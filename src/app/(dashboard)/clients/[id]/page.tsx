import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientDetailView from "@/components/clients/ClientDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.organization.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: client ? `${client.name} | Gestão de Cliente Maître` : "Empresa Cliente | Maître Conecta",
    description: "Visão 360°, processos seletivos e governança da empresa cliente.",
  };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  const { id } = await params;

  const client = await prisma.organization.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          department: true,
          phone: true,
        },
        orderBy: { name: "asc" },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              jobTitle: true,
            },
          },
        },
      },
      _count: {
        select: {
          jobs: true,
          candidates: true,
          users: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <ClientDetailView
      client={JSON.parse(JSON.stringify(client))}
      isAdmin={isAdmin}
    />
  );
}
