import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearningDashboardClient, {
  CourseItem,
  EnrollmentItem,
  TrainingClassItem,
} from "@/components/learning/LearningDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Aprendizagem (LMS & Treinamentos) | Maître Conecta",
  description: "Trilhas de Capacitação Corporativa, Turmas, Frequência, Quizzes e Certificação Condicional",
};

export default async function LearningPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "RECRUITER";
  const canManage = role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECRUITER";
  const currentUserName = session?.user?.name || "Colaborador";
  const currentUserEmail = session?.user?.email || "";

  const { getServerTenantScope } = await import("@/lib/security");
  const resolvedParams = searchParams ? await searchParams : {};
  const scope = await getServerTenantScope(session, resolvedParams.orgId);

  const orgWhere = scope.isGlobalAccess ? {} : { id: scope.organizationId };
  const organizations = await prisma.organization.findMany({
    where: orgWhere,
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  // Buscar organização ativa estritamente dentro do escopo permitido
  const orgId = scope.organizationId || organizations[0]?.id || "";

  // Buscar cursos publicados da organização ou cursos gerais da Maître Master
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
    let parsedQuestions = [];
    if (c.quizQuestions) {
      try {
        parsedQuestions = JSON.parse(c.quizQuestions);
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
      minPassingScore: c.minPassingScore,
      minAttendancePercent: c.minAttendancePercent,
      quizQuestions: parsedQuestions,
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
    attendancePercent: enr.attendancePercent ?? 100,
    quizScore: enr.quizScore,
    isCertified: enr.isCertified,
    status: enr.status,
    completedAt: enr.completedAt ? enr.completedAt.toISOString() : null,
    certificateCode: enr.certificateCode,
    score: enr.score,
    courseTitle: enr.course.title,
    courseDuration: enr.course.durationMinutes,
    courseCategory: enr.course.category,
    minPassingScore: enr.course.minPassingScore,
    minAttendancePercent: enr.course.minAttendancePercent,
  }));

  // Buscar turmas de treinamento (TrainingClass)
  const trainingClassesDb = await prisma.trainingClass.findMany({
    where: {
      ...(orgId ? { organizationId: orgId } : {}),
    },
    include: {
      course: {
        select: { id: true, title: true, category: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const trainingClasses: TrainingClassItem[] = trainingClassesDb.map((tc) => {
    let parsedAttendance = [];
    if (tc.attendanceRecords) {
      try {
        parsedAttendance = JSON.parse(tc.attendanceRecords);
      } catch {
        parsedAttendance = [];
      }
    }
    const hasAttendance = parsedAttendance.length > 0;

    return {
      id: tc.id,
      courseId: tc.courseId,
      courseTitle: tc.course.title,
      courseCategory: tc.course.category,
      name: tc.name,
      instructor: tc.instructorName || "Instrutor Conecta",
      startDate: tc.startDate.toISOString(),
      endDate: tc.endDate ? tc.endDate.toISOString() : null,
      status: hasAttendance ? "COMPLETED" : "SCHEDULED",
      attendanceRecords: parsedAttendance,
    };
  });

  return (
    <LearningDashboardClient
      courses={courses}
      enrollments={enrollments}
      trainingClasses={trainingClasses}
      canManage={canManage}
      currentUserName={currentUserName}
      currentUserEmail={currentUserEmail}
      organizations={JSON.parse(JSON.stringify(organizations))}
      currentOrgId={orgId}
    />
  );
}
