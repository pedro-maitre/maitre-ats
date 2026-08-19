/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function submitApplication(jobId: string, orgSlug: string, formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const profileSummary = formData.get("profileSummary") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const tags = formData.get("tags") as string;
  const source = formData.get("source") as string || "Site de Carreiras";
  const salaryExpectation = formData.get("salaryExpectation") as string;
  const resumeFile = formData.get("resumeFile") as File | null;

  const expectationNum = salaryExpectation ? parseFloat(salaryExpectation) : null;

  // Parse tags
  let tagsJson = "[]";
  if (tags) {
    const tagsArray = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t);
    tagsJson = JSON.stringify(tagsArray);
  }

  // Upload Resume to Supabase Storage
  let resumeUrl = null;
  if (resumeFile && resumeFile.size > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const fileExt = resumeFile.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${orgSlug}/${fileName}`;

    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("resumes")
      .upload(filePath, buffer, {
        contentType: resumeFile.type,
      });

    if (!error && data) {
      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);
      resumeUrl = urlData.publicUrl;
    }
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

  return { success: true };
}
