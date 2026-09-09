"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  Smile,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  Send,
  CheckCircle2,
  TrendingUp,
  Users,
  ShieldCheck,
  Plus,
  BarChart3,
  Flame,
  Building2,
  ListTodo,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  submitSurveyResponse,
  postRecognition,
  likeRecognition,
  createActionPlan,
  updateActionPlanStatus,
} from "@/app/(dashboard)/culture/actions";

export interface SurveyItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  responsesCount: number;
}

export interface ResponseItem {
  id: string;
  department: string | null;
  npsScore: number;
  dimensionScores: {
    leadership?: number;
    communication?: number;
    recognition?: number;
    workload?: number;
    strategy?: number;
  };
  feedback: string | null;
  respondedAt: string;
}

export interface RecognitionItem {
  id: string;
  senderName: string;
  receiverName: string;
  receiverDepartment: string | null;
  valuePillar: string;
  message: string;
  likesCount: number;
  createdAt: string;
}

export interface CultureActionPlanItem {
  id: string;
  surveyId: string | null;
  dimension: string;
  title: string;
  description: string;
  ownerName: string;
  targetDate: string;
  status: string;
  progressPercent: number;
  createdAt: string;
}

interface CultureDashboardClientProps {
  activeSurvey: SurveyItem | null;
  responses: ResponseItem[];
  recognitions: RecognitionItem[];
  actionPlans?: CultureActionPlanItem[];
  departmentsMaskedCount?: number;
  isKAnonymized?: boolean;
  canManage: boolean;
  organizations?: Array<{ id: string; name: string }>;
  currentOrgId?: string;
}

const PILLAR_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  INOVACAO: {
    label: "Inovação",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: "💡",
  },
  EXCELENCIA: {
    label: "Excelência",
    color: "text-maitre-gold",
    bg: "bg-maitre-gold/10",
    border: "border-maitre-gold/30",
    icon: "⭐",
  },
  COLABORACAO: {
    label: "Colaboração",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "🤝",
  },
  FOCO_NO_CLIENTE: {
    label: "Foco no Cliente",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "🎯",
  },
  RESPEITO: {
    label: "Respeito & Empatia",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: "❤️",
  },
};

const DIMENSION_LABELS: Record<string, string> = {
  leadership: "Liderança & Apoio ao Desenvolvimento",
  communication: "Comunicação Interna & Transparência",
  recognition: "Reconhecimento & Valorização",
  workload: "Equilíbrio & Bem-Estar (Workload)",
  strategy: "Alinhamento com a Estratégia",
};

export default function CultureDashboardClient({
  activeSurvey,
  responses,
  recognitions: initialRecognitions,
  actionPlans: initialActionPlans = [],
  departmentsMaskedCount = 0,
  isKAnonymized = false,
  canManage,
  organizations = [],
  currentOrgId = "",
}: CultureDashboardClientProps) {
  const [selectedOrg, setSelectedOrg] = useState(currentOrgId || (organizations[0]?.id || ""));
  const [activeTab, setActiveTab] = useState<
    "overview" | "mural" | "survey" | "comments" | "action_plans"
  >("overview");
  const [recognitions, setRecognitions] = useState(initialRecognitions);
  const [actionPlans, setActionPlans] = useState<CultureActionPlanItem[]>(initialActionPlans);
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>("ALL");

  // Estado do modal de reconhecimento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverDepartment, setReceiverDepartment] = useState("");
  const [valuePillar, setValuePillar] = useState("EXCELENCIA");
  const [message, setMessage] = useState("");
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);
  const [recSuccess, setRecSuccess] = useState(false);

  // Estado do formulário de resposta à pesquisa
  const [formNps, setFormNps] = useState<number | null>(null);
  const [formDepartment, setFormDepartment] = useState("Tecnologia");
  const [formDimLeadership, setFormDimLeadership] = useState(4);
  const [formDimCommunication, setFormDimCommunication] = useState(4);
  const [formDimRecognition, setFormDimRecognition] = useState(4);
  const [formDimWorkload, setFormDimWorkload] = useState(4);
  const [formDimStrategy, setFormDimStrategy] = useState(4);
  const [formFeedback, setFormFeedback] = useState("");
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  // Estado de criação de Plano de Ação (T-15)
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  const [newPlanDimension, setNewPlanDimension] = useState("communication");
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newPlanOwner, setNewPlanOwner] = useState("Gente & Gestão (DHO)");
  const [newPlanDate, setNewPlanDate] = useState("2026-10-30");
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  // Cálculo de eNPS
  const totalResponses = responses.length;
  const promoters = responses.filter((r) => r.npsScore >= 9).length;
  const passives = responses.filter((r) => r.npsScore >= 7 && r.npsScore <= 8).length;
  const detractors = responses.filter((r) => r.npsScore <= 6).length;

  const pctPromoters =
    totalResponses > 0 ? Math.round((promoters / totalResponses) * 100) : 0;
  const pctPassives =
    totalResponses > 0 ? Math.round((passives / totalResponses) * 100) : 0;
  const pctDetractors =
    totalResponses > 0 ? Math.round((detractors / totalResponses) * 100) : 0;
  const enpsScore = pctPromoters - pctDetractors;

  // Zona de classificação de eNPS
  let zoneLabel = "Zona de Aperfeiçoamento";
  let zoneColor = "text-amber-500 bg-amber-500/10 border-amber-500/30";
  if (enpsScore >= 75) {
    zoneLabel = "Zona de Excelência";
    zoneColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  } else if (enpsScore >= 50) {
    zoneLabel = "Zona de Qualidade";
    zoneColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
  } else if (enpsScore < 0) {
    zoneLabel = "Zona Crítica";
    zoneColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
  }

  // Médias de dimensões de clima
  const calcAvg = (field: keyof ResponseItem["dimensionScores"]) => {
    const valid = responses
      .map((r) => r.dimensionScores[field])
      .filter((v): v is number => typeof v === "number");
    if (valid.length === 0) return "4.0";
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
  };

  const avgLeadership = calcAvg("leadership");
  const avgCommunication = calcAvg("communication");
  const avgRecognition = calcAvg("recognition");
  const avgWorkload = calcAvg("workload");
  const avgStrategy = calcAvg("strategy");

  // Handler de Curtir Reconhecimento
  const handleLike = async (id: string) => {
    setRecognitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likesCount: r.likesCount + 1 } : r))
    );
    try {
      await likeRecognition(id);
    } catch {
      // rollback silencioso se necessário
    }
  };

  // Handler de Enviar Reconhecimento
  const handleSendRecognition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim() || !message.trim()) return;

    setIsSubmittingRec(true);
    try {
      const res = await postRecognition({
        receiverName: receiverName.trim(),
        receiverDepartment: receiverDepartment.trim() || undefined,
        valuePillar,
        message: message.trim(),
      });

      if (res.success && res.recognition) {
        setRecognitions([
          {
            id: res.recognition.id,
            senderName: res.recognition.senderName,
            receiverName: res.recognition.receiverName,
            receiverDepartment: res.recognition.receiverDepartment,
            valuePillar: res.recognition.valuePillar,
            message: res.recognition.message,
            likesCount: res.recognition.likesCount,
            createdAt: res.recognition.createdAt.toISOString(),
          },
          ...recognitions,
        ]);
        setRecSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setRecSuccess(false);
          setReceiverName("");
          setReceiverDepartment("");
          setMessage("");
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao publicar reconhecimento.");
    } finally {
      setIsSubmittingRec(false);
    }
  };

  // Handler de Enviar Pesquisa de Clima
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formNps === null || !activeSurvey) {
      alert("Por favor, selecione sua nota de recomendação de 0 a 10.");
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      const res = await submitSurveyResponse({
        surveyId: activeSurvey.id,
        department: formDepartment,
        npsScore: formNps,
        dimensionScores: {
          leadership: formDimLeadership,
          communication: formDimCommunication,
          recognition: formDimRecognition,
          workload: formDimWorkload,
          strategy: formDimStrategy,
        },
        feedback: formFeedback,
      });

      if (res.success) {
        setSurveySubmitted(true);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao submeter resposta.");
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  // Handler de Criar Plano de Ação
  const handleCreateActionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim() || !newPlanDescription.trim()) return;

    setIsSubmittingPlan(true);
    try {
      const res = await createActionPlan({
        surveyId: activeSurvey?.id,
        dimension: newPlanDimension,
        title: newPlanTitle,
        description: newPlanDescription,
        ownerName: newPlanOwner,
        targetDate: newPlanDate,
        organizationId: selectedOrg,
      });

      if (res.success && res.plan) {
        const item: CultureActionPlanItem = {
          id: res.plan.id,
          surveyId: res.plan.surveyId,
          dimension: res.plan.dimension,
          title: res.plan.title,
          description: res.plan.description || "",
          ownerName: res.plan.ownerName,
          targetDate: res.plan.targetDate ? res.plan.targetDate.toISOString() : new Date().toISOString(),
          status: res.plan.status,
          progressPercent: 0,
          createdAt: res.plan.createdAt.toISOString(),
        };
        setActionPlans([item, ...actionPlans]);
        setIsActionPlanModalOpen(false);
        setNewPlanTitle("");
        setNewPlanDescription("");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao criar Plano de Ação.");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handler de Atualizar Progresso do Plano de Ação
  const handleStepActionPlan = async (planId: string, currentProgress: number, step: number) => {
    const nextProgress = Math.max(0, Math.min(100, currentProgress + step));
    const nextStatus = nextProgress >= 100 ? "DONE" : nextProgress > 0 ? "IN_PROGRESS" : "PLANNED";

    try {
      const res = await updateActionPlanStatus({
        actionPlanId: planId,
        status: nextStatus,
      });

      if (res.success && res.plan) {
        setActionPlans((prev) =>
          prev.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  progressPercent: nextProgress,
                  status: res.plan.status,
                }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar plano.");
    }
  };

  // Filtragem de reconhecimentos por pilar
  const filteredRecognitions = recognitions.filter((r) => {
    if (selectedPillarFilter === "ALL") return true;
    return r.valuePillar === selectedPillarFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
              <HeartHandshake size={13} /> Conecta Cultura & eNPS
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
              <ShieldCheck size={13} /> Protegido por K-Anonimato (k ≥ 5)
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Clima, Engajamento & Rituais de Cultura
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Termômetro contínuo da equipe, eNPS corporativo, mural de reconhecimento entre pares e planos de ação para pontos críticos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {organizations && organizations.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 px-3 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Building2 size={14} className="text-rose-500" />
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

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-maitre-gold/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles size={14} /> Elogiar um Colega
          </button>
        </div>
      </div>

      {/* BANNER DE PRIVACIDADE LGPD / K-ANONIMATO (T-15) */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              Conformidade Estrita com LGPD & K-Anonimato Corporativo
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl leading-relaxed">
              Para proteger os colaboradores contra qualquer tipo de viés ou retaliação gerencial, respostas de setores com menos de 5 respondentes são automaticamente mascaradas e agregadas sob <strong>"Outros / Protegido por K-Anonimato"</strong>.
            </p>
          </div>
        </div>

        {departmentsMaskedCount > 0 && (
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold whitespace-nowrap self-start sm:self-center">
            {departmentsMaskedCount} setor(es) protegido(s)
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Score eNPS</span>
            <TrendingUp size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {enpsScore > 0 ? `+${enpsScore}` : enpsScore}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${zoneColor}`}>
              {zoneLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {pctPromoters}% Promotores • {pctDetractors}% Detratores
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-maitre-gold">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clima Médio Geral</span>
            <Smile size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {((parseFloat(avgLeadership) + parseFloat(avgCommunication) + parseFloat(avgRecognition) + parseFloat(avgWorkload) + parseFloat(avgStrategy)) / 5).toFixed(1)} / 5.0
          </div>
          <p className="text-xs text-slate-400 font-medium">Consolidado das 5 dimensões avaliadas.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Planos de Ação (DHO)</span>
            <ListTodo size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {actionPlans.length}
          </div>
          <p className="text-xs text-slate-400 font-medium">Iniciativas para sanar vulnerabilidades de clima.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Respondentes</span>
            <Users size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalResponses}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            100% anônimas e protegidas por K-Anonimato.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 size={16} /> Diagnóstico de Clima
        </button>
        <button
          onClick={() => setActiveTab("action_plans")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "action_plans"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ListTodo size={16} /> Planos de Ação ({actionPlans.length})
        </button>
        <button
          onClick={() => setActiveTab("mural")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "mural"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles size={16} /> Mural de Reconhecimento ({recognitions.length})
        </button>
        <button
          onClick={() => setActiveTab("survey")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "survey"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Smile size={16} /> Responder Pesquisa de Pulso
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "comments"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MessageSquare size={16} /> Feedbacks Qualitativos ({responses.filter((r) => r.feedback).length})
        </button>
      </div>

      {/* TAB 1: DIAGNÓSTICO DE CLIMA */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Dimensões de Clima Organizacional (Escala 1 a 5)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Média consolidada calculada através das respostas anônimas da equipe no ciclo ativo.
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      setIsActionPlanModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Novo Plano de Ação
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {[
                  { key: "leadership", label: "Liderança & Apoio ao Desenvolvimento", val: avgLeadership, desc: "Acessibilidade e direcionamento da gestão direta" },
                  { key: "communication", label: "Comunicação Interna & Transparência", val: avgCommunication, desc: "Clareza nos fluxos de informação entre áreas" },
                  { key: "recognition", label: "Reconhecimento & Valorização", val: avgRecognition, desc: "Sentimento de justiça e elogio pelo trabalho entregue" },
                  { key: "workload", label: "Equilíbrio & Bem-Estar (Workload)", val: avgWorkload, desc: "Saúde mental e carga de trabalho equilibrada" },
                  { key: "strategy", label: "Alinhamento com a Estratégia", val: avgStrategy, desc: "Compreensão do propósito e metas anuais da empresa" },
                ].map((item, idx) => {
                  const numVal = parseFloat(item.val);
                  const pct = (numVal / 5) * 100;
                  const isVulnerable = numVal < 3.8;

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {item.label}
                          {isVulnerable && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">
                              Ponto de Atenção
                            </span>
                          )}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">{item.val} / 5.0</span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-700 ${
                            numVal >= 4.5 ? "bg-emerald-500" : numVal >= 3.8 ? "bg-maitre-gold" : "bg-amber-500"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>{item.desc}</span>
                        {canManage && (
                          <button
                            onClick={() => {
                              setNewPlanDimension(item.key);
                              setNewPlanTitle(`Iniciativa de Melhoria: ${item.label}`);
                              setIsActionPlanModalOpen(true);
                            }}
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                          >
                            Criar Ação <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card Lateral: Ciclo Ativo */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-maitre-gold font-bold text-xs uppercase tracking-wider">
                <Flame size={16} /> Ciclo em Andamento
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {activeSurvey?.title || "Pesquisa de Clima Corporativa"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {activeSurvey?.description || "Pesquisa de pulso para identificação contínua de promotores e oportunidades de melhoria de cultura."}
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Público: Todos os colaboradores</span>
                <span className="text-emerald-500 font-bold">● Ativa</span>
              </div>
              <button
                onClick={() => setActiveTab("survey")}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors text-center"
              >
                Preencher Pesquisa Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLANOS DE AÇÃO (T-15) */}
      {activeTab === "action_plans" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider">
                  Governança de DHO
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Planos de Ação para Fortalecimento do Clima
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tratamento estruturado dos pontos de atenção diagnosticados pela pesquisa, garantindo ciclo fechado de melhoria contínua (PDCA).
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setIsActionPlanModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center"
              >
                <Plus size={15} /> Novo Plano de Ação
              </button>
            )}
          </div>

          {actionPlans.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-3">
              <ListTodo size={32} className="text-slate-400 mx-auto" />
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Nenhum Plano de Ação cadastrado ainda
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Crie planos vinculados às dimensões de clima que necessitam de intervenção (comunicação, workload, liderança).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actionPlans.map((plan) => {
                const isCompleted = plan.status === "COMPLETED" || plan.progressPercent >= 100;
                const dimLabel = DIMENSION_LABELS[plan.dimension] || plan.dimension;

                return (
                  <div
                    key={plan.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          {dimLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isCompleted
                            ? "bg-emerald-500/15 text-emerald-500"
                            : plan.progressPercent > 0
                            ? "bg-blue-500/15 text-blue-500"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          {isCompleted ? "Concluído" : plan.progressPercent > 0 ? "Em Andamento" : "Não Iniciado"}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {plan.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Progresso da Ação:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{plan.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${plan.progressPercent}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? "bg-emerald-500" : "bg-purple-600"
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Responsável: <strong>{plan.ownerName}</strong></span>
                          <span>Prazo: {new Date(plan.targetDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>

                    {canManage && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          onClick={() => handleStepActionPlan(plan.id, plan.progressPercent, 25)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs"
                        >
                          +25% Progresso
                        </button>
                        <button
                          onClick={() => handleStepActionPlan(plan.id, plan.progressPercent, 100 - plan.progressPercent)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Concluir
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MURAL DE RECONHECIMENTO */}
      {activeTab === "mural" && (
        <div className="space-y-6">
          {/* Filtros por Pilar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedPillarFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPillarFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Todos os Valores ({recognitions.length})
            </button>
            {Object.entries(PILLAR_MAP).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setSelectedPillarFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedPillarFilter === key
                    ? "bg-maitre-gold text-slate-950 shadow-md shadow-maitre-gold/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            ))}
          </div>

          {/* Grid de Elogios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecognitions.map((rec) => {
              const pillar = PILLAR_MAP[rec.valuePillar] || PILLAR_MAP.EXCELENCIA;
              return (
                <div
                  key={rec.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-maitre-gold/50 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pillar.bg} ${pillar.color} ${pillar.border}`}>
                        <span>{pillar.icon}</span> {pillar.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rec.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                      "{rec.message}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">
                        Para: {rec.receiverName}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Por: {rec.senderName} {rec.receiverDepartment ? `• ${rec.receiverDepartment}` : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLike(rec.id)}
                      aria-label={`Curtir reconhecimento para ${rec.receiverName}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all group active:scale-95 cursor-pointer shadow-sm"
                    >
                      <ThumbsUp size={14} className="text-rose-500 group-hover:scale-110 transition-transform" />
                      <span>{rec.likesCount}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FORMULÁRIO DE RESPOSTA À PESQUISA */}
      {activeTab === "survey" && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {surveySubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Obrigado por sua contribuição!
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Sua resposta foi gravada de forma 100% anônima e protegida pelas políticas de K-Anonimato da Maître Conecta.
              </p>
              <button
                onClick={() => {
                  setSurveySubmitted(false);
                  setActiveTab("overview");
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                Voltar ao Painel
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSurvey} className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Pesquisa Confidencial</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Sua voz constrói nossa cultura
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Responda com total franqueza. Seus dados não são atrelados ao seu usuário e departamentos pequenos são agregados para K-Anonimato.
                </p>
              </div>

              {/* Pergunta de eNPS (0 a 10) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  1. Em uma escala de 0 a 10, o quanto você recomendaria nossa empresa como um excelente local de trabalho?
                </label>
                <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                    const isSelected = formNps === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormNps(num)}
                        className={`h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center border ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md scale-105"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dimensões de Clima */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  2. Avalie as dimensões corporativas (1 = Muito insatisfeito a 5 = Excelente)
                </label>

                {[
                  { label: "Liderança Direta", state: formDimLeadership, setter: setFormDimLeadership },
                  { label: "Comunicação Interna", state: formDimCommunication, setter: setFormDimCommunication },
                  { label: "Reconhecimento & Feedback", state: formDimRecognition, setter: setFormDimRecognition },
                  { label: "Carga de Trabalho (Workload)", state: formDimWorkload, setter: setFormDimWorkload },
                  { label: "Clareza da Estratégia", state: formDimStrategy, setter: setFormDimStrategy },
                ].map((dim, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{dim.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => dim.setter(val)}
                          className={`w-7 h-7 rounded-lg font-bold text-xs ${
                            dim.state === val
                              ? "bg-rose-500 text-white"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Setor */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Seu Departamento (Protegido por K-Anonimato)
                </label>
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="Tecnologia">Tecnologia & Produto</option>
                  <option value="Comercial">Comercial & Vendas</option>
                  <option value="Operações">Operações & Entrega</option>
                  <option value="RH">Gente & Gestão / RH</option>
                  <option value="Financeiro">Financeiro & Jurídico</option>
                  <option value="Marketing">Marketing & Growth</option>
                </select>
              </div>

              {/* Feedback Livre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sugestões / Comentários Livres (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  placeholder="Deixe uma sugestão para a liderança melhorar o nosso dia a dia..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSurvey}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={15} /> {isSubmittingSurvey ? "Enviando anonimamente..." : "Enviar Resposta Anônima"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 5: COMENTÁRIOS QUALITATIVOS COM K-ANONIMATO (T-15) */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-rose-500" /> Voz do Time: Comentários & Oportunidades
              </h3>
              <p className="text-xs text-slate-400">
                Respostas de setores com menos de 5 respondentes foram agrupadas sob o rótulo protegido.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Total de comentários: {responses.filter((r) => r.feedback).length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {responses
              .filter((r) => r.feedback)
              .map((r) => {
                const isMasked = r.department?.includes("K-Anonimato");
                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        isMasked
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        {isMasked && <ShieldCheck size={11} />}
                        {r.department || "Geral"}
                      </span>
                      <span className={`text-xs font-black ${r.npsScore >= 9 ? "text-emerald-500" : r.npsScore >= 7 ? "text-amber-500" : "text-rose-500"}`}>
                        Nota eNPS: {r.npsScore}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{r.feedback}"
                    </p>

                    <span className="text-[10px] text-slate-400 block pt-1">
                      Registrado em {new Date(r.respondedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL NOVO PLANO DE AÇÃO (T-15) */}
      {isActionPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo size={16} className="text-purple-600" /> Criar Plano de Ação de Clima
              </h3>
              <button
                onClick={() => setIsActionPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateActionPlan} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Dimensão de Vulnerabilidade / Oportunidade
                </label>
                <select
                  value={newPlanDimension}
                  onChange={(e) => setNewPlanDimension(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none"
                >
                  <option value="leadership">Liderança & Apoio ao Desenvolvimento</option>
                  <option value="communication">Comunicação Interna & Transparência</option>
                  <option value="recognition">Reconhecimento & Valorização</option>
                  <option value="workload">Equilíbrio & Bem-Estar (Workload)</option>
                  <option value="strategy">Alinhamento com a Estratégia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Título da Iniciativa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento Quinzenal All-Hands e Canais de Comunicação"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Descrição e Escopo da Ação
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Quais etapas serão implementadas para sanar a dor apontada pela equipe?"
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Líder / Responsável
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlanOwner}
                    onChange={(e) => setNewPlanOwner(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Data Limite (Prazo)
                  </label>
                  <input
                    type="date"
                    required
                    value={newPlanDate}
                    onChange={(e) => setNewPlanDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActionPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmittingPlan ? "Salvando..." : "Salvar Plano de Ação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECONHECER UM COLEGA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-bold">
                  <Sparkles size={16} />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reconhecer um Colega
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal de reconhecimento"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {recSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Reconhecimento Publicado!
                </h4>
                <p className="text-xs text-slate-400">
                  Seu elogio foi adicionado ao mural de cultura com sucesso.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendRecognition} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nome do Colega *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mariana Souza"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Departamento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Engenharia / RH"
                      value={receiverDepartment}
                      onChange={(e) => setReceiverDepartment(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilar de Cultura / Valor *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(PILLAR_MAP).map(([key, meta]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValuePillar(key)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border text-left ${
                          valuePillar === key
                            ? "bg-maitre-gold text-slate-950 border-maitre-gold shadow-sm font-black"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span>{meta.icon}</span>
                        <span className="truncate">{meta.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mensagem de Reconhecimento *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Descreva o que o colega fez e como isso impactou positivamente o time ou cliente..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRec}
                    className="px-5 py-2 rounded-xl bg-maitre-gold text-slate-950 font-bold text-xs shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={13} /> {isSubmittingRec ? "Publicando..." : "Publicar Elogio"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
