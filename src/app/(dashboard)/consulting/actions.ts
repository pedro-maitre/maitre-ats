/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";
import { sendConsultingProjectNotificationEmail } from "@/lib/email";

/**
 * Busca todos os projetos de consultoria com entregáveis e organização cliente.
 */
export async function getConsultingProjects(organizationId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    const where: any = {};
    if (organizationId && organizationId !== "ALL") {
      where.organizationId = organizationId;
    }

    const projects = await prisma.consultingProject.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        deliverables: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects;
  } catch (error: any) {
    console.error("Erro ao buscar projetos de consultoria:", error);
    return [];
  }
}

/**
 * Cria um novo projeto de consultoria corporativa.
 */
export async function createConsultingProject(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const title = (formData.get("title") as string)?.trim();
    const organizationId = (formData.get("organizationId") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() || "HUNTING_EXECUTIVO";
    const description = (formData.get("description") as string)?.trim() || null;
    const consultantName = (formData.get("consultantName") as string)?.trim() || user.name || "Consultor Maître";
    const consultantEmail = (formData.get("consultantEmail") as string)?.trim() || user.email;
    const budget = parseFloat((formData.get("budget") as string)?.replace(/[^0-9.]/g, "") || "0");
    const targetDateStr = formData.get("targetDate") as string;
    const targetDate = targetDateStr ? new Date(targetDateStr) : null;
    const deliverablesRaw = (formData.get("deliverables") as string)?.trim();

    if (!title || !organizationId) {
      return { success: false, error: "Título e Empresa Cliente são obrigatórios." };
    }

    // Criar projeto
    const project = await prisma.consultingProject.create({
      data: {
        organizationId,
        title,
        category,
        description,
        consultantName,
        consultantEmail,
        budget: budget > 0 ? budget : null,
        targetDate,
        status: "IN_PROGRESS",
        progressPercent: 10,
      },
    });

    // Criar entregáveis se informados (linhas separadas por quebra de linha)
    if (deliverablesRaw) {
      const items = deliverablesRaw.split("\n").map((d) => d.trim()).filter(Boolean);
      for (const item of items) {
        await prisma.projectDeliverable.create({
          data: {
            projectId: project.id,
            title: item,
            status: "PENDING",
          },
        });
      }
    } else {
      // Cria marcos padrão conforme a categoria
      const defaultDeliverables: Record<string, string[]> = {
        HUNTING_EXECUTIVO: [
          "Alinhamento do Perfil de Competências e Job Description",
          "Mapeamento de Mercado (Longlist) & Hunting Ativo",
          "Entrevistas por Competências & Avaliação Fit 3D",
          "Apresentação da Shortlist de Executivos ao Cliente",
          "Negociação de Oferta & Acompanhamento de Admissão",
        ],
        CARGOS_SALARIOS: [
          "Diagnóstico da Estrutura Atual e Matriz de Funções",
          "Pesquisa Salarial e Calibração de Mercado",
          "Elaboração da Tabela Salarial e Curva de Remuneração",
          "Manual Descritivo de Cargos e Competências",
          "Plano de Enquadramento e Treinamento da Liderança",
        ],
        DIAGNOSTICO_CLIMA: [
          "Alinhamento dos Indicadores e Dimensões de Pesquisa",
          "Lançamento e Engajamento da Coleta eNPS",
          "Tabulação e People Analytics dos Resultados",
          "Apresentação Executiva à Diretoria",
          "Plano de Ação e Matriz de Priorização DHO",
        ],
      };

      const defaults = defaultDeliverables[category] || [
        "Reunião de Kick-off e Diagnóstico Inicial",
        "Execução dos Trabalhos Consultivos",
        "Apresentação do Relatório Final e Entregáveis",
      ];

      for (const item of defaults) {
        await prisma.projectDeliverable.create({
          data: {
            projectId: project.id,
            title: item,
            status: "PENDING",
          },
        });
      }
    }

    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "CLIENT_UPDATE",
      resourceType: "ConsultingProject",
      resourceId: project.id,
      afterData: { title, category, consultantName },
      reason: `Novo projeto de consultoria "${title}" criado por ${user.email}.`,
    });

    // Disparo de notificação por e-mail transacional
    if (consultantEmail) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        });
        const baseUrl = process.env.NEXTAUTH_URL || "https://maitreconecta.vercel.app";

        sendConsultingProjectNotificationEmail({
          recipientEmail: consultantEmail,
          recipientName: consultantName,
          projectTitle: title,
          companyName: org?.name || "Cliente Parceiro",
          categoryLabel: category.replace(/_/g, " "),
          consultantName,
          projectUrl: `${baseUrl}/consulting`,
        }).catch((e) => console.error("Erro ao enviar e-mail de projeto:", e));
      } catch (emailErr) {
        console.warn("Aviso ao disparar e-mail de consultoria:", emailErr);
      }
    }

    revalidatePath("/consulting");
    revalidatePath(`/clients/${organizationId}`);
    return { success: true, project };
  } catch (error: any) {
    console.error("Erro ao criar projeto de consultoria:", error);
    return { success: false, error: error.message || "Erro ao salvar projeto." };
  }
}

/**
 * Atualiza o status e progresso de um projeto.
 */
export async function updateProjectStatus(
  projectId: string,
  status: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "PAUSED",
  progressPercent: number
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const updated = await prisma.consultingProject.update({
      where: { id: projectId },
      data: {
        status,
        progressPercent,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    await logAuditEvent({
      organizationId: updated.organizationId,
      actorUserId: user.id,
      action: "CLIENT_UPDATE",
      resourceType: "ConsultingProject",
      resourceId: projectId,
      afterData: { status, progressPercent },
      reason: `Status do projeto atualizado para ${status} (${progressPercent}%)`,
    });

    revalidatePath("/consulting");
    revalidatePath(`/clients/${updated.organizationId}`);
    return { success: true, project: updated };
  } catch (error: any) {
    console.error("Erro ao atualizar status do projeto:", error);
    return { success: false, error: error.message || "Erro ao atualizar projeto." };
  }
}

/**
 * Atualiza o status de um entregável.
 */
export async function updateDeliverableStatus(
  deliverableId: string,
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED"
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const deliverable = await prisma.projectDeliverable.update({
      where: { id: deliverableId },
      data: { status },
      include: {
        project: {
          include: {
            deliverables: true,
          },
        },
      },
    });

    // Recalcula automaticamente o progresso percentual do projeto
    const all = deliverable.project.deliverables;
    const completedCount = all.filter((d) => d.status === "APPROVED").length;
    const inProgressCount = all.filter((d) => d.status === "SUBMITTED" || d.status === "IN_PROGRESS").length;
    const total = all.length;

    let newProgress = total > 0 ? Math.round(((completedCount * 1.0 + inProgressCount * 0.5) / total) * 100) : 0;
    if (newProgress > 100) newProgress = 100;

    let newProjectStatus = deliverable.project.status;
    if (newProgress === 100) {
      newProjectStatus = "COMPLETED";
    } else if (newProgress > 0 && newProjectStatus === "PLANNING") {
      newProjectStatus = "IN_PROGRESS";
    }

    await prisma.consultingProject.update({
      where: { id: deliverable.projectId },
      data: {
        progressPercent: newProgress,
        status: newProjectStatus,
        completedAt: newProgress === 100 ? new Date() : null,
      },
    });

    revalidatePath("/consulting");
    revalidatePath(`/clients/${deliverable.project.organizationId}`);
    return { success: true, deliverable, progressPercent: newProgress };
  } catch (error: any) {
    console.error("Erro ao atualizar entregável:", error);
    return { success: false, error: error.message || "Erro ao atualizar entregável." };
  }
}
