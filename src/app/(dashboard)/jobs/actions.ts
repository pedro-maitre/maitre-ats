"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;

  if (!title || !description) {
    throw new Error("Título e descrição são obrigatórios");
  }

  // Get or create org
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Maître", slug: "maitre" }
    });
  }

  // Create Job
  const job = await prisma.job.create({
    data: {
      title,
      department,
      location,
      description,
      status: "OPEN",
      organizationId: org.id,
      stages: {
        create: [
          { name: "Triagem", order: 0 },
          { name: "Entrevista RH", order: 1 },
          { name: "Entrevista Técnica", order: 2 },
          { name: "Proposta", order: 3 },
        ]
      }
    }
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}/board`);
}
