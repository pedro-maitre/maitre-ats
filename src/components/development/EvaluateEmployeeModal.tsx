/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Target,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  User,
  Zap,
  HelpCircle,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import {
  savePerformanceEvaluation,
  saveDevelopmentPlan,
  calculateNineBoxPosition,
  NineBoxPosition,
} from "@/app/(dashboard)/development/actions";

export const NINE_BOX_CONFIG: Record<
  NineBoxPosition,
  { title: string; subtitle: string; bg: string; text: string; border: string; icon: string; action: string }
> = {
  TOP_TALENT: {
    title: "⭐ Talento Top / Estrela",
    subtitle: "Alto Desempenho + Alto Potencial",
    bg: "bg-emerald-500/15 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: "⭐",
    action: "Retenção prioritária, plano de sucessão imediato e bônus de performance.",
  },
  FUTURE_LEADER: {
    title: "🚀 Futuro Líder / Crescimento",
    subtitle: "Médio Desempenho + Alto Potencial",
    bg: "bg-sky-500/15 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/30",
    icon: "🚀",
    action: "Aceleração de projetos complexos e mentoria de liderança.",
  },
  ENIGMA: {
    title: "💎 Enigma / Diamante Bruto",
    subtitle: "Baixo Desempenho + Alto Potencial",
    bg: "bg-purple-500/15 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    icon: "💎",
    action: "Investigar causas de baixo resultado (engajamento, alocação ou liderança).",
  },
  HIGH_PERFORMER: {
    title: "🏆 Alto Desempenho / Pilar",
    subtitle: "Alto Desempenho + Médio Potencial",
    bg: "bg-teal-500/15 dark:bg-teal-950/40",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
    icon: "🏆",
    action: "Manter motivado, delegar responsabilidades técnicas e reconhecimento contínuo.",
  },
  KEY_PROFESSIONAL: {
    title: "🎯 Profissional Chave / Mantenedor",
    subtitle: "Médio Desempenho + Médio Potencial",
    bg: "bg-blue-500/15 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: "🎯",
    action: "PDI com metas intermediárias para elevação de entrega.",
  },
  DILEMMA: {
    title: "⚠️ Dilema / Questionável",
    subtitle: "Baixo Desempenho + Médio Potencial",
    bg: "bg-amber-500/15 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: "⚠️",
    action: "Plano de recuperação (PIP) com prazo de 60 a 90 dias.",
  },
  TECHNICAL_EXPERT: {
    title: "🛡️ Especialista / Confiável",
    subtitle: "Alto Desempenho + Baixo Potencial",
    bg: "bg-indigo-500/15 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    icon: "🛡️",
    action: "Valorizar domínio técnico, sem pressão para cargos de gestão/liderança.",
  },
  EFFECTIVE: {
    title: "⏳ Profissional Eficaz / Alerta",
    subtitle: "Médio Desempenho + Baixo Potencial",
    bg: "bg-slate-500/15 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-500/30",
    icon: "⏳",
    action: "Monitorar consistência e reciclagem de conhecimentos.",
  },
  RISK: {
    title: "🛑 Risco / Ação Imediata",
    subtitle: "Baixo Desempenho + Baixo Potencial",
    bg: "bg-rose-500/15 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    icon: "🛑",
    action: "Feedback formal de desalinhamento ou transição de desligamento.",
  },
};

interface EvaluateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    candidateId: string;
    organizationId: string;
    name: string;
    jobTitle: string;
    department: string | null;
    currentEvaluation?: {
      performanceScore: number;
      potentialScore: number;
      boxPosition: string;
      competencies?: Record<string, number>;
      strengths?: string;
      improvements?: string;
    } | null;
  } | null;
  onSuccess?: () => void;
}

export default function EvaluateEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EvaluateEmployeeModalProps) {
  const [performance, setPerformance] = useState(
    employee?.currentEvaluation?.performanceScore || 3.5
  );
  const [potential, setPotential] = useState(
    employee?.currentEvaluation?.potentialScore || 3.5
  );

  const [competencies, setCompetencies] = useState<Record<string, number>>({
    leadership: 3.5,
    communication: 4.0,
    execution: 3.5,
    resilience: 4.0,
    autonomy: 3.5,
  });

  const [strengths, setStrengths] = useState(
    employee?.currentEvaluation?.strengths || "Excelente compromisso e domínio técnico das entregas."
  );
  const [improvements, setImprovements] = useState(
    employee?.currentEvaluation?.improvements || "Desenvolver visão holística de negócio e liderança de projetos transversais."
  );

  // PDI rápido
  const [createPdi, setCreatePdi] = useState(false);
  const [pdiTitle, setPdiTitle] = useState("");
  const [pdiCategory, setPdiCategory] = useState("LEADERSHIP");
  const [pdiDate, setPdiDate] = useState("");

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !employee) return null;

  const currentBox = calculateNineBoxPosition(performance, potential);
  const boxInfo = NINE_BOX_CONFIG[currentBox];

  const handleCompetencyChange = (key: string, val: number) => {
    setCompetencies((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    startTransition(async () => {
      setFeedbackError(null);
      setFeedbackSuccess(null);

      // 1. Salva a Avaliação 9-Box
      const res = await savePerformanceEvaluation({
        candidateId: employee.candidateId,
        organizationId: employee.organizationId,
        performanceScore: performance,
        potentialScore: potential,
        competencies,
        strengths,
        improvements,
      });

      if (!res.success) {
        setFeedbackError(res.error || "Erro ao salvar avaliação.");
        return;
      }

      // 2. Se optou por criar meta de PDI
      if (createPdi && pdiTitle.trim()) {
        await saveDevelopmentPlan({
          candidateId: employee.candidateId,
          organizationId: employee.organizationId,
          title: pdiTitle,
          category: pdiCategory,
          targetDate: pdiDate || undefined,
        });
      }

      setFeedbackSuccess("Avaliação 9-Box e competências salvas com sucesso!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Calibração 9-Box: {employee.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cargo: <span className="text-slate-200 font-semibold">{employee.jobTitle}</span> • {employee.department || "Geral"}
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

        {/* Feedback */}
        {feedbackSuccess && (
          <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} /> {feedbackSuccess}
          </div>
        )}
        {feedbackError && (
          <div className="px-6 py-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> {feedbackError}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card do Quadrante Dinâmico Resultante */}
          <div className={`p-5 rounded-2xl border ${boxInfo.bg} ${boxInfo.border} space-y-2 transition-all`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${boxInfo.text}`}>
                Classificação 9-Box Atual
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Entrega: {performance.toFixed(1)} / Potencial: {potential.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {boxInfo.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Plano de Ação Recomendado:</strong> {boxInfo.action}
            </p>
          </div>

          {/* Sliders dos 2 Eixos Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            {/* Eixo 1: Desempenho / Entregas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">1. Desempenho / Entregas</span>
                <span className="font-mono text-indigo-500 font-black">{performance.toFixed(1)} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={performance}
                onChange={(e) => setPerformance(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span>Baixo (&lt;2.6)</span>
                <span>Médio (2.6-3.8)</span>
                <span>Alto (&gt;3.8)</span>
              </div>
            </div>

            {/* Eixo 2: Potencial / Liderança */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">2. Potencial & Agilidade de Aprendizado</span>
                <span className="font-mono text-purple-500 font-black">{potential.toFixed(1)} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={potential}
                onChange={(e) => setPotential(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span>Baixo (&lt;2.6)</span>
                <span>Médio (2.6-3.8)</span>
                <span>Alto (&gt;3.8)</span>
              </div>
            </div>
          </div>

          {/* Radar de Competências */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Avaliação de Competências (1 a 5)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "leadership", label: "Liderança & Influência" },
                { key: "communication", label: "Comunicação & Relacionamento" },
                { key: "execution", label: "Entrega Técnica & Qualidade" },
                { key: "resilience", label: "Resiliência & Gestão de Crise" },
                { key: "autonomy", label: "Autonomia & Proatividade" },
              ].map((comp) => (
                <div
                  key={comp.key}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {comp.label}
                  </span>
                  <select
                    value={competencies[comp.key] || 3.5}
                    onChange={(e) => handleCompetencyChange(comp.key, parseFloat(e.target.value))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="1.0">1.0 - Insuficiente</option>
                    <option value="2.0">2.0 - Em Desenvolvimento</option>
                    <option value="3.0">3.0 - Atende ao Esperado</option>
                    <option value="4.0">4.0 - Supera o Esperado</option>
                    <option value="5.0">5.0 - Referência / Excepcional</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Pontos Fortes & Oportunidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pontos Fortes Observados:
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Principais virtudes e entregas do colaborador..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Oportunidades de Desenvolvimento:
              </label>
              <textarea
                rows={2}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Pontos prioritários para evolução no próximo ciclo..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Vincular Meta de PDI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createPdi}
                  onChange={(e) => setCreatePdi(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  🎯 Criar meta imediata no Plano de Desenvolvimento Individual (PDI)
                </span>
              </label>
            </div>

            {createPdi && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-in fade-in">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={pdiTitle}
                    onChange={(e) => setPdiTitle(e.target.value)}
                    placeholder="Título da Meta (ex: Concluir certificação em Liderança Estratégica)"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    value={pdiDate}
                    onChange={(e) => setPdiDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Salvar Avaliação 9-Box
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
