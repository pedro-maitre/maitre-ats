import React from "react";
import {
  Compass,
  MapPin,
  TrendingUp,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Conecta Carreiras (Mobilidade & Sucessão) | Maître Conecta",
  description: "Mobilidade Interna, Recrutamento Interno e Mapeamento de Sucessão para Posições Críticas",
};

export default function CareersHubPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 text-violet-500 dark:text-violet-400 text-xs font-bold uppercase tracking-wider border border-violet-500/30">
              <Compass size={13} /> Conecta Carreiras
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fase P3 Roadmap</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Mobilidade Interna & Sucessão
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Gestão de planos de sucessão para cadeiras críticas, trilhas de carreira em Y e job rotation.
          </p>
        </div>
      </div>

      {/* Cards de Recursos do Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-500 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Mapa de Sucessão</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Mapeamento de sucessores imediatos (prontos em 3 a 12 meses) para mitigar riscos de perda de talentos-chave.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-violet-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold">
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Recrutamento Interno</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Publicação de oportunidades exclusivas para colaboradores antes da abertura ao mercado externo.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-indigo-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <Compass size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Trilhas de Carreira em Y / W</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Estruturas claras de progressão horizontal e vertical entre os caminhos de Especialista Técnico e Liderança.
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
