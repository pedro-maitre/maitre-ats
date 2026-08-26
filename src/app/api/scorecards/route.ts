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
    const interviewId = searchParams.get("interviewId");
    const applicationId = searchParams.get("applicationId");

    const where: Record<string, unknown> = {};

    if (interviewId) {
      where.interviewId = interviewId;
    } else if (applicationId) {
      where.interview = { applicationId };
    }

    if (session.user.role === "HIRING_MANAGER" && session.user.organizationId) {
      where.interview = {
        ...(typeof where.interview === "object" && where.interview !== null ? where.interview : {}),
        application: {
          job: { organizationId: session.user.organizationId },
        },
      };
    }

    const scorecards = await prisma.scorecard.findMany({
      where,
      include: {
        evaluator: {
          select: { id: true, name: true, email: true, role: true },
        },
        interview: {
          include: {
            application: {
              include: {
                candidate: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                job: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: scorecards.length, data: scorecards });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de scorecards (GET):", err);
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
    const {
      interviewId,
      technicalScore,
      cultureScore,
      communicationScore,
      overallRecommendation,
      notes,
    } = body;

    if (!interviewId || technicalScore === undefined || cultureScore === undefined || !overallRecommendation) {
      return NextResponse.json(
        { error: "interviewId, technicalScore, cultureScore e overallRecommendation são obrigatórios." },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: { select: { id: true, title: true, organizationId: true } },
            candidate: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Entrevista não encontrada." }, { status: 404 });
    }

    // Trava de organização para Hiring Manager
    if (session.user.role === "HIRING_MANAGER" && session.user.organizationId !== interview.application.job.organizationId) {
      return NextResponse.json({ error: "Acesso não autorizado a esta vaga." }, { status: 403 });
    }

    const scorecard = await prisma.$transaction(async (tx) => {
      const created = await tx.scorecard.create({
        data: {
          interviewId,
          evaluatorId: session.user.id,
          technicalScore: Number(technicalScore),
          cultureScore: Number(cultureScore),
          communicationScore: Number(communicationScore || cultureScore),
          overallRecommendation,
          notes: notes || undefined,
        },
      });

      // Registra na timeline de atividades
      const recLabels: Record<string, string> = {
        STRONG_HIRE: "Aprovar com Ênfase ⭐",
        HIRE: "Aprovado ✅",
        HOLD: "Em Espera ⏳",
        NO_HIRE: "Reprovado ❌",
      };

      await tx.activity.create({
        data: {
          applicationId: interview.applicationId,
          actorId: session.user.id,
          type: "SCORECARD_SUBMITTED",
          description: `📋 Scorecard de Avaliação preenchido por ${session.user.name || session.user.email} (${recLabels[overallRecommendation] || overallRecommendation}).`,
          metadata: JSON.stringify({
            scorecardId: created.id,
            interviewId,
            technicalScore,
            cultureScore,
            overallRecommendation,
          }),
        },
      });

      return created;
    });

    // Auditoria
    await logAuditEvent({
      organizationId: interview.application.job.organizationId,
      actorUserId: session.user.id,
      action: "SCORECARD_SUBMITTED",
      resourceType: "Scorecard",
      resourceId: scorecard.id,
      afterData: {
        interviewId,
        technicalScore,
        cultureScore,
        overallRecommendation,
      },
    });

    return NextResponse.json({ success: true, data: scorecard }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de scorecards (POST):", err);
    return NextResponse.json({ error: err.message || "Erro ao registrar scorecard" }, { status: 500 });
  }
}
