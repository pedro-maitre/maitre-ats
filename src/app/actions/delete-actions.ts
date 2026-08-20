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

  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado. Apenas o Admin Master pode excluir usuários da equipe.");
  }

  if (session.user.id === userId) {
    throw new Error("Você não pode excluir sua própria conta.");
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message || "Erro ao excluir o usuário." };
  }
}
