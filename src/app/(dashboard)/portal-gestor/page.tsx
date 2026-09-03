import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHiringManagerDashboardData } from "./actions";
import HiringManagerPortalClient from "@/components/portal-gestor/HiringManagerPortalClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal do Gestor | Maître Conecta",
  description: "Acompanhamento de hunting, avaliação de finalistas e aprovação de propostas salariais",
};

export default async function PortalGestorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  let data: any = {
    jobs: [],
    finalists: [],
    pendingOffers: [],
    stats: {
      openJobs: 0,
      finalistsCount: 0,
      pendingOffersCount: 0,
      completedHires: 0,
    },
  };

  try {
    const res = await getHiringManagerDashboardData();
    if (res) {
      data = res;
    }
  } catch (err) {
    console.error("Erro ao carregar dados do portal do gestor:", err);
  }

  return (
    <HiringManagerPortalClient
      initialData={JSON.parse(JSON.stringify(data))}
      userName={session.user.name || "Gestor"}
    />
  );
}
