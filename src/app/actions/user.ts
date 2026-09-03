"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "CANDIDATE" | "HIRING_MANAGER";
  jobTitle?: string | null;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  joinedAt?: string | Date | null;
};

export type UpdateUserInput = {
  name: string;
  role: string;
  jobTitle?: string | null;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  joinedAt?: string | Date | null;
};

/**
 * Criação de novo usuário / colaborador pela equipe administrativa.
 */
export async function createUser(data: CreateUserInput) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
    return { success: false, error: "Não autorizado. Apenas Administradores podem criar novos usuários." };
  }

  const name = data.name?.trim();
  const email = data.email?.toLowerCase().trim();
  const password = data.password?.trim();
  const role = data.role || "RECRUITER";

  if (!name || !email || !password) {
    return { success: false, error: "Todos os campos obrigatórios (Nome, E-mail e Senha) devem ser preenchidos." };
  }

  if (password.length < 6) {
    return { success: false, error: "A senha deve conter no mínimo 6 caracteres." };
  }

  try {
    // 1. Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Já existe um usuário cadastrado com este e-mail." };
    }

    // 2. Obter ou criar organização padrão (Maître Consultoria)
    let org = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: "maitre" },
          { name: { contains: "Maître", mode: "insensitive" } },
        ]
      }
    });

    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Maître Consultoria", slug: "maitre" },
      });
    }

    // 3. Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar usuário / colaborador
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        jobTitle: data.jobTitle?.trim() || null,
        department: data.department?.trim() || null,
        phone: data.phone?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
        linkedinUrl: data.linkedinUrl?.trim() || null,
        bio: data.bio?.trim() || null,
        status: data.status?.trim() || "ACTIVE",
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        organizationId: org.id,
      },
      include: {
        organization: true,
      },
    });

    revalidatePath("/users");

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        jobTitle: newUser.jobTitle,
        department: newUser.department,
        phone: newUser.phone,
        avatarUrl: newUser.avatarUrl,
        linkedinUrl: newUser.linkedinUrl,
        bio: newUser.bio,
        status: newUser.status,
        joinedAt: newUser.joinedAt,
        organization: newUser.organization ? { name: newUser.organization.name } : null,
        createdAt: newUser.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message || "Erro ao criar o usuário no banco de dados." };
  }
}

/**
 * Atualização dos dados e perfil profissional do colaborador.
 */
export async function updateUser(
  userId: string,
  data: UpdateUserInput
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
    return { success: false, error: "Não autorizado. Apenas Administradores podem editar usuários." };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name?.trim(),
        role: data.role,
        jobTitle: data.jobTitle !== undefined ? (data.jobTitle?.trim() || null) : undefined,
        department: data.department !== undefined ? (data.department?.trim() || null) : undefined,
        phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
        avatarUrl: data.avatarUrl !== undefined ? (data.avatarUrl?.trim() || null) : undefined,
        linkedinUrl: data.linkedinUrl !== undefined ? (data.linkedinUrl?.trim() || null) : undefined,
        bio: data.bio !== undefined ? (data.bio?.trim() || null) : undefined,
        status: data.status !== undefined ? (data.status?.trim() || "ACTIVE") : undefined,
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
      },
      include: {
        organization: true,
      },
    });

    revalidatePath("/users");
    return {
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        jobTitle: updated.jobTitle,
        department: updated.department,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
        linkedinUrl: updated.linkedinUrl,
        bio: updated.bio,
        status: updated.status,
        joinedAt: updated.joinedAt,
        organization: updated.organization ? { name: updated.organization.name } : null,
        createdAt: updated.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message || "Erro ao atualizar o usuário no banco de dados." };
  }
}
