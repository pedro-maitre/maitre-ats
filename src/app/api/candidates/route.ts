import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const isAuthorized = role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECRUITER";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Apenas recrutadores autenticados podem cadastrar ou editar candidatos diretamente." },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { firstName, lastName, email, phone, profileSummary, source, resumeUrl } = data;

    if (!firstName || !email) {
      return NextResponse.json({ error: "Nome e Email são obrigatórios." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const orgId = session?.user?.organizationId || (role === "SUPER_ADMIN" ? (await prisma.organization.findFirst())?.id : null);

    if (!orgId) {
      return NextResponse.json({ error: "Organização não informada ou não vinculada ao usuário." }, { status: 400 });
    }

    // Upsert Candidate (if email exists, update, otherwise create)
    const candidate = await prisma.candidate.upsert({
      where: { email: cleanEmail },
      update: {
        firstName,
        lastName,
        phone,
        profileSummary,
        resumeUrl,
        source: source || "Banco de Talentos",
      },
      create: {
        firstName,
        lastName,
        email,
        phone,
        profileSummary,
        resumeUrl,
        source: source || "Banco de Talentos",
        organizationId: orgId,
      },
    });

    return NextResponse.json({ success: true, candidateId: candidate.id }, { status: 201 });
  } catch (error) {
    console.error("Save Candidate Error:", error);
    return NextResponse.json({ error: "Erro ao salvar candidato." }, { status: 500 });
  }
}
