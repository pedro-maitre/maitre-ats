import React from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  Video,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Conecta Aprendizagem (LMS & Treinamentos) | Maître Conecta",
  description: "Trilhas de Capacitação Corporativa, Cursos, Certificados e Onboarding",
};

export default function LearningPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
              <GraduationCap size={13} /> Conecta Aprendizagem
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fase P4 Roadmap</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Treinamentos & Trilhas de Conhecimento
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Plataforma corporativa de capacitação (LMS), catálogo de cursos executivos e emissão de certificados.
          </p>
        </div>
      </div>

      {/* Cards de Recursos do Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center font-bold">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Trilhas de Onboarding</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Jornadas automáticas de ambientação de novos contratados, integradas com a conversão do ATS.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-cyan-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
            <Video size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Catálogo de Cursos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Biblioteca de microlearning em liderança, atendimento ao cliente, compliance e vendas da metodologia Maître.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-blue-500 flex items-center gap-1">
            <span>Estruturado no ecossistema</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Certificados & Horas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Emissão automática de comprovantes de conclusão e controle de horas de treinamento para auditoria de RH.
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
