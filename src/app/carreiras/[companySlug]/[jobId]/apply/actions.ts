/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function submitApplication(formData: FormData) {
  const jobId = formData.get("jobId") as string;
  const orgSlug = formData.get("companySlug") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const phone = formData.get("phone") as string;
  const profileSummary = formData.get("profileSummary") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const tags = formData.get("tags") as string;
  const source = (formData.get("source") as string) || "Portal de Carreiras";
  const salaryExpectation = formData.get("salaryExpectation") as string;
  const resumeUrl = formData.get("resumeUrl") as string;
  const password = formData.get("password") as string;

  if (!email || !firstName) {
    throw new Error("Nome e e-mail são obrigatórios.");
  }

  const expectationNum = salaryExpectation ? parseFloat(salaryExpectation) : null;

  // Parse tags
  let tagsJson = "[]";
  if (tags) {
    const tagsArray = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t);
    tagsJson = JSON.stringify(tagsArray);
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) throw new Error("Organização não encontrada");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  if (!job) throw new Error("Vaga não encontrada");

  const firstStage = job.stages[0];
  if (!firstStage) throw new Error("Vaga sem etapas configuradas");

  // If password was provided, create or update user account for candidate portal
  let userId: string | undefined;
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (password && password.length >= 6) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName?.trim() || ""}`.trim();

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name: fullName,
        },
      });
      userId = updatedUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: fullName,
          role: "CANDIDATE",
          organizationId: org.id,
        },
      });
      userId = newUser.id;
    }
  } else if (existingUser) {
    userId = existingUser.id;
  }

  // Upsert Candidate
  const candidate = await prisma.candidate.upsert({
    where: { email },
    update: {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      phone,
      linkedinUrl,
      tags: tagsJson,
      profileSummary,
      resumeUrl: resumeUrl || undefined,
      source,
      userId: userId || undefined,
    },
    create: {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      email,
      phone,
      linkedinUrl,
      tags: tagsJson,
      profileSummary,
      resumeUrl,
      source,
      organizationId: org.id,
      userId,
    },
  });

  // Check if application already exists
  const existingApp = await prisma.application.findFirst({
    where: {
      candidateId: candidate.id,
      jobId: job.id,
    },
  });

  if (existingApp) {
    throw new Error("Você já se candidatou para esta vaga. Acesse sua Área do Candidato para acompanhar o processo.");
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
      matchScore: Math.floor(Math.random() * 41) + 60, // Mock initial match score between 60-100
      salaryExpectation: expectationNum,
      fitCategory,
      priority,
    },
  });

  return { success: true, candidateId: candidate.id };
}
