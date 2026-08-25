import React from "react";
import {
  TrendingUp,
  Target,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Conecta Desenvolvimento (Desempenho & PDI) | Maître Conecta",
  description: "Gestão de Competências, Ciclos de Avaliação 360°, Feedback Contínuo e PDI",
};

export default function DevelopmentPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              <TrendingUp size={13} /> Conecta Desenvolvimento
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fase P3 Roadmap</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Competências, Desempenho & PDI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Ciclos de avaliação de performance 9-Box, matriz de competências técnicas/comportamentais e Planos de Desenvolvimento Individual.
          </p>
        </div>
      </div>

      {/* Cards de Recursos do Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Matriz 9-Box & Calibração</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Mapeamento visual do cruzamento entre potencial de liderança e entregas de metas/desempenho técnico.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-indigo-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Feedback Contínuo 1:1</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Rituais estruturados de conversas de alinhamento, elogios públicos e planos de ação em tempo real.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-purple-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">PDI (Plano de Ação)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Metas de desenvolvimento de soft & hard skills conectadas diretamente com as trilhas de aprendizagem Maître.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-maitre-gold flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
