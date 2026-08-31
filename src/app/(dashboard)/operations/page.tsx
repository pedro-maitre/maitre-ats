/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import OperationsDashboardClient from "@/components/operations/OperationsDashboardClient";
import { AdmissionDossierItem } from "@/components/operations/AdmissionDetailsModal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Operações (Admissão Digital & DP) | Maître Conecta",
  description: "Gestão de documentos, armazenamento seguro, termos de admissão e processos de DP",
};

export default async function OperationsPage() {
  const [documents, conversions] = await Promise.all([
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

  // Formata os dossiês
  const dossiers: AdmissionDossierItem[] = conversions.map((conv) => {
    const app = conv.application;
    const org = app.job.organization;
    const candidate = app.candidate;

    let additionalData = {};
    if (conv.additionalData) {
      try {
        additionalData = JSON.parse(conv.additionalData);
      } catch {
        additionalData = {};
      }
    }

    // Documentos do candidato relacionados a essa organização
    const candidateDocs = candidate.documents
      .filter((d) => d.organizationId === org.id)
      .map((d) => ({
        id: d.id,
        classification: d.classification,
        originalName: d.originalName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        checksum: d.checksum,
        status: d.status,
        storageKey: d.storageKey,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt.toISOString(),
      }));

    return {
      id: conv.id,
      applicationId: app.id,
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      jobTitle: app.job.title,
      department: app.job.department,
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      admissionStatus: conv.admissionStatus,
      employeeCode: conv.employeeCode,
      token: conv.token,
      notes: conv.notes,
      salaryOffered: app.offers[0]?.salaryOffered || app.salaryExpectation || null,
      employmentType: app.offers[0]?.employmentType || app.job.employmentType || "CLT",
      convertedAt: conv.convertedAt.toISOString(),
      additionalData,
      documents: candidateDocs,
    };
  });

  return (
    <OperationsDashboardClient
      dossiers={dossiers}
      canonicalDocsCount={documents.length}
    />
  );
}
