/**
 * Módulo de Regras de Negócio, Permissões e Governança
 * Central de Gestão Interna da Maître Consultoria
 */

import { Session } from "next-auth";
import { ForbiddenError, UnauthorizedError } from "./security";

export type InternalPermission =
  | "internal.task.create"
  | "internal.task.assign"
  | "internal.task.update"
  | "internal.task.delete"
  | "internal.project.manage"
  | "internal.delivery.review"
  | "internal.meeting.manage"
  | "internal.calendar.manage"
  | "internal.member.manage"
  | "internal.config.manage";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectType = "PROJECT" | "RECURRING_SERVICE" | "INTERNAL_ACTIVITY";
export type MeetingStatus = "SCHEDULED" | "IN_PROGRESS" | "CONCLUDED" | "CANCELLED";

export interface InternalUserContext {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  isMasterOrg: boolean;
  isAdminMaster: boolean;
}

/**
 * Valida se um usuário específico é a Admin Master exclusiva da Maître.
 * Regra: Deve coincidir com o ID configurado da Adriana na organização Master.
 */
export function checkIsAdminMaster(
  userId: string,
  configuredAdminMasterId?: string | null,
  isMasterOrg: boolean = true
): boolean {
  if (!userId || !configuredAdminMasterId || !isMasterOrg) {
    return false;
  }
  return userId === configuredAdminMasterId;
}

/**
 * Matriz de permissões da Central Interna da Maître.
 * - Admin Master (Adriana): Todas as permissões de gestão, governança, delegação e configuração.
 * - Integrantes Operacionais (Pedro, Erika, Lauriana, Kheviany, Emidio):
 *   - Criar demandas e tarefas;
 *   - Atualizar suas próprias tarefas e itens onde colaboram;
 *   - Visualizar agenda, projetos em que participam e reuniões;
 *   - Submeter entregas para revisão;
 *   - Registrar bloqueios e comentários.
 */
export function hasInternalPermission(
  userCtx: InternalUserContext,
  permission: InternalPermission,
  resourceContext?: {
    taskAssigneeId?: string | null;
    taskCreatorId?: string | null;
    taskMemberIds?: string[];
    reviewerId?: string | null;
  }
): boolean {
  // 1. Admin Master tem controle administrativo pleno
  if (userCtx.isAdminMaster) {
    return true;
  }

  // 2. Não-membros da organização Master não possuem acesso à gestão interna
  if (!userCtx.isMasterOrg) {
    return false;
  }

  // 3. Regras granulares por permissão
  switch (permission) {
    case "internal.task.create":
      // Qualquer integrante da Maître pode criar tarefas e demandas
      return true;

    case "internal.task.assign":
      // Atribuir tarefa a outra pessoa exige ser Admin Master ou o próprio criador da tarefa
      if (!resourceContext) return false;
      return resourceContext.taskCreatorId === userCtx.userId;

    case "internal.task.update":
      // Pode atualizar se for o responsável, o criador ou colaborador da tarefa
      if (!resourceContext) return true;
      if (resourceContext.taskAssigneeId === userCtx.userId) return true;
      if (resourceContext.taskCreatorId === userCtx.userId) return true;
      if (resourceContext.taskMemberIds?.includes(userCtx.userId)) return true;
      return false;

    case "internal.task.delete":
      // Exclusão reservada à Admin Master ou criador antes do início da execução
      if (!resourceContext) return false;
      return resourceContext.taskCreatorId === userCtx.userId;

    case "internal.project.manage":
      // Criar e gerenciar escopo de projetos reservado à Admin Master
      return false;

    case "internal.delivery.review":
      // Aprovar entregas exige ser o revisor formalmente designado ou a Admin Master
      if (!resourceContext) return false;
      return resourceContext.reviewerId === userCtx.userId;

    case "internal.meeting.manage":
      // Conduzir e fechar atas da reunião semanal é atribuição da Admin Master
      return false;

    case "internal.calendar.manage":
      // Integrantes podem criar seus próprios compromissos internos
      return true;

    case "internal.member.manage":
    case "internal.config.manage":
      // Exclusivo da Admin Master (governança de sistema)
      return false;

    default:
      return false;
  }
}

/**
 * Validação rigorosa de transição de status de tarefa.
 */
export function validateTaskTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus,
  options: {
    requiresApproval: boolean;
    hasApprovedReview: boolean;
    cancellationReason?: string | null;
    assigneeId?: string | null;
    isBlocked?: boolean;
  }
): { allowed: boolean; reason?: string } {
  // Regra 1: Para iniciar execução (sair de TODO para IN_PROGRESS), deve ter um responsável principal
  if (currentStatus === "TODO" && (newStatus === "IN_PROGRESS" || newStatus === "IN_REVIEW")) {
    if (!options.assigneeId) {
      return {
        allowed: false,
        reason: "A tarefa precisa ter um responsável principal atribuído para iniciar execução.",
      };
    }
  }

  // Regra 2: Cancelamento exige justificativa/motivo
  if (newStatus === "CANCELLED") {
    if (!options.cancellationReason || options.cancellationReason.trim().length < 5) {
      return {
        allowed: false,
        reason: "O cancelamento de uma demanda exige o preenchimento do motivo (mínimo 5 caracteres).",
      };
    }
  }

  // Regra 3: Tarefa com aprovação obrigatória não pode ser concluída diretamente sem decisão aprovada
  if (newStatus === "COMPLETED" && options.requiresApproval) {
    if (!options.hasApprovedReview) {
      return {
        allowed: false,
        reason: "Esta entrega exige aprovação formal do revisor designado antes de ser marcada como concluída.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Utilitários de Data e Fuso Horário para Reunião Semanal e Agenda.
 * Padrão da Maître: Segunda-feira às 15h30.
 */
export function getNextWeeklyMeetingDate(
  referenceDate: Date = new Date(),
  dayOfWeek: number = 1, // 1 = Segunda-feira
  timeString: string = "15:30",
  _timezone: string = "America/Fortaleza"
): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const target = new Date(referenceDate);

  const currentDay = target.getDay(); // 0 = Domingo, 1 = Segunda, ...
  let daysToAdd = (dayOfWeek - currentDay + 7) % 7;

  target.setHours(hours, minutes, 0, 0);

  // Se já passou o horário na segunda-feira atual, programa para a próxima semana
  if (daysToAdd === 0 && target.getTime() <= referenceDate.getTime()) {
    daysToAdd = 7;
  }

  target.setDate(target.getDate() + daysToAdd);
  return target;
}

/**
 * Calcula a métrica de distribuição de tarefas por integrante.
 * AVISO DE PRODUTO: Apresentado exclusivamente como volume operacional para balanceamento
 * de carga da equipe, e NUNCA como avaliação de produtividade ou score individual punitivo.
 */
export function calculateTeamWorkloadDistribution(
  teamMembers: Array<{ id: string; name: string }>,
  tasks: Array<{ assigneeId: string | null; status: string; isBlocked: boolean; dueDate: Date | null }>
) {
  const now = new Date();

  return teamMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
    const completed = memberTasks.filter((t) => t.status === "COMPLETED").length;
    const inProgress = memberTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const inReview = memberTasks.filter((t) => t.status === "IN_REVIEW").length;
    const blocked = memberTasks.filter((t) => t.isBlocked && t.status !== "COMPLETED").length;
    const overdue = memberTasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < now
    ).length;

    return {
      userId: member.id,
      name: member.name,
      totalAssigned: memberTasks.length,
      inProgress,
      inReview,
      completed,
      blocked,
      overdue,
    };
  });
}
