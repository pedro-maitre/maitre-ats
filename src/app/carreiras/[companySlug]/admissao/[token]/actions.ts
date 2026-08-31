/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadSecureDocument } from "@/lib/resume-storage";
import { logAuditEvent } from "@/lib/audit";

export type AdmissionDocumentCategory =
  | "RG_CNH"
  | "CPF"
  | "CTPS"
  | "RESIDENCIA"
  | "DIPLOMA"
  | "TITULO_ELEITOR"
  | "ASO"
  | "DADOS_BANCARIOS"
  | "TERMO_LGPD";

export interface AdmissionDocumentInfo {
  id: string;
  classification: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

export async function getAdmissionDetails(companySlug: string, token: string) {
  try {
    const conversion = await prisma.hireConversion.findFirst({
      where: {
        token,
        application: {
          job: {
            organization: {
              slug: companySlug,
            },
          },
        },
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                organization: true,
              },
            },
            offers: {
              where: { status: "APPROVED" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão não encontrado ou link expirado." };
    }

    const app = conversion.application;
    const org = app.job.organization;

    // Busca documentos existentes do candidato
    const documents = await prisma.document.findMany({
      where: {
        candidateId: app.candidateId,
        organizationId: org.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedDocs: AdmissionDocumentInfo[] = documents.map((d) => ({
      id: d.id,
      classification: d.classification,
      originalName: d.originalName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      checksum: d.checksum,
      status: d.status,
      rejectionReason: d.rejectionReason,
      createdAt: d.createdAt.toISOString(),
    }));

    let additionalData = {};
    if (conversion.additionalData) {
      try {
        additionalData = JSON.parse(conversion.additionalData);
      } catch {
        additionalData = {};
      }
    }

    return {
      success: true,
      data: {
        conversionId: conversion.id,
        applicationId: app.id,
        candidateId: app.candidateId,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
        candidateEmail: app.candidate.email,
        candidatePhone: app.candidate.phone,
        jobTitle: app.job.title,
        department: app.job.department,
        companyName: org.name,
        companySlug: org.slug,
        primaryColor: org.primaryColor || "#D4AF37",
        logoUrl: org.logoUrl,
        admissionStatus: conversion.admissionStatus,
        notes: conversion.notes,
        employeeCode: conversion.employeeCode,
        salaryOffered: app.offers[0]?.salaryOffered || app.salaryExpectation || null,
        employmentType: app.offers[0]?.employmentType || app.job.employmentType || "CLT",
        documents: parsedDocs,
        additionalData,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar dados de admissão:", error);
    return { success: false, error: "Falha ao carregar formulário de admissão." };
  }
}

/**
 * Upload de documento de admissão com cálculo de hash SHA-256 e gravação canônica
 */
export async function uploadAdmissionDocument(formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const classification = formData.get("classification") as string;
    const file = formData.get("file") as File | null;

    if (!token || !classification || !file) {
      return { success: false, error: "Arquivo ou classificação ausente." };
    }

    const conversion = await prisma.hireConversion.findFirst({
      where: { token },
      include: {
        application: {
          include: {
            candidate: true,
            job: { select: { organizationId: true, organization: { select: { slug: true } } } },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão inválido." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Salva o documento no Supabase Storage canônico com cálculo de SHA-256
    const storageResult = await uploadSecureDocument({
      buffer,
      originalFilename: file.name,
      organizationId: conversion.application.job.organizationId,
      candidateId: conversion.application.candidateId,
      classification: classification as any,
    });

    let newDoc = null;
    if (storageResult.documentId) {
      newDoc = await prisma.document.update({
        where: { id: storageResult.documentId },
        data: {
          classification,
          status: "PENDING",
        },
      });
    } else {
      newDoc = await prisma.document.create({
        data: {
          organizationId: conversion.application.job.organizationId,
          candidateId: conversion.application.candidateId,
          provider: storageResult.provider,
          bucket: "resumes",
          storageKey: storageResult.storageKey,
          originalName: file.name,
          mimeType: file.type || "application/pdf",
          sizeBytes: file.size,
          checksum: storageResult.checksum,
          classification,
          status: "PENDING",
        },
      });
    }

    // Atualiza status do processo para Em Análise pelo DP se estava pendente
    if (conversion.admissionStatus === "PENDING_DOCUMENTS") {
      await prisma.hireConversion.update({
        where: { id: conversion.id },
        data: { admissionStatus: "UNDER_REVIEW" },
      });
    }

    // Registra na timeline
    await prisma.activity.create({
      data: {
        applicationId: conversion.applicationId,
        type: "DOCUMENT_UPLOADED",
        description: `📄 Documento (${classification}: ${file.name}) enviado pelo contratado (SHA-256: ${storageResult.checksum.substring(0, 12)}...).`,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: conversion.application.job.organizationId,
      action: "CANDIDATE_UPDATE",
      resourceType: "Document",
      resourceId: newDoc.id,
      afterData: {
        classification,
        originalName: file.name,
        checksum: storageResult.checksum,
      },
    });

    const slug = conversion.application.job.organization.slug;
    revalidatePath(`/carreiras/${slug}/admissao/${token}`);
    revalidatePath(`/operations`);

    return {
      success: true,
      document: {
        id: newDoc.id,
        classification: newDoc.classification,
        originalName: newDoc.originalName,
        mimeType: newDoc.mimeType,
        sizeBytes: newDoc.sizeBytes,
        checksum: newDoc.checksum,
        status: newDoc.status,
        createdAt: newDoc.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Erro no upload de documento admissional:", error);
    return { success: false, error: error.message || "Erro no upload do arquivo." };
  }
}

/**
 * Salva os dados cadastrais complementares do novo colaborador
 */
export async function saveAdmissionPersonalData(params: {
  token: string;
  additionalData: Record<string, any>;
}) {
  try {
    const { token, additionalData } = params;

    const conversion = await prisma.hireConversion.findFirst({
      where: { token },
      include: {
        application: {
          include: {
            candidate: true,
            job: { select: { organization: { select: { slug: true } } } },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão inválido." };
    }

    await prisma.hireConversion.update({
      where: { id: conversion.id },
      data: {
        additionalData: JSON.stringify(additionalData),
        admissionStatus: "UNDER_REVIEW",
      },
    });

    // Atualiza telefone ou linkedin se informado
    if (additionalData.phone) {
      await prisma.candidate.update({
        where: { id: conversion.application.candidateId },
        data: {
          phone: additionalData.phone,
        },
      });
    }

    const slug = conversion.application.job.organization.slug;
    revalidatePath(`/carreiras/${slug}/admissao/${token}`);
    revalidatePath(`/operations`);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar dados pessoais de admissão:", error);
    return { success: false, error: "Falha ao salvar dados cadastrais." };
  }
}
