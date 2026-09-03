/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

/**
 * Busca os planos de sucessão com os sucessores mapeados.
 */
export async function getSuccessionPlans(organizationId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    const where: any = {};
    if (organizationId && organizationId !== "ALL") {
      where.organizationId = organizationId;
    }

    const plans = await prisma.successionPlan.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        successors: {
          orderBy: { performanceRating: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return plans;
  } catch (error: any) {
    console.error("Erro ao buscar planos de sucessão:", error);
    return [];
  }
}

/**
 * Cria um novo plano de sucessão para uma cadeira crítica.
 */
export async function createSuccessionPlan(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const positionTitle = (formData.get("positionTitle") as string)?.trim();
    const organizationId = (formData.get("organizationId") as string)?.trim();
    const currentHolderName = (formData.get("currentHolderName") as string)?.trim() || null;
    const criticalityLevel = (formData.get("criticalityLevel") as string)?.trim() || "HIGH";
    const riskOfLoss = (formData.get("riskOfLoss") as string)?.trim() || "MEDIUM";
    const impactOfLoss = (formData.get("impactOfLoss") as string)?.trim() || "HIGH";
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!positionTitle || !organizationId) {
      return { success: false, error: "Cargo e Empresa são obrigatórios." };
    }

    const plan = await prisma.successionPlan.create({
      data: {
        organizationId,
        positionTitle,
        currentHolderName,
        criticalityLevel,
        riskOfLoss,
        impactOfLoss,
        notes,
      },
    });

    // Se tiver sucessor inicial informado
    const successorName = (formData.get("successorName") as string)?.trim();
    if (successorName) {
      const successorEmail = (formData.get("successorEmail") as string)?.trim() || null;
      const currentRole = (formData.get("currentRole") as string)?.trim() || null;
      const readiness = (formData.get("readiness") as string)?.trim() || "READY_1_2_YEARS";

      await prisma.successionCandidate.create({
        data: {
          planId: plan.id,
          employeeName: successorName,
          employeeEmail: successorEmail,
          currentRole,
          readiness,
          performanceRating: 4.5,
          potentialRating: 4.5,
        },
      });
    }

    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "ROLE_CHANGE",
      resourceType: "SuccessionPlan",
      resourceId: plan.id,
      afterData: { positionTitle, criticalityLevel, currentHolderName },
      reason: `Mapeamento de sucessão para o cargo "${positionTitle}" criado por ${user.email}.`,
    });

    revalidatePath("/careers-hub");
    return { success: true, plan };
  } catch (error: any) {
    console.error("Erro ao criar plano de sucessão:", error);
    return { success: false, error: error.message || "Falha ao salvar plano de sucessão." };
  }
}

/**
 * Adiciona um potencial sucessor a uma cadeira crítica.
 */
export async function addSuccessorCandidate(planId: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const employeeName = (formData.get("employeeName") as string)?.trim();
    const employeeEmail = (formData.get("employeeEmail") as string)?.trim() || null;
    const currentRole = (formData.get("currentRole") as string)?.trim() || null;
    const readiness = (formData.get("readiness") as string)?.trim() || "READY_1_2_YEARS";
    const performanceRating = parseFloat(formData.get("performanceRating") as string) || 4.0;
    const potentialRating = parseFloat(formData.get("potentialRating") as string) || 4.0;
    const developmentActions = (formData.get("developmentActions") as string)?.trim() || null;

    if (!employeeName) {
      return { success: false, error: "Nome do colaborador sucessor é obrigatório." };
    }

    const successor = await prisma.successionCandidate.create({
      data: {
        planId,
        employeeName,
        employeeEmail,
        currentRole,
        readiness,
        performanceRating,
        potentialRating,
        developmentActions,
      },
    });

    revalidatePath("/careers-hub");
    return { success: true, successor };
  } catch (error: any) {
    console.error("Erro ao adicionar sucessor:", error);
    return { success: false, error: error.message || "Falha ao adicionar sucessor." };
  }
}

/**
 * Atualiza o nível de prontidão de um sucessor.
 */
export async function updateSuccessorReadiness(
  successorId: string,
  readiness: "READY_NOW" | "READY_1_2_YEARS" | "READY_3_PLUS" | "EMERGENCY_BACKUP"
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const updated = await prisma.successionCandidate.update({
      where: { id: successorId },
      data: { readiness },
    });

    revalidatePath("/careers-hub");
    return { success: true, successor: updated };
  } catch (error: any) {
    console.error("Erro ao atualizar prontidão:", error);
    return { success: false, error: error.message || "Falha ao atualizar prontidão." };
  }
}
