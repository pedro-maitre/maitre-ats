"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignCandidateToJob(candidateId: string, jobId: string) {
  // Check if job exists and get first stage
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { stages: { orderBy: { order: "asc" } } }
  });

  if (!job) throw new Error("Vaga não encontrada");
  
  const firstStage = job.stages[0];
  if (!firstStage) throw new Error("Vaga sem etapas configuradas");

  // Check if candidate is already in this job
  const existingApp = await prisma.application.findFirst({
    where: {
      candidateId,
      jobId
    }
  });

  if (existingApp) {
    throw new Error("O candidato já está participando deste processo seletivo.");
  }

  // Create Application (Manual Assignment, so fitCategory is null or manual)
  await prisma.application.create({
    data: {
      candidateId,
      jobId,
      stageId: firstStage.id,
      matchScore: null,
      priority: "NORMAL"
    }
  });

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath(`/jobs/${jobId}/board`);
  
  return { success: true };
}
