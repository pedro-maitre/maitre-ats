import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Dados incompletos." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "E-mail já está em uso." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Fetch an existing org or create one
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Maître Consultoria", slug: "maitre" },
      });
    }
    const orgId = org.id;

    // Public registration is strictly CANDIDATE
    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: "CANDIDATE",
        organizationId: orgId,
      },
    });

    // Auto-create/link Candidate profile
    await prisma.candidate.upsert({
      where: { email: cleanEmail },
      update: {
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        userId: user.id,
      },
      create: {
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        email: cleanEmail,
        userId: user.id,
        organizationId: orgId,
        source: "Portal",
      },
    });

    return NextResponse.json(
      { message: "Cadastro realizado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: "Erro ao criar usuário." },
      { status: 500 }
    );
  }
}
