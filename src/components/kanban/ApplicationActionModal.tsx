/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Calendar,
  DollarSign,
  Award,
  History,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import {
  scheduleInterview,
  submitScorecard,
  createOffer,
  authorizeHire,
  overrideApplicationFit,
} from "@/app/(dashboard)/jobs/[id]/board/actions";

interface ApplicationActionModalProps {
  applicationId: string | null;
  candidateName: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ApplicationActionModal({
  applicationId,
  candidateName,
  onClose,
  onRefresh,
}: ApplicationActionModalProps) {
  const [activeTab, setActiveTab] = useState<"INTERVIEWS" | "OFFERS" | "FIT" | "HIRE" | "FEEDBACK_IA">("INTERVIEWS");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form States
  // 1. Entrevista
  const [interviewTitle, setInterviewTitle] = useState("Entrevista Técnica e Cultural");
  const [scheduledAt, setScheduledAt] = useState("");
  const [format, setFormat] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  // 2. Scorecard
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);
  const [techScore, setTechScore] = useState(4.5);
  const [cultScore, setCultScore] = useState(4.8);
  const [commScore, setCommScore] = useState(4.7);
  const [recommendation, setRecommendation] = useState<"STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE">("HIRE");
  const [scorecardNotes, setScorecardNotes] = useState("");

  // 3. Proposta (Offer)
  const [salaryOffered, setSalaryOffered] = useState("");
  const [employmentType, setEmploymentType] = useState<"CLT" | "PJ" | "ESTAGIO">("CLT");
  const [startDate, setStartDate] = useState("");
  const [benefits, setBenefits] = useState("Assistência Médica, Vale Refeição, Seguro de Vida, PLR");

  // 4. Override Fit 3D
  const [newFitCategory, setNewFitCategory] = useState<"ALTO_FIT" | "MEDIO_FIT" | "BAIXO_FIT">("ALTO_FIT");
  const [newPriority, setNewPriority] = useState<"PRIORIZADO" | "NORMAL" | "DUVIDA">("PRIORIZADO");
  const [overrideReason, setOverrideReason] = useState("");

  // 5. Contratação (Hire)
  const [employeeCode, setEmployeeCode] = useState("MC-2026-001");
  const [admissionUrl, setAdmissionUrl] = useState<string | null>(null);
  const [copiedAdmissionUrl, setCopiedAdmissionUrl] = useState(false);

  // 6. Feedback Humanizado com IA
  const [feedbackType, setFeedbackType] = useState<string>("REJECTION_INTERVIEW");
  const [feedbackStrengths, setFeedbackStrengths] = useState("Excelente postura profissional e domínio de conceitos fundamentais");
  const [feedbackImprovements, setFeedbackImprovements] = useState("Aprofundar experiência prática em projetos de maior escala");
  const [generatedFeedback, setGeneratedFeedback] = useState("");
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  if (!applicationId) return null;

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (!scheduledAt) throw new Error("Informe a data e horário da entrevista.");

      const res = await scheduleInterview({
        applicationId,
        title: interviewTitle,
        scheduledAt,
        format,
        meetingUrl,
        notes: interviewNotes,
      });

      if (!res.success) throw new Error(res.error);

      setSuccessMsg("🎉 Entrevista agendada com sucesso! Notificação registrada.");
      setActiveInterviewId(res.interviewId || null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao agendar entrevista.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterviewId) {
      setErrorMsg("Selecione ou agende uma entrevista antes de registrar o scorecard.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await submitScorecard({
        interviewId: activeInterviewId,
        technicalScore: Number(techScore),
        cultureScore: Number(cultScore),
        communicationScore: Number(commScore),
        overallRecommendation: recommendation,
        notes: scorecardNotes,
      });

      if (!res.success) throw new Error(res.error);

      setSuccessMsg("⭐ Scorecard registrado e parecer salvo com sucesso!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar scorecard.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const val = parseFloat(salaryOffered.replace(/[^0-9.]/g, ""));
      if (isNaN(val) || val <= 0) throw new Error("Informe um valor válido de proposta salarial.");

      const res = await createOffer({
        applicationId,
        salaryOffered: val,
        employmentType,
        startDate,
        benefits,
      });

      if (!res.success) throw new Error(res.error);

      setSuccessMsg("💼 Proposta de contratação criada e enviada para aprovação!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao criar proposta.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideFit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (!overrideReason.trim()) throw new Error("A justificativa técnica do ajuste é obrigatória.");

      const res = await overrideApplicationFit(
        applicationId,
        newFitCategory,
        newPriority,
        overrideReason
      );

      if (!res.success) throw new Error(res.error);

      setSuccessMsg("🤖 Ajuste de Fit 3D e auditoria de IA registrados com sucesso!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao ajustar Fit.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeHire = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await authorizeHire(applicationId, employeeCode);
      if (!res.success) throw new Error(res.error);

      if (res.admissionUrl) {
        setAdmissionUrl(res.admissionUrl);
      }
      setSuccessMsg("🚀 Contratação autorizada! E-mail com o Portal de Admissão Digital enviado ao candidato e registro integrado ao Core HR.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao autorizar contratação.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeedback = async () => {
    setIsGeneratingFeedback(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/candidate/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          candidateName,
          feedbackType,
          strengths: feedbackStrengths,
          improvements: feedbackImprovements,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedFeedback(data.feedback);
      } else {
        setErrorMsg(data.error || "Erro ao gerar feedback.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado.");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleCopyFeedback = () => {
    if (!generatedFeedback) return;
    navigator.clipboard.writeText(generatedFeedback);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold text-base">
              {candidateName[0] || "C"}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {candidateName}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gestão de Etapas, Avaliações e Contratação
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/60 px-4 pt-2 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("INTERVIEWS")}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "INTERVIEWS"
                ? "border-maitre-gold text-slate-900 dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Calendar size={14} /> Entrevistas & Scorecards
          </button>

          <button
            onClick={() => setActiveTab("OFFERS")}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "OFFERS"
                ? "border-maitre-gold text-slate-900 dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <DollarSign size={14} /> Proposta Salarial
          </button>

          <button
            onClick={() => setActiveTab("FIT")}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "FIT"
                ? "border-maitre-gold text-slate-900 dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Sparkles size={14} /> Ajuste Fit 3D
          </button>

          <button
            onClick={() => setActiveTab("FEEDBACK_IA")}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "FEEDBACK_IA"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Sparkles size={14} className="text-purple-500" /> Feedback com IA
          </button>

          <button
            onClick={() => setActiveTab("HIRE")}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "HIRE"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Award size={14} /> Contratar & Core HR
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: ENTREVISTAS & SCORECARDS */}
          {activeTab === "INTERVIEWS" && (
            <div className="space-y-6">
              <form onSubmit={handleScheduleInterview} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={14} className="text-maitre-gold" />
                    Agendar Nova Entrevista
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Google Meet / Teams / Presencial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Título da Sessão *
                    </label>
                    <input
                      type="text"
                      required
                      value={interviewTitle}
                      onChange={(e) => setInterviewTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Data & Horário *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Formato
                    </label>
                    <select
                      value={format}
                      onChange={(e: any) => setFormat(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
                    >
                      <option value="ONLINE">🌐 Online (Videoconferência)</option>
                      <option value="IN_PERSON">🏢 Presencial no Escritório</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Link da Reunião (URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1d1e20] text-white hover:bg-slate-800 p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Confirmar Agendamento de Entrevista</span>
                </button>
              </form>

              {/* Formulário de Scorecard */}
              <form onSubmit={handleSubmitScorecard} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Award size={14} className="text-purple-500" />
                  Preencher Scorecard de Avaliação
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Técnica (1 a 5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      value={techScore}
                      onChange={(e) => setTechScore(parseFloat(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Cultura (1 a 5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      value={cultScore}
                      onChange={(e) => setCultScore(parseFloat(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Comunicação
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      value={commScore}
                      onChange={(e) => setCommScore(parseFloat(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Recomendação Geral do Avaliador *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "STRONG_HIRE", label: "🟢 Forte Contratação" },
                      { id: "HIRE", label: "🔵 Recomendado" },
                      { id: "HOLD", label: "🟡 Em Dúvida / Standby" },
                      { id: "NO_HIRE", label: "🔴 Não Recomendado" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setRecommendation(opt.id as any)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          recommendation === opt.id
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Parecer Técnico / Anotações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Pontos fortes, oportunidades de desenvolvimento e alinhamento com a vaga..."
                    value={scorecardNotes}
                    onChange={(e) => setScorecardNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 p-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                  <span>Salvar Avaliação do Scorecard</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PROPOSTA SALARIAL */}
          {activeTab === "OFFERS" && (
            <form onSubmit={handleCreateOffer} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-500" />
                Estruturar Proposta de Contratação (Job Offer)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Remuneração Proposta (R$/mês) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    placeholder="Ex: 15000"
                    value={salaryOffered}
                    onChange={(e) => setSalaryOffered(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-maitre-gold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Regime de Contratação
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e: any) => setEmploymentType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
                  >
                    <option value="CLT">CLT (Consolidação das Leis do Trabalho)</option>
                    <option value="PJ">PJ (Prestador de Serviços / Pessoa Jurídica)</option>
                    <option value="ESTAGIO">Estágio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Data Prevista de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Pacote de Benefícios & Condições
                </label>
                <textarea
                  rows={2}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 p-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                <span>Emitir Proposta Oficial</span>
              </button>
            </form>
          )}

          {/* TAB 3: AJUSTE DE FIT 3D */}
          {activeTab === "FIT" && (
            <form onSubmit={handleOverrideFit} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={14} className="text-maitre-gold" />
                Governança & Override de Decisão de IA
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Permite ao recrutador reclassificar o Fit do candidato, registrando justificativa formal e auditoria imutável conforme as diretrizes do plano de evolução.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Nova Categoria de Fit
                  </label>
                  <select
                    value={newFitCategory}
                    onChange={(e: any) => setNewFitCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
                  >
                    <option value="ALTO_FIT">🟢 Alto Fit (Aprovado com Prioridade)</option>
                    <option value="MEDIO_FIT">🟡 Médio Fit (Aderência Moderada)</option>
                    <option value="BAIXO_FIT">🔴 Baixo Fit (Fora do Perfil/Orçamento)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Nível de Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
                  >
                    <option value="PRIORIZADO">⚡ Priorizado</option>
                    <option value="NORMAL">Normal</option>
                    <option value="DUVIDA">Dúvida / Standby</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Justificativa Técnica do Ajuste * (Mínimo 5 caracteres)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Candidato possui histórico sênior comprovado na área, superando os requisitos mínimos da vaga..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !overrideReason.trim()}
                className="w-full bg-[#1d1e20] text-white hover:bg-slate-800 p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Gravar Override de Decisão & Auditoria</span>
              </button>
            </form>
          )}

          {/* TAB: FEEDBACK HUMANIZADO COM IA */}
          {activeTab === "FEEDBACK_IA" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Gerador de Feedback Humanizado & Construtivo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gera uma devolutiva empática e personalizada orientada ao desenvolvimento do candidato.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Tipo / Momento da Devolutiva
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="REJECTION_INTERVIEW">Encerramento pós-entrevista (Fase Final)</option>
                    <option value="REJECTION_TRIAGEM">Encerramento na Triagem Inicial</option>
                    <option value="FUTURE_TALENT">Convite para Banco de Talentos / Futuras Vagas</option>
                    <option value="GENERAL">Agradecimento e Feedback Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Pontos Fortes Identificados no Candidato
                  </label>
                  <input
                    type="text"
                    value={feedbackStrengths}
                    onChange={(e) => setFeedbackStrengths(e.target.value)}
                    placeholder="Ex: Excelente comunicação, boa base técnica, perfil colaborativo..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Critérios / Sugestões para Futuras Oportunidades
                  </label>
                  <input
                    type="text"
                    value={feedbackImprovements}
                    onChange={(e) => setFeedbackImprovements(e.target.value)}
                    placeholder="Ex: Aprofundar experiência em arquitetura de microsserviços, liderança de times..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateFeedback}
                  disabled={isGeneratingFeedback}
                  className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingFeedback ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Gerando Feedback com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Gerar Mensagem de Feedback com IA</span>
                    </>
                  )}
                </button>

                {generatedFeedback && (
                  <div className="space-y-2 pt-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        Mensagem Humanizada Gerada:
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyFeedback}
                        className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedFeedback ? "✓ Copiado!" : "Copiar Mensagem"}
                      </button>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {generatedFeedback}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONTRATAR & CORE HR */}
          {activeTab === "HIRE" && (
            <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  🎉
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Autorizar Contratação de {candidateName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gera a conversão em colaborador e despacha o evento transacional <code>candidate.hire_authorized.v1</code> para o Core HR.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Código de Matrícula do Novo Colaborador
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAuthorizeHire}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                <span>Efetivar Contratação & Iniciar Admissão Digital</span>
              </button>

              {admissionUrl && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Link do Portal de Admissão:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(admissionUrl);
                        setCopiedAdmissionUrl(true);
                        setTimeout(() => setCopiedAdmissionUrl(false), 3000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      {copiedAdmissionUrl ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedAdmissionUrl ? "Copiado!" : "Copiar Link"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 break-all bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {admissionUrl}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
