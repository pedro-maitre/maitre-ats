/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function submitApplication(formData: FormData) {
  const session = await getServerSession(authOptions);

  const jobId = formData.get("jobId") as string;
  const orgSlug = formData.get("companySlug") as string;

  // Perguntas obrigatórias da candidatura
  const salaryExpectation = formData.get("salaryExpectation") as string;
  const isReferral = formData.get("isReferral") as string; // "true" | "false"
  const referralName = (formData.get("referralName") as string)?.trim();
  const sourceChannel = (formData.get("sourceChannel") as string)?.trim() || "Portal de Carreiras";
  const sourceDetails = (formData.get("sourceDetails") as string)?.trim();

  // Dados cadastrais (podem vir do formulário ou da sessão logada)
  let firstName = (formData.get("firstName") as string)?.trim();
  let lastName = (formData.get("lastName") as string)?.trim();
  let email = (formData.get("email") as string)?.trim()?.toLowerCase();
  let phone = (formData.get("phone") as string)?.trim();
  let profileSummary = formData.get("profileSummary") as string;
  let linkedinUrl = formData.get("linkedinUrl") as string;
  let tags = formData.get("tags") as string;
  let resumeUrl = formData.get("resumeUrl") as string;
  const password = formData.get("password") as string;

  // Se o candidato estiver logado, recupera dados do perfil salvo no banco
  let loggedInCandidate: any = null;
  if (session?.user?.email) {
    email = session.user.email.toLowerCase();
    loggedInCandidate = await prisma.candidate.findUnique({
      where: { email },
    });

    if (loggedInCandidate) {
      if (!firstName) firstName = loggedInCandidate.firstName;
      if (!lastName) lastName = loggedInCandidate.lastName || "";
      if (!phone) phone = loggedInCandidate.phone || "";
      if (!resumeUrl) resumeUrl = loggedInCandidate.resumeUrl || "";
      if (!linkedinUrl) linkedinUrl = loggedInCandidate.linkedinUrl || "";
      if (!profileSummary) profileSummary = loggedInCandidate.profileSummary || "";
      if (!tags && loggedInCandidate.tags) tags = loggedInCandidate.tags;
    }
  }

  if (!email || !firstName) {
    throw new Error("Nome e e-mail são obrigatórios para a candidatura.");
  }

  if (!salaryExpectation) {
    throw new Error("Por favor, informe a sua pretensão salarial.");
  }

  const expectationNum = parseFloat(salaryExpectation.replace(/[^0-9.]/g, ""));
  if (isNaN(expectationNum) || expectationNum <= 0) {
    throw new Error("Por favor, informe um valor válido de pretensão salarial.");
  }

  // Define a origem consolidada com base nas respostas
  let computedSource = sourceChannel;
  if (isReferral === "true" || isReferral === "SIM") {
    computedSource = referralName ? `Indicação: ${referralName}` : "Indicação Interna";
  } else if (sourceChannel === "Outro" && sourceDetails) {
    computedSource = `Outro: ${sourceDetails}`;
  }

  // Parse tags
  let tagsJson = "[]";
  if (tags) {
    if (tags.startsWith("[") && tags.endsWith("]")) {
      tagsJson = tags;
    } else {
      const tagsArray = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t);
      tagsJson = JSON.stringify(tagsArray);
    }
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

  // Se senha foi fornecida e não há usuário criado, cria/atualiza conta
  let userId: string | undefined = loggedInCandidate?.userId;
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
      phone: phone || undefined,
      linkedinUrl: linkedinUrl || undefined,
      tags: tagsJson || undefined,
      profileSummary: profileSummary || undefined,
      resumeUrl: resumeUrl || undefined,
      source: computedSource,
      userId: userId || undefined,
    },
    create: {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      email,
      phone: phone || undefined,
      linkedinUrl: linkedinUrl || undefined,
      tags: tagsJson,
      profileSummary: profileSummary || "Candidatura registrada pelo portal.",
      resumeUrl: resumeUrl || undefined,
      source: computedSource,
      organizationId: org.id,
      userId,
    },
  });

  // Verifica se já existe candidatura ativa para a mesma vaga
  const existingApp = await prisma.application.findFirst({
    where: {
      candidateId: candidate.id,
      jobId: job.id,
    },
  });

  if (existingApp) {
    throw new Error("Você já se candidatou para esta vaga. Acesse a sua Área do Candidato para acompanhar o status.");
  }

  // KNOCKOUT RULE: Verifica se pretensão salarial excede o teto da vaga
  let fitCategory = "ALTO_FIT";
  let priority = "NORMAL";

  if (job.salaryMax && expectationNum && expectationNum > job.salaryMax) {
    fitCategory = "BAIXO_FIT";
    priority = "DUVIDA";
  }

  // Cria a Candidatura na 1ª Etapa
  const application = await prisma.application.create({
    data: {
      candidateId: candidate.id,
      jobId: job.id,
      stageId: firstStage.id,
      matchScore: Math.floor(Math.random() * 26) + 75, // Score inicial entre 75-100%
      salaryExpectation: expectationNum,
      fitCategory,
      priority,
    },
  });

  // Registra atividade no histórico do processo seletivo
  await prisma.activity.create({
    data: {
      applicationId: application.id,
      type: "APPLICATION_SUBMITTED",
      description: isReferral === "true" || isReferral === "SIM"
        ? `Candidatura enviada com indicação de: ${referralName || "Colaborador interno"}.`
        : `Candidatura enviada. Canal de origem: ${computedSource}.`,
      metadata: JSON.stringify({
        salaryExpectation: expectationNum,
        isReferral: isReferral === "true" || isReferral === "SIM",
        referralName: referralName || null,
        sourceChannel,
        sourceDetails: sourceDetails || null,
      }),
    },
  });

  return { success: true, candidateId: candidate.id, applicationId: application.id };
}
