/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";
import { sendAdmissionRequirementEmail } from "@/lib/email";

/**
 * Valida ou Rejeita um documento de admissão individual pelo DP
 */
export async function validateDocument(
  documentId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        candidate: true,
        organization: true,
      },
    });

    if (!doc) {
      return { success: false, error: "Documento não encontrado." };
    }

    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: doc.organizationId,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "Document",
      resourceId: doc.id,
      afterData: {
        status,
        rejectionReason,
        validatedBy: user.email,
      },
    });

    revalidatePath("/operations");
    return { success: true, document: updatedDoc };
  } catch (error: any) {
    console.error("Erro ao validar documento:", error);
    return { success: false, error: error.message || "Erro ao validar documento." };
  }
}

/**
 * Envia notificação de pendência / exigência documental ao candidato
 */
export async function requestRequirement(
  conversionId: string,
  requirementNotes: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const conversion = await prisma.hireConversion.findUnique({
      where: { id: conversionId },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão não encontrado." };
    }

    const app = conversion.application;
    const org = app.job.organization;

    await prisma.hireConversion.update({
      where: { id: conversion.id },
      data: {
        admissionStatus: "REQUIREMENT",
        notes: requirementNotes,
        reviewedBy: user.email,
        reviewedAt: new Date(),
      },
    });

    // Registra na timeline
    await prisma.activity.create({
      data: {
        applicationId: app.id,
        actorId: user.id || undefined,
        type: "NOTE_ADDED",
        description: `⚠️ Pendência de admissão apontada pelo DP: ${requirementNotes}`,
      },
    });

    // Enviar e-mail de exigência
    if (conversion.token) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://maitreconecta.vercel.app";
      const admissionUrl = `${baseUrl}/carreiras/${org.slug}/admissao/${conversion.token}`;

      await sendAdmissionRequirementEmail({
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
        candidateEmail: app.candidate.email,
        jobTitle: app.job.title,
        companyName: org.name,
        admissionUrl,
        requirementNotes,
      });
    }

    // Auditoria
    await logAuditEvent({
      organizationId: org.id,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: {
        admissionStatus: "REQUIREMENT",
        requirementNotes,
      },
    });

    revalidatePath("/operations");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao solicitar exigência:", error);
    return { success: false, error: error.message || "Erro ao solicitar exigência." };
  }
}

/**
 * Efetiva a Admissão Digital, confirma matrícula e integra ao Core HR
 */
export async function finalizeAdmission(
  conversionId: string,
  employeeCode?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const conversion = await prisma.hireConversion.findUnique({
      where: { id: conversionId },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão não encontrado." };
    }

    const app = conversion.application;
    const finalCode = employeeCode || conversion.employeeCode || `MAT-${Math.floor(100000 + Math.random() * 900000)}`;

    await prisma.hireConversion.update({
      where: { id: conversion.id },
      data: {
        admissionStatus: "MATRICULATED",
        status: "ACTIVE",
        employeeCode: finalCode,
        reviewedBy: user.email,
        reviewedAt: new Date(),
      },
    });

    // Registra na timeline
    await prisma.activity.create({
      data: {
        applicationId: app.id,
        actorId: user.id || undefined,
        type: "STAGE_CHANGE",
        description: `🏆 Admissão concluída com sucesso! Matrícula ${finalCode} gerada pelo DP (${user.name || user.email}).`,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: user.id,
      action: "HIRE_AUTHORIZED",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: {
        admissionStatus: "MATRICULATED",
        employeeCode: finalCode,
      },
    });

    revalidatePath("/operations");
    revalidatePath("/employees");
    return { success: true, employeeCode: finalCode };
  } catch (error: any) {
    console.error("Erro ao efetivar admissão:", error);
    return { success: false, error: error.message || "Erro ao finalizar admissão." };
  }
}
