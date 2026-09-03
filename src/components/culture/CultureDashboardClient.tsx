"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  Smile,
  Sparkles,
  Award,
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
  Star,
  Building2,
} from "lucide-react";
import {
  submitSurveyResponse,
  postRecognition,
  likeRecognition,
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

interface CultureDashboardClientProps {
  activeSurvey: SurveyItem | null;
  responses: ResponseItem[];
  recognitions: RecognitionItem[];
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

export default function CultureDashboardClient({
  activeSurvey,
  responses,
  recognitions: initialRecognitions,
  organizations = [],
  currentOrgId = "",
}: CultureDashboardClientProps) {
  const [selectedOrg, setSelectedOrg] = useState(currentOrgId || (organizations[0]?.id || ""));
  const [activeTab, setActiveTab] = useState<
    "overview" | "mural" | "survey" | "comments"
  >("overview");
  const [recognitions, setRecognitions] = useState(initialRecognitions);
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
    if (valid.length === 0) return 4.0;
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
  };

  const avgLeadership = calcAvg("leadership");
  const avgCommunication = calcAvg("communication");
  const avgRecognition = calcAvg("recognition");
  const avgWorkload = calcAvg("workload");
  const avgStrategy = calcAvg("strategy");

  // Handler de Curtir
  const handleLike = async (id: string) => {
    setRecognitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likesCount: r.likesCount + 1 } : r))
    );
    try {
      await likeRecognition(id);
    } catch {
      // rollback em caso de falha silenciosa
    }
  };

  // Handler de Enviar Reconhecimento
  const handleSendRecognition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim() || !message.trim()) return;

    setIsSubmittingRec(true);
    try {
      const res = await postRecognition({
        receiverName,
        receiverDepartment,
        valuePillar,
        message,
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
            likesCount: 0,
            createdAt: new Date().toISOString(),
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

  // Handler de Submeter Pesquisa
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formNps === null || !activeSurvey) {
      alert("Por favor, selecione sua nota de recomendação de 0 a 10.");
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      await submitSurveyResponse({
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
      setSurveySubmitted(true);
    } catch (err: any) {
      alert(err.message || "Erro ao enviar resposta da pesquisa.");
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const filteredRecognitions =
    selectedPillarFilter === "ALL"
      ? recognitions
      : recognitions.filter((r) => r.valuePillar === selectedPillarFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
              <HeartHandshake size={13} /> Conecta Cultura
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              • Clima, eNPS & Reconhecimento
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Clima Organizacional & Cultura Viva
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Pesquisas anônimas de pulso contínuo, eNPS corporativo e mural de reconhecimento baseado em valores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {organizations && organizations.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 px-3 rounded-2xl shadow-sm">
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-maitre-gold to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-maitre-gold/20 hover:opacity-95 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles size={16} /> Reconhecer um Colega
          </button>
        </div>
      </div>

      {/* KPI Cards de eNPS & Clima */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card eNPS Score */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Score eNPS Geral
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${zoneColor}`}>
              {zoneLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${enpsScore >= 50 ? "text-emerald-500" : enpsScore >= 0 ? "text-amber-500" : "text-rose-500"}`}>
              {enpsScore > 0 ? `+${enpsScore}` : enpsScore}
            </span>
            <span className="text-xs text-slate-400 font-semibold">pontos (-100 a +100)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
            <div style={{ width: `${pctPromoters}%` }} className="bg-emerald-500 h-full" title={`Promotores: ${pctPromoters}%`} />
            <div style={{ width: `${pctPassives}%` }} className="bg-amber-400 h-full" title={`Neutros: ${pctPassives}%`} />
            <div style={{ width: `${pctDetractors}%` }} className="bg-rose-500 h-full" title={`Detratores: ${pctDetractors}%`} />
          </div>
        </div>

        {/* Card Promotores */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Promotores (9-10)</span>
            <Smile size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {pctPromoters}%
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {promoters} de {totalResponses} colaboradores recomendam ativamente.
          </p>
        </div>

        {/* Card Detratores */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detratores (0-6)</span>
            <TrendingUp size={18} className="rotate-180" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {pctDetractors}%
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {detractors} colaboradores apontam pontos de melhoria urgente.
          </p>
        </div>

        {/* Card Participação */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-maitre-gold">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Respostas Coletadas</span>
            <ShieldCheck size={18} />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalResponses}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            100% anônimas e protegidas por conformidade LGPD.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 size={16} /> Diagnóstico de Clima
        </button>
        <button
          onClick={() => setActiveTab("mural")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "mural"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles size={16} /> Mural de Reconhecimento ({recognitions.length})
        </button>
        <button
          onClick={() => setActiveTab("survey")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "survey"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Smile size={16} /> Responder Pesquisa de Pulso
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "comments"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MessageSquare size={16} /> Feedbacks Qualitativos
        </button>
      </div>

      {/* TAB 1: DIAGNÓSTICO DE CLIMA */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Dimensões de Clima Organizacional (Escala 1 a 5)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Média consolidada calculada através das respostas anônimas da equipe no ciclo ativo.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Liderança & Apoio ao Desenvolvimento", val: avgLeadership, desc: "Acessibilidade e direcionamento da gestão direta" },
                  { label: "Comunicação Interna & Transparência", val: avgCommunication, desc: "Clareza nos fluxos de informação entre áreas" },
                  { label: "Reconhecimento & Valorização", val: avgRecognition, desc: "Sentimento de justiça e elogio pelo trabalho entregue" },
                  { label: "Equilíbrio & Bem-Estar (Workload)", val: avgWorkload, desc: "Saúde mental e carga de trabalho equilibrada" },
                  { label: "Alinhamento com a Estratégia", val: avgStrategy, desc: "Compreensão do propósito e metas anuais da empresa" },
                ].map((item, idx) => {
                  const numVal = parseFloat(item.val as string);
                  const pct = (numVal / 5) * 100;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                        <span className="font-black text-slate-900 dark:text-white">{item.val} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-700 ${
                            numVal >= 4.5 ? "bg-emerald-500" : numVal >= 3.8 ? "bg-maitre-gold" : "bg-amber-500"
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
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

      {/* TAB 2: MURAL DE RECONHECIMENTO */}
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
                      onClick={() => handleLike(rec.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-bold transition-colors group active:scale-90"
                    >
                      <ThumbsUp size={13} className="group-hover:text-rose-500 transition-colors" />
                      <span>{rec.likesCount}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FORMULÁRIO DE RESPOSTA À PESQUISA */}
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
                Sua resposta foi gravada de forma 100% anônima e auxiliará a liderança a aprimorar nosso ambiente e rituais.
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
                  Responda com total franqueza. Seus dados não são atrelados ao seu usuário.
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
                    let numColor = "hover:bg-rose-100 hover:text-rose-700";
                    if (num >= 9) numColor = "hover:bg-emerald-100 hover:text-emerald-700";
                    else if (num >= 7) numColor = "hover:bg-amber-100 hover:text-amber-700";

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormNps(num)}
                        className={`h-11 rounded-xl font-black text-xs transition-all flex items-center justify-center ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-maitre-gold dark:text-slate-950 scale-105 shadow-md"
                            : `bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 ${numColor}`
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                  <span>0 - Jamais recomendaria</span>
                  <span>10 - Com certeza recomendo</span>
                </div>
              </div>

              {/* Dimensões */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Avalie as dimensões de trabalho (1 = Discordo totalmente | 5 = Concordo totalmente)
                </label>

                {[
                  { label: "Apoio e Clareza da Liderança", state: formDimLeadership, set: setFormDimLeadership },
                  { label: "Comunicação e Transparência Interna", state: formDimCommunication, set: setFormDimCommunication },
                  { label: "Reconhecimento pelo meu Trabalho", state: formDimRecognition, set: setFormDimRecognition },
                  { label: "Equilíbrio de Vida e Carga de Trabalho", state: formDimWorkload, set: setFormDimWorkload },
                  { label: "Clareza das Metas e Propósito", state: formDimStrategy, set: setFormDimStrategy },
                ].map((dim, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{dim.label}</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => dim.set(val)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                            dim.state === val
                              ? "bg-maitre-gold text-slate-950 shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Área / Departamento (Opcional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Departamento (para agrupamento de métricas)
                </label>
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Tecnologia">Tecnologia & Produto</option>
                  <option value="Gente & Gestão">Gente & Gestão / RH</option>
                  <option value="Comercial">Comercial & Vendas</option>
                  <option value="Operações">Operações & Atendimento</option>
                  <option value="Financeiro">Financeiro & Administrativo</option>
                  <option value="Geral">Prefiro não informar</option>
                </select>
              </div>

              {/* Feedback Aberto */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Comentário livre ou sugestão de melhoria (Opcional)
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

      {/* TAB 4: COMENTÁRIOS QUALITATIVOS */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Voz do Time: Comentários & Oportunidades Mapeadas
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Total de comentários: {responses.filter((r) => r.feedback).length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {responses
              .filter((r) => r.feedback)
              .map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
                    {new Date(r.respondedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
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
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {recSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Reconhecimento Publicado!
                </h4>
                <p className="text-xs text-slate-400">
                  Seu colega e a equipe já podem visualizar seu elogio no mural corporativo.
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
