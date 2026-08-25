"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  ChevronRight,
  Loader2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Check,
  X,
  Star,
  Search,
  Filter,
  UserCheck,
  Building2,
  HelpCircle,
  MoreHorizontal,
  Calendar,
  Award,
} from "lucide-react";
import ApplicationActionModal from "@/components/kanban/ApplicationActionModal";
import {
  batchMoveCandidates,
  batchUpdatePriority,
  moveCandidate,
} from "@/app/(dashboard)/jobs/[id]/board/actions";
import {
  ApplicationEvaluation,
  OverallFitCategory,
  getFitBadgeStyle,
} from "@/lib/fit-evaluator";

export type TriagemCandidate = {
  id: string; // ApplicationId
  candidateId: string;
  name: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  source: string | null;
  tags: string | null;
  salaryExpectation: number | null;
  priority: string;
  stageId: string;
  stageName: string;
  enteredStageAt: Date;
  evaluation: ApplicationEvaluation;
};

export type StageOption = {
  id: string;
  name: string;
  order: number;
};

export type JobInfo = {
  id: string;
  title: string;
  department: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
};

export default function SmartTriagemTable({
  initialCandidates,
  stages,
  job,
}: {
  initialCandidates: TriagemCandidate[];
  stages: StageOption[];
  job: JobInfo;
}) {
  const [candidates, setCandidates] = useState<TriagemCandidate[]>(initialCandidates);
  const [activeTab, setActiveTab] = useState<"ALL" | OverallFitCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPerformingBatch, setIsPerformingBatch] = useState(false);
  const [batchTargetStageId, setBatchTargetStageId] = useState<string>("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<{ id: string; name: string } | null>(null);

  // Formatador de Moeda
  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // KPIs de Triagem
  const metrics = useMemo(() => {
    const total = candidates.length;
    const altoFit = candidates.filter((c) => c.evaluation.fitCategory === "ALTO_FIT").length;
    const medioFit = candidates.filter((c) => c.evaluation.fitCategory === "MEDIO_FIT").length;
    const baixoFit = candidates.filter((c) => c.evaluation.fitCategory === "BAIXO_FIT").length;
    
    // Média de pretensão
    const withSalary = candidates.filter((c) => c.salaryExpectation && c.salaryExpectation > 0);
    const avgSalary =
      withSalary.length > 0
        ? Math.round(withSalary.reduce((acc, c) => acc + (c.salaryExpectation || 0), 0) / withSalary.length)
        : null;

    return {
      total,
      altoFit,
      medioFit,
      baixoFit,
      altoFitPercent: total > 0 ? Math.round((altoFit / total) * 100) : 0,
      avgSalary,
    };
  }, [candidates]);

  // Candidatos filtrados por aba, pesquisa e etapa
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Filtro de Aba
      if (activeTab !== "ALL" && c.evaluation.fitCategory !== activeTab) {
        return false;
      }

      // Filtro de Etapa
      if (selectedStageFilter !== "ALL" && c.stageId !== selectedStageFilter) {
        return false;
      }

      // Filtro de Busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesTags = c.tags ? c.tags.toLowerCase().includes(q) : false;
        return matchesName || matchesEmail || matchesTags;
      }

      return true;
    });
  }, [candidates, activeTab, selectedStageFilter, searchQuery]);

  // Selecionar todos os visíveis
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Ação em Lote: Mover para Etapa
  const handleBatchMove = async (targetStageId: string) => {
    if (!targetStageId || selectedIds.length === 0) return;
    setIsPerformingBatch(true);

    try {
      const res = await batchMoveCandidates(selectedIds, targetStageId);
      if (res.success) {
        const targetStageName = stages.find((s) => s.id === targetStageId)?.name || "Nova Etapa";
        setCandidates((prev) =>
          prev.map((c) =>
            selectedIds.includes(c.id)
              ? { ...c, stageId: targetStageId, stageName: targetStageName }
              : c
          )
        );
        showToast(`✅ ${selectedIds.length} candidatos movidos para "${targetStageName}"!`);
        setSelectedIds([]);
        setBatchTargetStageId("");
      } else {
        alert(res.error || "Erro ao mover candidatos em lote.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
    } finally {
      setIsPerformingBatch(false);
    }
  };

  // Ação em Lote: Atualizar Prioridade
  const handleBatchPriority = async (priority: "PRIORIZADO" | "NORMAL" | "DUVIDA") => {
    if (selectedIds.length === 0) return;
    setIsPerformingBatch(true);

    try {
      const res = await batchUpdatePriority(selectedIds, priority);
      if (res.success) {
        setCandidates((prev) =>
          prev.map((c) =>
            selectedIds.includes(c.id) ? { ...c, priority } : c
          )
        );
        showToast(`⭐ Prioridade atualizada para ${selectedIds.length} candidatos!`);
        setSelectedIds([]);
      } else {
        alert(res.error || "Erro ao atualizar prioridade.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
    } finally {
      setIsPerformingBatch(false);
    }
  };

  // Mover candidato individualmente via dropdown na linha
  const handleSingleMove = async (applicationId: string, newStageId: string) => {
    try {
      const res = await moveCandidate(applicationId, newStageId);
      if (res.success) {
        const newStage = stages.find((s) => s.id === newStageId);
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === applicationId
              ? { ...c, stageId: newStageId, stageName: newStage?.name || c.stageName }
              : c
          )
        );
        showToast(`Etapa alterada com sucesso!`);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao alterar etapa.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-maitre-gold/30 flex items-center gap-3 animate-in slide-in-from-bottom-5 font-bold text-sm">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Cards de Triagem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total de Inscritos
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.total}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {job.salaryMax ? `Teto: ${formatCurrency(job.salaryMax)}` : "Faixa flexível"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles size={13} /> Alto Fit (Aprovados)
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.altoFit}{" "}
              <span className="text-xs font-bold text-slate-400">
                ({metrics.altoFitPercent}%)
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Salário & Skills compatíveis
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Médio Fit (Em Análise)
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {metrics.medioFit}
            </div>
            <span className="text-xs font-medium text-slate-500">
              Pequeno desvio ou skills parciais
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-500/20 flex items-center justify-center">
            <HelpCircle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Baixo Fit / Alertas
            </span>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
              {metrics.baixoFit}
            </div>
            <span className="text-xs font-medium text-slate-500">
              Fora do orçamento ou sem requisitos
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Abas de Fit */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Abas */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Todos</span>
              <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">
                {metrics.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ALTO_FIT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ALTO_FIT"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              <Sparkles size={13} />
              <span>Alto Fit</span>
              <span className="bg-emerald-700 dark:bg-emerald-900 text-white px-1.5 py-0.5 rounded-md text-[10px]">
                {metrics.altoFit}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("MEDIO_FIT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "MEDIO_FIT"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              }`}
            >
              <span>Médio Fit</span>
              <span className="bg-amber-700 dark:bg-amber-900 text-white px-1.5 py-0.5 rounded-md text-[10px]">
                {metrics.medioFit}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("BAIXO_FIT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "BAIXO_FIT"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}
            >
              <AlertTriangle size={13} />
              <span>Baixo Fit / Alertas</span>
              <span className="bg-red-700 dark:bg-red-900 text-white px-1.5 py-0.5 rounded-md text-[10px]">
                {metrics.baixoFit}
              </span>
            </button>
          </div>

          {/* Busca & Filtro de Etapa */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar candidato, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-maitre-gold outline-none transition-all cursor-pointer"
              >
                <option value="ALL">📍 Todas as Etapas</option>
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white dark:bg-slate-950 dark:border-slate-700 p-4 rounded-2xl shadow-2xl border border-maitre-gold/40 flex flex-wrap items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-7 h-7 rounded-full bg-maitre-gold text-slate-950 font-black text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">Selecionados</span>
          </div>

          {/* Mover para Etapa em Lote */}
          <div className="flex items-center gap-2">
            <select
              value={batchTargetStageId}
              onChange={(e) => setBatchTargetStageId(e.target.value)}
              disabled={isPerformingBatch}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
            >
              <option value="">Avançar para etapa...</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  ⏩ {st.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleBatchMove(batchTargetStageId)}
              disabled={!batchTargetStageId || isPerformingBatch}
              className="bg-maitre-gold hover:bg-maitre-gold-hover text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPerformingBatch && <Loader2 size={13} className="animate-spin" />}
              <span>Mover em Lote</span>
            </button>
          </div>

          {/* Priorizar em Lote */}
          <button
            onClick={() => handleBatchPriority("PRIORIZADO")}
            disabled={isPerformingBatch}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Star size={13} />
            <span>Priorizar</span>
          </button>

          {/* Desmarcar */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-slate-400 hover:text-white text-xs font-semibold p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabela de Candidatos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-4 pl-6 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredCandidates.length > 0 &&
                      selectedIds.length === filteredCandidates.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-maitre-gold focus:ring-maitre-gold cursor-pointer"
                  />
                </th>
                <th className="p-4">Candidato</th>
                <th className="p-4">Classificação Fit</th>
                <th className="p-4">Match de Skills</th>
                <th className="p-4">Salary Fit (Pretensão)</th>
                <th className="p-4">Etapa Atual</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredCandidates.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const badge = c.evaluation.summaryBadge;
                const salary = c.evaluation.salaryFit;
                const skills = c.evaluation.skillsMatch;
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                      isSelected ? "bg-maitre-gold/5 dark:bg-maitre-gold/10" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 pl-6">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(c.id)}
                        className="w-4 h-4 rounded border-slate-300 text-maitre-gold focus:ring-maitre-gold cursor-pointer"
                      />
                    </td>

                    {/* Candidato Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-black shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/candidates/${c.candidateId}`}
                              target="_blank"
                              className="font-bold text-slate-900 dark:text-white hover:text-maitre-gold transition-colors leading-tight line-clamp-1"
                            >
                              {c.name}
                            </Link>
                            {c.priority === "PRIORIZADO" && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                ⭐ Prioritário
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
                            <span className="truncate max-w-[150px]">{c.email}</span>
                            {c.phone && (
                              <a
                                href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:underline flex items-center gap-0.5"
                                title="Abrir WhatsApp"
                              >
                                <Phone size={11} />
                                <span>{c.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Fit Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${badge.bg} ${badge.color} ${badge.border}`}
                      >
                        {c.evaluation.fitCategory === "ALTO_FIT" && <Sparkles size={13} />}
                        {c.evaluation.fitCategory === "BAIXO_FIT" && <AlertTriangle size={13} />}
                        {badge.label}
                      </span>
                    </td>

                    {/* Skills Match */}
                    <td className="p-4">
                      <div className="w-36 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">
                            Aderência
                          </span>
                          <span
                            className={
                              skills.score >= 70
                                ? "text-emerald-600"
                                : skills.score >= 45
                                ? "text-amber-600"
                                : "text-red-500"
                            }
                          >
                            {skills.score}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              skills.score >= 70
                                ? "bg-emerald-500"
                                : skills.score >= 45
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${skills.score}%` }}
                          />
                        </div>
                        {skills.matchedSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {skills.matchedSkills.slice(0, 2).map((sk, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                {sk}
                              </span>
                            ))}
                            {skills.matchedSkills.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{skills.matchedSkills.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Salary Fit */}
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {formatCurrency(c.salaryExpectation)}
                        </div>
                        <div className="mt-0.5">
                          {salary.status === "WITHIN_BUDGET" ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check size={12} /> {salary.label}
                            </span>
                          ) : salary.status === "SLIGHTLY_ABOVE" ? (
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <HelpCircle size={12} /> {salary.label}
                            </span>
                          ) : salary.status === "OUT_OF_BUDGET" ? (
                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                              <AlertTriangle size={12} /> {salary.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {salary.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Etapa Atual & Dropdown rápido */}
                    <td className="p-4">
                      <select
                        value={c.stageId}
                        onChange={(e) => handleSingleMove(c.id, e.target.value)}
                        className="text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer transition-all"
                      >
                        {stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            📍 {st.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Ações */}
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApp({ id: c.id, name: c.name })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-maitre-gold/20 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-maitre-gold transition-colors"
                          title="Abrir Gestão de Entrevistas, Propostas e Contratação"
                        >
                          <MoreHorizontal size={14} />
                          <span>Ações</span>
                        </button>

                        {c.resumeUrl && (
                          <a
                            href={c.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Visualizar Currículo (PDF)"
                          >
                            <FileText size={16} />
                          </a>
                        )}

                        <Link
                          href={`/candidates/${c.candidateId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-maitre-gold hover:text-maitre-gold-hover hover:underline p-1"
                          title="Abrir perfil completo"
                        >
                          <span>Perfil</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UserCheck size={36} className="text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Nenhum candidato encontrado nesta visão
                      </p>
                      <p className="text-xs text-slate-400">
                        Altere os filtros de pesquisa ou selecione outra aba acima.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Action Modal */}
      {selectedApp && (
        <ApplicationActionModal
          applicationId={selectedApp.id}
          candidateName={selectedApp.name}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
