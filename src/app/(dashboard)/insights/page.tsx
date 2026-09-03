/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import InsightsDashboardClient, {
  AnalyticsJobItem,
  AnalyticsApplicationItem,
} from "@/components/insights/InsightsDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Insights (People Analytics) | Maître Conecta",
  description: "Indicadores estratégicos de R&S, People Analytics, Funil de Contratação e Fit 3D",
};

export default async function InsightsPage() {
  const [jobs, applications, organizations] = await Promise.all([
    prisma.job.findMany({
      include: {
        organization: true,
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      include: {
        candidate: true,
        stage: true,
        job: {
          include: {
            organization: true,
          },
        },
        interviews: true,
        offers: true,
        hireConversion: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Formata os dados para o Client Component
  const formattedJobs: AnalyticsJobItem[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    department: job.department,
    status: job.status,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    organizationId: job.organizationId,
    organizationName: job.organization?.name || "Organização Desconhecida",
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    applicationsCount: job.applications?.length || 0,
  }));

  const formattedApplications: AnalyticsApplicationItem[] = applications.map((app) => ({
    id: app.id,
    jobId: app.job?.id || "",
    jobTitle: app.job?.title || "Vaga Desconhecida",
    department: app.job?.department || null,
    organizationId: app.job?.organizationId || "",
    organizationName: app.job?.organization?.name || "Organização Desconhecida",
    candidateName: app.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}`.trim() : "Candidato Desconhecido",
    source: app.candidate?.source || "Banco de Talentos",
    fitCategory: app.fitCategory,
    matchScore: app.matchScore,
    salaryExpectation: app.salaryExpectation,
    createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : new Date().toISOString(),
    isHired: !!app.hireConversion,
    hiredAt: app.hireConversion?.convertedAt ? new Date(app.hireConversion.convertedAt).toISOString() : null,
    salaryOffered: app.offers?.[0]?.salaryOffered || null,
    employmentType: app.offers?.[0]?.employmentType || app.job?.employmentType || "CLT",
    interviewsCount: app.interviews?.length || 0,
    offersCount: app.offers?.length || 0,
    currentStageName: app.stage?.name || "Estágio Desconhecido",
  }));

  return (
    <InsightsDashboardClient
      jobs={formattedJobs}
      applications={formattedApplications}
      organizations={organizations}
    />
  );
}
