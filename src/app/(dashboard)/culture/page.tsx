import React from "react";
import {
  HeartHandshake,
  Smile,
  Sparkles,
  MessageSquare,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Conecta Cultura (Clima & eNPS) | Maître Conecta",
  description: "Pesquisas de Clima Organizacional, eNPS, Engajamento e Rituais de Cultura",
};

export default function CulturePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
              <HeartHandshake size={13} /> Conecta Cultura
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fase P4 Roadmap</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Clima, Engajamento & Cultura
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Pesquisas de pulso contínuas, cálculo de eNPS corporativo, reconhecimento entre pares e rituais de valores.
          </p>
        </div>
      </div>

      {/* Cards de Recursos do Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
            <Smile size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Pesquisas de Clima & eNPS</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Métricas anônimas de satisfação de equipe, promotores de marca empregadora e diagnóstico de pontos de atenção.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-rose-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Mural de Reconhecimento</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Feed interativo de elogios entre pares baseado nos valores da empresa, gerando engajamento e senso de pertencimento.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-amber-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Pesquisas de Pulso Rápidas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Enquetes rápidas semanais ou quinzenais para medir o impacto de mudanças, projetos e bem-estar.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-purple-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
