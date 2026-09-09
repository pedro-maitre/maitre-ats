import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CareersHubDashboardClient from "@/components/careers-hub/CareersHubDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Carreiras | Maître Conecta",
  description: "Mobilidade Interna, Recrutamento Interno e Mapeamento de Sucessão para Posições Críticas",
};

export default async function CareersHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  const resolvedParams = searchParams ? await searchParams : {};
  const { getServerTenantScope } = await import("@/lib/security");
  const scope = await getServerTenantScope(session, resolvedParams.orgId);

  const planWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const orgWhere = scope.isGlobalAccess ? {} : { id: scope.organizationId };

  let plans: any[] = [];
  let organizations: any[] = [];
  let jobs: any[] = [];
  let employees: any[] = [];
  let internalApplications: any[] = [];
  let careerTracks: any[] = [];

  try {
    const [plansRes, orgsRes, jobsRes, empRes, intAppsRes, tracksRes] = await Promise.all([
      prisma.successionPlan.findMany({
        where: planWhere,
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          successors: {
            orderBy: { performanceRating: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organization.findMany({
        where: orgWhere,
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      prisma.job.findMany({
        where: {
          ...planWhere,
          status: "OPEN",
        },
        include: {
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.findMany({
        where: {
          ...planWhere,
          status: "ACTIVE",
        },
        include: {
          department: { select: { name: true } },
          position: { select: { title: true } },
          performanceEvaluations: {
            select: { performanceScore: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 2,
          },
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.internalApplication.findMany({
        where: planWhere,
        include: {
          job: { select: { id: true, title: true, department: true } },
          employee: { select: { id: true, fullName: true, email: true, admissionDate: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.careerTrack.findMany({
        where: planWhere,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    plans = plansRes || [];
    organizations = orgsRes || [];
    jobs = jobsRes || [];
    employees = empRes || [];
    internalApplications = intAppsRes || [];
    careerTracks = tracksRes || [];
  } catch (err) {
    console.error("Erro ao carregar dados de carreiras e sucessão:", err);
  }

  return (
    <CareersHubDashboardClient
      initialPlans={JSON.parse(JSON.stringify(plans))}
      organizations={JSON.parse(JSON.stringify(organizations))}
      jobs={JSON.parse(JSON.stringify(jobs))}
      employees={JSON.parse(JSON.stringify(employees))}
      initialApplications={JSON.parse(JSON.stringify(internalApplications))}
      initialTracks={JSON.parse(JSON.stringify(careerTracks))}
      isAdmin={isAdmin}
    />
  );
}
