"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerTenantScope } from "@/lib/security";

export async function createCandidate(formData: FormData) {
  const session = await getServerSession(authOptions);
  const tenantScope = await getServerTenantScope(session);

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = formData.get("phone") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const profileSummary = formData.get("profileSummary") as string;
  const tagsStr = formData.get("tags") as string;
  const source = formData.get("source") as string;
  const resumeUrl = (formData.get("resumeUrl") as string) || null;

  if (!firstName || !lastName || !email) {
    throw new Error("Nome, sobrenome e e-mail são obrigatórios");
  }

  // Parse tags
  let tagsJson = "[]";
  if (tagsStr) {
    const tagsArray = tagsStr.split(",").map(t => t.trim()).filter(t => t);
    tagsJson = JSON.stringify(tagsArray);
  }

  const orgId = tenantScope.organizationId || (await prisma.organization.findFirst())?.id;
  if (!orgId) throw new Error("Organização não encontrada");

  const existing = await prisma.candidate.findUnique({
    where: {
      organizationId_email: {
        organizationId: orgId,
        email,
      },
    },
  });

  if (existing) {
    throw new Error("Já existe um candidato com este e-mail no Banco de Talentos desta organização.");
  }

  const candidate = await prisma.candidate.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      linkedinUrl,
      profileSummary,
      resumeUrl: resumeUrl || undefined,
      tags: tagsJson,
      source: source || "Cadastro Manual",
      organizationId: orgId,
    },
  });

  revalidatePath("/candidates");
  redirect(`/candidates/${candidate.id}`);
}
