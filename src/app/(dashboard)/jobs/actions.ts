"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createJob(formData: FormData) {
  const session = await getServerSession(authOptions);
  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const salaryMin = formData.get("salaryMin") ? parseFloat(formData.get("salaryMin") as string) : null;
  const salaryMax = formData.get("salaryMax") ? parseFloat(formData.get("salaryMax") as string) : null;
  const rawRecruiterId = formData.get("recruiterId") as string;
  const recruiterId = rawRecruiterId && rawRecruiterId !== "none" ? rawRecruiterId : (session?.user?.role === "RECRUITER" ? session.user.id : null);

  if (!title || !description) {
    throw new Error("Título e descrição são obrigatórios");
  }

  // Get or create org
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Maître Consultoria", slug: "maitre" }
    });
  }

  // Create Job
  const job = await prisma.job.create({
    data: {
      title,
      department,
      location,
      description,
      salaryMin,
      salaryMax,
      status: "OPEN",
      organizationId: org.id,
      recruiterId,
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

/**
 * Atribuição rápida de recrutador a uma vaga por Administradores
 */
export async function assignJobRecruiter(jobId: string, recruiterId: string | null) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return { success: false, error: "Apenas administradores podem atribuir vagas a recrutadores." };
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        recruiterId: recruiterId && recruiterId !== "none" ? recruiterId : null,
      },
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}/board`);

    return {
      success: true,
      recruiterName: updatedJob.recruiter?.name || "Sem recrutador",
      recruiterId: updatedJob.recruiterId,
    };
  } catch (error: any) {
    console.error("[JOB_ASSIGN] Erro ao atribuir recrutador:", error);
    return { success: false, error: error?.message || "Erro ao atribuir recrutador." };
  }
}

