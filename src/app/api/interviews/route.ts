import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
    const jobId = searchParams.get("jobId");

    const where: Record<string, unknown> = {};

    if (applicationId) {
      where.applicationId = applicationId;
    } else if (jobId) {
      where.application = { jobId };
    }

    // Isolamento Estrito Multi-Tenant: Usuários não-SUPER_ADMIN só visualizam entrevistas de sua organização
    if (session.user.role !== "SUPER_ADMIN") {
      if (!session.user.organizationId) {
        return NextResponse.json({ error: "Usuário não vinculado a uma organização." }, { status: 403 });
      }
      where.application = {
        ...(typeof where.application === "object" && where.application !== null ? where.application : {}),
        job: { organizationId: session.user.organizationId },
      };
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        scorecards: {
          include: {
            evaluator: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        application: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            job: {
              select: { id: true, title: true, organizationId: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json({ success: true, count: interviews.length, data: interviews });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de entrevistas (GET):", err);
    return NextResponse.json({ error: err.message || "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "RECRUITER" && role !== "HIRING_MANAGER") {
      return NextResponse.json({ error: "Acesso não permitido para este perfil." }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, title, scheduledAt, durationMin, format, meetingUrl, notes } = body;

    if (!applicationId || !scheduledAt) {
      return NextResponse.json(
        { error: "applicationId e scheduledAt são campos obrigatórios." },
        { status: 400 }
      );
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { id: true, title: true, organizationId: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });
    }

    // Isolamento Multi-Tenant: Apenas SUPER_ADMIN pode agendar entrevista fora da sua organização
    if (session.user.role !== "SUPER_ADMIN" && session.user.organizationId !== app.job.organizationId) {
      return NextResponse.json({ error: "Acesso não autorizado a esta organização." }, { status: 403 });
    }

    const interview = await prisma.$transaction(async (tx) => {
      const created = await tx.interview.create({
        data: {
          applicationId,
          title: title || "Entrevista com Gestor / Avaliador",
          scheduledAt: new Date(scheduledAt),
          durationMin: durationMin || 45,
          format: format || "ONLINE",
          meetingUrl: meetingUrl || undefined,
          notes: notes || undefined,
        },
      });

      // Registra na timeline
      await tx.activity.create({
        data: {
          applicationId,
          actorId: session.user.id,
          type: "INTERVIEW_SCHEDULED",
          description: `📅 Entrevista agendada: "${created.title}" para ${new Date(scheduledAt).toLocaleString("pt-BR")}.`,
          metadata: JSON.stringify({
            interviewId: created.id,
            format: created.format,
            meetingUrl: created.meetingUrl || null,
          }),
        },
      });

      // Dispara evento na outbox
      await tx.integrationOutbox.create({
        data: {
          organizationId: app.job.organizationId,
          eventType: "interview.scheduled.v1",
          payload: JSON.stringify({
            interviewId: created.id,
            applicationId,
            jobId: app.job.id,
            candidateEmail: app.candidate.email,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            scheduledAt: new Date(scheduledAt).toISOString(),
            meetingUrl: created.meetingUrl || null,
            scheduledBy: session.user.email,
          }),
        },
      });

      return created;
    });

    // Auditoria imutável
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: session.user.id,
      action: "INTERVIEW_SCHEDULED",
      resourceType: "Interview",
      resourceId: interview.id,
      afterData: {
        title: interview.title,
        scheduledAt: interview.scheduledAt,
        format: interview.format,
      },
    });

    return NextResponse.json({ success: true, data: interview }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de entrevistas (POST):", err);
    return NextResponse.json({ error: err.message || "Erro ao agendar entrevista" }, { status: 500 });
  }
}
