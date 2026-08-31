"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Award,
  Sparkles,
  MessageCircle,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { getFitBadgeStyle, ApplicationEvaluation } from "@/lib/fit-evaluator";
import WhatsAppQuickActionModal from "@/components/ui/WhatsAppQuickActionModal";

interface ResumeSplitViewerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string; // ApplicationId
    candidateId?: string;
    name: string;
    email: string;
    phone: string | null;
    resumeUrl: string | null;
    linkedinUrl: string | null;
    source: string | null;
    tags: string | null;
    salaryExpectation: number | null;
    priority?: string;
    stageName?: string;
    evaluation?: ApplicationEvaluation;
  } | null;
  jobTitle: string;
  companyName: string;
  onOpenActionsModal?: (appId: string, candidateName: string) => void;
}

export default function ResumeSplitViewer({
  isOpen,
  onClose,
  candidate,
  jobTitle,
  companyName,
  onOpenActionsModal,
}: ResumeSplitViewerProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!isOpen || !candidate) return null;

  const tagsList = candidate.tags
    ? candidate.tags.startsWith("[")
      ? JSON.parse(candidate.tags)
      : candidate.tags.split(",").map((t: string) => t.trim())
    : [];

  const evalData = candidate.evaluation;
  const fitBadge = evalData ? getFitBadgeStyle(evalData.overallCategory) : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
            isMaximized ? "h-[98vh] max-w-[98vw]" : "h-[90vh] max-w-7xl"
          }`}
        >
          {/* Header Superior */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    {candidate.name}
                  </h2>
                  {candidate.stageName && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {candidate.stageName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vaga: <span className="text-slate-200 font-semibold">{jobTitle}</span> • {companyName}
                </p>
              </div>
            </div>

            {/* Controles do Header */}
            <div className="flex items-center gap-2">
              {candidate.resumeUrl && (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all border border-slate-700"
                title={isMaximized ? "Restaurar tamanho" : "Maximizar"}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center transition-all border border-rose-500/30"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Corpo Dividido: Split View (PDF à esquerda / Dados e Ações à direita) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Painel Esquerdo: Visualizador de PDF */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 sm:p-4 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
              {candidate.resumeUrl ? (
                <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner bg-slate-200 dark:bg-slate-900 relative flex flex-col">
                  <iframe
                    src={`${candidate.resumeUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0 rounded-2xl"
                    title={`Currículo de ${candidate.name}`}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum arquivo PDF anexado
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                    Este candidato foi cadastrado sem anexo de currículo ou o documento está em processamento.
                  </p>
                </div>
              )}
            </div>

            {/* Painel Direito: Ficha, Fit 3D e Ações Rápidas */}
            <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 p-6 overflow-y-auto flex flex-col gap-6 shrink-0">
              {/* Card de Contato */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Informações de Contato
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <Phone size={14} className="text-slate-400" />
                    <span>{candidate.phone || "Telefone não informado"}</span>
                  </div>
                  {candidate.linkedinUrl && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <Globe size={14} className="text-sky-500" />
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:underline flex items-center gap-1 font-semibold truncate"
                      >
                        Perfil no LinkedIn
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Fit 3D & Match */}
              {evalData && fitBadge && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-850 dark:to-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-maitre-gold" />
                      Diagnóstico de Fit 3D
                    </h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${fitBadge.bg} ${fitBadge.text} ${fitBadge.border}`}>
                      {fitBadge.label} ({Math.round(evalData.overallScore)}%)
                    </span>
                  </div>

                  {/* Detalhamento dos 3 eixos */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Técnico</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {Math.round(evalData.techFit.score)}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Salarial</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {evalData.salaryFit.status === "WITHIN_BUDGET"
                          ? "100%"
                          : evalData.salaryFit.status === "SLIGHTLY_ABOVE"
                          ? "75%"
                          : evalData.salaryFit.status === "OUT_OF_BUDGET"
                          ? "25%"
                          : "—"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Sênior</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {Math.round(evalData.seniorityFit.score)}%
                      </span>
                    </div>
                  </div>

                  {/* Justificativa em Linguagem Natural */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    &ldquo;{evalData.explanation}&rdquo;
                  </p>
                </div>
              )}

              {/* Pretensão Salarial */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pretensão Salarial:
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {candidate.salaryExpectation
                    ? `R$ ${candidate.salaryExpectation.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "A combinar"}
                </span>
              </div>

              {/* Tags & Skills Extraídas */}
              {tagsList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Competências & Palavras-Chave
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsList.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de Ação Rápida */}
              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>Mensagem WhatsApp 1-Click</span>
                </button>

                {onOpenActionsModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenActionsModal(candidate.id, candidate.name);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-maitre-navy hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
                  >
                    <Calendar size={15} />
                    <span>Agendar Entrevista / Avaliar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de WhatsApp */}
      <WhatsAppQuickActionModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        applicationId={candidate.id}
        candidateName={candidate.name}
        candidatePhone={candidate.phone}
        jobTitle={jobTitle}
        companyName={companyName}
      />
    </>
  );
}
