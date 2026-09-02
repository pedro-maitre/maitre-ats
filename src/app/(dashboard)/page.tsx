/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  BarChart3,
  GraduationCap,
  HeartHandshake,
  Compass,
  FileText,
  Layers,
  ChevronRight,
  UserPlus,
  Plus,
  Send,
  Zap,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel Executivo | Maître Conecta",
  description: "Visão consolidada e central de comando de todos os módulos da Suíte Maître Conecta",
};

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "Administrador";

  // Consultas agregadas em paralelo com fallback resiliente
  let jobs: any[] = [];
  let candidates: any[] = [];
  let applications: any[] = [];
  let conversions: any[] = [];
  let documents: any[] = [];
  let stages: any[] = [];
  let recentAudits: any[] = [];
  let dbError: string | null = null;

  try {
    const results = await Promise.all([
      prisma.job.findMany({
        include: {
          applications: {
            include: { candidate: true, stage: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.application.findMany({
        include: {
          candidate: true,
          job: true,
          stage: true,
          offers: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.hireConversion.findMany({
        include: {
          application: {
            include: { candidate: true, job: true, offers: true },
          },
        },
        orderBy: { convertedAt: "desc" },
      }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.stage.findMany({
        include: {
          _count: { select: { applications: true } },
        },
      }),
      prisma.auditEvent.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    jobs = results[0];
    candidates = results[1];
    applications = results[2];
    conversions = results[3];
    documents = results[4];
    stages = results[5];
    recentAudits = results[6];
  } catch (err: any) {
    console.error("Erro ao carregar métricas do painel executivo:", err?.message || err);
    dbError = "O banco de dados está sincronizando ou conectando. As informações serão atualizadas automaticamente.";
  }

  // Cálculos & Métricas
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
  const totalCandidates = candidates.length;
  const totalApplications = applications.length;
  const totalHires = conversions.length;
  const totalDocs = documents.length;

  const altoFitApps = applications.filter((a) => a.fitCategory === "ALTO_FIT");
  const pendingTriagem = applications.filter(
    (a) => a.stage?.name?.toLowerCase().includes("triagem") || !a.stageId
  );
  const pendingOnboarding = conversions.filter((c) => c.status === "PENDING_ONBOARDING");

  const totalPayroll = conversions.reduce((acc, c) => {
    const salary =
      c.application.offers[0]?.salaryOffered ||
      c.application.salaryExpectation ||
      c.application.job.salaryMax ||
      0;
    return acc + salary;
  }, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  // Alertas inteligentes
  const alerts: {
    type: "warning" | "info" | "success" | "danger";
    title: string;
    description: string;
    link: string;
    linkText: string;
    badge: string;
  }[] = [];

  if (pendingTriagem.length > 0) {
    alerts.push({
      type: "warning",
      title: `${pendingTriagem.length} candidaturas aguardando triagem`,
      description: "Candidatos recentes aguardam classificação de Fit 3D e avanço de etapa.",
      link: "/jobs",
      linkText: "Abrir Triagem",
      badge: "Conecta Talentos",
    });
  }

  if (pendingOnboarding.length > 0) {
    alerts.push({
      type: "info",
      title: `${pendingOnboarding.length} colaboradores em processo de onboarding`,
      description: "Novos contratados em fase de envio de documentação e formalização.",
      link: "/employees",
      linkText: "Ver Core HR",
      badge: "Conecta Pessoas",
    });
  }

  if (altoFitApps.length > 0) {
    alerts.push({
      type: "success",
      title: `${altoFitApps.length} candidatos classificados com Alto Fit 3D`,
      description: "Perfis com alta aderência técnica, cultural e alinhamento orçamentário.",
      link: "/jobs",
      linkText: "Ver Priorizados",
      badge: "Governança IA",
    });
  }

  // Se não houver alertas graves, adiciona alerta informativo padrão
  if (alerts.length === 0) {
    alerts.push({
      type: "success",
      title: "Operação estável e sincronizada",
      description: "Todos os processos seletivos e admissões estão em dia.",
      link: "/insights",
      linkText: "Ver Analytics",
      badge: "Status Geral",
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16">
      {/* Header Executivo com Boas-Vindas */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#1d1e20] via-slate-900 to-[#141517] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-maitre-gold/20 text-maitre-gold text-[10px] font-extrabold uppercase tracking-widest border border-maitre-gold/30">
              Central de Comando
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              • Suíte Maître Conecta v2.5
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Olá, {userName}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Visão unificada em tempo real dos 9 módulos de R&S, Core HR, Operações e DHO da sua organização.
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/jobs/new"
            className="bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-4 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-105 transition-all"
          >
            <Plus size={16} />
            <span>Criar Nova Vaga</span>
          </Link>
          <Link
            href="/employees"
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <UserCheck size={16} className="text-purple-400" />
            <span>Admissão Core HR</span>
          </Link>
        </div>

        {/* Efeito Visual de Fundo */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-maitre-gold/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Aviso de Sincronização / Cold Start do Banco se houver */}
      {dbError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle size={18} className="shrink-0 text-amber-500" />
          <span>{dbError}</span>
        </div>
      )}

      {/* SEÇÃO 1: CENTRAL DE ALERTAS & AÇÕES PENDENTES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Alertas & Ações Pendentes
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Atualização em tempo real</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                alert.type === "warning"
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30"
                  : alert.type === "info"
                  ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-500/30"
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      alert.type === "warning"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : alert.type === "info"
                        ? "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {alert.badge}
                  </span>
                  <Clock size={12} className="text-slate-400" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                  {alert.title}
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {alert.description}
                </p>
              </div>

              <Link
                href={alert.link}
                className="inline-flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white hover:underline pt-2 border-t border-slate-200/50 dark:border-slate-800"
              >
                <span>{alert.linkText}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: MATRIZ DOS 9 MÓDULOS DA SUÍTE MAÎTRE CONECTA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center">
              <Layers size={16} />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Visão Consolidada dos 9 Módulos
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Ecossistema Completo de RH</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Conecta Talentos */}
          <Link
            href="/jobs"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-maitre-gold/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
                  <Briefcase size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  ● Operacional
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-maitre-gold transition-colors">
                  Conecta Talentos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ATS, Vagas, Pipeline Kanban e Fit 3D</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {activeJobs} Vagas • {totalApplications} Inscritos
              </span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Conecta Pessoas */}
          <Link
            href="/employees"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-maitre-gold/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <UserCheck size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  ● Operacional
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-maitre-gold transition-colors">
                  Conecta Pessoas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Core HR, Matrículas e Vínculos</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {totalHires} Colaboradores Ativos
              </span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. Conecta Operações */}
          <Link
            href="/operations"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                  <FileCheck size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  ● Operacional
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  Conecta Operações
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Admissão Digital, Termos & SHA-256</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {totalDocs} Documentos Seguros
              </span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Conecta Insights */}
          <Link
            href="/insights"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                  <BarChart3 size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  ● Operacional
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  Conecta Insights
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">People Analytics & Indicadores</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(totalPayroll)} Folha Gerada
              </span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 5. Conecta Desenvolvimento */}
          <Link
            href="/development"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full">
                  Fase P3
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  Conecta Desenvolvimento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Competências, 9-Box e PDI</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Ciclos de Performance</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 6. Conecta Aprendizagem */}
          <Link
            href="/learning"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-500/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold">
                  <GraduationCap size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-sky-500/15 text-sky-500 rounded-full">
                  Fase P4
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                  Conecta Aprendizagem
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">LMS, Treinamentos & Certificados</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Trilhas de Onboarding</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 7. Conecta Cultura */}
          <Link
            href="/culture"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-500/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
                  <HeartHandshake size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-500/15 text-rose-500 rounded-full">
                  Fase P4
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
                  Conecta Cultura
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Clima, eNPS e Rituais de Cultura</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Pesquisas de Pulso</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 8. Conecta Carreiras */}
          <Link
            href="/careers-hub"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-600/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Compass size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-600/15 text-amber-600 dark:text-amber-400 rounded-full">
                  Fase P3
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Conecta Carreiras
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mobilidade & Mapa de Sucessão</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Posições Críticas</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 9. Conecta Consultoria */}
          <Link
            href="/consulting"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-maitre-gold/50 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-maitre-gold/20 text-maitre-gold rounded-full">
                  Maître Prime
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-maitre-gold transition-colors">
                  Conecta Consultoria
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Hunting & Projetos Estratégicos</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Serviço Especializado</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* SEÇÃO 3: ÚLTIMAS ATIVIDADES & AUDITORIA DE TRANSAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vagas Ativas Recentes */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase size={16} className="text-maitre-gold" />
              Posições em Andamento no ATS
            </h3>
            <Link href="/jobs" className="text-xs font-bold text-maitre-gold hover:underline">
              Ver todas ({totalJobs})
            </Link>
          </div>

          <div className="space-y-3">
            {jobs.slice(0, 4).map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}/board`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 hover:border-maitre-gold/40 transition-all group"
              >
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-maitre-gold transition-colors">
                    {j.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{j.department || "Geral"}</span>
                    <span>•</span>
                    <span>{j.applications.length} candidatos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      j.status === "ACTIVE"
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {j.status === "ACTIVE" ? "Aberta" : "Pausada"}
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trilha de Auditoria & Atividades */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              Eventos Recentes do Ecossistema
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Trilha Imutável</span>
          </div>

          <div className="space-y-3">
            {recentAudits.length > 0 ? (
              recentAudits.map((aud) => (
                <div
                  key={aud.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {aud.action}
                      </span>
                      <p className="text-[10px] text-slate-400">{aud.resourceType}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(aud.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum evento recente registrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
