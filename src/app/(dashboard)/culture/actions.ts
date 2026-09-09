"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

// Submeter resposta anônima de pesquisa de clima
export async function submitSurveyResponse(data: {
  surveyId: string;
  department?: string;
  npsScore: number;
  dimensionScores: {
    leadership: number;
    communication: number;
    recognition: number;
    workload: number;
    strategy: number;
  };
  feedback?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const survey = await prisma.climateSurvey.findUnique({
    where: { id: data.surveyId },
  });

  if (!survey) {
    throw new Error("Pesquisa não encontrada.");
  }

  const nps = Math.max(0, Math.min(10, Math.round(data.npsScore)));

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: survey.id,
      organizationId: survey.organizationId,
      department: data.department?.trim() || "Geral",
      npsScore: nps,
      dimensionScores: JSON.stringify(data.dimensionScores),
      feedback: data.feedback?.trim() || null,
    },
  });

  revalidatePath("/culture");
  return { success: true, id: response.id };
}

// Publicar reconhecimento entre pares no mural
export async function postRecognition(data: {
  receiverName: string;
  receiverDepartment?: string;
  valuePillar: string;
  message: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  if (!data.receiverName?.trim() || !data.message?.trim()) {
    throw new Error("Nome do destinatário e mensagem são obrigatórios.");
  }

  // Buscar organização do usuário
  let orgId = session.user.organizationId;
  if (!orgId) {
    const firstOrg = await prisma.organization.findFirst();
    orgId = firstOrg?.id || null;
  }

  if (!orgId) {
    throw new Error("Organização não localizada.");
  }

  const recognition = await prisma.cultureRecognition.create({
    data: {
      organizationId: orgId,
      senderId: session.user.id,
      senderName: session.user.name || "Colaborador",
      receiverName: data.receiverName.trim(),
      receiverDepartment: data.receiverDepartment?.trim() || null,
      valuePillar: data.valuePillar || "EXCELENCIA",
      message: data.message.trim(),
    },
  });

  revalidatePath("/culture");
  return { success: true, recognition };
}

// Curtir / Aplaudir um reconhecimento
export async function likeRecognition(recognitionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const updated = await prisma.cultureRecognition.update({
    where: { id: recognitionId },
    data: {
      likesCount: {
        increment: 1,
      },
    },
  });

  revalidatePath("/culture");
  return { success: true, likesCount: updated.likesCount };
}

// Criar nova pesquisa de clima (Admins e RH)
export async function createClimateSurvey(data: {
  title: string;
  description?: string;
  targetAudience?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "RECRUITER") {
    throw new Error("Sem permissão para criar pesquisas de clima.");
  }

  let orgId = session.user.organizationId;
  if (!orgId) {
    const firstOrg = await prisma.organization.findFirst();
    orgId = firstOrg?.id || null;
  }

  if (!orgId) {
    throw new Error("Organização não localizada.");
  }

  const survey = await prisma.climateSurvey.create({
    data: {
      organizationId: orgId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      targetAudience: data.targetAudience || "ALL",
      status: "ACTIVE",
    },
  });

  revalidatePath("/culture");
  return { success: true, survey };
}

// Criar Plano de Ação derivado do diagnóstico de clima (T-15)
export async function createActionPlan(data: {
  surveyId?: string;
  dimension: string;
  title: string;
  description: string;
  ownerName?: string;
  targetDate: string | Date;
  organizationId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "RECRUITER") {
    throw new Error("Apenas RH e lideranças podem criar Planos de Ação.");
  }

  let orgId = data.organizationId || session.user.organizationId;
  if (!orgId) {
    const firstOrg = await prisma.organization.findFirst();
    orgId = firstOrg?.id || null;
  }

  if (!orgId) {
    throw new Error("Organização não localizada.");
  }

  // Garantir existência de uma pesquisa associada (surveyId é chave estrangeira obrigatória)
  let surveyId = data.surveyId;
  if (!surveyId) {
    const activeSurvey = await prisma.climateSurvey.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    if (activeSurvey) {
      surveyId = activeSurvey.id;
    } else {
      const createdSurvey = await prisma.climateSurvey.create({
        data: {
          organizationId: orgId,
          title: "Ciclo de Clima & Cultura 2026",
          description: "Pesquisa contínua de clima e engajamento",
          status: "ACTIVE",
        },
      });
      surveyId = createdSurvey.id;
    }
  }

  const plan = await prisma.cultureActionPlan.create({
    data: {
      organizationId: orgId,
      surveyId: surveyId,
      dimension: data.dimension,
      title: data.title.trim(),
      description: data.description.trim(),
      ownerName: data.ownerName?.trim() || session.user.name || "DHO / Gente & Gestão",
      targetDate: new Date(data.targetDate),
      status: "PLANNED",
      kpiSuccessIndicator: "Evolução das notas de clima no ciclo",
    },
  });

  await logAuditEvent({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "CULTURE_ACTION_PLAN_CREATED",
    resourceType: "CultureActionPlan",
    resourceId: plan.id,
    afterData: {
      title: plan.title,
      dimension: plan.dimension,
      ownerName: plan.ownerName,
    },
  });

  revalidatePath("/culture");
  return { success: true, plan };
}

// Atualizar status do Plano de Ação (T-15)
export async function updateActionPlanStatus(data: {
  actionPlanId: string;
  status: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const plan = await prisma.cultureActionPlan.findUnique({
    where: { id: data.actionPlanId },
  });

  if (!plan) {
    throw new Error("Plano de Ação não encontrado.");
  }

  const updatedPlan = await prisma.cultureActionPlan.update({
    where: { id: data.actionPlanId },
    data: {
      status: data.status,
    },
  });

  await logAuditEvent({
    organizationId: plan.organizationId,
    actorUserId: session.user.id,
    action: "CULTURE_ACTION_PLAN_UPDATED",
    resourceType: "CultureActionPlan",
    resourceId: plan.id,
    afterData: {
      title: plan.title,
      oldStatus: plan.status,
      newStatus: data.status,
    },
  });

  revalidatePath("/culture");
  return { success: true, plan: updatedPlan };
}
