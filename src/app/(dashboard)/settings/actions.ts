"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: { name: string; email: string }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: formData.email }
  });

  if (existingUser && existingUser.id !== session.user.id) {
    throw new Error("Este e-mail já está em uso por outro usuário.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: formData.name,
      email: formData.email,
    }
  });

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function updateOrganization(formData: { name: string; slug: string }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) {
    throw new Error("Usuário não vinculado a uma organização.");
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem alterar os dados da empresa.");
  }

  // Check slug uniqueness
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: formData.slug }
  });

  if (existingOrg && existingOrg.id !== user.organizationId) {
    throw new Error("Esta URL (slug) já está sendo utilizada por outra empresa.");
  }

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      name: formData.name,
      slug: formData.slug,
    }
  });

  revalidatePath("/settings/organization");
  return { success: true };
}
