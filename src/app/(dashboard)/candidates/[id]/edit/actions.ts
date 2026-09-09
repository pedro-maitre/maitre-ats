"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerTenantScope } from "@/lib/security";

export async function updateCandidate(candidateId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const tenantScope = await getServerTenantScope(session);

  const existing = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!existing) {
    throw new Error("Candidato não encontrado");
  }

  if (tenantScope.organizationId && existing.organizationId !== tenantScope.organizationId) {
    throw new Error("Acesso negado: Você não tem permissão para editar este candidato.");
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const profileSummary = formData.get("profileSummary") as string;
  const tagsStr = formData.get("tags") as string;
  const source = formData.get("source") as string;

  if (!firstName || !lastName || !email) {
    throw new Error("Nome, sobrenome e e-mail são obrigatórios");
  }

  // Parse tags string back to JSON array format
  let tagsJson = "[]";
  if (tagsStr) {
    const tagsArray = tagsStr.split(",").map(t => t.trim()).filter(t => t);
    tagsJson = JSON.stringify(tagsArray);
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      firstName,
      lastName,
      email,
      phone,
      linkedinUrl,
      profileSummary,
      tags: tagsJson,
      source,
    }
  });

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${candidateId}`);
  redirect(`/candidates/${candidateId}`);
}
