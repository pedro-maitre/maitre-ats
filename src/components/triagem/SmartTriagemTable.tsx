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
  Eye,
  EyeOff,
  Clock,
  MessageCircle,
  Shield,
} from "lucide-react";
import ApplicationActionModal from "@/components/kanban/ApplicationActionModal";
import ResumeSplitViewer from "@/components/candidates/ResumeSplitViewer";
import WhatsAppFeedbackModal from "@/components/feedback/WhatsAppFeedbackModal";
import EmptyState from "@/components/ui/EmptyState";
import FinalistsComparatorModal from "@/components/jobs/FinalistsComparatorModal";
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
  companyName?: string;
};

// Calcula tempo de permanência na etapa e status do SLA
function getStageSlaInfo(date: Date) {
  const diffInMs = new Date().getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  let label = `${diffInHours}h`;
  if (diffInHours >= 24) {
    label = `${diffInDays}d`;
  }

  let slaLevel: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
  if (diffInDays >= 7) {
    slaLevel = "CRITICAL";
  } else if (diffInDays >= 3) {
    slaLevel = "WARNING";
  }

  return { label, diffInDays, slaLevel };
}

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
  const [isBlindRecruitment, setIsBlindRecruitment] = useState(false);

  // Modais
  const [selectedApp, setSelectedApp] = useState<{ id: string; name: string } | null>(null);
  const [splitCandidate, setSplitCandidate] = useState<TriagemCandidate | null>(null);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<TriagemCandidate | null>(null);
  const [isComparingFinalists, setIsComparingFinalists] = useState(false);

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
      avgSalary,
    };
  }, [candidates]);

  // Toast Helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Filtros aplicados
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Filtro por Aba de Fit
      if (activeTab !== "ALL" && c.evaluation.fitCategory !== activeTab) {
        return false;
      }

      // 2. Filtro por Etapa
      if (selectedStageFilter !== "ALL" && c.stageId !== selectedStageFilter) {
        return false;
      }

      // 3. Busca por texto
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchTags = c.tags?.toLowerCase().includes(q) || false;
        const matchExplanation = c.evaluation.explanation.toLowerCase().includes(q);

        if (!matchName && !matchEmail && !matchTags && !matchExplanation) {
          return false;
        }
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

  // Toggle individual de seleção
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Ação em Lote: Mover de Etapa
  const handleBatchMove = async (targetStageId: string) => {
    if (selectedIds.length === 0 || !targetStageId) return;
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-maitre-gold/30 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} className="text-maitre-gold" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header com Indicadores Inteligentes de Triagem */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total em Triagem
            </span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {metrics.total}
            </h4>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Alto Fit (Recomendados)
            </span>
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.altoFit}
            </h4>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <HelpCircle size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Médio Fit (Avaliar)
            </span>
            <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.medioFit}
            </h4>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/10 text-maitre-gold flex items-center justify-center font-bold">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Média Pretensão
            </span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(metrics.avgSalary)}
            </h4>
          </div>
        </div>
      </div>

      {/* Abas e Filtros de Busca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Abas de Fit */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Todos ({metrics.total})
            </button>

            <button
              onClick={() => setActiveTab("ALTO_FIT")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ALTO_FIT"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <Sparkles size={14} />
              <span>Alto Fit ({metrics.altoFit})</span>
            </button>

            <button
              onClick={() => setActiveTab("MEDIO_FIT")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "MEDIO_FIT"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
              }`}
            >
              <HelpCircle size={14} />
              <span>Médio Fit ({metrics.medioFit})</span>
            </button>

            <button
              onClick={() => setActiveTab("BAIXO_FIT")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "BAIXO_FIT"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100"
              }`}
            >
              <AlertTriangle size={14} />
              <span>Baixo Fit ({metrics.baixoFit})</span>
            </button>
          </div>

          {/* Botão de Triagem Cega */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setIsBlindRecruitment(!isBlindRecruitment)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                isBlindRecruitment
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
              title="Oculta nomes e dados pessoais para avaliação focada em competências"
            >
              {isBlindRecruitment ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>Triagem Cega</span>
              {isBlindRecruitment && (
                <span className="px-1.5 py-0.2 rounded bg-purple-800 text-[10px] uppercase font-black">
                  Ativo
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, competência ou palavras do currículo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-maitre-gold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-slate-400 shrink-0" />
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="w-full sm:w-auto text-xs font-semibold py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
            >
              <option value="ALL">Todas as Etapas</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barra de Ações em Lote (Fixa ou Flutuante quando houver itens selecionados) */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-xl border border-maitre-gold/30 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-maitre-gold animate-pulse" />
            <span className="text-xs font-bold">
              {selectedIds.length} {selectedIds.length === 1 ? "candidato selecionado" : "candidatos selecionados"}
            </span>
          </div>

          {/* Mover em Lote */}
          <div className="flex items-center gap-2">
            <select
              value={batchTargetStageId}
              onChange={(e) => setBatchTargetStageId(e.target.value)}
              className="text-xs font-bold py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
            >
              <option value="">Selecionar Etapa de Destino...</option>
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

          {/* Comparar Finalistas Lado a Lado (quando 2+ selecionados) */}
          {selectedIds.length >= 2 && (
            <button
              type="button"
              onClick={() => setIsComparingFinalists(true)}
              className="bg-maitre-gold/20 hover:bg-maitre-gold/30 text-maitre-gold border border-maitre-gold/40 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Comparar candidatos selecionados lado a lado"
            >
              <Award size={14} />
              <span>Comparar Finalistas ({selectedIds.length})</span>
            </button>
          )}

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
            className="text-slate-400 hover:text-white text-xs font-semibold p-1 transition-colors cursor-pointer"
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
                <th className="p-4">Pretensão Salarial</th>
                <th className="p-4">Permanência (SLA)</th>
                <th className="p-4">Etapa Atual</th>
                <th className="p-4 text-right pr-6">Ações Rápidas</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredCandidates.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const badge = c.evaluation.summaryBadge;
                const salary = c.evaluation.salaryFit;
                const skills = c.evaluation.skillsMatch;
                const sla = getStageSlaInfo(c.enteredStageAt);

                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                const displayName = isBlindRecruitment
                  ? `Candidato #${c.candidateId.substring(0, 5).toUpperCase()}`
                  : c.name;

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
                        <div
                          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-black shrink-0 cursor-pointer hover:border-maitre-gold transition-colors"
                          onClick={() => setSplitCandidate(c)}
                          title="Abrir Currículo (Split View)"
                        >
                          {isBlindRecruitment ? <Shield size={16} className="text-purple-500" /> : initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSplitCandidate(c)}
                              className="font-bold text-slate-900 dark:text-white hover:text-maitre-gold transition-colors leading-tight line-clamp-1 text-left"
                            >
                              {displayName}
                            </button>
                            {c.priority === "PRIORIZADO" && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                ⭐ Prioritário
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
                            {isBlindRecruitment ? (
                              <span className="text-purple-500 font-semibold text-[11px]">Perfil Anonimizado</span>
                            ) : (
                              <>
                                <span className="truncate max-w-[150px]">{c.email}</span>
                                {c.phone && (
                                  <button
                                    type="button"
                                    onClick={() => setWhatsAppCandidate(c)}
                                    className="text-emerald-600 hover:underline flex items-center gap-0.5 font-semibold"
                                    title="Enviar WhatsApp 1-Click"
                                  >
                                    <Phone size={11} />
                                    <span>{c.phone}</span>
                                  </button>
                                )}
                              </>
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

                    {/* Permanência (SLA) */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          sla.slaLevel === "CRITICAL"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : sla.slaLevel === "WARNING"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <Clock size={12} />
                        <span>{sla.label}</span>
                      </span>
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

                    {/* Ações Rápidas */}
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Split View (Leitor) */}
                        <button
                          type="button"
                          onClick={() => setSplitCandidate(c)}
                          aria-label={`Visualizar currículo de ${c.name}`}
                          className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl text-slate-500 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Visualizar Currículo (Split View)"
                        >
                          <FileText size={16} />
                        </button>

                        {/* Botão WhatsApp 1-Click */}
                        {!isBlindRecruitment && c.phone && (
                          <button
                            type="button"
                            onClick={() => setWhatsAppCandidate(c)}
                            aria-label={`Enviar feedback WhatsApp para ${c.name}`}
                            className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Mensagem WhatsApp 1-Click"
                          >
                            <MessageCircle size={16} />
                          </button>
                        )}

                        {/* Mais Ações */}
                        <button
                          type="button"
                          onClick={() => setSelectedApp({ id: c.id, name: c.name })}
                          aria-label={`Gerenciar entrevistas e propostas para ${c.name}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-maitre-gold/20 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-maitre-gold transition-colors"
                          title="Abrir Gestão de Entrevistas, Propostas e Contratação"
                        >
                          <MoreHorizontal size={14} />
                          <span>Ações</span>
                        </button>

                        <Link
                          href={`/candidates/${c.candidateId}`}
                          target="_blank"
                          aria-label={`Abrir perfil completo de ${c.name}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-maitre-gold hover:text-maitre-gold-hover hover:underline p-1"
                          title="Abrir perfil completo"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      icon={UserCheck}
                      title="Nenhum candidato encontrado nesta visão"
                      description="Altere os filtros de pesquisa ou selecione outra aba de avaliação."
                      actionLabel="Limpar Filtros"
                      onAction={() => {
                        setSearchQuery("");
                        setActiveTab("ALL");
                        setSelectedStageFilter("ALL");
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Viewer Modal */}
      {splitCandidate && (
        <ResumeSplitViewer
          isOpen={!!splitCandidate}
          onClose={() => setSplitCandidate(null)}
          candidate={{
            id: splitCandidate.id,
            candidateId: splitCandidate.candidateId,
            name: splitCandidate.name,
            email: splitCandidate.email,
            phone: splitCandidate.phone,
            resumeUrl: splitCandidate.resumeUrl,
            linkedinUrl: splitCandidate.linkedinUrl,
            source: splitCandidate.source,
            tags: splitCandidate.tags,
            salaryExpectation: splitCandidate.salaryExpectation,
            priority: splitCandidate.priority,
            stageName: splitCandidate.stageName,
            evaluation: splitCandidate.evaluation,
          }}
          jobTitle={job.title}
          companyName={job.companyName || "Maître Conecta"}
          onOpenActionsModal={(appId, name) => setSelectedApp({ id: appId, name })}
        />
      )}

      {/* WhatsApp Feedback Modal Oficial (23 Templates) */}
      {whatsAppCandidate && (
        <WhatsAppFeedbackModal
          isOpen={!!whatsAppCandidate}
          onClose={() => setWhatsAppCandidate(null)}
          applicationId={whatsAppCandidate.id}
          candidate={{
            id: whatsAppCandidate.candidateId,
            firstName: whatsAppCandidate.name.split(" ")[0],
            lastName: whatsAppCandidate.name.split(" ").slice(1).join(" ") || "",
            phone: whatsAppCandidate.phone,
            email: whatsAppCandidate.email,
          }}
          job={{
            id: job.id,
            title: job.title,
            organizationName: job.companyName || "Maître Conecta",
          }}
          stageName={whatsAppCandidate.stageName || "Triagem Inteligente"}
          defaultTemplateId={
            whatsAppCandidate.evaluation?.fitCategory === "BAIXO_FIT"
              ? "curriculo-nao-selecionado"
              : whatsAppCandidate.evaluation?.fitCategory === "ALTO_FIT"
              ? "aprovacao-proxima-etapa"
              : "candidatura-em-analise"
          }
        />
      )}

      {/* Enterprise Action Modal */}
      {selectedApp && (
        <ApplicationActionModal
          applicationId={selectedApp.id}
          candidateName={selectedApp.name}
          onClose={() => setSelectedApp(null)}
        />
      )}

      {/* Finalists Comparator Modal */}
      {isComparingFinalists && (
        <FinalistsComparatorModal
          isOpen={isComparingFinalists}
          onClose={() => setIsComparingFinalists(false)}
          candidates={candidates
            .filter((c) => selectedIds.includes(c.id))
            .slice(0, 4)}
          jobTitle={job.title}
          companyName={job.companyName || "Maître Conecta"}
          onOpenActionsModal={(appId, name) => {
            setIsComparingFinalists(false);
            setSelectedApp({ id: appId, name });
          }}
        />
      )}
    </div>
  );
}
