"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type StageInput = {
  id?: string;
  name: string;
  order: number;
  isDeleted?: boolean;
};

export type UpdateJobInput = {
  title: string;
  department?: string | null;
  location?: string | null;
  employmentType?: string | null;
  seniority?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status: string;
  description: string;
  recruiterId?: string | null;
  requiredSkills?: string | null;
  stages?: StageInput[];
};

/**
 * Atualiza integralmente os dados de uma vaga, incluindo parâmetros, requisitos e etapas.
 */
export async function updateJobFull(jobId: string, input: UpdateJobInput) {
  if (!input.title || !input.description) {
    return { success: false, error: "Título e descrição são obrigatórios." };
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { stages: { include: { _count: { select: { applications: true } } } } },
    });

    if (!job) {
      return { success: false, error: "Vaga não encontrada." };
    }

    // 1. Atualizar campos básicos da vaga
    await prisma.job.update({
      where: { id: jobId },
      data: {
        title: input.title,
        department: input.department || null,
        location: input.location || null,
        employmentType: input.employmentType || null,
        seniority: input.seniority || null,
        salaryMin: input.salaryMin ? Number(input.salaryMin) : null,
        salaryMax: input.salaryMax ? Number(input.salaryMax) : null,
        status: input.status || "OPEN",
        description: input.description,
        recruiterId: input.recruiterId && input.recruiterId !== "none" ? input.recruiterId : null,
        requiredSkills: input.requiredSkills || null,
      },
    });

    // 2. Gerenciar Etapas (Stages), se fornecidas
    if (input.stages && input.stages.length > 0) {
      for (const st of input.stages) {
        if (st.id) {
          // Etapa existente
          if (st.isDeleted) {
            // Verificar se há candidatos na etapa antes de deletar
            const existingStage = job.stages.find((s) => s.id === st.id);
            if (existingStage && existingStage._count.applications === 0) {
              await prisma.stage.delete({ where: { id: st.id } });
            }
          } else {
            // Atualizar nome e ordem
            await prisma.stage.update({
              where: { id: st.id },
              data: {
                name: st.name,
                order: st.order,
              },
            });
          }
        } else if (!st.isDeleted && st.name.trim()) {
          // Nova etapa criada
          await prisma.stage.create({
            data: {
              name: st.name.trim(),
              order: st.order,
              jobId: jobId,
              organizationId: job.organizationId,
            },
          });
        }
      }
    }

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}/board`);
    revalidatePath(`/jobs/${jobId}/edit`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update job full:", error);
    return { success: false, error: error.message || "Falha ao atualizar a vaga." };
  }
}

/**
 * Alterna o status da vaga rapidamente (ex: OPEN, PAUSED, CLOSED).
 */
export async function toggleJobStatus(jobId: string, newStatus: "OPEN" | "PAUSED" | "CLOSED") {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}/board`);
    revalidatePath(`/jobs/${jobId}/edit`);

    return { success: true, status: newStatus };
  } catch (error: any) {
    console.error("Failed to toggle job status:", error);
    return { success: false, error: error.message || "Erro ao alterar status da vaga." };
  }
}

/**
 * Encerra/Arquiva uma vaga.
 */
export async function closeJob(jobId: string) {
  return toggleJobStatus(jobId, "CLOSED");
}
