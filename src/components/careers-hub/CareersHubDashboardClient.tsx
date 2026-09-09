"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Users,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  UserCheck,
  Sparkles,
  AlertTriangle,
  X,
  Loader2,
  Award,
  Layers,
  Briefcase,
  GitFork,
  Target,
  FileText,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  createSuccessionPlan,
  addSuccessorCandidate,
  updateSuccessorReadiness,
  applyInternalJob,
  reviewInternalApplication,
  createCareerTrack,
} from "@/app/(dashboard)/careers-hub/actions";
import { checkInternalJobEligibility, getDefaultYCareerTrack } from "@/lib/mobility";

interface CareersHubDashboardClientProps {
  initialPlans: any[];
  organizations: Array<{ id: string; name: string; slug: string }>;
  jobs?: any[];
  employees?: any[];
  initialApplications?: any[];
  initialTracks?: any[];
  isAdmin: boolean;
}

export default function CareersHubDashboardClient({
  initialPlans,
  organizations,
  jobs = [],
  employees = [],
  initialApplications = [],
  initialTracks = [],
  isAdmin,
}: CareersHubDashboardClientProps) {
  const [plans, setProjects] = useState<any[]>(initialPlans);
  const [internalApps, setInternalApps] = useState<any[]>(initialApplications);
  const [careerTracks, setCareerTracks] = useState<any[]>(initialTracks);
  const [activeTab, setActiveTab] = useState<"succession" | "mobility" | "tracks">("succession");

  const [selectedOrgFilter, setSelectedOrgFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSuccessorModalOpen, setIsAddSuccessorModalOpen] = useState(false);
  const [selectedPlanForSuccessor, setSelectedPlanForSuccessor] = useState<any | null>(null);

  // Estados de Mobilidade Interna
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<any | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || "");
  const [coverLetter, setCoverLetter] = useState("");
  const [eligibilityCheck, setEligibilityCheck] = useState<any | null>(null);

  // Estados de Trilha em Y
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackTitle, setTrackTitle] = useState("Engenharia de Software & Sistemas");
  const [trackType, setTrackType] = useState("Y_DUAL");
  const [trackDescription, setTrackDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states para criação de Plano de Sucessão
  const [positionTitle, setPositionTitle] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [currentHolderName, setCurrentHolderName] = useState("");
  const [criticalityLevel, setCriticalityLevel] = useState("HIGH");
  const [riskOfLoss, setRiskOfLoss] = useState("MEDIUM");
  const [impactOfLoss, setImpactOfLoss] = useState("HIGH");
  const [notes, setNotes] = useState("");
  const [initialSuccessorName, setInitialSuccessorName] = useState("");
  const [initialReadiness, setInitialReadiness] = useState("READY_1_2_YEARS");

  // Form states para adicionar Sucessor a um plano existente
  const [succName, setSuccName] = useState("");
  const [succEmail, setSuccEmail] = useState("");
  const [succRole, setSuccRole] = useState("");
  const [succReadiness, setSuccReadiness] = useState("READY_NOW");
  const [succActions, setSuccActions] = useState("");

  const filtered = plans.filter((p) => {
    return selectedOrgFilter === "ALL" || p.organizationId === selectedOrgFilter;
  });

  const totalPositions = plans.length;
  const criticalCount = plans.filter((p) => p.criticalityLevel === "CRITICAL").length;
  const totalSuccessors = plans.reduce((acc, p) => acc + (p.successors?.length || 0), 0);
  const readyNowCount = plans.reduce(
    (acc, p) => acc + (p.successors?.filter((s: any) => s.readiness === "READY_NOW").length || 0),
    0
  );

  const getReadinessBadge = (readiness: string) => {
    switch (readiness) {
      case "READY_NOW":
        return { label: "Pronto Imediato (0-3 meses)", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      case "READY_1_2_YEARS":
        return { label: "Pronto em 1 a 2 anos", bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
      case "READY_3_PLUS":
        return { label: "Médio / Longo Prazo (3+ anos)", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      case "EMERGENCY_BACKUP":
        return { label: "Backup Emergencial", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      default:
        return { label: readiness, bg: "bg-slate-800 text-slate-400 border-slate-700" };
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("positionTitle", positionTitle);
      formData.append("organizationId", organizationId);
      formData.append("currentHolderName", currentHolderName);
      formData.append("criticalityLevel", criticalityLevel);
      formData.append("riskOfLoss", riskOfLoss);
      formData.append("impactOfLoss", impactOfLoss);
      formData.append("notes", notes);
      formData.append("successorName", initialSuccessorName);
      formData.append("readiness", initialReadiness);

      const res = await createSuccessionPlan(formData);
      if (!res.success) throw new Error(res.error);

      setFeedback({ type: "success", text: "Plano de sucessão mapeado com sucesso!" });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForSuccessor) return;
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("employeeName", succName);
      formData.append("employeeEmail", succEmail);
      formData.append("currentRole", succRole);
      formData.append("readiness", succReadiness);
      formData.append("developmentActions", succActions);

      const res = await addSuccessorCandidate(selectedPlanForSuccessor.id, formData);
      if (!res.success) throw new Error(res.error);

      setFeedback({ type: "success", text: "Sucessor adicionado à cadeira com sucesso!" });
      setIsAddSuccessorModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handler de Simulação de Elegibilidade
  const handleSelectEmployeeForApply = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const result = checkInternalJobEligibility(emp);
      setEligibilityCheck(result);
    } else {
      setEligibilityCheck(null);
    }
  };

  // Handler de Candidatura Interna
  const handleApplyInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForApply || !selectedEmployeeId) return;
    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("jobId", selectedJobForApply.id);
    formData.append("employeeId", selectedEmployeeId);
    formData.append("coverLetter", coverLetter);

    try {
      const res = await applyInternalJob(formData);
      if (res.success && res.application) {
        const emp = employees.find((e) => e.id === selectedEmployeeId);
        const newApp = {
          ...res.application,
          job: selectedJobForApply,
          employee: emp,
        };
        setInternalApps((prev) => [newApp, ...prev]);
        setFeedback({
          type: "success",
          text: res.warning
            ? `Candidatura enviada com ressalvas: ${res.warning}`
            : "Candidatura interna submetida com sucesso! Elegibilidade confirmada.",
        });
        setIsApplyModalOpen(false);
        setCoverLetter("");
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao registrar candidatura." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro inesperado ao registrar candidatura." });
    } finally {
      setLoading(false);
    }
  };

  // Handler de Revisão de Candidatura Interna
  const handleReviewApp = async (appId: string, newStatus: string) => {
    setLoading(true);
    try {
      const res = await reviewInternalApplication(appId, newStatus, `Atualizado via painel para ${newStatus}`);
      if (res.success) {
        setInternalApps((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        setFeedback({ type: "success", text: `Candidatura atualizada para ${newStatus} com sucesso!` });
      } else {
        setFeedback({ type: "error", text: res.error || "Falha ao atualizar status." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao atualizar candidatura." });
    } finally {
      setLoading(false);
    }
  };

  // Handler de Criação de Trilha em Y
  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("organizationId", organizationId);
    formData.append("title", trackTitle);
    formData.append("trackType", trackType);
    formData.append("description", trackDescription);

    try {
      const res = await createCareerTrack(formData);
      if (res.success && res.track) {
        setCareerTracks((prev) => [res.track, ...prev]);
        setFeedback({ type: "success", text: "Trilha de Carreira em Y criada com sucesso!" });
        setIsTrackModalOpen(false);
        setTrackDescription("");
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao criar trilha." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao criar trilha de carreira." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider border border-violet-500/30">
              <Compass size={13} /> Conecta Carreiras
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Mobilidade Interna & Sucessão</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Sucessão, Recrutamento Interno & Carreiras em Y
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Mapeie sucessores para posições críticas, promova a mobilidade interna com elegibilidade e estruture progressões de carreira.
          </p>
        </div>

        {/* Botão de Criação dinâmico por Aba */}
        <div className="flex items-center gap-2.5">
          {activeTab === "succession" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>Mapear Cadeira Crítica</span>
            </button>
          )}

          {activeTab === "tracks" && (
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>Criar Trilha em Y</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação de Abas do Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("succession")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "succession"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Target size={15} /> Planos de Sucessão ({plans.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mobility")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "mobility"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Briefcase size={15} /> Mobilidade Interna ({jobs.length} vagas)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tracks")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "tracks"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <GitFork size={15} /> Trilhas de Carreira em Y ({careerTracks.length})
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ABA 1: PLANOS DE SUCESSÃO (EXISTENTE) */}
      {activeTab === "succession" && (
        <div className="space-y-8 animate-in fade-in">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cadeiras Mapeadas</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalPositions}</p>
          <span className="text-xs font-medium text-slate-400">Posições monitoradas</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cadeiras Críticas (Alta Relevância)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{criticalCount}</p>
          <span className="text-xs font-medium text-rose-400">Impacto vital no negócio</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sucessores no Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalSuccessors}</p>
          <span className="text-xs font-medium text-cyan-400">Talentos mapeados</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Prontos Agora (0-3 meses)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{readyNowCount}</p>
          <span className="text-xs font-medium text-emerald-400">Assunção imediata</span>
        </div>
      </div>

      {/* Filtro por Organização */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">Filtrar por Empresa:</span>
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
          >
            <option value="ALL">Todas as Empresas</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Cadeiras de Sucessão */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Compass size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma cadeira crítica mapeada ainda
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Comece mapeando os cargos essenciais da liderança e identificando os potenciais sucessores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header da Cadeira */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-violet-400 flex items-center gap-1">
                        <Building2 size={12} />
                        {plan.organization?.name || "Empresa"}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {plan.positionTitle}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                      plan.criticalityLevel === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                    }`}
                  >
                    {plan.criticalityLevel === "CRITICAL" ? "Crítico" : "Relevante"}
                  </span>
                </div>

                {/* Ocupante Atual & Riscos */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 my-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Titular Atual
                    </span>
                    <strong className="text-slate-900 dark:text-white mt-0.5 block truncate">
                      {plan.currentHolderName || "Vaga em Aberto"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Risco de Saída / Vazio
                    </span>
                    <span className="text-amber-500 font-bold mt-0.5 block">
                      {plan.riskOfLoss === "HIGH" ? "Alto Risco" : "Risco Moderado"}
                    </span>
                  </div>
                </div>

                {/* Lista de Sucessores */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Linha Sucessória ({plan.successors?.length || 0})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanForSuccessor(plan);
                        setIsAddSuccessorModalOpen(true);
                      }}
                      className="text-violet-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Adicionar Sucessor</span>
                    </button>
                  </div>

                  {(!plan.successors || plan.successors.length === 0) ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
                      ⚠️ Cadeira desprotegida: Nenhum sucessor mapeado para este cargo.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plan.successors.map((succ: any) => {
                        const badge = getReadinessBadge(succ.readiness);
                        return (
                          <div
                            key={succ.id}
                            className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {succ.employeeName}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {succ.currentRole || "Função atual"}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 text-center ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé com Ações */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Criado em {new Date(plan.createdAt).toLocaleDateString("pt-BR")}</span>
                <Link
                  href="/development"
                  className="text-violet-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Conectar ao PDI</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

      {/* Modal Mapear Nova Cadeira Crítica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Mapear Cadeira Crítica de Sucessão
                </h3>
                <p className="text-xs text-slate-400">
                  Identifique a posição estratégica e os riscos associados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal de mapeamento de cadeira crítica"
                className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Empresa *
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Título do Cargo / Cadeira *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Diretor de Tecnologia (CTO) ou Head de R&S"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Titular Atual
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do ocupante"
                    value={currentHolderName}
                    onChange={(e) => setCurrentHolderName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Criticidade
                  </label>
                  <select
                    value={criticalityLevel}
                    onChange={(e) => setCriticalityLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  >
                    <option value="CRITICAL">Crítico (Vital)</option>
                    <option value="HIGH">Alta Relevância</option>
                    <option value="MEDIUM">Média</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Primeiro Sucessor Mapeado (Opcional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nome do colaborador"
                    value={initialSuccessorName}
                    onChange={(e) => setInitialSuccessorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  />
                  <select
                    value={initialReadiness}
                    onChange={(e) => setInitialReadiness(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  >
                    <option value="READY_NOW">Pronto Agora (0-3 meses)</option>
                    <option value="READY_1_2_YEARS">Pronto em 1-2 Anos</option>
                    <option value="READY_3_PLUS">3+ Anos</option>
                    <option value="EMERGENCY_BACKUP">Backup Emergencial</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Salvar Cadeira</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Sucessor */}
      {isAddSuccessorModalOpen && selectedPlanForSuccessor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Adicionar Sucessor
                </h3>
                <p className="text-xs text-slate-400">
                  Cadeira: <strong className="text-violet-400">{selectedPlanForSuccessor.positionTitle}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSuccessorModalOpen(false)}
                aria-label="Fechar modal de adicionar sucessor"
                className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSuccessor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Nome do Colaborador *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedro Henrique Silva"
                  value={succName}
                  onChange={(e) => setSuccName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    E-mail do Colaborador
                  </label>
                  <input
                    type="email"
                    placeholder="pedro@empresa.com"
                    value={succEmail}
                    onChange={(e) => setSuccEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Cargo / Posição Atual
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tech Recruiter Pleno"
                    value={succRole}
                    onChange={(e) => setSuccRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Nível de Prontidão (Timeline de Sucessão)
                </label>
                <select
                  value={succReadiness}
                  onChange={(e) => setSuccReadiness(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                >
                  <option value="READY_NOW">🟢 Pronto Agora (Capacidade imediata, 0 a 3 meses)</option>
                  <option value="READY_1_2_YEARS">🔵 Pronto em 1 a 2 anos (Necessita capacitação acelerada)</option>
                  <option value="READY_3_PLUS">🟣 Médio a Longo Prazo (3+ anos de maturação)</option>
                  <option value="EMERGENCY_BACKUP">🟠 Backup Emergencial de Continuidade</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Ações de Desenvolvimento Recomendadas (PDI)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Treinamento em Liderança Executiva, Mentoria com Diretoria..."
                  value={succActions}
                  onChange={(e) => setSuccActions(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSuccessorModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Adicionar Sucessor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE CANDIDATURA INTERNA & VALIDAÇÃO DE ELEGIBILIDADE */}
      {isApplyModalOpen && selectedJobForApply && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-violet-500" />
                  Candidatura a Vaga Interna
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Vaga: {selectedJobForApply.title}</p>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyInternal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Selecione o Colaborador Candidato *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleSelectEmployeeForApply(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.position?.title || "Colaborador"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prévia de Elegibilidade em Tempo Real */}
              {eligibilityCheck && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    eligibilityCheck.isEligible
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {eligibilityCheck.isEligible ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{eligibilityCheck.isEligible ? "Elegibilidade Aprovada" : "Inconsistência de Elegibilidade"}</span>
                  </div>
                  <ul className="text-[11px] list-disc list-inside space-y-1">
                    {eligibilityCheck.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/20">
                    Tempo de empresa: {eligibilityCheck.currentTenureMonths} meses (mín. 6m exigido)
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Carta de Motivação / Justificativa de Mobilidade
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique suas motivações para esta oportunidade e suas principais contribuições esperadas..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Confirmar Candidatura</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE TRILHA EM Y */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GitFork size={20} className="text-violet-500" />
                  Cadastrar Trilha de Carreira em Y
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Defina a progressão para uma área técnica ou corporativa</p>
              </div>
              <button onClick={() => setIsTrackModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTrack} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Empresa / Organização *
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Título da Trilha *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Engenharia de Software, DHO, Vendas..."
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Descrição da Trilha
                </label>
                <textarea
                  rows={2}
                  placeholder="Objetivos e escopo da progressão funcional em Y..."
                  value={trackDescription}
                  onChange={(e) => setTrackDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Criar Trilha em Y</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
