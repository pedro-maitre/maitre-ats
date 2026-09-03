/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OperationsDashboardClient from "@/components/operations/OperationsDashboardClient";
import { AdmissionDossierItem } from "@/components/operations/AdmissionDetailsModal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Operações (Admissão Digital & DP) | Maître Conecta",
  description: "Gestão de documentos, armazenamento seguro, termos de admissão e processos de DP",
};

export default async function OperationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  let documents: any[] = [];
  let conversions: any[] = [];

  try {
    const [docsRes, convsRes] = await Promise.all([
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.hireConversion.findMany({
        include: {
          application: {
            include: {
              candidate: {
                include: {
                  documents: true,
                },
              },
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
        orderBy: { convertedAt: "desc" },
      }),
    ]);
    documents = docsRes || [];
    conversions = convsRes || [];
  } catch (err) {
    console.error("Erro ao carregar operações:", err);
  }

  // Formata os dossiês com proteção defensiva contra nulos
  const dossiers: AdmissionDossierItem[] = conversions.map((conv) => {
    const app = conv.application || {};
    const org = app.job?.organization || { id: "", name: "Empresa", slug: "empresa" };
    const candidate = app.candidate || {
      id: "",
      firstName: "Candidato",
      lastName: "",
      email: "",
      phone: null,
      documents: [],
    };

    let additionalData = {};
    if (conv.additionalData) {
      try {
        additionalData = JSON.parse(conv.additionalData);
      } catch {
        additionalData = {};
      }
    }

    // Documentos do candidato relacionados a essa organização
    const candidateDocs = (candidate.documents || [])
      .filter((d: any) => !org.id || d.organizationId === org.id)
      .map((d: any) => ({
        id: d.id,
        classification: d.classification || "DOCUMENTO",
        originalName: d.originalName || "arquivo.pdf",
        mimeType: d.mimeType || "application/pdf",
        sizeBytes: d.sizeBytes || 0,
        checksum: d.checksum || "",
        status: d.status || "PENDING",
        storageKey: d.storageKey || "",
        rejectionReason: d.rejectionReason || null,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      }));

    return {
      id: conv.id,
      applicationId: app.id || "",
      candidateId: candidate.id,
      candidateName: `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Colaborador",
      candidateEmail: candidate.email || "",
      candidatePhone: candidate.phone || null,
      jobTitle: app.job?.title || "Cargo",
      department: app.job?.department || "Geral",
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      admissionStatus: conv.admissionStatus || "PENDING_DOCUMENTS",
      employeeCode: conv.employeeCode || null,
      token: conv.token || "",
      notes: conv.notes || null,
      salaryOffered: app.offers?.[0]?.salaryOffered || app.salaryExpectation || null,
      employmentType: app.offers?.[0]?.employmentType || app.job?.employmentType || "CLT",
      convertedAt: conv.convertedAt ? new Date(conv.convertedAt).toISOString() : new Date().toISOString(),
      additionalData,
      documents: candidateDocs,
    };
  });

  return (
    <OperationsDashboardClient
      dossiers={JSON.parse(JSON.stringify(dossiers))}
      canonicalDocsCount={documents.length}
    />
  );
}
