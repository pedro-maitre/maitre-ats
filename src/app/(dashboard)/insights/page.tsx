/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  PieChart,
  Target,
  Sparkles,
  ShieldCheck,
  Building2,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Insights (People Analytics) | Maître Conecta",
  description: "Indicadores estratégicos de R&S, People Analytics, Funil de Contratação e Fit 3D",
};

export default async function InsightsPage() {
  const [jobs, candidates, applications, conversions] = await Promise.all([
    prisma.job.findMany({ include: { applications: true } }),
    prisma.candidate.findMany(),
    prisma.application.findMany({ include: { stage: true, job: true } }),
    prisma.hireConversion.findMany({
      include: {
        application: {
          include: { candidate: true, job: true, offers: true },
        },
      },
    }),
  ]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
  const totalCandidates = candidates.length;
  const totalApplications = applications.length;
  const totalHires = conversions.length;

  // Taxa de conversão geral
  const conversionRate =
    totalApplications > 0 ? ((totalHires / totalApplications) * 100).toFixed(1) : "0.0";

  // Fit 3D Distribution
  const altoFitCount = applications.filter((a) => a.fitCategory === "ALTO_FIT").length;
  const medioFitCount = applications.filter((a) => a.fitCategory === "MEDIO_FIT").length;
  const baixoFitCount = applications.filter((a) => a.fitCategory === "BAIXO_FIT").length;
  const unclassifiedFit = applications.filter((a) => !a.fitCategory).length;

  // Fontes de Atração
  const sourcesMap: Record<string, number> = {};
  candidates.forEach((c) => {
    const src = c.source || "Banco de Talentos";
    sourcesMap[src] = (sourcesMap[src] || 0) + 1;
  });

  const topSources = Object.entries(sourcesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Folha Salarial Gerada
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
              <BarChart3 size={13} /> Conecta Insights
            </span>
            <span className="text-xs text-slate-400 font-semibold">• People Analytics Estratégico</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Indicadores & Inteligência de RH
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Métricas de funil de atração, velocidade de contratação, assertividade do Fit 3D e projeções salariais.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Vagas Abertas</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{activeJobs}</p>
          <span className="text-xs font-medium text-slate-400">De um total de {totalJobs} posições</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Inscrições</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalApplications}</p>
          <span className="text-xs font-medium text-slate-400">Candidaturas ativas no pipeline</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Conversão de Seleção</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{conversionRate}%</p>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> {totalHires} contratações efetivadas
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Massa Salarial Gerada</span>
            <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalPayroll)}</p>
          <span className="text-xs font-medium text-slate-400">Folha mensal das novas posições</span>
        </div>
      </div>

      {/* Gráficos & Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição do Fit 3D */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Distribuição do Fit 3D (IA & Governança)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Total: {totalApplications}</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  🟢 Alto Fit (Priorizados)
                </span>
                <span className="text-slate-900 dark:text-white">
                  {altoFitCount} ({totalApplications > 0 ? ((altoFitCount / totalApplications) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${totalApplications > 0 ? (altoFitCount / totalApplications) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  🟡 Médio Fit (Aderência Parcial)
                </span>
                <span className="text-slate-900 dark:text-white">
                  {medioFitCount} ({totalApplications > 0 ? ((medioFitCount / totalApplications) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${totalApplications > 0 ? (medioFitCount / totalApplications) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  🔴 Baixo Fit (Desvio Salarial / Skills)
                </span>
                <span className="text-slate-900 dark:text-white">
                  {baixoFitCount} ({totalApplications > 0 ? ((baixoFitCount / totalApplications) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${totalApplications > 0 ? (baixoFitCount / totalApplications) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fontes de Atração e Canais */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <PieChart size={16} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Principais Canais de Origem
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{totalCandidates} Talentos</span>
          </div>

          <div className="space-y-3">
            {topSources.map(([src, count]) => {
              const pct = totalCandidates > 0 ? ((count / totalCandidates) * 100).toFixed(0) : 0;
              return (
                <div key={src} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-maitre-gold" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{src}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{count}</span>
                    <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
