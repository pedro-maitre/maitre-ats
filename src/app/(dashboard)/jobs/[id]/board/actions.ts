"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateApplicationFit } from "@/lib/fit-evaluator";

/**
 * Move um candidato individual para outra etapa.
 */
export async function moveCandidate(applicationId: string, newStageId: string) {
  try {
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        stageId: newStageId,
        enteredStageAt: new Date(),
      },
      include: {
        job: { select: { id: true } },
      },
    });

    if (updated.job?.id) {
      revalidatePath(`/jobs/${updated.job.id}/board`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to move candidate", error);
    return { success: false, error: error.message || "Falha ao mover candidato" };
  }
}

/**
 * Move múltiplos candidatos em lote (Bulk Action) para uma nova etapa.
 */
export async function batchMoveCandidates(applicationIds: string[], newStageId: string) {
  if (!applicationIds || applicationIds.length === 0) {
    return { success: false, error: "Nenhum candidato selecionado." };
  }

  try {
    await prisma.application.updateMany({
      where: {
        id: { in: applicationIds },
      },
      data: {
        stageId: newStageId,
        enteredStageAt: new Date(),
      },
    });

    // Buscar o jobId para revalidação de cache
    const sample = await prisma.application.findFirst({
      where: { id: applicationIds[0] },
      select: { jobId: true },
    });

    if (sample?.jobId) {
      revalidatePath(`/jobs/${sample.jobId}/board`);
    }

    return { success: true, count: applicationIds.length };
  } catch (error: any) {
    console.error("Failed to batch move candidates", error);
    return { success: false, error: error.message || "Falha ao mover candidatos em lote" };
  }
}

/**
 * Atualiza a prioridade em lote de múltiplos candidatos.
 */
export async function batchUpdatePriority(
  applicationIds: string[],
  priority: "PRIORIZADO" | "NORMAL" | "DUVIDA"
) {
  if (!applicationIds || applicationIds.length === 0) {
    return { success: false, error: "Nenhum candidato selecionado." };
  }

  try {
    await prisma.application.updateMany({
      where: {
        id: { in: applicationIds },
      },
      data: {
        priority,
      },
    });

    const sample = await prisma.application.findFirst({
      where: { id: applicationIds[0] },
      select: { jobId: true },
    });

    if (sample?.jobId) {
      revalidatePath(`/jobs/${sample.jobId}/board`);
    }

    return { success: true, count: applicationIds.length };
  } catch (error: any) {
    console.error("Failed to batch update priority", error);
    return { success: false, error: error.message || "Falha ao atualizar prioridade em lote" };
  }
}

/**
 * Recalcula e persiste as pontuações e categorias de Fit de todas as candidaturas de uma vaga.
 */
export async function batchRecalculateAndPersistFit(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!job) {
      return { success: false, error: "Vaga não encontrada." };
    }

    // Processar todas as aplicações
    const updates = job.applications.map((app) => {
      const evaluation = evaluateApplicationFit(
        {
          title: job.title,
          description: job.description,
          department: job.department,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        },
        {
          tags: app.candidate.tags,
          profileSummary: app.candidate.profileSummary,
        },
        {
          salaryExpectation: app.salaryExpectation,
        }
      );

      return prisma.application.update({
        where: { id: app.id },
        data: {
          matchScore: evaluation.skillsMatch.score,
          fitCategory: evaluation.fitCategory,
          priority: app.priority === "NORMAL" ? evaluation.prioritySuggestion : app.priority,
        },
      });
    });

    await prisma.$transaction(updates);
    revalidatePath(`/jobs/${jobId}/board`);

    return { success: true, totalProcessed: updates.length };
  } catch (error: any) {
    console.error("Failed to recalculate and persist fit", error);
    return { success: false, error: error.message || "Falha ao recalcular Fit da vaga" };
  }
}
