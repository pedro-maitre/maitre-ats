import React from "react";
import {
  Sparkles,
  FileCheck,
  FolderGit2,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

export const metadata = {
  title: "Conecta Consultoria (Projetos & Entregáveis) | Maître Conecta",
  description: "Projetos Estratégicos, Entregáveis e Acompanhamento Consultivo da Maître",
};

export default function ConsultingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
              <Sparkles size={13} /> Conecta Consultoria
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Projetos Especializados Maître</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Governança de Projetos & Entregáveis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Acompanhamento de consultorias em Hunting Executivo, Diagnóstico Organizacional, Cargos & Salários e DHO.
          </p>
        </div>
      </div>

      {/* Cards de Recursos do Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <FolderGit2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Projetos & Entregáveis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Cronograma de marcos, relatórios de entregáveis e atas de alinhamento com a equipe de consultores Maître.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-maitre-gold flex items-center gap-1">
            <span>Serviço Integrado Maître</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Cargos & Salários</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Tabelas salariais calibradas com pesquisas de mercado, faixas de remuneração e descrição formal de funções.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-blue-500 flex items-center gap-1">
            <span>Serviço Integrado Maître</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Hunting Executivo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Mapeamento de executivos C-Level, board members e posições estratégicas com pareceres confidenciais.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-emerald-500 flex items-center gap-1">
            <span>Serviço Integrado Maître</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
