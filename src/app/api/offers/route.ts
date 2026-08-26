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

    if (session.user.role === "HIRING_MANAGER" && session.user.organizationId) {
      where.application = {
        ...(typeof where.application === "object" && where.application !== null ? where.application : {}),
        job: { organizationId: session.user.organizationId },
      };
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        application: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            job: {
              select: { id: true, title: true, organizationId: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: offers.length, data: offers });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de propostas (GET):", err);
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
    const { applicationId, salaryOffered, employmentType, startDate, benefits } = body;

    if (!applicationId || !salaryOffered) {
      return NextResponse.json(
        { error: "applicationId e salaryOffered são obrigatórios." },
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

    // Trava para Hiring Manager
    if (session.user.role === "HIRING_MANAGER" && session.user.organizationId !== app.job.organizationId) {
      return NextResponse.json({ error: "Acesso não autorizado a esta vaga." }, { status: 403 });
    }

    const offer = await prisma.$transaction(async (tx) => {
      const created = await tx.offer.create({
        data: {
          applicationId,
          salaryOffered: Number(salaryOffered),
          employmentType: employmentType || "CLT",
          startDate: startDate ? new Date(startDate) : undefined,
          benefits: benefits || undefined,
          status: "PENDING_APPROVAL",
        },
      });

      const formattedSalary = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(salaryOffered));

      // Registra na timeline
      await tx.activity.create({
        data: {
          applicationId,
          actorId: session.user.id,
          type: "STAGE_CHANGE",
          description: `💼 Proposta formal de contratação elaborada no valor de ${formattedSalary} (${created.employmentType}).`,
          metadata: JSON.stringify({
            offerId: created.id,
            salaryOffered: created.salaryOffered,
            employmentType: created.employmentType,
          }),
        },
      });

      // Outbox event
      await tx.integrationOutbox.create({
        data: {
          organizationId: app.job.organizationId,
          eventType: "offer.created.v1",
          payload: JSON.stringify({
            offerId: created.id,
            applicationId,
            jobId: app.job.id,
            candidateEmail: app.candidate.email,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            salaryOffered: created.salaryOffered,
            employmentType: created.employmentType,
            createdBy: session.user.email,
          }),
        },
      });

      return created;
    });

    // Auditoria
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: session.user.id,
      action: "OFFER_CREATED",
      resourceType: "Offer",
      resourceId: offer.id,
      afterData: {
        salaryOffered: offer.salaryOffered,
        employmentType: offer.employmentType,
        status: offer.status,
      },
    });

    return NextResponse.json({ success: true, data: offer }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de propostas (POST):", err);
    return NextResponse.json({ error: err.message || "Erro ao criar proposta" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId, status } = body;

    if (!offerId || !status) {
      return NextResponse.json({ error: "offerId e status são obrigatórios." }, { status: 400 });
    }

    const before = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            job: { select: { id: true, organizationId: true } },
          },
        },
      },
    });

    if (!before) {
      return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    }

    if (session.user.role === "HIRING_MANAGER" && session.user.organizationId !== before.application.job.organizationId) {
      return NextResponse.json({ error: "Acesso não autorizado a esta vaga." }, { status: 403 });
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: before.application.job.organizationId,
      actorUserId: session.user.id,
      action: "OFFER_STATUS_CHANGED",
      resourceType: "Offer",
      resourceId: offerId,
      beforeData: { status: before.status },
      afterData: { status: updated.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na API de propostas (PATCH):", err);
    return NextResponse.json({ error: err.message || "Erro ao atualizar proposta" }, { status: 500 });
  }
}
