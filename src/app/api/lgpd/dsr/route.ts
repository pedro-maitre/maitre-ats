import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const VALID_REQUEST_TYPES = ["ACCESS", "CORRECTION", "DELETION", "REVOCATION"] as const;

/**
 * Endpoint de Solicitação de Direitos do Titular (LGPD Art. 18)
 * Permite que candidatos solicitem confirmação, acesso, correção, eliminação ou revogação de dados.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, requestType, justification } = body;

    if (!email || !requestType) {
      return NextResponse.json(
        { error: "E-mail e tipo de solicitação (requestType) são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const normalizedType = String(requestType).toUpperCase();

    if (!VALID_REQUEST_TYPES.includes(normalizedType as any)) {
      return NextResponse.json(
        { error: `Tipo inválido. Valores aceitos: ${VALID_REQUEST_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Registra a solicitação na tabela DataSubjectRequest
    const dsr = await prisma.dataSubjectRequest.create({
      data: {
        email: cleanEmail,
        requestType: normalizedType,
        justification: justification ? String(justification).slice(0, 1000) : undefined,
        status: "PENDING",
      },
    });

    // Registra evento na trilha de auditoria imutável
    await logAuditEvent({
      action: "LGPD_REQUEST",
      resourceType: "DataSubjectRequest",
      resourceId: dsr.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      reason: `Solicitação LGPD (${normalizedType}) aberta por ${cleanEmail}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Solicitação LGPD registrada com sucesso. O encarregado de dados (DPO) analisará o pedido dentro do prazo legal de 15 dias.",
        protocol: dsr.id,
        status: dsr.status,
        requestedAt: dsr.requestedAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro na rota DSR LGPD:", err);
    return NextResponse.json(
      { error: "Falha interna ao processar requisição LGPD." },
      { status: 500 }
    );
  }
}

/**
 * Listagem das solicitações para administradores e DPO do sistema
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== "SUPER_ADMIN" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Acesso restrito a administradores e DPO." }, { status: 403 });
    }

    const requests = await prisma.dataSubjectRequest.findMany({
      orderBy: { requestedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, count: requests.length, data: requests });
  } catch (err: any) {
    console.error("Erro ao listar solicitações DSR:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
