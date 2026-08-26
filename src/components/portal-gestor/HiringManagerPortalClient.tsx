"use client";

import React, { useState } from "react";
import {
  Building2,
  Briefcase,
  Users,
  Award,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileText,
  Star,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Send,
} from "lucide-react";
import Link from "next/link";
import { submitScorecard } from "@/app/(dashboard)/jobs/[id]/board/actions";

interface HiringManagerPortalProps {
  initialData: {
    jobs: any[];
    applications: any[];
    userOrgName: string;
  };
  userName: string;
}

export default function HiringManagerPortalClient({
  initialData,
  userName,
}: HiringManagerPortalProps) {
  const [activeTab, setActiveTab] = useState<"FINALISTS" | "JOBS" | "OFFERS">("FINALISTS");
  const [selectedAppForScorecard, setSelectedAppForScorecard] = useState<any | null>(null);

  // Scorecard state
  const [techScore, setTechScore] = useState(5);
  const [cultScore, setCultScore] = useState(5);
  const [commScore, setCommScore] = useState(5);
  const [recommendation, setRecommendation] = useState<"STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE">("STRONG_HIRE");
  const [scorecardNotes, setScorecardNotes] = useState("");
  const [submittingScorecard, setSubmittingScorecard] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { jobs, applications, userOrgName } = initialData;

  // Filtrar finalistas (candidatos com fit médio ou alto ou em etapas de entrevista)
  const finalists = applications.filter(
    (app) => app.fitCategory === "ALTO_FIT" || app.fitCategory === "MEDIO_FIT" || (app.interviews && app.interviews.length > 0)
  );

  const offers = applications.filter((app) => app.offers && app.offers.length > 0);

  const handleScorecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForScorecard) return;

    setSubmittingScorecard(true);
    setFeedback(null);

    try {
      const interviewId = selectedAppForScorecard.interviews?.[0]?.id;
      if (!interviewId) {
        throw new Error("Não há entrevista aberta vinculada para este candidato. O recrutador Maître deve agendar o horário primeiro.");
      }

      const res = await submitScorecard({
        interviewId,
        technicalScore: techScore,
        cultureScore: cultScore,
        communicationScore: commScore,
        overallRecommendation: recommendation,
        notes: scorecardNotes,
      });

      if (!res.success) throw new Error(res.error);

      setFeedback({
        type: "success",
        text: `✨ Avaliação registrada com sucesso para ${selectedAppForScorecard.candidate.firstName}! O time de Hunting da Maître já recebeu seu parecer.`,
      });
      setSelectedAppForScorecard(null);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Erro ao registrar avaliação.",
      });
    } finally {
      setSubmittingScorecard(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Executivo do Gestor */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-maitre-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-maitre-gold uppercase tracking-wider">
              <Building2 size={15} />
              <span>Portal do Gestor Contratante • {userOrgName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Olá, {userName}! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Acompanhe as posições em hunting conduzidas pela **Maître Consultoria**, avalie os candidatos finalistas recomendados e aprove propostas salariais.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                SLA de Hunting
              </span>
              <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Clock size={14} /> Ativo (100%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Cards de Métricas do Gestor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Vagas Abertas na Sua Conta
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {jobs.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Award size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Finalistas Recomendados
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {finalists.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Propostas em Decisão
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {offers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("FINALISTS")}
          className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "FINALISTS"
              ? "border-maitre-gold text-slate-900 dark:text-white font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          <Award size={16} className={activeTab === "FINALISTS" ? "text-maitre-gold" : "text-slate-400"} />
          <span>Finalistas Recomendados ({finalists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("JOBS")}
          className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "JOBS"
              ? "border-maitre-gold text-slate-900 dark:text-white font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          <Briefcase size={16} className={activeTab === "JOBS" ? "text-maitre-gold" : "text-slate-400"} />
          <span>Vagas em Hunting ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("OFFERS")}
          className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "OFFERS"
              ? "border-maitre-gold text-slate-900 dark:text-white font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          <DollarSign size={16} className={activeTab === "OFFERS" ? "text-maitre-gold" : "text-slate-400"} />
          <span>Propostas Salariais ({offers.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Finalistas */}
      {activeTab === "FINALISTS" && (
        <div className="space-y-4">
          {finalists.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nenhum finalista apresentado no momento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Nossa equipe de consultores Maître está executando a triagem de hunting. Assim que os perfis de alto fit forem validados, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {finalists.map((app) => {
                const candidate = app.candidate;
                const matchScore = Math.round(app.matchScore || 85);
                const hasScorecard = app.interviews?.some((i: any) => i.scorecards?.length > 0);

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-black text-lg">
                            {candidate.firstName[0]}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                              {candidate.firstName} {candidate.lastName}
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Vaga: <strong className="text-slate-700 dark:text-slate-200">{app.jobTitle}</strong>
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-black flex items-center gap-1">
                          <Sparkles size={13} /> {matchScore}% Fit
                        </span>
                      </div>

                      {/* Resumo Profissional do Candidato */}
                      {candidate.profileSummary && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          &quot;{candidate.profileSummary}&quot;
                        </p>
                      )}

                      {/* Detalhes de Pretensão & Parecer */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Pretensão Salarial
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                            {app.salaryExpectation
                              ? `R$ ${app.salaryExpectation.toLocaleString("pt-BR")}`
                              : "A Combinar"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Etapa Atual
                          </span>
                          <span className="font-extrabold text-purple-400 mt-0.5 block truncate">
                            {app.stage?.name || "Entrevista com Gestor"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações do Gestor */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {candidate.resumeUrl ? (
                        <Link
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-maitre-gold transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <FileText size={14} />
                          <span>Ver Currículo</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Currículo analisado</span>
                      )}

                      <button
                        onClick={() => setSelectedAppForScorecard(app)}
                        className={`flex items-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm ${
                          hasScorecard
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105"
                        }`}
                      >
                        <Star size={14} />
                        <span>{hasScorecard ? "Ver/Editar Avaliação" : "Avaliar Candidato"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Vagas */}
      {activeTab === "JOBS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold uppercase">
                    Hunting Ativo
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {job.department || "Geral"}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight mb-2">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {job.description}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Candidatos no Funil:</span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {job._count?.applications || 0} inscritos
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/carreiras/${job.organization.slug}/${job.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  <ExternalLink size={12} />
                  <span>Ver na Web</span>
                </Link>

                <Link
                  href={`/jobs/${job.id}/board`}
                  className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 text-white py-1.5 px-3 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <span>Ver Pipeline</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba 3: Propostas */}
      {activeTab === "OFFERS" && (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <DollarSign size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nenhuma proposta salarial pendente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Quando um candidato atingir a fase final de negociação salarial, os detalhes da proposta aparecerão aqui para sua aprovação.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {offers.map((app) => (
                <div
                  key={app.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-base text-white">
                        {app.candidate.firstName} {app.candidate.lastName}
                      </h4>
                      <span className="text-xs text-slate-400">Vaga: {app.jobTitle}</span>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-purple-500/15 text-purple-400 text-xs font-bold border border-purple-500/30">
                      Proposta Elaborada
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Salário Proposto:</span>
                      <strong className="text-emerald-400 font-extrabold text-sm">
                        R$ {app.offers[0]?.salaryOffered?.toLocaleString("pt-BR") || "A definir"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Regime de Contratação:</span>
                      <span className="text-white font-semibold">{app.offers[0]?.employmentType || "CLT"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Benefícios:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{app.offers[0]?.benefits || "Pacote padrão"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Avaliação / Scorecard */}
      {selectedAppForScorecard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
                  <Star size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Scorecard de Avaliação
                  </h3>
                  <span className="text-xs text-slate-400">
                    Candidato: {selectedAppForScorecard.candidate.firstName} {selectedAppForScorecard.candidate.lastName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForScorecard(null)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScorecardSubmit} className="p-6 space-y-5">
              {/* Avaliação em Estrelas / Notas 1 a 5 */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Competência Técnica & Experiência:</span>
                    <span className="text-maitre-gold">{techScore} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={techScore}
                    onChange={(e) => setTechScore(parseFloat(e.target.value))}
                    className="w-full accent-maitre-gold cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Fit Cultural com a Sua Empresa:</span>
                    <span className="text-maitre-gold">{cultScore} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={cultScore}
                    onChange={(e) => setCultScore(parseFloat(e.target.value))}
                    className="w-full accent-maitre-gold cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Comunicação & Postura Executiva:</span>
                    <span className="text-maitre-gold">{commScore} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={commScore}
                    onChange={(e) => setCommScore(parseFloat(e.target.value))}
                    className="w-full accent-maitre-gold cursor-pointer"
                  />
                </div>
              </div>

              {/* Recomendação Geral */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Recomendação Final
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRecommendation("STRONG_HIRE")}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      recommendation === "STRONG_HIRE"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <ThumbsUp size={14} />
                    <span>Aprovar com Ênfase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommendation("HIRE")}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      recommendation === "HIRE"
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Aprovado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommendation("HOLD")}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      recommendation === "HOLD"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <Clock size={14} />
                    <span>Em Espera (Standby)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommendation("NO_HIRE")}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      recommendation === "NO_HIRE"
                        ? "bg-rose-500/20 border-rose-500 text-rose-400"
                        : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <ThumbsDown size={14} />
                    <span>Reprovado</span>
                  </button>
                </div>
              </div>

              {/* Parecer Descritivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Parecer do Gestor / Anotações da Entrevista
                </label>
                <textarea
                  rows={3}
                  value={scorecardNotes}
                  onChange={(e) => setScorecardNotes(e.target.value)}
                  placeholder="Descreva pontos fortes, dúvidas ou alinhamento com a equipe..."
                  className="w-full p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-maitre-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppForScorecard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingScorecard}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingScorecard ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Registrar Parecer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
