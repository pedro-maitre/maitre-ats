"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import crypto from "crypto";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

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
      attendancePercent: 100, // Matrícula ativa com frequência integral inicial
      status: "IN_PROGRESS",
    },
  });

  revalidatePath("/learning");
  return { success: true, enrollment };
}

// Atualizar progresso das aulas
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
    include: { course: true },
  });

  if (!enrollment) {
    throw new Error("Matrícula não encontrada.");
  }

  const newProgress = Math.max(0, Math.min(100, Math.round(data.progressPercent)));

  const updated = await prisma.courseEnrollment.update({
    where: { id: data.enrollmentId },
    data: {
      progressPercent: newProgress,
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
  minPassingScore?: number;
  minAttendancePercent?: number;
  quizQuestions?: QuizQuestion[];
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
      minPassingScore: data.minPassingScore ?? 70.0,
      minAttendancePercent: data.minAttendancePercent ?? 75,
      quizQuestions: data.quizQuestions ? JSON.stringify(data.quizQuestions) : null,
      status: "PUBLISHED",
      modules: JSON.stringify(data.modules),
    },
  });

  revalidatePath("/learning");
  return { success: true, course };
}

// Criar nova turma presencial/síncrona (TrainingClass)
export async function createTrainingClass(data: {
  courseId: string;
  name: string;
  instructor?: string;
  startDate: string | Date;
  endDate?: string | Date;
  organizationId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "RECRUITER") {
    throw new Error("Apenas RH e administradores podem criar turmas.");
  }

  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
  });

  if (!course) {
    throw new Error("Curso associado não encontrado.");
  }

  const orgId = data.organizationId || course.organizationId;

  const trainingClass = await prisma.trainingClass.create({
    data: {
      organizationId: orgId,
      courseId: course.id,
      name: data.name.trim(),
      instructorName: data.instructor?.trim() || session.user.name || "Instrutor Conecta",
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      attendanceRecords: "[]",
    },
  });

  await logAuditEvent({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "TRAINING_CLASS_CREATED",
    resourceType: "TrainingClass",
    resourceId: trainingClass.id,
    afterData: {
      className: trainingClass.name,
      courseTitle: course.title,
      instructorName: trainingClass.instructorName,
    },
  });

  revalidatePath("/learning");
  return { success: true, trainingClass };
}

// Registrar lista de presença da turma e atualizar frequência dos colaboradores
export async function updateClassAttendance(data: {
  classId: string;
  attendanceList: Array<{
    employeeEmail: string;
    employeeName: string;
    attended: boolean;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const trainingClass = await prisma.trainingClass.findUnique({
    where: { id: data.classId },
    include: { course: true },
  });

  if (!trainingClass) {
    throw new Error("Turma não encontrada.");
  }

  // Atualizar turma com histórico de presença
  const updatedClass = await prisma.trainingClass.update({
    where: { id: data.classId },
    data: {
      attendanceRecords: JSON.stringify(data.attendanceList),
    },
  });

  // Atualizar a porcentagem de presença para as matrículas correspondentes
  for (const record of data.attendanceList) {
    const attendanceVal = record.attended ? 100 : 0;
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId: trainingClass.courseId,
        employeeEmail: record.employeeEmail.toLowerCase(),
      },
    });

    if (enrollment) {
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          attendancePercent: attendanceVal,
        },
      });
    }
  }

  await logAuditEvent({
    organizationId: trainingClass.organizationId,
    actorUserId: session.user.id,
    action: "TRAINING_ATTENDANCE_RECORDED",
    resourceType: "TrainingClass",
    resourceId: trainingClass.id,
    afterData: {
      className: trainingClass.name,
      totalAttendees: data.attendanceList.filter((a) => a.attended).length,
      totalRegistered: data.attendanceList.length,
    },
  });

  revalidatePath("/learning");
  return { success: true, trainingClass: updatedClass };
}

// Submeter questionário de fixação (Quiz) e validar critérios para Certificação
export async function submitCourseQuiz(data: {
  enrollmentId: string;
  answers: number[]; // índices escolhidos pelo usuário para cada pergunta
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: data.enrollmentId },
    include: { course: true },
  });

  if (!enrollment) {
    throw new Error("Matrícula não encontrada.");
  }

  const course = enrollment.course;
  let questions: QuizQuestion[] = [];

  if (course.quizQuestions) {
    try {
      questions = JSON.parse(course.quizQuestions);
    } catch {
      questions = [];
    }
  }

  // Fallback padrão se não houver perguntas específicas cadastradas
  if (questions.length === 0) {
    questions = [
      {
        question: `Qual é o objetivo principal do treinamento de "${course.title}"?`,
        options: [
          "Cumprir apenas burocracia sem aplicação prática",
          "Desenvolver competências críticas e garantir conformidade e excelência",
          "Apenas preencher horas de expediente",
          "Nenhuma das opções anteriores",
        ],
        correctIndex: 1,
      },
      {
        question: "Como o conteúdo deste curso deve ser aplicado no dia a dia da empresa?",
        options: [
          "Seguindo as diretrizes de governança, qualidade e respeito aos padrões da Maître Conecta",
          "Apenas quando o gestor solicitar explicitamente",
          "De forma isolada sem compartilhar boas práticas com a equipe",
          "Ignorando os princípios de segurança da informação",
        ],
        correctIndex: 0,
      },
      {
        question: "Em caso de dúvidas sobre os procedimentos aprendidos, qual a conduta adequada?",
        options: [
          "Improvisar sem avisar ninguém",
          "Consultar a liderança imediata, DHO e os manuais corporativos oficiais",
          "Deixar a demanda parada indefinidamente",
          "Repassar a tarefa para outro setor sem orientação",
        ],
        correctIndex: 1,
      },
    ];
  }

  // Calcular pontuação
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (data.answers[idx] === q.correctIndex) {
      correctCount++;
    }
  });

  const quizScore = Math.round((correctCount / questions.length) * 100);
  const minScore = course.minPassingScore ?? 70.0;
  const minAttendance = course.minAttendancePercent ?? 75;
  const currentAttendance = enrollment.attendancePercent ?? 100;

  const passedScore = quizScore >= minScore;
  const passedAttendance = currentAttendance >= minAttendance;
  const isApproved = passedScore && passedAttendance;

  let certificateCode = enrollment.certificateCode;
  if (isApproved && !certificateCode) {
    const hash = crypto.randomBytes(4).toString("hex").toUpperCase();
    certificateCode = `MC-CERT-${new Date().getFullYear()}-${hash}`;
  }

  const updatedEnrollment = await prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      quizScore,
      quizCompletedAt: new Date(),
      status: isApproved ? "COMPLETED" : "IN_PROGRESS",
      progressPercent: isApproved ? 100 : enrollment.progressPercent,
      completedAt: isApproved ? new Date() : enrollment.completedAt,
      certificateCode: isApproved ? certificateCode : enrollment.certificateCode,
      isCertified: isApproved,
    },
  });

  await logAuditEvent({
    organizationId: enrollment.organizationId,
    actorUserId: session.user.id,
    action: "COURSE_QUIZ_SUBMITTED",
    resourceType: "CourseEnrollment",
    resourceId: enrollment.id,
    afterData: {
      courseTitle: course.title,
      quizScore,
      minScore,
      attendancePercent: currentAttendance,
      minAttendance,
      isApproved,
      certificateCode: isApproved ? certificateCode : null,
    },
  });

  revalidatePath("/learning");

  return {
    success: true,
    isApproved,
    quizScore,
    minScore,
    currentAttendance,
    minAttendance,
    certificateCode: isApproved ? certificateCode : null,
    message: isApproved
      ? "Parabéns! Você atingiu todos os critérios avaliativos e sua certificação oficial foi emitida com sucesso."
      : !passedScore && !passedAttendance
      ? `Aproveitamento insuficiente (${quizScore}% / mín. ${minScore}%) e frequência abaixo da exigida (${currentAttendance}% / mín. ${minAttendance}%).`
      : !passedScore
      ? `Aproveitamento no Quiz (${quizScore}%) abaixo da nota de corte (${minScore}%). Tente novamente para obter sua certificação.`
      : `Frequência registrada (${currentAttendance}%) abaixo do mínimo regulamentar (${minAttendance}%). Contate seu instrutor de RH.`,
    enrollment: updatedEnrollment,
  };
}
