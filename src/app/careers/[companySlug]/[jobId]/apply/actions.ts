/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";

export async function submitApplication(formData: FormData) {
  const jobId = formData.get("jobId") as string;
  const orgSlug = formData.get("companySlug") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const profileSummary = formData.get("profileSummary") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const tags = formData.get("tags") as string;
  const source = formData.get("source") as string || "Site de Carreiras";
  const salaryExpectation = formData.get("salaryExpectation") as string;
  const resumeUrl = formData.get("resumeUrl") as string;

  const expectationNum = salaryExpectation ? parseFloat(salaryExpectation) : null;

  // Parse tags
  let tagsJson = "[]";
  if (tags) {
    const tagsArray = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t);
    tagsJson = JSON.stringify(tagsArray);
  }

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
      linkedinUrl,
      tags: tagsJson,
      profileSummary,
      resumeUrl: resumeUrl || undefined,
      source: source || "Site de Carreiras",
    },
    create: {
      firstName,
      lastName,
      email,
      phone,
      linkedinUrl,
      tags: tagsJson,
      profileSummary,
      resumeUrl,
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

  // KNOCKOUT RULE: Check if salary expectation exceeds job budget
  let fitCategory = "ALTO_FIT";
  let priority = "NORMAL";
  
  if (job.salaryMax && expectationNum && expectationNum > job.salaryMax) {
    fitCategory = "BAIXO_FIT";
    priority = "DUVIDA";
  }

  // Create Application
  await prisma.application.create({
    data: {
      candidateId: candidate.id,
      jobId: job.id,
      stageId: firstStage.id,
      matchScore: Math.floor(Math.random() * 41) + 60, // Mock score between 60-100
      salaryExpectation: expectationNum,
      fitCategory,
      priority
    }
  });

  // Compliance LGPD: Registro formal de consentimento do candidato
  try {
    await prisma.candidateConsent.create({
      data: {
        candidateId: candidate.id,
        purpose: "R&S_BANCO_TALENTOS",
        granted: true,
      },
    });
  } catch (consentErr: any) {
    console.warn("Aviso ao registrar consentimento LGPD:", consentErr?.message);
  }

  return { success: true };
}
