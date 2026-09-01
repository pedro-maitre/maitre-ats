"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface LogFeedbackSentParams {
  candidateId: string;
  applicationId?: string;
  templateId: string;
  templateNumber: number;
  templateTitle: string;
  messageText: string;
  phone: string;
  stageName?: string;
  jobId?: string;
  feedbackConsentGranted?: boolean; // Para o template 22 (LGPD)
}

/**
 * Registra o envio de mensagem de WhatsApp / Feedback no ATS (Activity + AuditEvent)
 * garantindo rastreabilidade e governança exigida pelo manual de seleção e pela LGPD.
 */
export async function logFeedbackSentAction(params: LogFeedbackSentParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const {
      candidateId,
      applicationId,
      templateId,
      templateNumber,
      templateTitle,
      messageText,
      phone,
      stageName,
      jobId,
      feedbackConsentGranted,
    } = params;

    // Busca o candidato para obter organizationId
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, organizationId: true, firstName: true, lastName: true },
    });

    if (!candidate) {
      return { success: false, error: "Candidato não localizado." };
    }

    // Se houver applicationId, cria o registro de Activity na timeline
    let activityRecord = null;
    if (applicationId) {
      activityRecord = await prisma.activity.create({
        data: {
          applicationId,
          actorId: session.user.id || undefined,
          type: "WHATSAPP_FEEDBACK_SENT",
          description: `Feedback WhatsApp enviado: #${templateNumber} ${templateTitle}`,
          metadata: JSON.stringify({
            templateId,
            templateNumber,
            templateTitle,
            phone,
            stageName: stageName || "Geral",
            messageSnippet: messageText.length > 200 ? messageText.substring(0, 200) + "..." : messageText,
            sentBy: session.user.name || session.user.email,
            sentAt: new Date().toISOString(),
          }),
        },
      });
    }

    // Cria registro de auditoria imutável (AuditEvent)
    await prisma.auditEvent.create({
      data: {
        organizationId: candidate.organizationId,
        actorUserId: session.user.id,
        action: "FEEDBACK_WHATSAPP_SENT",
        resourceType: "Candidate",
        resourceId: candidateId,
        afterData: JSON.stringify({
          templateId,
          templateNumber,
          templateTitle,
          phone,
          applicationId: applicationId || null,
          jobId: jobId || null,
        }),
      },
    });

    // Se for o template #22 de consentimento de Banco de Talentos, cria registro em CandidateConsent
    if (templateId === "autorizacao-banco-talentos" && feedbackConsentGranted !== undefined) {
      await prisma.candidateConsent.create({
        data: {
          candidateId,
          purpose: "BANCO_TALENTOS",
          granted: feedbackConsentGranted,
          grantedAt: new Date(),
        },
      });
    }

    // Revalidação de rotas afetadas
    if (jobId) {
      revalidatePath(`/jobs/${jobId}`);
    }
    revalidatePath("/candidates");

    return {
      success: true,
      activityId: activityRecord?.id || null,
    };
  } catch (error: any) {
    console.error("Erro ao registrar envio de feedback:", error);
    return {
      success: false,
      error: error.message || "Falha ao registrar histórico do feedback no ATS.",
    };
  }
}

/**
 * Busca histórico de feedbacks WhatsApp enviados para uma candidatura ou candidato
 */
export async function getFeedbackHistoryAction(candidateId: string, applicationId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, data: [] };
    }

    if (applicationId) {
      const activities = await prisma.activity.findMany({
        where: {
          applicationId,
          type: "WHATSAPP_FEEDBACK_SENT",
        },
        include: {
          actor: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: activities.map((a) => ({
          id: a.id,
          description: a.description,
          createdAt: a.createdAt.toISOString(),
          actorName: a.actor?.name || a.actor?.email || "Recrutador",
          metadata: a.metadata ? JSON.parse(a.metadata) : {},
        })),
      };
    }

    return { success: true, data: [] };
  } catch (error: any) {
    console.error("Erro ao buscar histórico de feedbacks:", error);
    return { success: false, data: [], error: error.message };
  }
}
