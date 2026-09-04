import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientListClient from "@/components/clients/ClientListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Empresas Clientes | Maître Conecta",
  description: "Gestão de empresas clientes parceiras e portais de carreiras white-label",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  if (!isAdmin) {
    redirect(role === "HIRING_MANAGER" ? "/portal-gestor" : "/jobs");
  }

  let clients: any[] = [];
  let masterOrg: any = null;

  try {
    const [clientsRes, masterRes] = await Promise.all([
      prisma.organization.findMany({
        where: {
          isMaster: false,
        },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              jobs: true,
              candidates: true,
              users: true,
            },
          },
          jobs: {
            select: {
              id: true,
              title: true,
              status: true,
              department: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.organization.findFirst({
        where: {
          OR: [{ isMaster: true }, { slug: "maitre" }],
        },
        include: {
          _count: {
            select: {
              jobs: true,
              candidates: true,
              users: true,
            },
          },
        },
      }),
    ]);

    clients = clientsRes || [];
    masterOrg = masterRes || null;
  } catch (error) {
    console.error("Erro ao carregar empresas clientes na página:", error);
  }

  return (
    <ClientListClient
      initialClients={JSON.parse(JSON.stringify(clients))}
      masterOrganization={masterOrg ? JSON.parse(JSON.stringify(masterOrg)) : null}
      isAdmin={isAdmin}
    />
  );
}
