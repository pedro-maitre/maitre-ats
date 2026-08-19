import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { firstName, lastName, email, phone, profileSummary, source } = data;

    if (!firstName || !email) {
      return NextResponse.json({ error: "Nome e Email são obrigatórios." }, { status: 400 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Maître", slug: "maitre" }
      });
    }
    const orgId = org.id;

    // Upsert Candidate (if email exists, update, otherwise create)
    const candidate = await prisma.candidate.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone,
        profileSummary,
        source: source || "Banco de Talentos",
      },
      create: {
        firstName,
        lastName,
        email,
        phone,
        profileSummary,
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
