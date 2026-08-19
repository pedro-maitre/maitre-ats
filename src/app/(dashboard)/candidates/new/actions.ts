"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCandidate(formData: FormData) {
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

  // Parse tags
  let tagsJson = "[]";
  if (tagsStr) {
    const tagsArray = tagsStr.split(",").map(t => t.trim()).filter(t => t);
    tagsJson = JSON.stringify(tagsArray);
  }

  // Get Org
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("Organização não encontrada");

  const existing = await prisma.candidate.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error("Já existe um candidato com este e-mail no Banco de Talentos.");
  }

  const candidate = await prisma.candidate.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      linkedinUrl,
      profileSummary,
      tags: tagsJson,
      source: source || "Cadastro Manual",
      organizationId: org.id
    }
  });

  revalidatePath("/candidates");
  redirect(`/candidates/${candidate.id}`);
}
