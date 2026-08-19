"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateJob(jobId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const salaryMin = formData.get("salaryMin") ? parseFloat(formData.get("salaryMin") as string) : null;
  const salaryMax = formData.get("salaryMax") ? parseFloat(formData.get("salaryMax") as string) : null;

  if (!title || !description) {
    throw new Error("Título e descrição são obrigatórios");
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      title,
      department,
      location,
      description,
      salaryMin,
      salaryMax,
    }
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}/board`);
  redirect(`/jobs/${jobId}/board`);
}
