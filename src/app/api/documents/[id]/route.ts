import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDocumentUrl } from "@/lib/resume-storage";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        candidate: true,
        organization: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }

    const userRole = session.user.role || "";
    const userEmail = session.user.email.toLowerCase();

    // Validação de Permissão (Anti-IDOR)
    const isOwnerCandidate = Boolean(document.candidate?.email?.toLowerCase() === userEmail);
    const isRecruiterOrAdmin = ["SUPER_ADMIN", "ADMIN", "RECRUITER"].includes(userRole);

    if (!isOwnerCandidate && !isRecruiterOrAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Você não tem permissão para acessar este documento." },
        { status: 403 }
      );
    }

    if (!document.storageKey) {
      return NextResponse.json({ error: "Chave do arquivo não encontrada." }, { status: 404 });
    }

    // Gera URL assinada de 15 minutos (900 segundos)
    const signedUrl = await getSignedDocumentUrl(document.storageKey, 900);

    // Registra Auditoria Imutável
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    await logAuditEvent({
      organizationId: document.organizationId,
      actorUserId: user?.id,
      action: "RESUME_VIEW",
      resourceType: "Document",
      resourceId: document.id,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const isDirectDownload = request.nextUrl.searchParams.get("download") === "true";

    if (isDirectDownload) {
      return NextResponse.redirect(signedUrl);
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      filename: document.originalName,
      signedUrl,
      expiresInSeconds: 900,
    });
  } catch (err: any) {
    console.error("Erro ao gerar URL do documento:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar documento." },
      { status: 500 }
    );
  }
}
