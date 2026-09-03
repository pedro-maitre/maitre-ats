"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  Video,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  PlayCircle,
  FileText,
  Search,
  Filter,
  Check,
  Download,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  enrollCourse,
  updateLessonProgress,
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
  modules: CourseModule[];
}

export interface EnrollmentItem {
  id: string;
  courseId: string;
  employeeName: string;
  employeeEmail: string;
  progressPercent: number;
  status: string;
  completedAt: string | null;
  certificateCode: string | null;
  score: number | null;
  courseTitle: string;
  courseDuration: number;
  courseCategory: string;
}

interface LearningDashboardClientProps {
  courses: CourseItem[];
  enrollments: EnrollmentItem[];
  canManage: boolean;
  currentUserName: string;
  currentUserEmail: string;
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
  canManage,
  currentUserName,
  currentUserEmail,
}: LearningDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "my_courses" | "certificates">("my_courses");
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Player de Curso Modal
  const [playerCourse, setPlayerCourse] = useState<CourseItem | null>(null);
  const [playerEnrollment, setPlayerEnrollment] = useState<EnrollmentItem | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Certificado Modal
  const [certificateModalData, setCertificateModalData] = useState<EnrollmentItem | null>(null);

  // KPIs
  const totalCourses = courses.length;
  const inProgressCount = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
  const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;
  const totalCompletedHours = enrollments
    .filter((e) => e.status === "COMPLETED")
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
          status: res.enrollment.status,
          completedAt: null,
          certificateCode: null,
          score: null,
          courseTitle: course.title,
          courseDuration: course.durationMinutes,
          courseCategory: course.category,
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

  // Avançar Progresso
  const handleAdvanceProgress = async (newPercent: number) => {
    if (!playerEnrollment) return;
    setIsUpdatingProgress(true);

    try {
      const res = await updateLessonProgress({
        enrollmentId: playerEnrollment.id,
        progressPercent: newPercent,
        score: newPercent >= 100 ? 9.5 : undefined,
      });

      if (res.success && res.enrollment) {
        const updatedItem: EnrollmentItem = {
          ...playerEnrollment,
          progressPercent: res.enrollment.progressPercent,
          status: res.enrollment.status,
          completedAt: res.enrollment.completedAt
            ? res.enrollment.completedAt.toISOString()
            : null,
          certificateCode: res.enrollment.certificateCode,
          score: res.enrollment.score,
        };

        setPlayerEnrollment(updatedItem);
        setEnrollments((prev) =>
          prev.map((e) => (e.id === updatedItem.id ? updatedItem : e))
        );

        if (newPercent >= 100) {
          setCertificateModalData(updatedItem);
        }
      }
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar progresso.");
    } finally {
      setIsUpdatingProgress(false);
    }
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
              • LMS Corporativo & Trilhas
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Academia Corporativa & Desenvolvimento
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Capacitação contínua, onboarding de admitidos do Core HR e certificações executivas da Metodologia Maître.
          </p>
        </div>
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
          <div className="flex items-center justify-between text-maitre-gold">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificados</span>
            <Award size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {completedCount}
          </div>
          <p className="text-xs text-slate-400 font-medium">Comprovantes oficiais emitidos.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Horas Concluídas</span>
            <Clock size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalCompletedHours.toFixed(1)}h
          </div>
          <p className="text-xs text-slate-400 font-medium">Carga horária total capacitada.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("my_courses")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "my_courses"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <PlayCircle size={16} /> Meus Treinamentos ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "catalog"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen size={16} /> Catálogo de Cursos ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
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
                const isDone = enr.progressPercent >= 100;

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

                      <h4 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">
                        {enr.courseTitle}
                      </h4>

                      {/* Barra de Progresso */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Progresso</span>
                          <span className={isDone ? "text-emerald-500 font-black" : "text-slate-900 dark:text-white"}>
                            {enr.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${enr.progressPercent}%` }}
                            className={`h-full rounded-full transition-all duration-700 ${
                              isDone ? "bg-emerald-500" : "bg-gradient-to-r from-maitre-gold to-amber-500"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      {isDone ? (
                        <button
                          onClick={() => setCertificateModalData(enr)}
                          className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/30"
                        >
                          <Award size={14} /> Ver Certificado Oficial
                        </button>
                      ) : (
                        <button
                          onClick={() => course && openCoursePlayer(course, enr)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <PlayCircle size={14} /> Continuar Treinamento
                        </button>
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
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar curso ou competência..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Todas as Áreas
              </button>
              {Object.entries(CATEGORY_MAP).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === key
                      ? "bg-maitre-gold text-slate-950 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cursos do Catálogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const cat =
                CATEGORY_MAP[course.category] || CATEGORY_MAP.ONBOARDING;
              const isEnrolled = enrollments.some((e) => e.courseId === course.id);
              const enrItem = enrollments.find((e) => e.courseId === course.id);

              return (
                <div
                  key={course.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-5 hover:border-maitre-gold/50 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.color} ${cat.border}`}>
                        {cat.label}
                      </span>
                      {course.isOnboardingDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 uppercase tracking-wider">
                          Trilha Oficial
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {course.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {course.durationMinutes} min
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} /> {course.modules.length} Módulos
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isEnrolled ? (
                      <button
                        onClick={() => openCoursePlayer(course, enrItem)}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <PlayCircle size={14} /> Continuar ({(enrItem?.progressPercent || 0)}%)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-maitre-gold/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <GraduationCap size={15} /> Matricular-se Gratuitamente
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICADOS */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments
              .filter((e) => e.status === "COMPLETED")
              .map((enr) => (
                <div
                  key={enr.id}
                  className="p-6 rounded-3xl bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-900 dark:to-slate-950 border border-maitre-gold/40 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center">
                      <Award size={22} />
                    </span>
                    <span className="text-[10px] font-mono font-bold text-maitre-gold border border-maitre-gold/30 px-2 py-0.5 rounded-md">
                      {enr.certificateCode}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {enr.courseTitle}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Concluído em {enr.completedAt ? new Date(enr.completedAt).toLocaleDateString("pt-BR") : "2026"} • {enr.courseDuration} min
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Certificado Válido
                    </span>
                    <button
                      onClick={() => setCertificateModalData(enr)}
                      className="text-xs font-bold text-maitre-gold hover:underline flex items-center gap-1"
                    >
                      Visualizar <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL PLAYER DE AULA */}
      {playerCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">
                  Sala de Aula Virtual
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {playerCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setPlayerCourse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Barra de Progresso no Modal */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Seu Progresso no Curso</span>
                <span className="text-maitre-gold font-black">
                  {playerEnrollment?.progressPercent || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${playerEnrollment?.progressPercent || 0}%` }}
                  className="bg-maitre-gold h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Módulos e Aulas */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Conteúdo Programático & Lições
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

            {/* Botões de Avanço */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPlayerCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Fechar
              </button>

              <div className="flex gap-2">
                {(playerEnrollment?.progressPercent || 0) < 100 ? (
                  <button
                    disabled={isUpdatingProgress}
                    onClick={() => {
                      const current = playerEnrollment?.progressPercent || 0;
                      const next = current === 0 ? 50 : 100;
                      handleAdvanceProgress(next);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={14} />
                    {isUpdatingProgress
                      ? "Salvando..."
                      : (playerEnrollment?.progressPercent || 0) === 0
                      ? "Concluir Módulo 1 (50%)"
                      : "Concluir Curso & Emitir Certificado (100%)"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPlayerCourse(null);
                      if (playerEnrollment) setCertificateModalData(playerEnrollment);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Award size={14} /> Abrir Meu Certificado
                  </button>
                )}
              </div>
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
                Carga Horária: {certificateModalData.courseDuration} minutos • Aproveitamento: 9.5 / 10.0
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
