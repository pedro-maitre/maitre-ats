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

/**
 * Submete uma candidatura de recrutamento interno validando a elegibilidade do colaborador.
 */
export async function applyInternalJob(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER", "CANDIDATE"]);

    const employeeId = (formData.get("employeeId") as string)?.trim();
    const jobId = (formData.get("jobId") as string)?.trim();
    const coverLetter = (formData.get("coverLetter") as string)?.trim() || null;

    if (!employeeId || !jobId) {
      return { success: false, error: "Colaborador e Vaga são obrigatórios." };
    }

    const [employee, job] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          performanceEvaluations: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      }),
      prisma.job.findUnique({
        where: { id: jobId },
      }),
    ]);

    if (!employee || !job) {
      return { success: false, error: "Colaborador ou Vaga não localizados." };
    }

    // Valida tenant
    if (employee.organizationId !== job.organizationId) {
      return { success: false, error: "Inconsistência de organização entre colaborador e vaga." };
    }

    // Verifica se já existe candidatura
    const existing = await prisma.internalApplication.findFirst({
      where: {
        employeeId,
        jobId,
      },
    });

    if (existing) {
      return { success: false, error: "Colaborador já possui uma candidatura registrada para esta vaga." };
    }

    const { checkInternalJobEligibility } = await import("@/lib/mobility");
    const eligibility = checkInternalJobEligibility(employee);

    const application = await prisma.internalApplication.create({
      data: {
        organizationId: employee.organizationId,
        jobId,
        employeeId,
        coverLetter,
        status: eligibility.isEligible ? "SUBMITTED" : "INELIGIBLE",
        managerApprovalStatus: "PENDING",
        eligibilitySnapshot: JSON.stringify(eligibility),
      },
    });

    await logAuditEvent({
      organizationId: employee.organizationId,
      actorUserId: user.id,
      action: "INTERNAL_JOB_APPLIED",
      resourceType: "InternalApplication",
      resourceId: application.id,
      afterData: {
        employeeId,
        jobId,
        isEligible: eligibility.isEligible,
      },
    });

    revalidatePath("/careers-hub");
    return {
      success: true,
      application,
      eligibility,
      warning: eligibility.isEligible ? null : eligibility.reasons.join(" "),
    };
  } catch (error: any) {
    console.error("Erro ao aplicar para vaga interna:", error);
    return { success: false, error: error.message || "Falha ao registrar candidatura interna." };
  }
}

/**
 * Atualiza o status de aprovação de uma candidatura interna.
 */
export async function reviewInternalApplication(
  applicationId: string,
  newStatus: string, // MANAGER_APPROVED, INTERVIEWING, TRANSFERRED, REJECTED
  managerFeedback?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const application = await prisma.internalApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return { success: false, error: "Candidatura não encontrada." };
    }

    const updated = await prisma.internalApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        managerApprovalStatus: newStatus === "REJECTED" ? "REJECTED" : "APPROVED",
        managerFeedback: managerFeedback || application.managerFeedback,
      },
    });

    await logAuditEvent({
      organizationId: application.organizationId,
      actorUserId: user.id,
      action: "INTERNAL_JOB_REVIEWED",
      resourceType: "InternalApplication",
      resourceId: applicationId,
      beforeData: { status: application.status },
      afterData: { status: newStatus, managerFeedback },
    });

    revalidatePath("/careers-hub");
    return { success: true, application: updated };
  } catch (error: any) {
    console.error("Erro ao revisar candidatura interna:", error);
    return { success: false, error: error.message || "Falha ao revisar candidatura." };
  }
}

/**
 * Cadastra uma Trilha de Carreira em Y para a organização.
 */
export async function createCareerTrack(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const organizationId = (formData.get("organizationId") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const trackType = (formData.get("trackType") as string)?.trim() || "Y_DUAL";
    const description = (formData.get("description") as string)?.trim() || null;
    const levelsJson = (formData.get("levels") as string)?.trim();

    if (!organizationId || !title) {
      return { success: false, error: "Organização e Título da Trilha são obrigatórios." };
    }

    const { getDefaultYCareerTrack } = await import("@/lib/mobility");
    const defaultLevels = getDefaultYCareerTrack(title);
    const levelsToStore = levelsJson ? levelsJson : JSON.stringify(defaultLevels);

    const track = await prisma.careerTrack.create({
      data: {
        organizationId,
        title,
        trackType,
        description,
        levels: levelsToStore,
      },
    });

    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "CAREER_TRACK_CREATED",
      resourceType: "CareerTrack",
      resourceId: track.id,
      afterData: { title, trackType },
    });

    revalidatePath("/careers-hub");
    return { success: true, track };
  } catch (error: any) {
    console.error("Erro ao criar trilha de carreira:", error);
    return { success: false, error: error.message || "Falha ao criar trilha de carreira." };
  }
}

