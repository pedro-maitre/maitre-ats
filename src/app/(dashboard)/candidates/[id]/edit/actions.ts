"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateCandidate(candidateId: string, formData: FormData) {
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
