"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlayCircle,
  Search,
  Check,
  Download,
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  UserCheck,
  CheckSquare,
  AlertTriangle,
  HelpCircle,
  Send,
  Plus,
} from "lucide-react";
import {
  enrollCourse,
  updateLessonProgress,
  submitCourseQuiz,
  createTrainingClass,
  updateClassAttendance,
  QuizQuestion,
} from "@/app/(dashboard)/learning/actions";

export interface CourseModuleLesson {
  id: string;
  title: string;
  durationMin: number;
  type: string;
}

export interface CourseModule {
  title: string;
  lessons: CourseModuleLesson[];
}

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  durationMinutes: number;
  isOnboardingDefault: boolean;
  minPassingScore?: number;
  minAttendancePercent?: number;
  quizQuestions?: QuizQuestion[];
  modules: CourseModule[];
}

export interface EnrollmentItem {
  id: string;
  courseId: string;
  employeeName: string;
  employeeEmail: string;
  progressPercent: number;
  attendancePercent?: number;
  quizScore?: number | null;
  isCertified?: boolean;
  status: string;
  completedAt: string | null;
  certificateCode: string | null;
  score: number | null;
  courseTitle: string;
  courseDuration: number;
  courseCategory: string;
  minPassingScore?: number;
  minAttendancePercent?: number;
}

export interface AttendanceRecord {
  employeeEmail: string;
  employeeName: string;
  attended: boolean;
}

export interface TrainingClassItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  name: string;
  instructor: string;
  startDate: string;
  endDate: string | null;
  status: string;
  attendanceRecords: AttendanceRecord[];
}

interface LearningDashboardClientProps {
  courses: CourseItem[];
  enrollments: EnrollmentItem[];
  trainingClasses?: TrainingClassItem[];
  canManage: boolean;
  currentUserName: string;
  currentUserEmail: string;
  organizations?: Array<{ id: string; name: string }>;
  currentOrgId?: string;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  ONBOARDING: {
    label: "Onboarding & Integração",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  LIDERANCA: {
    label: "Liderança & Gestão",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  COMPLIANCE_LGPD: {
    label: "Compliance & LGPD",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
  METODOLOGIA_MAITRE: {
    label: "Metodologia Maître",
    color: "text-maitre-gold",
    bg: "bg-maitre-gold/10",
    border: "border-maitre-gold/30",
  },
};

export default function LearningDashboardClient({
  courses,
  enrollments: initialEnrollments,
  trainingClasses: initialTrainingClasses = [],
  canManage,
  currentUserName,
  currentUserEmail,
  organizations = [],
  currentOrgId = "",
}: LearningDashboardClientProps) {
  const [selectedOrg, setSelectedOrg] = useState(currentOrgId || (organizations[0]?.id || ""));
  const [activeTab, setActiveTab] = useState<"catalog" | "my_courses" | "certificates" | "classes">("my_courses");
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>(initialEnrollments);
  const [trainingClasses, setTrainingClasses] = useState<TrainingClassItem[]>(initialTrainingClasses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Player de Curso Modal
  const [playerCourse, setPlayerCourse] = useState<CourseItem | null>(null);
  const [playerEnrollment, setPlayerEnrollment] = useState<EnrollmentItem | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Certificado Modal
  const [certificateModalData, setCertificateModalData] = useState<EnrollmentItem | null>(null);

  // Modal de Quiz Avaliativo
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizEnrollment, setQuizEnrollment] = useState<EnrollmentItem | null>(null);
  const [quizCourse, setQuizCourse] = useState<CourseItem | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    success: boolean;
    isApproved: boolean;
    quizScore: number;
    minScore: number;
    currentAttendance: number;
    minAttendance: number;
    message: string;
  } | null>(null);

  // Modal de Criação de Turma
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassCourseId, setNewClassCourseId] = useState(courses[0]?.id || "");
  const [newClassInstructor, setNewClassInstructor] = useState(currentUserName);
  const [newClassStartDate, setNewClassStartDate] = useState("2026-10-15T14:00");
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // Modal de Registro de Presença na Turma
  const [attendanceModalClass, setAttendanceModalClass] = useState<TrainingClassItem | null>(null);
  const [attendanceCandidateList, setAttendanceCandidateList] = useState<AttendanceRecord[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // KPIs
  const totalCourses = courses.length;
  const inProgressCount = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
  const completedCount = enrollments.filter((e) => e.status === "COMPLETED" || e.isCertified).length;
  const totalCompletedHours = enrollments
    .filter((e) => e.status === "COMPLETED" || e.isCertified)
    .reduce((acc, curr) => acc + (curr.courseDuration || 60), 0) / 60;

  // Filtragem de Catálogo
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handler de Matrícula
  const handleEnroll = async (course: CourseItem) => {
    try {
      const res = await enrollCourse({
        courseId: course.id,
        employeeName: currentUserName,
        employeeEmail: currentUserEmail,
      });

      if (res.success && res.enrollment) {
        const newEnrollment: EnrollmentItem = {
          id: res.enrollment.id,
          courseId: course.id,
          employeeName: res.enrollment.employeeName,
          employeeEmail: res.enrollment.employeeEmail,
          progressPercent: res.enrollment.progressPercent,
          attendancePercent: res.enrollment.attendancePercent ?? 100,
          status: res.enrollment.status,
          completedAt: null,
          certificateCode: null,
          score: null,
          isCertified: false,
          courseTitle: course.title,
          courseDuration: course.durationMinutes,
          courseCategory: course.category,
          minPassingScore: course.minPassingScore ?? 70,
          minAttendancePercent: course.minAttendancePercent ?? 75,
        };
        setEnrollments([newEnrollment, ...enrollments]);
        openCoursePlayer(course, newEnrollment);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao matricular.");
    }
  };

  // Abrir Player
  const openCoursePlayer = (course: CourseItem, enrollment?: EnrollmentItem) => {
    const existing =
      enrollment || enrollments.find((e) => e.courseId === course.id);
    setPlayerCourse(course);
    setPlayerEnrollment(existing || null);
  };

  // Avançar Progresso de aula
  const handleAdvanceProgress = async (newPercent: number) => {
    if (!playerEnrollment) return;
    setIsUpdatingProgress(true);

    try {
      const res = await updateLessonProgress({
        enrollmentId: playerEnrollment.id,
        progressPercent: newPercent,
      });

      if (res.success && res.enrollment) {
        const updatedItem: EnrollmentItem = {
          ...playerEnrollment,
          progressPercent: res.enrollment.progressPercent,
          score: res.enrollment.score,
        };

        setPlayerEnrollment(updatedItem);
        setEnrollments((prev) =>
          prev.map((e) => (e.id === updatedItem.id ? updatedItem : e))
        );
      }
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar progresso.");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Abrir Quiz de Fixação
  const handleOpenQuiz = (course: CourseItem, enrollment: EnrollmentItem) => {
    setPlayerCourse(null);
    setQuizCourse(course);
    setQuizEnrollment(enrollment);
    setQuizAnswers([]);
    setQuizFeedback(null);
    setQuizModalOpen(true);
  };

  // Submeter Quiz
  const handleSubmitQuiz = async () => {
    if (!quizEnrollment || !quizCourse) return;
    setIsSubmittingQuiz(true);
    setQuizFeedback(null);

    try {
      const res = await submitCourseQuiz({
        enrollmentId: quizEnrollment.id,
        answers: quizAnswers,
      });

      setQuizFeedback(res);

      if (res.success && res.enrollment) {
        const updatedEnr: EnrollmentItem = {
          ...quizEnrollment,
          progressPercent: res.enrollment.progressPercent,
          attendancePercent: res.enrollment.attendancePercent ?? 100,
          quizScore: res.enrollment.quizScore,
          isCertified: res.enrollment.isCertified,
          status: res.enrollment.status,
          certificateCode: res.enrollment.certificateCode,
          completedAt: res.enrollment.completedAt ? res.enrollment.completedAt.toISOString() : null,
        };

        setEnrollments((prev) =>
          prev.map((e) => (e.id === updatedEnr.id ? updatedEnr : e))
        );
        setQuizEnrollment(updatedEnr);

        if (res.isApproved) {
          setTimeout(() => {
            setQuizModalOpen(false);
            setCertificateModalData(updatedEnr);
          }, 2000);
        }
      }
    } catch (err: any) {
      alert(err.message || "Erro ao avaliar respostas do Quiz.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Criar Turma de Treinamento
  const handleCreateTrainingClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCourseId) return;

    setIsSubmittingClass(true);
    try {
      const res = await createTrainingClass({
        courseId: newClassCourseId,
        name: newClassName,
        instructor: newClassInstructor,
        startDate: newClassStartDate,
        organizationId: selectedOrg,
      });

      if (res.success && res.trainingClass) {
        const course = courses.find((c) => c.id === newClassCourseId);
        const newClassItem: TrainingClassItem = {
          id: res.trainingClass.id,
          courseId: res.trainingClass.courseId,
          courseTitle: course?.title || "Treinamento",
          courseCategory: course?.category || "ONBOARDING",
          name: res.trainingClass.name,
          instructor: res.trainingClass.instructorName || "Instrutor Conecta",
          startDate: res.trainingClass.startDate.toISOString(),
          endDate: res.trainingClass.endDate ? res.trainingClass.endDate.toISOString() : null,
          status: "SCHEDULED",
          attendanceRecords: [],
        };
        setTrainingClasses([newClassItem, ...trainingClasses]);
        setIsCreateClassOpen(false);
        setNewClassName("");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao criar turma.");
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Abrir Modal de Frequência
  const handleOpenAttendanceModal = (tc: TrainingClassItem) => {
    setAttendanceModalClass(tc);
    // Pré-carregar inscritos com base nas matrículas do curso ou na lista existente
    if (tc.attendanceRecords && tc.attendanceRecords.length > 0) {
      setAttendanceCandidateList(tc.attendanceRecords);
    } else {
      const courseEnrs = enrollments.filter((e) => e.courseId === tc.courseId);
      if (courseEnrs.length > 0) {
        setAttendanceCandidateList(
          courseEnrs.map((e) => ({
            employeeName: e.employeeName,
            employeeEmail: e.employeeEmail,
            attended: true,
          }))
        );
      } else {
        setAttendanceCandidateList([
          {
            employeeName: currentUserName,
            employeeEmail: currentUserEmail,
            attended: true,
          },
        ]);
      }
    }
  };

  // Salvar Frequência
  const handleSaveAttendance = async () => {
    if (!attendanceModalClass) return;
    setIsSavingAttendance(true);
    try {
      const res = await updateClassAttendance({
        classId: attendanceModalClass.id,
        attendanceList: attendanceCandidateList,
      });

      if (res.success && res.trainingClass) {
        setTrainingClasses((prev) =>
          prev.map((c) =>
            c.id === attendanceModalClass.id
              ? {
                  ...c,
                  status: "COMPLETED",
                  attendanceRecords: attendanceCandidateList,
                }
              : c
          )
        );
        // Atualizar lista local de matrículas
        setEnrollments((prev) =>
          prev.map((enr) => {
            if (enr.courseId === attendanceModalClass.courseId) {
              const rec = attendanceCandidateList.find(
                (r) => r.employeeEmail.toLowerCase() === enr.employeeEmail.toLowerCase()
              );
              if (rec) {
                return {
                  ...enr,
                  attendancePercent: rec.attended ? 100 : 0,
                };
              }
            }
            return enr;
          })
        );
        setAttendanceModalClass(null);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao registrar presença.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Questões para o Quiz
  const getQuizQuestions = (course: CourseItem): QuizQuestion[] => {
    if (course.quizQuestions && course.quizQuestions.length > 0) {
      return course.quizQuestions;
    }
    return [
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
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
              <GraduationCap size={13} /> Conecta Aprendizagem
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              • LMS Corporativo & Trilhas de DHO
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Academia Corporativa & Desenvolvimento
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Capacitação contínua, gestão de turmas, controle de frequência e certificações com aprovação em Quiz e nota de corte.
          </p>
        </div>

        {organizations && organizations.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 px-3 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Building2 size={14} className="text-cyan-500" />
              <span className="hidden sm:inline">Empresa:</span>
            </span>
            <select
              value={selectedOrg}
              onChange={(e) => {
                const newOrgId = e.target.value;
                setSelectedOrg(newOrgId);
                const url = new URL(window.location.href);
                url.searchParams.set("orgId", newOrgId);
                window.location.href = url.toString();
              }}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id} className="bg-white dark:bg-slate-900">
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-cyan-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Catálogo Disponível</span>
            <BookOpen size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalCourses} Cursos
          </div>
          <p className="text-xs text-slate-400 font-medium">Trilhas institucionais e liderança.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Em Andamento</span>
            <PlayCircle size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {inProgressCount}
          </div>
          <p className="text-xs text-slate-400 font-medium">Cursos com aulas em progresso.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Turmas Ativas</span>
            <Users size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {trainingClasses.length}
          </div>
          <p className="text-xs text-slate-400 font-medium">Sessões síncronas com controle de presença.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-maitre-gold">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificados Emitidos</span>
            <Award size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {completedCount}
          </div>
          <p className="text-xs text-slate-400 font-medium">Aprovados com presença ≥75% e nota ≥70%.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("my_courses")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "my_courses"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <PlayCircle size={16} /> Meus Treinamentos ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "catalog"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen size={16} /> Catálogo de Cursos ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "classes"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users size={16} /> Turmas & Frequência ({trainingClasses.length})
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "certificates"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Award size={16} /> Meus Certificados ({completedCount})
        </button>
      </div>

      {/* TAB 1: MEUS TREINAMENTOS */}
      {activeTab === "my_courses" && (
        <div className="space-y-6">
          {enrollments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Nenhum curso em andamento
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Explore o catálogo de capacitações e inicie sua jornada na Trilha de Onboarding ou Liderança.
              </p>
              <button
                onClick={() => setActiveTab("catalog")}
                className="px-6 py-2.5 rounded-xl bg-maitre-gold text-slate-950 font-bold text-xs shadow-md"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enr) => {
                const course = courses.find((c) => c.id === enr.courseId);
                const cat =
                  CATEGORY_MAP[enr.courseCategory] ||
                  CATEGORY_MAP.ONBOARDING;
                const isCertified = enr.isCertified || enr.status === "COMPLETED";

                return (
                  <div
                    key={enr.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-5 hover:border-maitre-gold/50 transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.color} ${cat.border}`}>
                          {cat.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock size={12} /> {enr.courseDuration} min
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {enr.courseTitle}
                      </h3>

                      {/* Progresso de Aulas e Frequência */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-semibold">Progresso Aulas:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {enr.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${enr.progressPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400 flex items-center gap-1">
                            <UserCheck size={12} className="text-indigo-400" /> Presença em Turma:
                          </span>
                          <span className={`font-bold ${
                            (enr.attendancePercent ?? 100) >= (enr.minAttendancePercent ?? 75)
                              ? "text-emerald-500"
                              : "text-rose-500"
                          }`}>
                            {enr.attendancePercent ?? 100}% (mín. {enr.minAttendancePercent ?? 75}%)
                          </span>
                        </div>

                        {enr.quizScore !== null && enr.quizScore !== undefined && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <HelpCircle size={12} className="text-amber-400" /> Nota no Quiz:
                            </span>
                            <span className={`font-bold ${
                              enr.quizScore >= (enr.minPassingScore ?? 70)
                                ? "text-emerald-500"
                                : "text-rose-500"
                            }`}>
                              {enr.quizScore}% (corte: {enr.minPassingScore ?? 70}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {isCertified ? (
                        <button
                          onClick={() => setCertificateModalData(enr)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:opacity-95"
                        >
                          <Award size={14} /> Ver Certificado Oficial
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => {
                              if (course) openCoursePlayer(course, enr);
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <PlayCircle size={14} /> Aulas ({enr.progressPercent}%)
                          </button>
                          <button
                            onClick={() => {
                              if (course) handleOpenQuiz(course, enr);
                            }}
                            title="Realizar Quiz de Fixação para desbloquear certificado"
                            className="px-3.5 py-2.5 rounded-xl bg-maitre-gold hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md"
                          >
                            <CheckSquare size={14} /> Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATÁLOGO DE CURSOS */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Barra de Busca & Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar treinamentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-maitre-gold"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Todos
              </button>
              {Object.keys(CATEGORY_MAP).map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedCategory(k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === k
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  {CATEGORY_MAP[k].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => {
              const cat = CATEGORY_MAP[c.category] || CATEGORY_MAP.ONBOARDING;
              const isEnrolled = enrollments.some((e) => e.courseId === c.id);

              return (
                <div
                  key={c.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.color} ${cat.border}`}>
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock size={12} /> {c.durationMinutes} min
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        Corte Quiz: {c.minPassingScore ?? 70}%
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        Frequência Mín.: {c.minAttendancePercent ?? 75}%
                      </span>
                      {c.isOnboardingDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                          Obrigatório Onboarding
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">
                      {c.modules.length} Módulos estruturados
                    </span>
                    {isEnrolled ? (
                      <button
                        onClick={() => openCoursePlayer(c)}
                        className="px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5"
                      >
                        Continuar <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5"
                      >
                        Matricular-se
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TURMAS & FREQUÊNCIA (T-14) */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
                  DHO Corporativo
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Gestão de Turmas Síncronas & Chamada de Presença
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O DHO controla as sessões presenciais ou síncronas. A frequência registrada alimenta a regra de corte de certificação (mín. 75%).
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setIsCreateClassOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center"
              >
                <Plus size={15} /> Criar Nova Turma
              </button>
            )}
          </div>

          {trainingClasses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-3">
              <Calendar size={32} className="text-slate-400 mx-auto" />
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Nenhuma turma agendada no momento
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cadastre a primeira turma corporativa para realizar encontros com os colaboradores e registrar lista de presença.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingClasses.map((tc) => {
                const isCompleted = tc.status === "COMPLETED";
                const totalRegistered = tc.attendanceRecords?.length || 0;
                const totalAttended =
                  tc.attendanceRecords?.filter((r) => r.attended).length || 0;
                const attendanceRate =
                  totalRegistered > 0
                    ? Math.round((totalAttended / totalRegistered) * 100)
                    : 0;

                return (
                  <div
                    key={tc.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCompleted
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                        }`}>
                          {isCompleted ? "Concluída / Chamada Feita" : "Agendada / Aberta"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar size={12} /> {new Date(tc.startDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {tc.name}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Curso:</strong> {tc.courseTitle}
                        </p>
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Instrutor:</strong> {tc.instructor}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Presença Registrada:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {totalAttended} / {totalRegistered} ({attendanceRate}%)
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                      <button
                        onClick={() => handleOpenAttendanceModal(tc)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <UserCheck size={14} /> Fazer / Ver Chamada
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEUS CERTIFICADOS */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          {completedCount === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-maitre-gold mx-auto flex items-center justify-center">
                <Award size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Nenhum certificado emitido ainda
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Conclua os módulos de treinamento, mantenha presença ≥75% e atinja no mínimo 70% no Quiz de Fixação para emitir seu certificado verificado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments
                .filter((e) => e.status === "COMPLETED" || e.isCertified)
                .map((enr) => (
                  <div
                    key={enr.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-maitre-gold/40 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-maitre-gold/10 rounded-bl-full pointer-events-none" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/40">
                          Certificado Autêntico
                        </span>
                        <ShieldCheck size={18} className="text-maitre-gold" />
                      </div>

                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {enr.courseTitle}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Colaborador:</strong> {enr.employeeName}
                        </p>
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Código Oficial:</strong> {enr.certificateCode}
                        </p>
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Nota no Quiz:</strong> {enr.quizScore ?? 95}%
                        </p>
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Frequência:</strong> {enr.attendancePercent ?? 100}%
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCertificateModalData(enr)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 hover:opacity-95"
                    >
                      <Download size={14} /> Visualizar / Baixar Certificado
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PLAYER DE CURSO */}
      {playerCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                  Player Corporativo Maître Conecta
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {playerCourse.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {playerCourse.description}
                </p>
              </div>
              <button
                onClick={() => setPlayerCourse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulação de Player de Vídeo / Apresentação */}
            <div className="aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden group">
              <div className="w-16 h-16 rounded-full bg-maitre-gold/20 text-maitre-gold flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <PlayCircle size={36} />
              </div>
              <h4 className="text-white font-bold text-sm">
                Ambiente de Capacitação Multimídia
              </h4>
              <p className="text-slate-400 text-xs max-w-sm mt-1">
                Aulas estruturadas com materiais didáticos, compliance e boas práticas de excelência.
              </p>
            </div>

            {/* Módulos do Curso */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Grade Curricular do Treinamento
              </h4>

              <div className="space-y-3">
                {playerCourse.modules.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5"
                  >
                    <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen size={14} className="text-cyan-500" /> {mod.title}
                    </h5>

                    <div className="space-y-1.5 pl-2">
                      {mod.lessons.map((les, lIdx) => {
                        const isLessonDone =
                          (playerEnrollment?.progressPercent || 0) >=
                          ((mIdx + 1) * 50);

                        return (
                          <div
                            key={lIdx}
                            className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800"
                          >
                            <span className="flex items-center gap-2">
                              {isLessonDone ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              ) : (
                                <PlayCircle size={14} className="text-slate-400" />
                              )}
                              <span>{les.title}</span>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {les.durationMin} min
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões de Avanço e Acesso ao Quiz */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPlayerCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Fechar
              </button>

              <div className="flex gap-2">
                <button
                  disabled={isUpdatingProgress}
                  onClick={() => {
                    const current = playerEnrollment?.progressPercent || 0;
                    const next = current === 0 ? 50 : 100;
                    handleAdvanceProgress(next);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} />
                  {isUpdatingProgress
                    ? "Salvando..."
                    : (playerEnrollment?.progressPercent || 0) === 0
                    ? "Avançar Aula (50%)"
                    : "Concluir Aulas (100%)"}
                </button>

                {playerEnrollment && (
                  <button
                    onClick={() => {
                      if (playerCourse && playerEnrollment) {
                        handleOpenQuiz(playerCourse, playerEnrollment);
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 hover:opacity-95"
                  >
                    <CheckSquare size={14} /> Fazer Avaliação Final (Quiz)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE QUIZ AVALIATIVO (T-14) */}
      {quizModalOpen && quizCourse && quizEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                    Avaliação de Fixação (Quiz)
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Corte: {quizCourse.minPassingScore ?? 70}% • Frequência mín: {quizCourse.minAttendancePercent ?? 75}%
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {quizCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setQuizModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Alerta de Critérios */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3 text-xs">
              <ShieldCheck size={18} className="text-maitre-gold shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Condições Regulamentares para Emissão do Certificado Oficial:
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Sua frequência atual registrada é de <strong>{quizEnrollment.attendancePercent ?? 100}%</strong>.
                  Para certificação, é necessário acertar pelo menos {quizCourse.minPassingScore ?? 70}% das questões e possuir frequência igual ou superior a {quizCourse.minAttendancePercent ?? 75}%.
                </p>
              </div>
            </div>

            {/* Questões */}
            <div className="space-y-6">
              {getQuizQuestions(quizCourse).map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[qIdx] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            const newAns = [...quizAnswers];
                            newAns[qIdx] = optIdx;
                            setQuizAnswers(newAns);
                          }}
                          className={`w-full p-3 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                            isSelected
                              ? "bg-maitre-gold/15 border-maitre-gold text-slate-900 dark:text-white font-bold"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected
                              ? "border-maitre-gold bg-maitre-gold text-slate-950 font-bold"
                              : "border-slate-400"
                          }`}>
                            {isSelected && "✓"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback de Resultado */}
            {quizFeedback && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
                quizFeedback.isApproved
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              }`}>
                {quizFeedback.isApproved ? (
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {quizFeedback.isApproved ? "Aprovado com Excelência!" : "Não Aprovado"}
                  </p>
                  <p className="mt-0.5">{quizFeedback.message}</p>
                </div>
              </div>
            )}

            {/* Botões do Quiz */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setQuizModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isSubmittingQuiz || quizAnswers.length < getQuizQuestions(quizCourse).length}
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send size={14} />
                {isSubmittingQuiz ? "Avaliando..." : "Submeter Quiz & Validar Certificado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR TURMA (T-14) */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> Criar Turma de Treinamento
              </h3>
              <button
                onClick={() => setIsCreateClassOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrainingClass} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma Alpha - Onboarding Q3"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Curso Vinculado
                </label>
                <select
                  value={newClassCourseId}
                  onChange={(e) => setNewClassCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({CATEGORY_MAP[c.category]?.label || c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Instrutor Responsável
                </label>
                <input
                  type="text"
                  required
                  value={newClassInstructor}
                  onChange={(e) => setNewClassInstructor(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Data e Hora da Sessão
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newClassStartDate}
                  onChange={(e) => setNewClassStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmittingClass ? "Criando..." : "Salvar Turma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE PRESENÇA (T-14) */}
      {attendanceModalClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500">
                  Controle de Frequência & Presença
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {attendanceModalClass.name}
                </h3>
              </div>
              <button
                onClick={() => setAttendanceModalClass(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Marque os colaboradores presentes. Essa lista atualizará automaticamente o percentual de frequência do colaborador para fins de certificação no curso <strong>{attendanceModalClass.courseTitle}</strong>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {attendanceCandidateList.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const updated = [...attendanceCandidateList];
                    updated[idx].attended = !updated[idx].attended;
                    setAttendanceCandidateList(updated);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    rec.attended
                      ? "bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  <div>
                    <p>{rec.employeeName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{rec.employeeEmail}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    rec.attended
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {rec.attended ? "Presente" : "Ausente"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAttendanceModalClass(null)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled={isSavingAttendance}
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md disabled:opacity-50"
              >
                {isSavingAttendance ? "Salvando..." : "Salvar Frequência"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERTIFICADO OFICIAL MAÎTRE */}
      {certificateModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-maitre-gold shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-maitre-gold/10 rounded-bl-full pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-bold">
                  <Award size={20} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-maitre-gold">
                  Certificado de Conclusão Oficial
                </span>
              </div>
              <button
                onClick={() => setCertificateModalData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-4 py-4">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Certificamos que
              </p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-serif">
                {certificateModalData.employeeName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                concluiu com êxito os requisitos do programa corporativo de capacitação em:
              </p>
              <h3 className="text-lg font-black text-maitre-gold">
                {certificateModalData.courseTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Carga Horária: {certificateModalData.courseDuration} minutos • Frequência: {certificateModalData.attendancePercent ?? 100}% • Nota no Quiz: {certificateModalData.quizScore ?? 95}%
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="text-left">
                <span className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Código de Autenticidade: {certificateModalData.certificateCode}
                </span>
                <span className="text-[10px] text-slate-400">
                  Emitido em {certificateModalData.completedAt ? new Date(certificateModalData.completedAt).toLocaleDateString("pt-BR") : "2026"}
                </span>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Download size={13} /> Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
