import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConsultingDashboardClient from "@/components/consulting/ConsultingDashboardClient";
import { getInternalHubData } from "@/app/(dashboard)/consulting/internal-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Central de Gestão Interna & Consultoria | Maître Conecta",
  description: "Gestão Interna da Maître Consultoria, Demandas, Reuniões e Projetos Estratégicos",
};

export default async function ConsultingPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string; tab?: string }>;
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

  const projectWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const orgWhere = scope.isGlobalAccess ? {} : { id: scope.organizationId };

  let projects: any[] = [];
  let organizations: any[] = [];
  let internalData: any = null;

  try {
    const [projectsRes, orgsRes, internalRes] = await Promise.all([
      prisma.consultingProject.findMany({
        where: projectWhere,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              primaryColor: true,
            },
          },
          deliverables: {
            orderBy: { createdAt: "asc" },
          },
          timesheets: {
            orderBy: { workDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organization.findMany({
        where: orgWhere,
        select: { id: true, name: true, slug: true, isMaster: true },
        orderBy: [{ isMaster: "asc" }, { name: "asc" }],
      }),
      getInternalHubData(),
    ]);

    projects = projectsRes || [];
    organizations = orgsRes || [];
    internalData = internalRes || null;
  } catch (err) {
    console.error("Erro ao carregar projetos de consultoria:", err);
  }

  return (
    <ConsultingDashboardClient
      initialProjects={JSON.parse(JSON.stringify(projects))}
      organizations={JSON.parse(JSON.stringify(organizations))}
      isAdmin={isAdmin}
      initialInternalData={internalData ? JSON.parse(JSON.stringify(internalData)) : null}
      initialTab={(resolvedParams.tab as any) || "overview"}
    />
  );
}
