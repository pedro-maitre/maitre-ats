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

export default async function CareersHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  let plans: any[] = [];
  let organizations: any[] = [];

  try {
    const [plansRes, orgsRes] = await Promise.all([
      prisma.successionPlan.findMany({
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
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]);

    plans = plansRes || [];
    organizations = orgsRes || [];
  } catch (err) {
    console.error("Erro ao carregar planos de sucessão:", err);
  }

  return (
    <CareersHubDashboardClient
      initialPlans={JSON.parse(JSON.stringify(plans))}
      organizations={JSON.parse(JSON.stringify(organizations))}
      isAdmin={isAdmin}
    />
  );
}
