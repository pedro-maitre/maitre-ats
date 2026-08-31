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
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  Calendar,
  Filter,
  Plus,
  Check,
  ExternalLink,
  ChevronRight,
  FileCheck,
} from "lucide-react";
import EvaluateEmployeeModal, {
  NINE_BOX_CONFIG,
} from "./EvaluateEmployeeModal";
import { NineBoxPosition, updatePdiStatus } from "@/app/(dashboard)/development/actions";

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
  currentEvaluation: {
    id: string;
    performanceScore: number;
    potentialScore: number;
    boxPosition: NineBoxPosition;
    competencies: Record<string, number>;
    strengths: string | null;
    improvements: string | null;
    evaluatedAt: string;
  } | null;
  pdiPlans: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    category: string;
    targetDate: string | null;
    completedAt: string | null;
  }[];
}

interface DevelopmentDashboardClientProps {
  employees: DevelopmentEmployeeItem[];
  organizations: { id: string; name: string }[];
}

// Matriz 3x3 ordenada para renderização em grid:
// Linha 1 (Alto Potencial):   [Enigma (X=Baixo), Futuro Líder (X=Médio), Top Talent (X=Alto)]
// Linha 2 (Médio Potencial):  [Dilema (X=Baixo), Profissional Chave (X=Médio), Alto Desempenho (X=Alto)]
// Linha 3 (Baixo Potencial):  [Risco (X=Baixo), Eficaz (X=Médio), Especialista (X=Alto)]
const MATRIX_GRID_POSITIONS: NineBoxPosition[][] = [
  ["ENIGMA", "FUTURE_LEADER", "TOP_TALENT"],
  ["DILEMMA", "KEY_PROFESSIONAL", "HIGH_PERFORMER"],
  ["RISK", "EFFECTIVE", "TECHNICAL_EXPERT"],
];

export default function DevelopmentDashboardClient({
  employees,
  organizations,
}: DevelopmentDashboardClientProps) {
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"9box" | "pdi" | "succession">("9box");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

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
            <span className="text-xs text-slate-400 font-semibold">• Performance & 9-Box</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Matriz 9-Box & Gestão de PDI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Calibração de potencial e desempenho, mapeamento de sucessão e Planos de Desenvolvimento Individual.
          </p>
        </div>

        {/* Filtro por Empresa */}
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <option value="ALL">🏢 Todas as Empresas</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Colaboradores Mapeados</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalEmployees}</p>
          <span className="text-xs font-medium text-slate-400">Integrados com o Core HR</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Altos Potenciais / Líderes</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{topTalentsCount}</p>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Prontos para promoção / sucessão
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Metas de PDI Ativas</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Target size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{totalPdiCount}</p>
          <span className="text-xs font-medium text-slate-400">Planos de desenvolvimento em curso</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Evolução do Ciclo</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {totalPdiCount > 0 ? `${Math.round((completedPdiCount / totalPdiCount) * 100)}%` : "100%"}
          </p>
          <span className="text-xs font-medium text-slate-400">
            {completedPdiCount} de {totalPdiCount} metas concluídas
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("9box")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "9box"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Layers size={15} /> Matriz 9-Box Visual
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pdi")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "pdi"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Target size={15} /> Acompanhamento de PDI ({totalPdiCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("succession")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "succession"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Sparkles size={15} /> Mapa de Sucessão & Top Talents
        </button>
      </div>

      {/* TAB 1: Matriz 9-Box Grid 3x3 */}
      {activeTab === "9box" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Legenda dos Eixos */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Eixo Vertical (Y):</span>
              <span>Potencial de Liderança & Agilidade de Aprendizado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Eixo Horizontal (X):</span>
              <span>Desempenho Técnico & Entregas de Metas</span>
            </div>
          </div>

          {/* Grid 3x3 da Matriz 9-Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MATRIX_GRID_POSITIONS.flat().map((boxKey) => {
              const config = NINE_BOX_CONFIG[boxKey];
              const boxEmployees = employeesByBox(boxKey);

              return (
                <div
                  key={boxKey}
                  className={`p-5 rounded-3xl border ${config.bg} ${config.border} flex flex-col justify-between min-h-[220px] transition-all hover:shadow-lg`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{config.title}</span>
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                          {config.subtitle}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${config.bg} ${config.text} ${config.border}`}
                      >
                        {boxEmployees.length} {boxEmployees.length === 1 ? "pessoa" : "pessoas"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {config.action}
                    </p>
                  </div>

                  {/* Lista de Colaboradores no Quadrante */}
                  <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 space-y-1.5">
                    {boxEmployees.length === 0 ? (
                      <span className="text-[11px] text-slate-400 block text-center py-2">
                        Nenhum colaborador neste quadrante
                      </span>
                    ) : (
                      boxEmployees.map((emp) => (
                        <div
                          key={emp.candidateId}
                          onClick={() => handleOpenEval(emp)}
                          className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 font-bold text-[10px] flex items-center justify-center">
                              {emp.candidateName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block group-hover:text-indigo-500 transition-colors">
                                {emp.candidateName}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {emp.jobTitle}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-indigo-500">
                              {emp.currentEvaluation
                                ? `${emp.currentEvaluation.performanceScore.toFixed(1)} / ${emp.currentEvaluation.potentialScore.toFixed(1)}`
                                : "Calibrar"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Acompanhamento de PDI */}
      {activeTab === "pdi" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={18} className="text-purple-500" />
              Metas de Desenvolvimento Individual (PDI)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento de capacitações, soft skills e trilhas de liderança dos colaboradores.
            </p>
          </div>

          <div className="space-y-3">
            {filteredEmployees.flatMap((emp) =>
              emp.pdiPlans.map((pdi) => (
                <div
                  key={pdi.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    pdi.status === "COMPLETED"
                      ? "bg-slate-50 dark:bg-slate-900 border-emerald-500/30 opacity-80"
                      : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePdi(pdi.id, pdi.status)}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        pdi.status === "COMPLETED"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </button>

                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          pdi.status === "COMPLETED"
                            ? "line-through text-slate-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {pdi.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Users size={11} /> {emp.candidateName} ({emp.jobTitle} • {emp.organizationName})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {pdi.category}
                    </span>

                    {pdi.targetDate && (
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(pdi.targetDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
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
                  Abra a calibração de um colaborador na aba Matriz 9-Box para vincular planos de ação e capacitação.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Mapa de Sucessão & Top Talents */}
      {activeTab === "succession" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-500" />
              Mapeamento de Sucessão & Lideranças Futuras
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Colaboradores classificados como Top Talents e Futuros Líderes prioritários para promoção e sucessão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees
              .filter(
                (emp) =>
                  emp.currentEvaluation?.boxPosition === "TOP_TALENT" ||
                  emp.currentEvaluation?.boxPosition === "FUTURE_LEADER"
              )
              .map((emp) => (
                <div
                  key={emp.candidateId}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 font-black flex items-center justify-center">
                        {emp.candidateName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {emp.candidateName}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {emp.jobTitle} • {emp.organizationName}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {emp.currentEvaluation?.boxPosition === "TOP_TALENT" ? "⭐ Top Talent" : "🚀 Futuro Líder"}
                    </span>
                  </div>

                  {emp.currentEvaluation?.strengths && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Pontos Fortes:</strong> {emp.currentEvaluation.strengths}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Matrícula: {emp.employeeCode || "Ativo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEval(emp)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      Calibrar / PDI <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal de Calibração */}
      <EvaluateEmployeeModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        employee={selectedEmployee}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
