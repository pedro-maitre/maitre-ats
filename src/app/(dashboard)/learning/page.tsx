import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearningDashboardClient, {
  CourseItem,
  EnrollmentItem,
} from "@/components/learning/LearningDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Aprendizagem (LMS & Treinamentos) | Maître Conecta",
  description: "Trilhas de Capacitação Corporativa, Cursos, Certificados e Onboarding",
};

export default async function LearningPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "RECRUITER";
  const canManage = role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECRUITER";
  const currentUserName = session?.user?.name || "Colaborador";
  const currentUserEmail = session?.user?.email || "";

  // Buscar organização ativa
  let orgId = session?.user?.organizationId;
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    orgId = defaultOrg?.id || "";
  }

  // Buscar cursos publicados
  const coursesDb = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(orgId ? { organizationId: orgId } : {}),
    },
    orderBy: [{ isOnboardingDefault: "desc" }, { createdAt: "desc" }],
  });

  const courses: CourseItem[] = coursesDb.map((c) => {
    let parsedModules = [];
    if (c.modules) {
      try {
        parsedModules = JSON.parse(c.modules);
      } catch {
        // fallback
      }
    }
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      durationMinutes: c.durationMinutes,
      isOnboardingDefault: c.isOnboardingDefault,
      modules: parsedModules,
    };
  });

  // Buscar matrículas
  const enrollmentsDb = await prisma.courseEnrollment.findMany({
    where: {
      ...(orgId ? { organizationId: orgId } : {}),
    },
    include: {
      course: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const enrollments: EnrollmentItem[] = enrollmentsDb.map((enr) => ({
    id: enr.id,
    courseId: enr.courseId,
    employeeName: enr.employeeName,
    employeeEmail: enr.employeeEmail,
    progressPercent: enr.progressPercent,
    status: enr.status,
    completedAt: enr.completedAt ? enr.completedAt.toISOString() : null,
    certificateCode: enr.certificateCode,
    score: enr.score,
    courseTitle: enr.course.title,
    courseDuration: enr.course.durationMinutes,
    courseCategory: enr.course.category,
  }));

  return (
    <LearningDashboardClient
      courses={courses}
      enrollments={enrollments}
      canManage={canManage}
      currentUserName={currentUserName}
      currentUserEmail={currentUserEmail}
    />
  );
}
