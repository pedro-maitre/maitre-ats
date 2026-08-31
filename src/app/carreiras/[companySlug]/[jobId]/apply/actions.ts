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

  // Processa Respostas das Killer Questions
  const killerAnswersRaw = formData.get("killerAnswers") as string;
  let isDisqualifiedByKillerQuestion = false;
  let killerAnswersFormatted: Record<string, string> = {};

  if (killerAnswersRaw) {
    try {
      killerAnswersFormatted = JSON.parse(killerAnswersRaw);
    } catch {}
  }

  // Verifica se a vaga possui Killer Questions com regra eliminatória
  if (job.requiredSkills) {
    try {
      const parsedSkills = JSON.parse(job.requiredSkills);
      if (parsedSkills && typeof parsedSkills === "object" && Array.isArray(parsedSkills.killerQuestions)) {
        for (const kq of parsedSkills.killerQuestions) {
          const answer = killerAnswersFormatted[kq.id];
          if (kq.disqualifyIfNo && (answer === "NAO" || answer === "false")) {
            isDisqualifiedByKillerQuestion = true;
          }
        }
      }
    } catch {}
  }

  // KNOCKOUT RULE: Verifica se pretensão salarial excede o teto da vaga ou se foi desqualificado por Killer Question
  let fitCategory = "ALTO_FIT";
  let priority = "NORMAL";

  if (isDisqualifiedByKillerQuestion) {
    fitCategory = "BAIXO_FIT";
    priority = "DUVIDA";
  } else if (job.salaryMax && expectationNum && expectationNum > job.salaryMax) {
    fitCategory = "BAIXO_FIT";
    priority = "DUVIDA";
  }

  // Cria a Candidatura na 1ª Etapa
  const application = await prisma.application.create({
    data: {
      candidateId: candidate.id,
      jobId: job.id,
      stageId: firstStage.id,
      matchScore: isDisqualifiedByKillerQuestion ? 30 : Math.floor(Math.random() * 26) + 75, // Score inicial
      salaryExpectation: expectationNum,
      fitCategory,
      priority,
      aiSnapshot: Object.keys(killerAnswersFormatted).length > 0 ? JSON.stringify({ killerAnswers: killerAnswersFormatted }) : undefined,
    },
  });

  // Registra atividade no histórico do processo seletivo
  await prisma.activity.create({
    data: {
      applicationId: application.id,
      type: "APPLICATION_SUBMITTED",
      description: isDisqualifiedByKillerQuestion
        ? `Candidatura submetida. ⚠️ Não atendeu a critério eliminatório da triagem.`
        : `Candidatura submetida com sucesso pelo Portal de Carreiras.`,
      metadata: JSON.stringify({
        source: computedSource,
        salaryExpectation: expectationNum,
        killerAnswers: killerAnswersFormatted,
        disqualified: isDisqualifiedByKillerQuestion,
      }),
    },
  });

  return { success: true, candidateId: candidate.id, applicationId: application.id };
}

/**
 * Retorna as perguntas de triagem e informações da vaga para a página de candidatura.
 */
export async function getJobKillerQuestions(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        title: true,
        department: true,
        requiredSkills: true,
        organization: {
          select: {
            name: true,
            primaryColor: true,
          },
        },
      },
    });

    if (!job) return { success: false, questions: [] };

    let questions: any[] = [];
    if (job.requiredSkills) {
      try {
        const parsed = JSON.parse(job.requiredSkills);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.killerQuestions)) {
          questions = parsed.killerQuestions;
        }
      } catch {}
    }

    return {
      success: true,
      jobTitle: job.title,
      department: job.department,
      companyName: job.organization.name,
      primaryColor: job.organization.primaryColor,
      questions,
    };
  } catch (error: any) {
    console.error("Erro ao carregar perguntas da vaga:", error);
    return { success: false, questions: [] };
  }
}

