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
  role: "SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "CANDIDATE";
};

/**
 * Criação de novo usuário pela equipe administrativa.
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
    return { success: false, error: "Todos os campos (Nome, E-mail e Senha) são obrigatórios." };
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

    // 2. Obter ou criar organização padrão
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Maître Consultoria", slug: "maitre" },
      });
    }

    // 3. Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
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
 * Atualização dos dados e nível de acesso do usuário.
 */
export async function updateUser(
  userId: string,
  data: { name: string; role: string }
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
        organization: updated.organization ? { name: updated.organization.name } : null,
        createdAt: updated.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message || "Erro ao atualizar o usuário no banco de dados." };
  }
}
