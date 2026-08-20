import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, phone, companySlug } = body;

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find organization
    let org = null;
    if (companySlug) {
      org = await prisma.organization.findUnique({
        where: { slug: companySlug },
      });
    }
    if (!org) {
      org = await prisma.organization.findFirst();
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { error: "Este e-mail já possui cadastro. Faça login para acessar sua área." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName?.trim() || ""}`.trim();

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name: fullName,
          role: existingUser.role || "CANDIDATE",
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: fullName,
          role: "CANDIDATE",
          organizationId: org?.id,
        },
      });
    }

    // Upsert Candidate profile linked to user
    const candidate = await prisma.candidate.upsert({
      where: { email: normalizedEmail },
      update: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || "",
        phone: phone || undefined,
        userId: user.id,
      },
      create: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || "",
        email: normalizedEmail,
        phone: phone || null,
        organizationId: org?.id || "default",
        userId: user.id,
        source: "Área do Candidato",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cadastro realizado com sucesso!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Candidate registration error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao realizar cadastro." },
      { status: 500 }
    );
  }
}
