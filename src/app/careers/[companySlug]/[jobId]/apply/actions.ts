/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";

export async function submitApplication(jobId: string, orgSlug: string, candidateData: any) {
  const { firstName, lastName, email, phone, profileSummary, source } = candidateData;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug }
  });

  if (!org) throw new Error("Organização não encontrada");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { stages: { orderBy: { order: "asc" } } }
  });

  if (!job) throw new Error("Vaga não encontrada");

  const firstStage = job.stages[0];
  if (!firstStage) throw new Error("Vaga sem etapas configuradas");

  // Upsert Candidate
  const candidate = await prisma.candidate.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      phone,
      profileSummary,
      source: source || "Site de Carreiras",
    },
    create: {
      firstName,
      lastName,
      email,
      phone,
      profileSummary,
      source: source || "Site de Carreiras",
      organizationId: org.id,
    },
  });

  // Check if application already exists
  const existingApp = await prisma.application.findFirst({
    where: {
      candidateId: candidate.id,
      jobId: job.id
    }
  });

  if (existingApp) {
    throw new Error("Você já se candidatou para esta vaga.");
  }

  // Create Application
  await prisma.application.create({
    data: {
      candidateId: candidate.id,
      jobId: job.id,
      stageId: firstStage.id,
      matchScore: Math.floor(Math.random() * 41) + 60 // Mock score between 60-100
    }
  });

  return { success: true };
}
