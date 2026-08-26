"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { sendHiringManagerInviteEmail } from "@/lib/email";

export async function getHiringManagerDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  const role = session.user.role;
  const userOrgId = session.user.organizationId;

  // Filtro de organização: Se for Hiring Manager, restringe à sua organização. Se for Admin/Recrutador, usa a org ou geral
  const orgFilter = (role === "HIRING_MANAGER" && userOrgId)
    ? { organizationId: userOrgId }
    : {};

  // Buscar vagas do cliente
  const jobs = await prisma.job.findMany({
    where: {
      ...orgFilter,
    },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      stages: {
        orderBy: { order: "asc" },
      },
      applications: {
        include: {
          candidate: true,
          stage: true,
          interviews: {
            include: { scorecards: true },
          },
          offers: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Extrair finalistas (candidatos em etapas avançadas como Entrevista ou Proposta)
  const allApplications = jobs.flatMap((j) =>
    j.applications.map((app) => ({
      ...app,
      jobTitle: j.title,
      jobDepartment: j.department,
      organizationName: j.organization.name,
    }))
  );

  return {
    jobs,
    applications: allApplications,
    userOrgName: session.user.organizationName || "Sua Empresa",
  };
}

export async function inviteHiringManager(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Não autorizado" };
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "RECRUITER") {
    return { success: false, error: "Apenas a equipe da consultoria pode convidar gestores de clientes." };
  }

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const organizationId = formData.get("organizationId")?.toString().trim();
  const initialPassword = formData.get("password")?.toString().trim() || "Maitre@2026";

  if (!name || !email || !organizationId) {
    return { success: false, error: "Nome, e-mail e empresa cliente são obrigatórios." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "Já existe um usuário cadastrado com este e-mail." };
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "HIRING_MANAGER",
        organizationId,
      },
      include: {
        organization: true,
      },
    });

    // Dispara e-mail de convite com credenciais de acesso
    if (user.email && user.organization) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      sendHiringManagerInviteEmail({
        managerName: user.name || "Gestor",
        managerEmail: user.email,
        companyName: user.organization.name,
        tempPassword: initialPassword,
        loginUrl: `${baseUrl}/login`,
      }).catch((e) => console.error("Erro ao enviar e-mail de convite para gestor:", e));
    }

    await logAuditEvent({
      organizationId,
      actorUserId: session.user.id,
      action: "CLIENT_UPDATE",
      resourceType: "User",
      resourceId: user.id,
      afterData: { name, email, role: "HIRING_MANAGER", organizationId },
      reason: `Convite de gestor do cliente (Hiring Manager) para a empresa ${user.organization?.name}`,
    });

    revalidatePath("/users");
    revalidatePath("/clients");
    return { success: true, user };
  } catch (error: any) {
    console.error("Erro ao convidar gestor:", error);
    return { success: false, error: error.message || "Erro ao convidar gestor." };
  }
}
