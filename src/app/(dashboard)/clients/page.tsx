import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClients } from "./actions";
import ClientListClient from "@/components/clients/ClientListClient";

export const metadata = {
  title: "Empresas Clientes | Maître Conecta",
  description: "Gestão de empresas clientes, contas corporativas e portais de carreiras white-label",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  const clients = await getClients();

  return (
    <ClientListClient
      initialClients={JSON.parse(JSON.stringify(clients))}
      isAdmin={isAdmin}
    />
  );
}
