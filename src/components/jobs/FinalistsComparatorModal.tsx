"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  UserCheck,
  TrendingUp,
  FileText,
  MessageCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { getFitBadgeStyle, ApplicationEvaluation } from "@/lib/fit-evaluator";

export type FinalistCandidate = {
  id: string; // applicationId
  candidateId: string;
  name: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
  salaryExpectation: number | null;
  priority: string;
  stageName: string;
  tags: string | null;
  evaluation: ApplicationEvaluation;
};

interface FinalistsComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: FinalistCandidate[];
  jobTitle: string;
  companyName: string;
  onOpenActionsModal?: (appId: string, candidateName: string) => void;
}

export default function FinalistsComparatorModal({
  isOpen,
  onClose,
  candidates,
  jobTitle,
  companyName,
  onOpenActionsModal,
}: FinalistsComparatorModalProps) {
  if (!isOpen || candidates.length === 0) return null;

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-7xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-bold">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Comparador de Finalistas Lado a Lado
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/30">
                  {candidates.length} {candidates.length === 1 ? "candidato" : "candidatos"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vaga: <span className="text-slate-200 font-semibold">{jobTitle}</span> • {companyName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Matriz Comparativa */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 space-y-6">
          <div
            className="grid gap-4 min-w-[700px]"
            style={{
              gridTemplateColumns: `repeat(${candidates.length}, minmax(280px, 1fr))`,
            }}
          >
            {candidates.map((c) => {
              const evalData = c.evaluation;
              const fitBadge = getFitBadgeStyle(evalData.fitCategory);
              const skills = evalData.skillsMatch;
              const salary = evalData.salaryFit;

              const initials = c.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={c.id}
                  className="bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col gap-5 shadow-sm hover:border-maitre-gold/40 transition-all"
                >
                  {/* Topo do Card */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-sm text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.stageName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico de Fit 3D */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles size={12} className="text-maitre-gold" />
                        Fit Geral
                      </span>
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${fitBadge.bg} ${fitBadge.text} ${fitBadge.border}`}>
                        {fitBadge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Skills</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          {skills.score}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Salário</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                          {formatCurrency(c.salaryExpectation)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Correspondentes & Faltantes */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Aderência de Competências
                    </span>
                    <div className="space-y-1.5">
                      {skills.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {skills.matchedSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold"
                            >
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      )}
                      {skills.missingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {skills.missingSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]"
                            >
                              ✕ {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parecer do Algoritmo */}
                  <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    &ldquo;{evalData.explanation}&rdquo;
                  </div>

                  {/* Botões de Ação para o Finalista */}
                  <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {onOpenActionsModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenActionsModal(c.id, c.name);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-maitre-gold hover:bg-maitre-gold-hover text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <UserCheck size={14} />
                        <span>Avançar para Proposta / Contratar</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {c.resumeUrl && (
                        <a
                          href={c.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FileText size={13} />
                          <span>Currículo</span>
                        </a>
                      )}

                      <a
                        href={`/candidates/${c.candidateId}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-maitre-gold border border-slate-200 dark:border-slate-700 transition-all"
                        title="Ver ficha completa"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
          >
            Fechar Comparador
          </button>
        </div>
      </div>
    </div>
  );
}
