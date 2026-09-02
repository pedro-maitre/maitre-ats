/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { evaluateApplicationFit } from "@/lib/fit-evaluator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { requireAuth } from "@/lib/security";
import { sendInterviewEmail, sendOfferEmail, sendAdmissionWelcomeEmail } from "@/lib/email";

/**
 * Move um candidato individual para outra etapa com transação ACID e histórico (ApplicationStageTransition).
 */
export async function moveCandidate(
  applicationId: string,
  newStageId: string,
  reason?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const currentApp = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        stage: true,
        candidate: true,
        job: { select: { id: true, title: true, organizationId: true } },
      },
    });

    if (!currentApp) {
      return { success: false, error: "Candidatura não encontrada." };
    }

    const previousStageId = currentApp.stageId;
    const previousStageName = currentApp.stage.name;

    const targetStage = await prisma.stage.findUnique({
      where: { id: newStageId },
    });

    if (!targetStage) {
      return { success: false, error: "Etapa de destino não encontrada." };
    }

    // TRANSAÇÃO ACID: Atualiza aplicação, grava transição e loga atividade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Grava a transição no histórico
      await tx.applicationStageTransition.create({
        data: {
          applicationId: currentApp.id,
          fromStageId: previousStageId,
          toStageId: newStageId,
          changedBy: user.email || user.id || "SYSTEM",
          reason: reason || undefined,
        },
      });

      // 2. Atualiza o estágio da candidatura
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          stageId: newStageId,
          enteredStageAt: new Date(),
        },
      });

      // 3. Registra na timeline funcional (Activity)
      await tx.activity.create({
        data: {
          applicationId: currentApp.id,
          actorId: user.id || undefined,
          type: "STAGE_CHANGE",
          description: `Candidato movido de "${previousStageName}" para "${targetStage.name}".`,
          metadata: JSON.stringify({
            fromStage: previousStageName,
            toStage: targetStage.name,
            reason: reason || null,
          }),
        },
      });

      // 4. Registra evento na outbox de integração se houver transição relevante
      await tx.integrationOutbox.create({
        data: {
          organizationId: currentApp.job.organizationId,
          eventType: "application.stage_changed.v1",
          payload: JSON.stringify({
            applicationId: currentApp.id,
            jobId: currentApp.job.id,
            candidateId: currentApp.candidateId,
            fromStage: previousStageName,
            toStage: targetStage.name,
            changedBy: user.email,
            changedAt: new Date().toISOString(),
          }),
        },
      });

      return updated;
    });

    // 5. Registra Auditoria Imutável (AuditEvent)
    await logAuditEvent({
      organizationId: currentApp.job.organizationId,
      actorUserId: user.id,
      action: "STAGE_CHANGE",
      resourceType: "Application",
      resourceId: currentApp.id,
      beforeData: { stageId: previousStageId, stageName: previousStageName },
      afterData: { stageId: newStageId, stageName: targetStage.name },
      reason: reason || undefined,
    });

    if (currentApp.job?.id) {
      revalidatePath(`/jobs/${currentApp.job.id}/board`);
    }

    return { success: true, newStageName: targetStage.name };
  } catch (error: any) {
    console.error("Falha ao mover candidato:", error);
    return { success: false, error: error.message || "Falha ao mover candidato" };
  }
}

/**
 * Move múltiplos candidatos em lote (Bulk Action) para uma nova etapa com histórico transacional.
 */
export async function batchMoveCandidates(applicationIds: string[], newStageId: string) {
  if (!applicationIds || applicationIds.length === 0) {
    return { success: false, error: "Nenhum candidato selecionado." };
  }

  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const targetStage = await prisma.stage.findUnique({
      where: { id: newStageId },
    });

    if (!targetStage) {
      return { success: false, error: "Etapa de destino não encontrada." };
    }

    const apps = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: { stage: true, job: true },
    });

    // Transação em lote
    await prisma.$transaction(async (tx) => {
      for (const app of apps) {
        // Grava transição
        await tx.applicationStageTransition.create({
          data: {
            applicationId: app.id,
            fromStageId: app.stageId,
            toStageId: newStageId,
            changedBy: user.email || user.id || "SYSTEM",
            reason: "Movimentação em Lote",
          },
        });

        // Atualiza aplicação
        await tx.application.update({
          where: { id: app.id },
          data: {
            stageId: newStageId,
            enteredStageAt: new Date(),
          },
        });

        // Timeline
        await tx.activity.create({
          data: {
            applicationId: app.id,
            actorId: user.id || undefined,
            type: "STAGE_CHANGE",
            description: `Movido em lote para "${targetStage.name}".`,
          },
        });
      }
    });

    if (apps[0]?.jobId) {
      revalidatePath(`/jobs/${apps[0].jobId}/board`);
    }

    return { success: true, count: applicationIds.length };
  } catch (error: any) {
    console.error("Falha ao mover candidatos em lote:", error);
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
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    await prisma.application.updateMany({
      where: { id: { in: applicationIds } },
      data: { priority },
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
    console.error("Falha ao atualizar prioridade em lote:", error);
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

/**
 * Ajuste Manual / Override de Fit 3D com Governança, Justificativa e Auditoria.
 */
export async function overrideApplicationFit(
  applicationId: string,
  newFitCategory: "ALTO_FIT" | "MEDIO_FIT" | "BAIXO_FIT",
  newPriority: "PRIORIZADO" | "NORMAL" | "DUVIDA",
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: "É obrigatório fornecer uma justificativa para o ajuste manual." };
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!app) {
      return { success: false, error: "Candidatura não encontrada." };
    }

    const previousFit = app.fitCategory;
    const previousPriority = app.priority;

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        fitCategory: newFitCategory,
        priority: newPriority,
        manualOverride: true,
        overrideReason: reason.trim(),
        reviewedBy: user.email,
        reviewedAt: new Date(),
      },
    });

    // Registra auditoria do Override
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: user.id,
      action: "OVERRIDE_FIT",
      resourceType: "Application",
      resourceId: app.id,
      beforeData: { fitCategory: previousFit, priority: previousPriority },
      afterData: { fitCategory: newFitCategory, priority: newPriority },
      reason,
    });

    revalidatePath(`/jobs/${app.jobId}/board`);

    return { success: true };
  } catch (error: any) {
    console.error("Erro no override de fit:", error);
    return { success: false, error: error.message || "Falha ao registrar ajuste de Fit" };
  }
}

/**
 * Ação de Autorização de Contratação (HIRE) Transacional com Outbox para o Core HR.
 */
export async function authorizeHire(applicationId: string, employeeCode?: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: { select: { id: true, title: true, organizationId: true, organization: { select: { name: true, slug: true } } } },
      },
    });

    if (!app) {
      return { success: false, error: "Candidatura não encontrada." };
    }

    const admissionToken = crypto.randomBytes(24).toString("hex");

    // Transação de Contratação + Outbox Event + Admissão Digital
    await prisma.$transaction(async (tx) => {
      // Cria ou atualiza o registro de conversão com token de admissão
      await tx.hireConversion.upsert({
        where: { applicationId: app.id },
        update: {
          convertedBy: user.email || "SYSTEM",
          employeeCode: employeeCode || undefined,
          convertedAt: new Date(),
          admissionStatus: "PENDING_DOCUMENTS",
        },
        create: {
          applicationId: app.id,
          convertedBy: user.email || "SYSTEM",
          employeeCode: employeeCode || undefined,
          token: admissionToken,
          admissionStatus: "PENDING_DOCUMENTS",
        },
      });

      // Dispara o evento de integração na Outbox
      await tx.integrationOutbox.create({
        data: {
          organizationId: app.job.organizationId,
          eventType: "candidate.hire_authorized.v1",
          payload: JSON.stringify({
            applicationId: app.id,
            candidateId: app.candidateId,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            candidateEmail: app.candidate.email,
            candidatePhone: app.candidate.phone,
            jobId: app.job.id,
            jobTitle: app.job.title,
            employeeCode: employeeCode || null,
            admissionToken,
            authorizedBy: user.email,
            occurredAt: new Date().toISOString(),
          }),
        },
      });

      // Registra na timeline
      await tx.activity.create({
        data: {
          applicationId: app.id,
          actorId: user.id || undefined,
          type: "STAGE_CHANGE",
          description: `🎉 Contratação autorizada! Processo de Admissão Digital iniciado por ${user.name || user.email}.`,
        },
      });
    });

    // Enviar e-mail de Boas-Vindas e Admissão Digital ao Candidato
    const baseUrl = process.env.NEXTAUTH_URL || "https://maitreconecta.vercel.app";
    const orgSlug = app.job.organization.slug;
    const admissionUrl = `${baseUrl}/carreiras/${orgSlug}/admissao/${admissionToken}`;

    await sendAdmissionWelcomeEmail({
      candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
      candidateEmail: app.candidate.email,
      jobTitle: app.job.title,
      companyName: app.job.organization.name,
      admissionUrl,
    });

    // Auditoria
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: user.id,
      action: "HIRE_AUTHORIZED",
      resourceType: "Application",
      resourceId: app.id,
      afterData: { employeeCode: employeeCode || null, admissionToken },
    });

    revalidatePath(`/jobs/${app.job.id}/board`);
    revalidatePath(`/operations`);
    revalidatePath(`/employees`);

    return { success: true, admissionToken, admissionUrl };
  } catch (error: any) {
    console.error("Erro ao autorizar contratação:", error);
    return { success: false, error: error.message || "Falha ao autorizar contratação." };
  }
}

/**
 * Agendamento de Entrevista com Avaliadores.
 */
export async function scheduleInterview(params: {
  applicationId: string;
  title: string;
  scheduledAt: string;
  durationMin?: number;
  format?: "ONLINE" | "IN_PERSON";
  meetingUrl?: string;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const interview = await prisma.interview.create({
      data: {
        applicationId: params.applicationId,
        title: params.title,
        scheduledAt: new Date(params.scheduledAt),
        durationMin: params.durationMin || 45,
        format: params.format || "ONLINE",
        meetingUrl: params.meetingUrl || undefined,
        notes: params.notes || undefined,
      },
      include: {
        application: {
          select: {
            jobId: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, organizationId: true, organization: { select: { name: true } } } },
          },
        },
      },
    });

    // Dispara e-mail para o candidato
    if (interview.application.candidate.email) {
      sendInterviewEmail({
        candidateName: `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
        candidateEmail: interview.application.candidate.email,
        jobTitle: interview.application.job.title,
        companyName: interview.application.job.organization.name,
        scheduledAt: interview.scheduledAt,
        format: interview.format,
        meetingUrl: interview.meetingUrl || undefined,
        notes: interview.notes || undefined,
      }).catch((e) => console.error("Erro ao enviar e-mail de entrevista:", e));
    }

    await logAuditEvent({
      organizationId: interview.application.job.organizationId,
      actorUserId: user.id,
      action: "INTERVIEW_SCHEDULED",
      resourceType: "Interview",
      resourceId: interview.id,
      afterData: { title: params.title, scheduledAt: params.scheduledAt },
    });

    revalidatePath(`/jobs/${interview.application.jobId}/board`);

    return { success: true, interviewId: interview.id };
  } catch (error: any) {
    console.error("Erro ao agendar entrevista:", error);
    return { success: false, error: error.message || "Falha ao agendar entrevista." };
  }
}

/**
 * Preenchimento e submissão de Scorecard de Avaliação da Entrevista.
 */
export async function submitScorecard(params: {
  interviewId: string;
  technicalScore: number;
  cultureScore: number;
  communicationScore: number;
  overallRecommendation: "STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE";
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const scorecard = await prisma.scorecard.create({
      data: {
        interviewId: params.interviewId,
        evaluatorId: user.id,
        technicalScore: params.technicalScore,
        cultureScore: params.cultureScore,
        communicationScore: params.communicationScore,
        overallRecommendation: params.overallRecommendation,
        notes: params.notes || undefined,
      },
      include: {
        interview: {
          include: {
            application: { select: { jobId: true, job: { select: { organizationId: true } } } },
          },
        },
      },
    });

    await logAuditEvent({
      organizationId: scorecard.interview.application.job.organizationId,
      actorUserId: user.id,
      action: "SCORECARD_SUBMITTED",
      resourceType: "Scorecard",
      resourceId: scorecard.id,
      afterData: {
        recommendation: params.overallRecommendation,
        technicalScore: params.technicalScore,
      },
    });

    revalidatePath(`/jobs/${scorecard.interview.application.jobId}/board`);

    return { success: true, scorecardId: scorecard.id };
  } catch (error: any) {
    console.error("Erro ao registrar scorecard:", error);
    return { success: false, error: error.message || "Falha ao registrar scorecard." };
  }
}

/**
 * Criação de Proposta de Contratação (Offer).
 */
export async function createOffer(params: {
  applicationId: string;
  salaryOffered: number;
  employmentType?: "CLT" | "PJ" | "ESTAGIO";
  startDate?: string;
  benefits?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const offer = await prisma.offer.create({
      data: {
        applicationId: params.applicationId,
        salaryOffered: params.salaryOffered,
        employmentType: params.employmentType || "CLT",
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        benefits: params.benefits || undefined,
        status: "PENDING_APPROVAL",
      },
      include: {
        application: {
          select: {
            jobId: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, organizationId: true, organization: { select: { name: true } } } },
          },
        },
      },
    });

    // Dispara e-mail de proposta para o candidato
    if (offer.application.candidate.email) {
      sendOfferEmail({
        candidateName: `${offer.application.candidate.firstName} ${offer.application.candidate.lastName}`,
        candidateEmail: offer.application.candidate.email,
        jobTitle: offer.application.job.title,
        companyName: offer.application.job.organization.name,
        salaryOffered: offer.salaryOffered,
        employmentType: offer.employmentType,
        benefits: offer.benefits || undefined,
      }).catch((e) => console.error("Erro ao enviar e-mail de proposta:", e));
    }

    await logAuditEvent({
      organizationId: offer.application.job.organizationId,
      actorUserId: user.id,
      action: "OFFER_CREATED",
      resourceType: "Offer",
      resourceId: offer.id,
      afterData: { salaryOffered: params.salaryOffered, status: "PENDING_APPROVAL" },
    });

    revalidatePath(`/jobs/${offer.application.jobId}/board`);

    return { success: true, offerId: offer.id };
  } catch (error: any) {
    console.error("Erro ao criar proposta:", error);
    return { success: false, error: error.message || "Falha ao criar proposta." };
  }
}

/**
 * Registra o envio de mensagem via WhatsApp no histórico de atividades e auditoria.
 */
export async function logWhatsAppActivity(params: {
  applicationId: string;
  candidatePhone: string;
  templateType: string;
  messageText: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const app = await prisma.application.findUnique({
      where: { id: params.applicationId },
      include: {
        candidate: true,
        job: { select: { id: true, title: true, organizationId: true } },
      },
    });

    if (!app) {
      return { success: false, error: "Candidatura não encontrada." };
    }

    const templateLabels: Record<string, string> = {
      INTERVIEW: "Convite para Entrevista",
      NEXT_STAGE: "Avanço de Etapa",
      OFFER_ALIGNMENT: "Alinhamento de Proposta",
      INITIAL_CONTACT: "Primeiro Contato / Triagem",
      CUSTOM: "Mensagem Personalizada",
    };

    const label = templateLabels[params.templateType] || params.templateType;

    // Registra na timeline de atividades do candidato
    await prisma.activity.create({
      data: {
        applicationId: app.id,
        actorId: user.id,
        type: "WHATSAPP_CONTACT",
        description: `Contato via WhatsApp (${label}) enviado para ${params.candidatePhone}.`,
        metadata: JSON.stringify({
          phone: params.candidatePhone,
          template: params.templateType,
          preview: params.messageText.substring(0, 150),
          sentAt: new Date().toISOString(),
        }),
      },
    });

    // Registra evento de auditoria
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: user.id,
      action: "WHATSAPP_SENT",
      resourceType: "Application",
      resourceId: app.id,
      afterData: {
        phone: params.candidatePhone,
        template: params.templateType,
      },
    });

    revalidatePath(`/jobs/${app.job.id}/board`);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao registrar atividade de WhatsApp:", error);
    return { success: false, error: error.message || "Falha ao registrar contato." };
  }
}

