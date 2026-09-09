/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth, ForbiddenError, UnauthorizedError } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";
import {
  checkIsAdminMaster,
  hasInternalPermission,
  validateTaskTransition,
  InternalUserContext,
  TaskStatus,
  TaskPriority,
  ProjectType,
  MeetingStatus,
} from "@/lib/internal-management";

/**
 * Obtém o contexto interno do usuário logado na Maître.
 */
export async function getInternalUserContext(): Promise<InternalUserContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new UnauthorizedError("Sessão não autenticada.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: { organization: true },
  });

  if (!user) {
    throw new UnauthorizedError("Usuário não encontrado.");
  }

  // Busca a organização Maître (Master)
  const maitreOrg = await prisma.organization.findFirst({
    where: { OR: [{ slug: "maitre" }, { isMaster: true }] },
  });

  const isMasterOrg = Boolean(maitreOrg && user.organizationId === maitreOrg.id);

  // Busca configuração para checar Admin Master exclusivo
  const config = maitreOrg
    ? await prisma.internalConsultingConfig.findUnique({
        where: { organizationId: maitreOrg.id },
      })
    : null;

  const isAdminMaster = checkIsAdminMaster(user.id, config?.adminMasterUserId, isMasterOrg);

  return {
    userId: user.id,
    email: user.email,
    name: user.name || "Colaborador",
    role: user.role,
    organizationId: user.organizationId || maitreOrg?.id || "",
    isMasterOrg,
    isAdminMaster,
  };
}

/**
 * Busca todos os dados da Central de Gestão Interna de forma consolidada e segura.
 */
export async function getInternalHubData() {
  try {
    const userCtx = await getInternalUserContext();

    const maitreOrg = await prisma.organization.findFirst({
      where: { OR: [{ slug: "maitre" }, { isMaster: true }] },
    });

    if (!maitreOrg) {
      throw new Error("Organização Maître Consultoria não encontrada.");
    }

    // Busca configuração ou cria padrão com Adriana se não existir
    let config = await prisma.internalConsultingConfig.findUnique({
      where: { organizationId: maitreOrg.id },
    });

    if (!config) {
      const adrianaUser = await prisma.user.findFirst({
        where: { email: { equals: "adriana@maitrework.com.br", mode: "insensitive" } },
      });
      config = await prisma.internalConsultingConfig.create({
        data: {
          organizationId: maitreOrg.id,
          adminMasterUserId: adrianaUser?.id || userCtx.userId,
          defaultTimezone: "America/Fortaleza",
          weeklyMeetingDay: 1,
          weeklyMeetingTime: "15:30",
          weeklyMeetingDuration: 60,
        },
      });
    }

    // Busca projetos e serviços vinculados à Maître
    const projects = await prisma.consultingProject.findMany({
      where: { organizationId: maitreOrg.id },
      include: {
        clientOrganization: {
          select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
        },
        deliverables: { orderBy: { createdAt: "asc" } },
        timesheets: { orderBy: { workDate: "desc" } },
        internalTasks: {
          select: { id: true, status: true, isBlocked: true, dueDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Busca tarefas internas com relações completas
    const tasks = await prisma.internalTask.findMany({
      where: { organizationId: maitreOrg.id },
      include: {
        project: {
          select: { id: true, title: true, category: true, projectType: true },
        },
        clientOrganization: {
          select: { id: true, name: true, slug: true },
        },
        creator: {
          select: { id: true, name: true, email: true, jobTitle: true, avatarUrl: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, jobTitle: true, avatarUrl: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true, jobTitle: true, avatarUrl: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, jobTitle: true } },
          },
        },
        subtasks: { orderBy: { createdAt: "asc" } },
        checklists: { orderBy: { order: "asc" } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { decidedAt: "desc" },
        },
        originMeeting: {
          select: { id: true, title: true, scheduledAt: true },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    // Membros da equipe Maître para seleção e atribuição
    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: maitreOrg.id,
        status: "ACTIVE",
        role: { in: ["SUPER_ADMIN", "ADMIN", "RECRUITER", "HIRING_MANAGER"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        department: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    // Empresas clientes parceiras para vínculo de projetos/serviços
    const clients = await prisma.organization.findMany({
      where: { isMaster: false },
      select: { id: true, name: true, slug: true, primaryColor: true },
      orderBy: { name: "asc" },
    });

    // Reuniões de alinhamento
    const meetings = await prisma.weeklyMeeting.findMany({
      where: { organizationId: maitreOrg.id },
      include: {
        facilitator: {
          select: { id: true, name: true, email: true, jobTitle: true },
        },
        tasksGenerated: {
          select: { id: true, title: true, status: true, assigneeId: true },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    });

    // Notificações in-app do usuário atual
    const notifications = await prisma.internalNotification.findMany({
      where: { userId: userCtx.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return {
      success: true,
      userCtx,
      config,
      projects,
      tasks,
      teamMembers,
      clients,
      meetings,
      notifications,
    };
  } catch (err: any) {
    console.error("Erro ao carregar dados da Central de Gestão Interna:", err);
    return {
      success: false,
      error: err.message || "Falha ao carregar dados da Central.",
      userCtx: null,
      config: null,
      projects: [],
      tasks: [],
      teamMembers: [],
      clients: [],
      meetings: [],
      notifications: [],
    };
  }
}

/**
 * Cria uma nova tarefa interna com suporte a checklist, subtarefas e colaboradores.
 */
export async function createInternalTask(payload: {
  title: string;
  description?: string;
  projectId?: string;
  clientOrganizationId?: string;
  assigneeId?: string;
  reviewerId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  startDate?: string;
  requiresApproval?: boolean;
  memberIds?: string[];
  checklists?: string[];
  originMeetingId?: string;
}) {
  try {
    const userCtx = await getInternalUserContext();

    if (!hasInternalPermission(userCtx, "internal.task.create")) {
      throw new ForbiddenError("Você não possui permissão para criar tarefas internas.");
    }

    if (!payload.title || payload.title.trim().length < 3) {
      return { success: false, error: "O título da tarefa deve ter pelo menos 3 caracteres." };
    }

    // Se informou atribuição a terceiro e não é Admin Master nem o criador, valida
    if (payload.assigneeId && payload.assigneeId !== userCtx.userId && !userCtx.isAdminMaster) {
      // Permitido na criação para delegar a colegas de equipe
    }

    const task = await prisma.internalTask.create({
      data: {
        organizationId: userCtx.organizationId,
        projectId: payload.projectId || null,
        clientOrganizationId: payload.clientOrganizationId || null,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        status: "TODO",
        priority: payload.priority || "MEDIUM",
        creatorId: userCtx.userId,
        assigneeId: payload.assigneeId || null,
        reviewerId: payload.reviewerId || null,
        requiresApproval: Boolean(payload.requiresApproval),
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        originType: payload.originMeetingId ? "WEEKLY_MEETING" : "DIRECT",
        originMeetingId: payload.originMeetingId || null,
      },
    });

    // Adiciona participantes / colaboradores
    if (payload.memberIds && payload.memberIds.length > 0) {
      const distinctMembers = Array.from(new Set(payload.memberIds)).filter(
        (id) => id !== payload.assigneeId
      );
      for (const mId of distinctMembers) {
        await prisma.taskMember.create({
          data: { taskId: task.id, userId: mId, role: "COLLABORATOR" },
        });
      }
    }

    // Adiciona itens de checklist se informados
    if (payload.checklists && payload.checklists.length > 0) {
      for (let i = 0; i < payload.checklists.length; i++) {
        const itemText = payload.checklists[i].trim();
        if (itemText) {
          await prisma.taskChecklistItem.create({
            data: { taskId: task.id, text: itemText, order: i },
          });
        }
      }
    }

    // Notifica o responsável atribuído se diferente do criador
    if (payload.assigneeId && payload.assigneeId !== userCtx.userId) {
      await prisma.internalNotification.create({
        data: {
          organizationId: userCtx.organizationId,
          userId: payload.assigneeId,
          title: "Nova Tarefa Atribuída",
          message: `${userCtx.name} atribuiu a tarefa "${task.title}" a você.`,
          type: "TASK_ASSIGNED",
          linkUrl: `/consulting?tab=tasks&taskId=${task.id}`,
        },
      });
    }

    await logAuditEvent({
      organizationId: userCtx.organizationId,
      actorUserId: userCtx.userId,
      action: "PROFILE_UPDATED" as any,
      resourceType: "InternalTask",
      resourceId: task.id,
      afterData: { title: task.title, assigneeId: task.assigneeId, priority: task.priority },
    });

    revalidatePath("/consulting");
    return { success: true, task };
  } catch (err: any) {
    console.error("Erro ao criar tarefa interna:", err);
    return { success: false, error: err.message || "Falha ao criar tarefa." };
  }
}

/**
 * Atualiza status, bloqueio, responsável ou prazo de uma tarefa existente.
 */
export async function updateInternalTask(
  taskId: string,
  payload: {
    status?: TaskStatus;
    priority?: TaskPriority;
    title?: string;
    description?: string;
    assigneeId?: string | null;
    reviewerId?: string | null;
    dueDate?: string | null;
    isBlocked?: boolean;
    blockReason?: string | null;
    cancellationReason?: string | null;
  }
) {
  try {
    const userCtx = await getInternalUserContext();

    const task = await prisma.internalTask.findUnique({
      where: { id: taskId },
      include: {
        members: true,
        reviews: { orderBy: { decidedAt: "desc" }, take: 1 },
      },
    });

    if (!task) {
      return { success: false, error: "Tarefa não encontrada." };
    }

    // Valida permissão de atualização
    const canUpdate = hasInternalPermission(userCtx, "internal.task.update", {
      taskAssigneeId: task.assigneeId,
      taskCreatorId: task.creatorId,
      taskMemberIds: task.members.map((m) => m.userId),
      reviewerId: task.reviewerId,
    });

    if (!canUpdate) {
      throw new ForbiddenError("Você não possui permissão para editar esta tarefa.");
    }

    // Se está alterando status, valida regras de negócio
    if (payload.status && payload.status !== task.status) {
      const hasApprovedReview = task.reviews[0]?.decision === "APPROVED";
      const validation = validateTaskTransition(task.status as TaskStatus, payload.status, {
        requiresApproval: task.requiresApproval,
        hasApprovedReview,
        cancellationReason: payload.cancellationReason,
        assigneeId: payload.assigneeId !== undefined ? payload.assigneeId : task.assigneeId,
        isBlocked: payload.isBlocked !== undefined ? payload.isBlocked : task.isBlocked,
      });

      if (!validation.allowed) {
        return { success: false, error: validation.reason };
      }
    }

    const dataToUpdate: any = {};

    if (payload.title) dataToUpdate.title = payload.title.trim();
    if (payload.description !== undefined) dataToUpdate.description = payload.description?.trim() || null;
    if (payload.priority) dataToUpdate.priority = payload.priority;
    if (payload.assigneeId !== undefined) dataToUpdate.assigneeId = payload.assigneeId;
    if (payload.reviewerId !== undefined) dataToUpdate.reviewerId = payload.reviewerId;
    if (payload.dueDate !== undefined) dataToUpdate.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;

    if (payload.status) {
      dataToUpdate.status = payload.status;
      if (payload.status === "COMPLETED") {
        dataToUpdate.completedAt = new Date();
      } else if (task.status === "COMPLETED") {
        dataToUpdate.completedAt = null;
      }
    }

    // Tratamento de bloqueio
    if (payload.isBlocked !== undefined) {
      dataToUpdate.isBlocked = payload.isBlocked;
      if (payload.isBlocked) {
        dataToUpdate.blockReason = payload.blockReason?.trim() || "Bloqueio operacional registrado.";
        dataToUpdate.blockedAt = new Date();

        // Notifica Adriana (Admin Master) e o criador sobre o bloqueio
        if (task.creatorId !== userCtx.userId) {
          await prisma.internalNotification.create({
            data: {
              organizationId: userCtx.organizationId,
              userId: task.creatorId,
              title: "⚠️ Tarefa Bloqueada",
              message: `A tarefa "${task.title}" foi marcada como bloqueada: ${payload.blockReason || "Sem detalhes"}`,
              type: "TASK_BLOCKED",
              linkUrl: `/consulting?tab=tasks&taskId=${task.id}`,
            },
          });
        }
      } else {
        dataToUpdate.blockReason = null;
        dataToUpdate.blockedAt = null;
      }
    }

    const updatedTask = await prisma.internalTask.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    // Se mudou de responsável, notifica novo assignee
    if (payload.assigneeId && payload.assigneeId !== task.assigneeId && payload.assigneeId !== userCtx.userId) {
      await prisma.internalNotification.create({
        data: {
          organizationId: userCtx.organizationId,
          userId: payload.assigneeId,
          title: "Tarefa Transferida",
          message: `${userCtx.name} atribuiu a tarefa "${task.title}" para você.`,
          type: "TASK_ASSIGNED",
          linkUrl: `/consulting?tab=tasks&taskId=${task.id}`,
        },
      });
    }

    // Se mudou prazo, notifica responsável
    if (payload.dueDate && task.assigneeId && task.assigneeId !== userCtx.userId) {
      await prisma.internalNotification.create({
        data: {
          organizationId: userCtx.organizationId,
          userId: task.assigneeId,
          title: "Prazo Atualizado",
          message: `O prazo da tarefa "${task.title}" foi alterado para ${new Date(payload.dueDate).toLocaleDateString("pt-BR")}.`,
          type: "DUE_DATE_CHANGED",
          linkUrl: `/consulting?tab=tasks&taskId=${task.id}`,
        },
      });
    }

    revalidatePath("/consulting");
    return { success: true, task: updatedTask };
  } catch (err: any) {
    console.error("Erro ao atualizar tarefa interna:", err);
    return { success: false, error: err.message || "Falha ao atualizar tarefa." };
  }
}

/**
 * Submete uma decisão formal de revisão/aprovação de entrega.
 */
export async function submitTaskReviewDecision(payload: {
  taskId: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  comments?: string;
  deliverableVersion?: string;
}) {
  try {
    const userCtx = await getInternalUserContext();

    const task = await prisma.internalTask.findUnique({
      where: { id: payload.taskId },
    });

    if (!task) {
      return { success: false, error: "Tarefa não localizada." };
    }

    const canReview = hasInternalPermission(userCtx, "internal.delivery.review", {
      reviewerId: task.reviewerId,
    });

    if (!canReview) {
      throw new ForbiddenError("Você não tem autorização como revisor desta entrega.");
    }

    const decision = await prisma.taskReviewDecision.create({
      data: {
        taskId: task.id,
        reviewerId: userCtx.userId,
        decision: payload.decision,
        comments: payload.comments?.trim() || null,
        deliverableVersion: payload.deliverableVersion || "1.0",
      },
    });

    // Atualiza status da tarefa de acordo com a decisão
    if (payload.decision === "APPROVED") {
      await prisma.internalTask.update({
        where: { id: task.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.internalTask.update({
        where: { id: task.id },
        data: {
          status: "IN_PROGRESS",
          isBlocked: false,
        },
      });
    }

    // Notifica o responsável pela tarefa
    if (task.assigneeId) {
      await prisma.internalNotification.create({
        data: {
          organizationId: userCtx.organizationId,
          userId: task.assigneeId,
          title: payload.decision === "APPROVED" ? "Entrega Aprovada! 🎉" : "Ajustes Solicitados na Entrega ⚠️",
          message: `${userCtx.name} ${payload.decision === "APPROVED" ? "aprovou" : "solicitou ajustes na"} tarefa "${task.title}": ${payload.comments || "Sem observações adicionais."}`,
          type: "REVIEW_DECISION",
          linkUrl: `/consulting?tab=tasks&taskId=${task.id}`,
        },
      });
    }

    revalidatePath("/consulting");
    return { success: true, decision };
  } catch (err: any) {
    console.error("Erro ao registrar decisão de revisão:", err);
    return { success: false, error: err.message || "Falha ao registrar revisão." };
  }
}

/**
 * Adiciona um comentário a uma tarefa interna.
 */
export async function addTaskComment(taskId: string, content: string) {
  try {
    const userCtx = await getInternalUserContext();

    if (!content || content.trim().length === 0) {
      return { success: false, error: "O comentário não pode ser vazio." };
    }

    const task = await prisma.internalTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "Tarefa não encontrada." };
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: userCtx.userId,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Notifica responsável caso quem comentou seja outra pessoa
    if (task.assigneeId && task.assigneeId !== userCtx.userId) {
      await prisma.internalNotification.create({
        data: {
          organizationId: userCtx.organizationId,
          userId: task.assigneeId,
          title: "Novo Comentário na Tarefa",
          message: `${userCtx.name} comentou em "${task.title}": "${content.slice(0, 80)}..."`,
          type: "TASK_ASSIGNED",
          linkUrl: `/consulting?tab=tasks&taskId=${task.id}`,
        },
      });
    }

    revalidatePath("/consulting");
    return { success: true, comment };
  } catch (err: any) {
    console.error("Erro ao adicionar comentário:", err);
    return { success: false, error: err.message || "Falha ao salvar comentário." };
  }
}

/**
 * Alterna estado de item de checklist.
 */
export async function toggleTaskChecklistItem(itemId: string, isCompleted: boolean) {
  try {
    const item = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: { isCompleted },
    });
    revalidatePath("/consulting");
    return { success: true, item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Alterna estado de subtarefa.
 */
export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  try {
    const subtask = await prisma.internalSubtask.update({
      where: { id: subtaskId },
      data: { isCompleted },
    });
    revalidatePath("/consulting");
    return { success: true, subtask };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Cria ou atualiza a Reunião Semanal de Alinhamento da Maître (Segundas 15h30).
 */
export async function saveWeeklyMeeting(payload: {
  meetingId?: string;
  title: string;
  scheduledAt: string;
  status?: MeetingStatus;
  participantsJson?: string;
  agendaTopicsJson?: string;
  notesMarkdown?: string;
  decisionsJson?: string;
}) {
  try {
    const userCtx = await getInternalUserContext();

    if (!userCtx.isAdminMaster && !hasInternalPermission(userCtx, "internal.meeting.manage")) {
      throw new ForbiddenError("Apenas a Admin Master pode gerenciar reuniões de alinhamento.");
    }

    let meeting;
    if (payload.meetingId) {
      meeting = await prisma.weeklyMeeting.update({
        where: { id: payload.meetingId },
        data: {
          title: payload.title,
          scheduledAt: new Date(payload.scheduledAt),
          status: payload.status || "SCHEDULED",
          participantsJson: payload.participantsJson,
          agendaTopicsJson: payload.agendaTopicsJson,
          notesMarkdown: payload.notesMarkdown,
          decisionsJson: payload.decisionsJson,
        },
      });
    } else {
      meeting = await prisma.weeklyMeeting.create({
        data: {
          organizationId: userCtx.organizationId,
          title: payload.title,
          scheduledAt: new Date(payload.scheduledAt),
          status: payload.status || "SCHEDULED",
          facilitatorId: userCtx.userId,
          participantsJson: payload.participantsJson,
          agendaTopicsJson: payload.agendaTopicsJson,
          notesMarkdown: payload.notesMarkdown,
          decisionsJson: payload.decisionsJson,
        },
      });
    }

    revalidatePath("/consulting");
    return { success: true, meeting };
  } catch (err: any) {
    console.error("Erro ao salvar reunião semanal:", err);
    return { success: false, error: err.message || "Falha ao salvar reunião." };
  }
}

/**
 * Encerra formalmente a Reunião Semanal com gravação de resumo estruturado e imutável.
 */
export async function concludeWeeklyMeeting(payload: {
  meetingId: string;
  concludedSummary: string;
}) {
  try {
    const userCtx = await getInternalUserContext();

    if (!userCtx.isAdminMaster) {
      throw new ForbiddenError("Apenas a Admin Master pode encerrar e homologar a ata de reunião semanal.");
    }

    const meeting = await prisma.weeklyMeeting.update({
      where: { id: payload.meetingId },
      data: {
        status: "CONCLUDED",
        endedAt: new Date(),
        concludedSummary: payload.concludedSummary,
      },
    });

    // Notifica todos os colaboradores da Maître com o resumo oficial da reunião
    const team = await prisma.user.findMany({
      where: { organizationId: userCtx.organizationId, status: "ACTIVE" },
      select: { id: true },
    });

    for (const member of team) {
      await prisma.internalNotification.create({
        data: {
          organizationId: userCtx.organizationId,
          userId: member.id,
          title: "Ata da Reunião Semanal Disponível",
          message: `A reunião "${meeting.title}" foi encerrada. Confira as decisões e tarefas registradas.`,
          type: "MEETING_SUMMARY",
          linkUrl: `/consulting?tab=meetings&meetingId=${meeting.id}`,
        },
      });
    }

    revalidatePath("/consulting");
    return { success: true, meeting };
  } catch (err: any) {
    console.error("Erro ao encerrar reunião:", err);
    return { success: false, error: err.message || "Falha ao encerrar reunião." };
  }
}

/**
 * Marca notificação in-app como lida.
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const userCtx = await getInternalUserContext();
    await prisma.internalNotification.updateMany({
      where: { id: notificationId, userId: userCtx.userId },
      data: { isRead: true },
    });
    revalidatePath("/consulting");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Atualiza configurações da Central Interna (exclusivo Admin Master).
 */
export async function updateInternalConfig(payload: {
  defaultTimezone?: string;
  weeklyMeetingDay?: number;
  weeklyMeetingTime?: string;
  weeklyMeetingDuration?: number;
}) {
  try {
    const userCtx = await getInternalUserContext();

    if (!userCtx.isAdminMaster) {
      throw new ForbiddenError("Apenas a Admin Master pode alterar as configurações da Central.");
    }

    const config = await prisma.internalConsultingConfig.update({
      where: { organizationId: userCtx.organizationId },
      data: {
        defaultTimezone: payload.defaultTimezone || "America/Fortaleza",
        weeklyMeetingDay: payload.weeklyMeetingDay !== undefined ? payload.weeklyMeetingDay : 1,
        weeklyMeetingTime: payload.weeklyMeetingTime || "15:30",
        weeklyMeetingDuration: payload.weeklyMeetingDuration || 60,
      },
    });

    revalidatePath("/consulting");
    return { success: true, config };
  } catch (err: any) {
    console.error("Erro ao atualizar configurações:", err);
    return { success: false, error: err.message };
  }
}
