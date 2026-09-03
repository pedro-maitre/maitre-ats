import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

/**
 * Rotina de Limpeza e Anonimização de Dados Antigos (LGPD Art. 16)
 * Processa a retenção de currículos e registros que excederam o prazo legal estabelecido.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
    const session = await getServerSession(authOptions);

    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
    const isAdminUser = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

    if (!isCronAuthorized && !isAdminUser) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    // Política padrão: 730 dias (2 anos) se não houver política customizada por organização
    const defaultRetentionDays = 730;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - defaultRetentionDays);

    // 1. Busca documentos expirados com retentionUntil menor que a data atual
    const expiredDocuments = await prisma.document.findMany({
      where: {
        retentionUntil: {
          lt: new Date(),
        },
      },
      take: 50,
    });

    let anonymizedCandidatesCount = 0;

    // 2. Busca candidatos inativos criados há mais de 2 anos sem candidaturas recentes
    const candidatesToAnonymize = await prisma.candidate.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        applications: {
          none: {
            createdAt: { gte: cutoffDate },
          },
        },
      },
      take: 20,
    });

    for (const cand of candidatesToAnonymize) {
      // Anonimiza dados pessoais identificáveis (PII)
      await prisma.candidate.update({
        where: { id: cand.id },
        data: {
          firstName: "Candidato",
          lastName: "Anonimizado (LGPD)",
          phone: null,
          linkedinUrl: null,
          profileSummary: "[Dados pessoais anonimizados conforme prazo de retenção LGPD]",
          resumeUrl: null,
        },
      });

      await logAuditEvent({
        organizationId: cand.organizationId,
        action: "CANDIDATE_UPDATE",
        resourceType: "Candidate",
        resourceId: cand.id,
        reason: "Anonimização automática por prazo de retenção LGPD (Art. 16)",
      });

      anonymizedCandidatesCount++;
    }

    return NextResponse.json({
      success: true,
      cutoffDate: cutoffDate.toISOString(),
      expiredDocumentsFound: expiredDocuments.length,
      anonymizedCandidatesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Erro no processamento da rotina de retenção LGPD:", err);
    return NextResponse.json(
      { error: "Falha ao processar política de retenção." },
      { status: 500 }
    );
  }
}
