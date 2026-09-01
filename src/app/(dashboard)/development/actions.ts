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

/**
 * Salva a Avaliação 9-Box e Competências de um Colaborador
 */
export async function savePerformanceEvaluation(params: {
  candidateId: string;
  organizationId: string;
  cycleName?: string;
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
      organizationId,
      cycleName = "Ciclo Anual 2026",
      performanceScore,
      potentialScore,
      competencies,
      strengths,
      improvements,
    } = params;

    const boxPosition = calculateNineBoxPosition(performanceScore, potentialScore);

    // Cria ou atualiza a avaliação do colaborador
    const evalRecord = await prisma.performanceEvaluation.create({
      data: {
        organizationId,
        candidateId,
        evaluatorId: user.id,
        cycleName,
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
      action: "CANDIDATE_UPDATE",
      resourceType: "PerformanceEvaluation",
      resourceId: evalRecord.id,
      afterData: {
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
 * Cria ou atualiza uma meta de Plano de Desenvolvimento Individual (PDI)
 */
export async function saveDevelopmentPlan(params: {
  candidateId: string;
  organizationId: string;
  title: string;
  description?: string;
  category?: string;
  targetDate?: string;
  actionItems?: string[];
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const {
      candidateId,
      organizationId,
      title,
      description,
      category = "TECH_SKILLS",
      targetDate,
      actionItems = [],
    } = params;

    const pdi = await prisma.developmentPlan.create({
      data: {
        organizationId,
        candidateId,
        title,
        description,
        category,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        actionItems: JSON.stringify(actionItems),
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "DevelopmentPlan",
      resourceId: pdi.id,
      afterData: { title, category },
    });

    revalidatePath("/development");
    return { success: true, plan: pdi };
  } catch (error: any) {
    console.error("Erro ao criar PDI:", error);
    return { success: false, error: error.message || "Erro ao salvar meta de PDI." };
  }
}

/**
 * Atualiza o status de um PDI (Concluir meta)
 */
export async function updatePdiStatus(pdiId: string, status: "IN_PROGRESS" | "COMPLETED" | "DELAYED") {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const pdi = await prisma.developmentPlan.update({
      where: { id: pdiId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    revalidatePath("/development");
    return { success: true, plan: pdi };
  } catch (error: any) {
    console.error("Erro ao atualizar status do PDI:", error);
    return { success: false, error: error.message || "Falha ao atualizar meta." };
  }
}
