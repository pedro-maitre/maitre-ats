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

export default async function OperationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { getServerTenantScope } = await import("@/lib/security");
  const resolvedParams = searchParams ? await searchParams : {};
  const scope = await getServerTenantScope(session, resolvedParams.orgId);

  const docWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const convWhere = scope.organizationId
    ? { application: { job: { organizationId: scope.organizationId } } }
    : {};
  const offboardingWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const activeEmpWhere = {
    ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
    status: "ACTIVE",
  };

  let documents: any[] = [];
  let conversions: any[] = [];
  let offboardings: any[] = [];
  let activeEmployees: any[] = [];

  try {
    const [docsRes, convsRes, offboardsRes, employeesRes] = await Promise.all([
      prisma.document.findMany({
        where: docWhere,
        orderBy: { createdAt: "desc" },
      }),
      prisma.hireConversion.findMany({
        where: convWhere,
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
      prisma.offboardingProcess.findMany({
        where: offboardingWhere,
        include: {
          employee: {
            include: {
              department: true,
              position: true,
            },
          },
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.findMany({
        where: activeEmpWhere,
        select: {
          id: true,
          fullName: true,
          email: true,
          registrationNumber: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
        orderBy: { fullName: "asc" },
      }),
    ]);
    documents = docsRes || [];
    conversions = convsRes || [];
    offboardings = offboardsRes || [];
    activeEmployees = employeesRes || [];
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
      offboardings={JSON.parse(JSON.stringify(offboardings))}
      activeEmployees={JSON.parse(JSON.stringify(activeEmployees))}
    />
  );
}
