"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Matricular colaborador / usuário em um curso
export async function enrollCourse(data: {
  courseId: string;
  candidateId?: string;
  employeeName?: string;
  employeeEmail?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
  });

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  const name = data.employeeName?.trim() || session.user.name || "Colaborador";
  const email = data.employeeEmail?.trim().toLowerCase() || session.user.email || "";

  // Verificar se já está matriculado
  const existing = await prisma.courseEnrollment.findFirst({
    where: {
      courseId: course.id,
      employeeEmail: email,
    },
  });

  if (existing) {
    return { success: true, enrollment: existing };
  }

  const enrollment = await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
      organizationId: course.organizationId,
      userId: session.user.id,
      candidateId: data.candidateId || null,
      employeeName: name,
      employeeEmail: email,
      progressPercent: 0,
      status: "IN_PROGRESS",
    },
  });

  revalidatePath("/learning");
  return { success: true, enrollment };
}

// Atualizar progresso e emitir certificado se atingir 100%
export async function updateLessonProgress(data: {
  enrollmentId: string;
  progressPercent: number;
  score?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: data.enrollmentId },
  });

  if (!enrollment) {
    throw new Error("Matrícula não encontrada.");
  }

  const newProgress = Math.max(0, Math.min(100, Math.round(data.progressPercent)));
  const isCompleted = newProgress >= 100;

  let certificateCode = enrollment.certificateCode;
  if (isCompleted && !certificateCode) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    certificateCode = `MC-CERT-${new Date().getFullYear()}-${randomSuffix}`;
  }

  const updated = await prisma.courseEnrollment.update({
    where: { id: data.enrollmentId },
    data: {
      progressPercent: newProgress,
      status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
      completedAt: isCompleted ? new Date() : null,
      certificateCode: certificateCode || null,
      score: data.score !== undefined ? data.score : enrollment.score,
    },
  });

  revalidatePath("/learning");
  return { success: true, enrollment: updated };
}

// Criar novo curso (Admins e RH)
export async function createCourse(data: {
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  isOnboardingDefault?: boolean;
  modules: Array<{
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      durationMin: number;
      type: string;
    }>;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "RECRUITER") {
    throw new Error("Sem permissão para publicar cursos.");
  }

  let orgId = session.user.organizationId;
  if (!orgId) {
    const firstOrg = await prisma.organization.findFirst();
    orgId = firstOrg?.id || null;
  }

  if (!orgId) {
    throw new Error("Organização não localizada.");
  }

  const slug = data.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const course = await prisma.course.create({
    data: {
      organizationId: orgId,
      title: data.title.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: data.description.trim(),
      category: data.category || "ONBOARDING",
      durationMinutes: data.durationMinutes || 60,
      isOnboardingDefault: Boolean(data.isOnboardingDefault),
      status: "PUBLISHED",
      modules: JSON.stringify(data.modules),
    },
  });

  revalidatePath("/learning");
  return { success: true, course };
}
