/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

import { NineBoxPosition, calculateNineBoxPosition } from "@/lib/nineBox";
export type { NineBoxPosition };

export interface PdiGoalItem {
  title: string;
  metricIndicator: string;
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  weightPercent: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "BLOCKED";
}

/**
 * Salva a Avaliação 9-Box e Competências de um Colaborador (Ciclos 90° e 180°)
 */
export async function savePerformanceEvaluation(params: {
  candidateId?: string;
  employeeId?: string;
  organizationId: string;
  cycleName?: string;
  evaluationType?: "SELF" | "MANAGER" | "CALIBRATION";
  evaluatorRole?: string;
  performanceScore: number;
  potentialScore: number;
  competencies: Record<string, number>;
  strengths?: string;
  improvements?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const {
      candidateId,
      employeeId,
      organizationId,
      cycleName = "Ciclo Anual 2026",
      evaluationType = "MANAGER",
      evaluatorRole = evaluationType === "SELF" ? "COLABORADOR" : "GESTOR_DIRETO",
      performanceScore,
      potentialScore,
      competencies,
      strengths,
      improvements,
    } = params;

    if (!candidateId && !employeeId) {
      return { success: false, error: "Informe o ID do colaborador ou candidato para avaliação." };
    }

    const boxPosition = calculateNineBoxPosition(performanceScore, potentialScore);

    // Cria o registro da avaliação
    const evalRecord = await prisma.performanceEvaluation.create({
      data: {
        organizationId,
        candidateId: candidateId || undefined,
        employeeId: employeeId || undefined,
        evaluatorId: user.id,
        cycleName,
        evaluationType,
        evaluatorRole,
        performanceScore,
        potentialScore,
        boxPosition,
        competencies: JSON.stringify(competencies),
        strengths,
        improvements,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "PERFORMANCE_EVALUATED",
      resourceType: "PerformanceEvaluation",
      resourceId: evalRecord.id,
      afterData: {
        employeeId,
        candidateId,
        evaluationType,
        boxPosition,
        performanceScore,
        potentialScore,
      },
    });

    revalidatePath("/development");
    return { success: true, evaluation: evalRecord };
  } catch (error: any) {
    console.error("Erro ao salvar avaliação 9-Box:", error);
    return { success: false, error: error.message || "Erro ao salvar avaliação." };
  }
}

/**
 * Cria ou atualiza uma meta de Plano de Desenvolvimento Individual (PDI) com metas quantitativas
 */
export async function saveDevelopmentPlan(params: {
  candidateId?: string;
  employeeId?: string;
  organizationId: string;
  title: string;
  description?: string;
  category?: string;
  targetDate?: string;
  actionItems?: string[];
  goals?: PdiGoalItem[];
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const {
      candidateId,
      employeeId,
      organizationId,
      title,
      description,
      category = "TECH_SKILLS",
      targetDate,
      actionItems = [],
      goals = [],
    } = params;

    if (!candidateId && !employeeId) {
      return { success: false, error: "Informe o colaborador para vincular o PDI." };
    }

    const pdi = await prisma.developmentPlan.create({
      data: {
        organizationId,
        candidateId: candidateId || undefined,
        employeeId: employeeId || undefined,
        title,
        description,
        category,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        actionItems: JSON.stringify(actionItems),
        goals: JSON.stringify(goals),
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "PDI_CREATED",
      resourceType: "DevelopmentPlan",
      resourceId: pdi.id,
      afterData: { title, category, goalsCount: goals.length },
    });

    revalidatePath("/development");
    return { success: true, plan: pdi };
  } catch (error: any) {
    console.error("Erro ao criar PDI:", error);
    return { success: false, error: error.message || "Erro ao salvar meta de PDI." };
  }
}

/**
 * Atualiza o progresso numérico de uma meta dentro do PDI
 */
export async function updatePdiGoalProgress(params: {
  planId: string;
  goalIndex: number;
  currentValue: number;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "BLOCKED";
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const { planId, goalIndex, currentValue, status } = params;

    const plan = await prisma.developmentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { success: false, error: "Plano de Desenvolvimento não encontrado." };
    }

    let goals: PdiGoalItem[] = [];
    try {
      goals = JSON.parse(plan.goals || "[]");
    } catch {
      goals = [];
    }

    if (goalIndex < 0 || goalIndex >= goals.length) {
      return { success: false, error: "Índice de meta inválido." };
    }

    goals[goalIndex].currentValue = currentValue;
    if (status) {
      goals[goalIndex].status = status;
    } else if (goals[goalIndex].targetValue > 0 && currentValue >= goals[goalIndex].targetValue) {
      goals[goalIndex].status = "ACHIEVED";
    } else if (currentValue > goals[goalIndex].baselineValue) {
      goals[goalIndex].status = "IN_PROGRESS";
    }

    // Se todas as metas foram atingidas, sugere conclusão do plano
    const allAchieved = goals.length > 0 && goals.every((g) => g.status === "ACHIEVED");
    const updatedStatus = allAchieved ? "COMPLETED" : plan.status;

    const updatedPlan = await prisma.developmentPlan.update({
      where: { id: planId },
      data: {
        goals: JSON.stringify(goals),
        status: updatedStatus,
        completedAt: allAchieved ? new Date() : plan.completedAt,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: plan.organizationId,
      actorUserId: user.id,
      action: "PDI_UPDATED",
      resourceType: "DevelopmentPlan",
      resourceId: plan.id,
      afterData: { goalIndex, currentValue, goalStatus: goals[goalIndex].status },
    });

    revalidatePath("/development");
    return { success: true, plan: updatedPlan, goals };
  } catch (error: any) {
    console.error("Erro ao atualizar progresso de meta:", error);
    return { success: false, error: error.message || "Erro ao atualizar meta." };
  }
}

/**
 * Atualiza o status de um PDI (Concluir meta geral)
 */
export async function updatePdiStatus(pdiId: string, status: "IN_PROGRESS" | "COMPLETED" | "DELAYED") {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const pdi = await prisma.developmentPlan.update({
      where: { id: pdiId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    await logAuditEvent({
      organizationId: pdi.organizationId,
      actorUserId: user.id,
      action: "PDI_UPDATED",
      resourceType: "DevelopmentPlan",
      resourceId: pdi.id,
      afterData: { status },
    });

    revalidatePath("/development");
    return { success: true, plan: pdi };
  } catch (error: any) {
    console.error("Erro ao atualizar status do PDI:", error);
    return { success: false, error: error.message || "Falha ao atualizar meta." };
  }
}
