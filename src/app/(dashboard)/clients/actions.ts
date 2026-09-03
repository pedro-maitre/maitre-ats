"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  // Busca exclusivamente as empresas clientes parceiras atendidas pela consultoria
  const clients = await prisma.organization.findMany({
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
  });

  return clients;
}

export async function getMasterOrganization() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  const master = await prisma.organization.findFirst({
    where: {
      OR: [
        { isMaster: true },
        { slug: "maitre" },
      ],
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
  });

  return master;
}

export async function createClient(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Não autorizado" };
  }

  // Apenas admins podem cadastrar novos clientes
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return { success: false, error: "Apenas administradores podem cadastrar novos clientes." };
  }

  const name = formData.get("name")?.toString().trim();
  let slug = formData.get("slug")?.toString().trim().toLowerCase();

  if (!name) {
    return { success: false, error: "O nome da empresa é obrigatório." };
  }

  if (!slug) {
    // Gerar slug a partir do nome
    slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } else {
    slug = slug
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  try {
    // Verificar se já existe empresa com este slug
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
      },
    });

    await logAuditEvent({
      organizationId: org.id,
      actorUserId: session.user.id,
      action: "CLIENT_CREATE",
      resourceType: "Organization",
      resourceId: org.id,
      afterData: { name, slug },
      reason: "Cadastro de nova empresa cliente na consultoria",
    });

    revalidatePath("/clients");
    revalidatePath("/jobs");
    revalidatePath("/candidates");

    return { success: true, client: org };
  } catch (error: any) {
    console.error("Erro ao criar empresa cliente:", error);
    return { success: false, error: error.message || "Erro ao salvar empresa cliente." };
  }
}

export async function updateClient(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Não autorizado" };
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return { success: false, error: "Apenas administradores podem editar clientes." };
  }

  const name = formData.get("name")?.toString().trim();
  const slug = formData.get("slug")?.toString().trim().toLowerCase();

  if (!name || !slug) {
    return { success: false, error: "Nome e slug são obrigatórios." };
  }

  try {
    const before = await prisma.organization.findUnique({ where: { id } });
    if (!before) {
      return { success: false, error: "Empresa cliente não encontrada." };
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    await logAuditEvent({
      organizationId: id,
      actorUserId: session.user.id,
      action: "CLIENT_UPDATE",
      resourceType: "Organization",
      resourceId: id,
      beforeData: before,
      afterData: updated,
      reason: "Atualização cadastral da empresa cliente",
    });

    revalidatePath("/clients");
    return { success: true, client: updated };
  } catch (error: any) {
    console.error("Erro ao atualizar empresa cliente:", error);
    return { success: false, error: error.message || "Erro ao atualizar empresa cliente." };
  }
}

export async function updateClientBranding(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Não autorizado" };
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return { success: false, error: "Apenas administradores podem customizar o branding." };
  }

  const primaryColor = formData.get("primaryColor")?.toString().trim() || "#D4AF37";
  const logoUrl = formData.get("logoUrl")?.toString().trim() || null;
  const bannerHeadline = formData.get("bannerHeadline")?.toString().trim() || null;
  const bannerSubheadline = formData.get("bannerSubheadline")?.toString().trim() || null;
  const aboutUs = formData.get("aboutUs")?.toString().trim() || null;
  const websiteUrl = formData.get("websiteUrl")?.toString().trim() || null;

  try {
    const before = await prisma.organization.findUnique({ where: { id } });
    if (!before) {
      return { success: false, error: "Empresa cliente não encontrada." };
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        primaryColor,
        logoUrl,
        bannerHeadline,
        bannerSubheadline,
        aboutUs,
        websiteUrl,
      },
    });

    await logAuditEvent({
      organizationId: id,
      actorUserId: session.user.id,
      action: "CLIENT_UPDATE",
      resourceType: "Organization",
      resourceId: id,
      beforeData: before,
      afterData: updated,
      reason: "Customização de Branding White-Label da página de carreiras",
    });

    revalidatePath(`/carreiras/${updated.slug}`);
    revalidatePath("/clients");
    return { success: true, client: updated };
  } catch (error: any) {
    console.error("Erro ao atualizar branding:", error);
    return { success: false, error: error.message || "Erro ao salvar personalização de branding." };
  }
}

export async function deleteClient(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Não autorizado" };
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN") {
    return { success: false, error: "Apenas Super Admins podem remover empresas clientes." };
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobs: true,
            candidates: true,
          },
        },
      },
    });

    if (!org) {
      return { success: false, error: "Empresa não encontrada." };
    }

    if (org.isMaster || org.slug === "maitre") {
      return {
        success: false,
        error: "A Empresa Master (Maître Consultoria) não pode ser excluída do sistema.",
      };
    }

    if (org._count.jobs > 0 || org._count.candidates > 0) {
      return {
        success: false,
        error: `Não é possível excluir esta empresa pois ela possui ${org._count.jobs} vagas e ${org._count.candidates} candidatos associados.`,
      };
    }

    await prisma.organization.delete({
      where: { id },
    });

    await logAuditEvent({
      organizationId: id,
      actorUserId: session.user.id,
      action: "CLIENT_DELETE",
      resourceType: "Organization",
      resourceId: id,
      beforeData: org,
      reason: "Exclusão de empresa cliente sem registros vinculados",
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir empresa:", error);
    return { success: false, error: error.message || "Erro ao excluir empresa." };
  }
}
