/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import InsightsDashboardClient, {
  AnalyticsJobItem,
  AnalyticsApplicationItem,
} from "@/components/insights/InsightsDashboardClient";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServerTenantScope } from "@/lib/security";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Insights (People Analytics) | Maître Conecta",
  description: "Indicadores estratégicos de R&S, People Analytics, Funil de Contratação e Fit 3D",
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const scope = await getServerTenantScope(session, resolvedParams.orgId);

  const jobWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const appWhere = scope.organizationId ? { job: { organizationId: scope.organizationId } } : {};
  const orgWhere = scope.isGlobalAccess ? {} : { id: scope.organizationId };

  const empWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const offWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const leaveWhere = scope.organizationId ? { employee: { organizationId: scope.organizationId } } : {};

  const [jobs, applications, organizations, employees, offboardings, leaves] = await Promise.all([
    prisma.job.findMany({
      where: jobWhere,
      include: {
        organization: true,
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: appWhere,
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
      where: orgWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: empWhere,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { title: true } },
      },
      orderBy: { admissionDate: "desc" },
    }),
    prisma.offboardingProcess.findMany({
      where: offWhere,
      orderBy: { lastWorkingDay: "desc" },
    }),
    prisma.employeeLeave.findMany({
      where: leaveWhere,
      orderBy: { startDate: "desc" },
    }),
  ]);

  const {
    calculateTurnoverMetrics,
    calculateAbsenteeismRate,
    calculateTenureMetrics,
  } = await import("@/lib/analytics");

  const turnoverMetrics = calculateTurnoverMetrics(
    employees.map((e) => ({
      ...e,
      admissionDate: e.admissionDate.toISOString(),
      terminationDate: e.terminationDate ? e.terminationDate.toISOString() : null,
    })),
    offboardings.map((o) => ({
      ...o,
      lastWorkingDay: o.lastWorkingDay.toISOString(),
    }))
  );

  const absenteeismMetrics = calculateAbsenteeismRate(
    employees.map((e) => ({
      ...e,
      admissionDate: e.admissionDate.toISOString(),
      terminationDate: e.terminationDate ? e.terminationDate.toISOString() : null,
    })),
    leaves.map((l) => ({
      ...l,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate ? l.endDate.toISOString() : null,
    }))
  );

  const tenureMetrics = calculateTenureMetrics(
    employees.map((e) => ({
      ...e,
      admissionDate: e.admissionDate.toISOString(),
      terminationDate: e.terminationDate ? e.terminationDate.toISOString() : null,
    }))
  );

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
      turnoverMetrics={turnoverMetrics}
      absenteeismMetrics={absenteeismMetrics}
      tenureMetrics={tenureMetrics}
    />
  );
}
