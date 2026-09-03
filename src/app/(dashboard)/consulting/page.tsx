import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConsultingDashboardClient from "@/components/consulting/ConsultingDashboardClient";
import { getConsultingProjects } from "./actions";

export const metadata = {
  title: "Conecta Consultoria | Maître Conecta",
  description: "Projetos Estratégicos, Entregáveis e Acompanhamento Consultivo da Maître",
};

export default async function ConsultingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  const [projects, organizations] = await Promise.all([
    getConsultingProjects(),
    prisma.organization.findMany({
      where: { isMaster: false },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ConsultingDashboardClient
      initialProjects={JSON.parse(JSON.stringify(projects))}
      organizations={JSON.parse(JSON.stringify(organizations))}
      isAdmin={isAdmin}
    />
  );
}
