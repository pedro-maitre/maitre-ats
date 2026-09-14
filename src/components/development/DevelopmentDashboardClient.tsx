/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Target,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Scale,
  Plus,
} from "lucide-react";
import EvaluateEmployeeModal, {
  NINE_BOX_CONFIG,
} from "./EvaluateEmployeeModal";
import { updatePdiStatus, updatePdiGoalProgress } from "@/app/(dashboard)/development/actions";
import { type NineBoxPosition } from "@/lib/nineBox";

export interface EvaluationDetail {
  id: string;
  evaluationType: "MANAGER" | "SELF" | "CALIBRATION";
  evaluatorRole?: string | null;
  performanceScore: number;
  potentialScore: number;
  boxPosition: NineBoxPosition;
  competencies: Record<string, number>;
  strengths: string | null;
  improvements: string | null;
  evaluatedAt: string;
}

export interface PdiGoal {
  title: string;
  metricIndicator: string;
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  weightPercent: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "BLOCKED";
}

export interface DevelopmentEmployeeItem {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  jobTitle: string;
  department: string | null;
  organizationId: string;
  organizationName: string;
  employeeCode: string | null;
  status: string;
  hiredAt: string;
  currentEvaluation: EvaluationDetail | null;
  managerEvaluation?: EvaluationDetail | null;
  selfEvaluation?: EvaluationDetail | null;
  pdiPlans: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    category: string;
    targetDate: string | null;
    completedAt: string | null;
    goals?: PdiGoal[];
  }[];
}

interface DevelopmentDashboardClientProps {
  employees: DevelopmentEmployeeItem[];
  organizations: { id: string; name: string }[];
}

const MATRIX_GRID_POSITIONS: NineBoxPosition[][] = [
  ["ENIGMA", "FUTURE_LEADER", "TOP_TALENT"],
  ["DILEMMA", "KEY_PROFESSIONAL", "HIGH_PERFORMER"],
  ["RISK", "EFFECTIVE", "TECHNICAL_EXPERT"],
];

const COMPETENCY_LABELS: Record<string, string> = {
  leadership: "Liderança",
  communication: "Comunicação",
  execution: "Execução & Entrega",
  resilience: "Resiliência & Agilidade",
  autonomy: "Autonomia & Proatividade",
};

export default function DevelopmentDashboardClient({
  employees,
  organizations,
}: DevelopmentDashboardClientProps) {
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"9box" | "gap" | "pdi" | "succession">("9box");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [updatingGoalKey, setUpdatingGoalKey] = useState<string | null>(null);

  // Filtragem por empresa
  const filteredEmployees = employees.filter((emp) => {
    if (selectedOrgId !== "ALL" && emp.organizationId !== selectedOrgId) return false;
    return true;
  });

  // Agrupamento por quadrante do 9-Box
  const employeesByBox = (box: NineBoxPosition) => {
    return filteredEmployees.filter((emp) => {
      const pos = emp.currentEvaluation?.boxPosition || "KEY_PROFESSIONAL";
      return pos === box;
    });
  };

  const handleOpenEval = (emp: DevelopmentEmployeeItem) => {
    setSelectedEmployee({
      candidateId: emp.candidateId,
      organizationId: emp.organizationId,
      name: emp.candidateName,
      jobTitle: emp.jobTitle,
      department: emp.department,
      currentEvaluation: emp.currentEvaluation,
    });
    setIsEvalModalOpen(true);
  };

  const handleTogglePdi = async (pdiId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    await updatePdiStatus(pdiId, nextStatus);
    router.refresh();
  };

  const handleGoalProgress = async (planId: string, goalIndex: number, currentVal: number, step: number) => {
    const key = `${planId}-${goalIndex}`;
    setUpdatingGoalKey(key);
    const newVal = Math.max(0, currentVal + step);
    await updatePdiGoalProgress({
      planId,
      goalIndex,
      currentValue: newVal,
    });
    setUpdatingGoalKey(null);
    router.refresh();
  };

  // KPIs
  const totalEmployees = filteredEmployees.length;
  const topTalentsCount = employeesByBox("TOP_TALENT").length + employeesByBox("FUTURE_LEADER").length;
  const totalPdiCount = filteredEmployees.reduce((acc, emp) => acc + emp.pdiPlans.length, 0);
  const completedPdiCount = filteredEmployees.reduce(
    (acc, emp) => acc + emp.pdiPlans.filter((p) => p.status === "COMPLETED").length,
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              <TrendingUp size={13} /> Conecta Desenvolvimento
            </span>
            <span className="text-xs text-slate-400 font-semibold">• DHO & Performance 360°</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Gestão de Desempenho, 9-Box & PDI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Calibração de talentos, comparativo de consenso 90° vs 180° e planos de desenvolvimento com metas quantitativas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {organizations.length > 1 && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">🏢 Todas as Empresas</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}

          <Link
            href="/employees"
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 shrink-0"
          >
            <Users size={15} /> Base de Colaboradores
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Colaboradores Mapeados</span>
            <Users size={18} />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalEmployees}</p>
          <span className="text-xs text-slate-400 font-medium">Cadastrados no Sistema / Recrutamento</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Talents & Futuros Líderes</span>
            <Award size={18} />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{topTalentsCount}</p>
          <span className="text-xs text-slate-400 font-medium">Quadrantes de aceleração e sucessão</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Metas de PDI Ativas</span>
            <Target size={18} />
          </div>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{totalPdiCount}</p>
          <span className="text-xs text-slate-400 font-medium">Planos individuais em andamento</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-sky-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taxa de Conclusão PDI</span>
            <CheckCircle2 size={18} />
          </div>
          <p className="text-3xl font-black text-sky-600 dark:text-sky-400">
            {totalPdiCount > 0 ? `${Math.round((completedPdiCount / totalPdiCount) * 100)}%` : "0%"}
          </p>
          <span className="text-xs text-slate-400 font-medium">{completedPdiCount} de {totalPdiCount} concluídos</span>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("9box")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "9box"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers size={14} />
          <span>Matriz 9-Box (Calibração)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gap")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "gap"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Scale size={14} />
          <span>Gap Analysis (90° Auto vs 180° Gestor)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pdi")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "pdi"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Target size={14} />
          <span>Metas & OKRs de PDI ({totalPdiCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("succession")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "succession"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles size={14} />
          <span>Mapa de Sucessão</span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: MATRIZ 9-BOX
          ==================================================================== */}
      {activeTab === "9box" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" />
                Matriz 9-Box de Desempenho e Potencial
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Eixo Vertical: Potencial (1 a 5) • Eixo Horizontal: Desempenho e Entregas (1 a 5).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MATRIX_GRID_POSITIONS.flat().map((box) => {
              const cfg = NINE_BOX_CONFIG[box];
              const emps = employeesByBox(box);

              return (
                <div
                  key={box}
                  className={`p-4 rounded-2xl border ${cfg.bg} ${cfg.border} flex flex-col justify-between min-h-[190px] transition-all hover:shadow-md`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <span>{cfg.icon}</span>
                        <span>{cfg.title}</span>
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {emps.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {cfg.subtitle}
                    </p>
                  </div>

                  <div className="my-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {emps.map((emp) => (
                      <div
                        key={emp.candidateId}
                        onClick={() => handleOpenEval(emp)}
                        className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between gap-2 hover:scale-[1.02] cursor-pointer transition-all shadow-xs"
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {emp.candidateName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {emp.jobTitle} • {emp.department}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                          {emp.currentEvaluation?.performanceScore?.toFixed(1) || "—"} / {emp.currentEvaluation?.potentialScore?.toFixed(1) || "—"}
                        </span>
                      </div>
                    ))}

                    {emps.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        Nenhum colaborador neste quadrante
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 font-medium">
                    💡 <span className="font-semibold">Ação recomendada:</span> {cfg.action}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: GAP ANALYSIS (90° AUTOAVALIAÇÃO VS 180° GESTOR)
          ==================================================================== */}
      {activeTab === "gap" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Scale size={18} className="text-purple-500" />
              Gap Analysis de Competências (90° Auto vs 180° Liderança)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identificação de convergência e pontos cegos entre a percepção do próprio colaborador e a avaliação do gestor.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => {
              const mgr = emp.managerEvaluation;
              const self = emp.selfEvaluation;

              if (!mgr && !self) return null;

              const mgrScore = mgr?.performanceScore || 0;
              const selfScore = self?.performanceScore || 0;
              const gap = selfScore > 0 && mgrScore > 0 ? Number((selfScore - mgrScore).toFixed(1)) : null;

              return (
                <div
                  key={emp.candidateId}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {emp.candidateName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {emp.jobTitle} • {emp.department} • {emp.organizationName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEval(emp)}
                      className="px-3 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold transition-all border border-purple-500/20 cursor-pointer"
                    >
                      Calibrar
                    </button>
                  </div>

                  {/* Resumo de Notas e Gap */}
                  <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">👔 Gestor (180°)</span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        {mgrScore > 0 ? mgrScore.toFixed(1) : "Pendente"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">🙋 Autoavaliação (90°)</span>
                      <span className="text-base font-black text-purple-600 dark:text-purple-400">
                        {selfScore > 0 ? selfScore.toFixed(1) : "Pendente"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">⚖️ Gap de Percepção</span>
                      {gap !== null ? (
                        <span
                          className={`text-base font-black ${
                            Math.abs(gap) <= 0.5
                              ? "text-emerald-500"
                              : gap > 0.5
                              ? "text-amber-500"
                              : "text-sky-500"
                          }`}
                        >
                          {gap > 0 ? `+${gap}` : gap}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">Incompleto</span>
                      )}
                    </div>
                  </div>

                  {/* Alerta de Diagnóstico de Consenso */}
                  {gap !== null && (
                    <div
                      className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 ${
                        Math.abs(gap) <= 0.5
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : gap > 0.5
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                      }`}
                    >
                      {Math.abs(gap) <= 0.5 ? (
                        <>
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span>Excelente alinhamento: a autoavaliação coincide com a visão da liderança.</span>
                        </>
                      ) : gap > 0.5 ? (
                        <>
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>Ponto cego: colaborador se autoavalia acima da percepção do gestor. Recomendado feedback 1-on-1.</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="shrink-0" />
                          <span>Potencial subestimado: a liderança enxerga mais entrega que o próprio colaborador.</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Comparativo de Competências */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Comparativo de Competências
                    </span>
                    {Object.keys(COMPETENCY_LABELS).map((compKey) => {
                      const mgrVal = mgr?.competencies?.[compKey] || 3.0;
                      const selfVal = self?.competencies?.[compKey] || 3.0;

                      return (
                        <div key={compKey} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {COMPETENCY_LABELS[compKey]}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              Gestor: <strong className="text-indigo-600 dark:text-indigo-400">{mgrVal.toFixed(1)}</strong> | Auto: <strong className="text-purple-600 dark:text-purple-400">{selfVal.toFixed(1)}</strong>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-indigo-500 rounded-l-full"
                              style={{ width: `${(mgrVal / 5) * 50}%` }}
                              title={`Gestor: ${mgrVal}`}
                            />
                            <div
                              className="h-full bg-purple-500 rounded-r-full"
                              style={{ width: `${(selfVal / 5) * 50}%` }}
                              title={`Auto: ${selfVal}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: METAS & OKRS DE PDI
          ==================================================================== */}
      {activeTab === "pdi" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={18} className="text-indigo-500" />
              Metas de Desenvolvimento Individual (PDI) & OKRs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento de metas quantitativas, indicadores mensuráveis e status de execução.
            </p>
          </div>

          <div className="space-y-4">
            {filteredEmployees.flatMap((emp) =>
              emp.pdiPlans.map((pdi) => (
                <div
                  key={pdi.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    pdi.status === "COMPLETED"
                      ? "bg-slate-50 dark:bg-slate-900/60 border-emerald-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePdi(pdi.id, pdi.status)}
                        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          pdi.status === "COMPLETED"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent"
                        }`}
                      >
                        <Check size={13} />
                      </button>

                      <div>
                        <h4
                          className={`text-sm font-bold ${
                            pdi.status === "COMPLETED"
                              ? "line-through text-slate-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {pdi.title}
                        </h4>
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Users size={12} /> {emp.candidateName} ({emp.jobTitle} • {emp.organizationName})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {pdi.category}
                      </span>
                      {pdi.targetDate && (
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(pdi.targetDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metas Quantitativas e Indicadores Vinculados */}
                  {pdi.goals && pdi.goals.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Metas Numéricas & Indicadores de Progresso
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pdi.goals.map((goal, gIdx) => {
                          const pct = goal.targetValue > 0
                            ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                            : 0;

                          return (
                            <div
                              key={gIdx}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {goal.title || goal.metricIndicator}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                  Peso: {goal.weightPercent}%
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                <span>Métrica: {goal.metricIndicator}</span>
                                <span className="font-mono font-bold">
                                  {goal.currentValue} / {goal.targetValue} ({pct}%)
                                </span>
                              </div>

                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  disabled={updatingGoalKey === `${pdi.id}-${gIdx}` || goal.currentValue <= 0}
                                  onClick={() => handleGoalProgress(pdi.id, gIdx, goal.currentValue, -10)}
                                  className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-40"
                                >
                                  -10
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingGoalKey === `${pdi.id}-${gIdx}`}
                                  onClick={() => handleGoalProgress(pdi.id, gIdx, goal.currentValue, 10)}
                                  className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 cursor-pointer"
                                >
                                  +10
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {totalPdiCount === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Target size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhuma meta de PDI cadastrada ainda
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Abra a calibração de um colaborador na aba Matriz 9-Box para vincular metas quantitativas e capacitações.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: MAPA DE SUCESSÃO
          ==================================================================== */}
      {activeTab === "succession" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              Linha de Sucessão & Liderança
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mapeamento de talentos de alto impacto elegíveis para assunção de posições críticas e cadeiras executivas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeesByBox("TOP_TALENT").map((emp) => (
              <div
                key={emp.candidateId}
                className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Award size={14} /> Sucessor Pronto (0 a 6 meses)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Score: {emp.currentEvaluation?.performanceScore} / Potencial: {emp.currentEvaluation?.potentialScore}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {emp.candidateName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {emp.jobTitle} • {emp.department} • {emp.organizationName}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 space-y-1 border border-slate-200/50 dark:border-slate-800">
                  <span className="font-bold block text-[10px] uppercase text-slate-400">Pontos Fortes:</span>
                  <p>{emp.currentEvaluation?.strengths || "Excelente entrega técnica e maturidade profissional."}</p>
                </div>
              </div>
            ))}

            {employeesByBox("TOP_TALENT").length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                <Sparkles size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhum sucessor imediato classificado como Top Talent
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Avalie colaboradores com alto desempenho e potencial na Matriz 9-Box para estruturar a sucessão de liderança.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Avaliação 9-Box e Metas */}
      <EvaluateEmployeeModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        employee={selectedEmployee}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
