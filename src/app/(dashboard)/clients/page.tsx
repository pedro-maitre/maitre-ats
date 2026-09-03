import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClients, getMasterOrganization } from "./actions";
import ClientListClient from "@/components/clients/ClientListClient";

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

  const [clients, masterOrg] = await Promise.all([
    getClients(),
    getMasterOrganization(),
  ]);

  return (
    <ClientListClient
      initialClients={JSON.parse(JSON.stringify(clients))}
      masterOrganization={masterOrg ? JSON.parse(JSON.stringify(masterOrg)) : null}
      isAdmin={isAdmin}
    />
  );
}
