"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateUser(
  userId: string,
  data: { name: string; role: string }
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado. Apenas Administradores podem editar usuários.");
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        role: data.role,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Erro ao atualizar o usuário no banco de dados." };
  }
}
