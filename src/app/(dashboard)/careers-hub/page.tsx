import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CareersHubDashboardClient from "@/components/careers-hub/CareersHubDashboardClient";
import { getSuccessionPlans } from "./actions";

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

  const [plans, organizations] = await Promise.all([
    getSuccessionPlans(),
    prisma.organization.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CareersHubDashboardClient
      initialPlans={JSON.parse(JSON.stringify(plans))}
      organizations={JSON.parse(JSON.stringify(organizations))}
      isAdmin={isAdmin}
    />
  );
}
