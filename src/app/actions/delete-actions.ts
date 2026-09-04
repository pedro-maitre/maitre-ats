"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function checkIsAdmin(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/**
 * Delete a Job (Admin Master only)
 */
export async function deleteJob(jobId: string) {
  const session = await getServerSession(authOptions);

  if (!checkIsAdmin(session?.user?.role)) {
    throw new Error("Não autorizado. Apenas Administradores podem excluir vagas.");
  }

  try {
    // Delete in cascade: Evaluations, Activities, Applications, Stages, Job
    await prisma.$transaction(async (tx) => {
      // Find applications for this job
      const apps = await tx.application.findMany({
        where: { jobId },
        select: { id: true },
      });
      const appIds = apps.map((a) => a.id);

      if (appIds.length > 0) {
        await tx.evaluation.deleteMany({
          where: { applicationId: { in: appIds } },
        });
        await tx.activity.deleteMany({
          where: { applicationId: { in: appIds } },
        });
        await tx.application.deleteMany({
          where: { jobId },
        });
      }

      await tx.stage.deleteMany({
        where: { jobId },
      });

      await tx.job.delete({
        where: { id: jobId },
      });
    });

    revalidatePath("/jobs");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting job:", error);
    return { success: false, error: error.message || "Erro ao excluir a vaga." };
  }
}

/**
 * Delete a Candidate (Admin Master only)
 */
export async function deleteCandidate(candidateId: string) {
  const session = await getServerSession(authOptions);

  if (!checkIsAdmin(session?.user?.role)) {
    throw new Error("Não autorizado. Apenas Administradores podem excluir candidatos.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const apps = await tx.application.findMany({
        where: { candidateId },
        select: { id: true },
      });
      const appIds = apps.map((a) => a.id);

      if (appIds.length > 0) {
        await tx.evaluation.deleteMany({
          where: { applicationId: { in: appIds } },
        });
        await tx.activity.deleteMany({
          where: { applicationId: { in: appIds } },
        });
        await tx.application.deleteMany({
          where: { candidateId },
        });
      }

      await tx.candidate.delete({
        where: { id: candidateId },
      });
    });

    revalidatePath("/candidates");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting candidate:", error);
    return { success: false, error: error.message || "Erro ao excluir o candidato." };
  }
}

/**
 * Delete a User (Super Admin only)
 */
export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
    return { success: false, error: "Não autorizado. Apenas Administradores podem excluir usuários." };
  }

  if (session?.user?.id === userId) {
    return { success: false, error: "Você não pode excluir sua própria conta enquanto estiver logado." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!targetUser) {
    return { success: false, error: "Usuário não encontrado." };
  }

  // Apenas SUPER_ADMIN pode excluir outros ADMINs ou SUPER_ADMINs
  if ((targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN") && session?.user?.role !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Não autorizado. Apenas o Admin Master (SUPER_ADMIN) pode excluir administradores.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Desvincular vagas atribuídas ao recrutador ou gestor
      await tx.job.updateMany({
        where: { recruiterId: userId },
        data: { recruiterId: null },
      });

      await tx.job.updateMany({
        where: { hiringManagerId: userId },
        data: { hiringManagerId: null },
      });

      // 2. Desvincular atividades
      await tx.activity.updateMany({
        where: { actorId: userId },
        data: { actorId: null },
      });

      // 3. Remover avaliações feitas por este usuário
      await tx.evaluation.deleteMany({
        where: { evaluatorId: userId },
      });

      // 4. Desvincular candidato caso exista
      await tx.candidate.updateMany({
        where: { userId: userId },
        data: { userId: null },
      });

      // 5. Excluir usuário
      await tx.user.delete({
        where: { id: userId },
      });
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message || "Erro ao excluir o usuário." };
  }
}
