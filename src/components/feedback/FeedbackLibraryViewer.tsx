"use client";

import React, { useState, useMemo } from "react";
import {
  FEEDBACK_TEMPLATES,
  FEEDBACK_CATEGORIES,
  FeedbackTemplate,
  FeedbackCategory,
  ANTI_DISCRIMINATION_RULES,
} from "@/lib/feedback-templates";
import {
  MessageSquare,
  Search,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Tag,
  CheckCircle2,
} from "lucide-react";
import WhatsAppFeedbackModal from "./WhatsAppFeedbackModal";
import EmptyState from "@/components/ui/EmptyState";

export default function FeedbackLibraryViewer() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Modal para teste rápido de envio
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testModalTemplateId, setTestModalTemplateId] = useState<string>("confirmacao-recebimento");

  // Filtra templates
  const filteredTemplates = useMemo(() => {
    return FEEDBACK_TEMPLATES.filter((tpl) => {
      const matchesCategory =
        selectedCategory === "ALL" || tpl.category === selectedCategory;
      const matchesSearch =
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.whenToUse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.rawTemplate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `#${tpl.number}`.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Copia o template padrão
  const handleCopyRaw = async (template: FeedbackTemplate) => {
    try {
      await navigator.clipboard.writeText(template.rawTemplate);
      setCopiedTemplateId(template.id);
      setTimeout(() => setCopiedTemplateId(null), 3000);
    } catch {
      console.error("Falha ao copiar template");
    }
  };

  const handleOpenTestModal = (templateId: string) => {
    setTestModalTemplateId(templateId);
    setIsTestModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <MessageSquare size={13} /> Central de Feedbacks & WhatsApp
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Manual Oficial Maître</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Manual & Biblioteca de Feedbacks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            23 modelos padronizados para todas as etapas da jornada seletiva, com respeito à LGPD e foco em experiência humanizada.
          </p>
        </div>

        {/* Botão de Guia Rápido */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{FEEDBACK_TEMPLATES.length} Modelos Ativos</span>
          </div>
        </div>
      </div>

      {/* Alerta de Governança e Diretrizes LGPD */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/20 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Conformidade LGPD & Ética</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Critérios estritamente objetivos. Nunca mencione estado civil, idade, localização de moradia ou características pessoais.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-maitre-gold shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Regra do Retorno Obrigatório</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              O silêncio nunca substitui o feedback. Envie atualizações mesmo quando a vaga estiver prorrogada ou suspensa.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Disparo com 1 Clique</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Gere mensagens instantâneas para WhatsApp Web ou copie diretamente para a área de transferência no ATS.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Seletor de Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Todos ({FEEDBACK_TEMPLATES.length})
          </button>
          {FEEDBACK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label.split("—")[0]}
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por termo, vaga, título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-3.5 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Grade de Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
          <EmptyState
            title="Nenhum modelo de feedback encontrado"
            description="Tente ajustar os termos de busca ou selecione outra categoria de processo seletivo."
            actionLabel="Limpar Filtros"
            onAction={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => {
            const isExpanded = expandedTemplateId === template.id;
            const isCopied = copiedTemplateId === template.id;

          return (
            <div
              key={template.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group"
            >
              <div className="space-y-3">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                      #{template.number}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {template.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400">
                        {FEEDBACK_CATEGORIES.find((c) => c.id === template.category)?.label}
                      </span>
                    </div>
                  </div>

                  {template.suggestedAtStatus && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {template.suggestedAtStatus}
                    </span>
                  )}
                </div>

                {/* Quando Usar */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Quando usar: </strong>
                  {template.whenToUse}
                  {template.carefulNotes && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-[11px] font-medium">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{template.carefulNotes}</span>
                    </div>
                  )}
                </div>

                {/* Preview da Mensagem */}
                <div className="relative">
                  <div
                    className={`rounded-2xl bg-[#EFEAE2] dark:bg-[#0b141a] p-3.5 border border-slate-200 dark:border-slate-800 text-xs whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 leading-relaxed transition-all ${
                      isExpanded ? "max-h-[500px]" : "max-h-[140px] overflow-hidden"
                    }`}
                  >
                    <div className="bg-[#D9FDD3] dark:bg-[#005c4b] p-3 rounded-2xl shadow-sm text-slate-900 dark:text-slate-100">
                      {template.rawTemplate}
                    </div>
                  </div>

                  {!isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#EFEAE2] dark:from-[#0b141a] to-transparent rounded-b-2xl pointer-events-none flex items-end justify-center pb-2">
                      <span className="text-[10px] font-bold text-slate-500">Clique em ver completo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação do Card */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedTemplateId(isExpanded ? null : template.id)
                  }
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} />
                      <span>Recolher</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      <span>Ver Texto Completo</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyRaw(template)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Copiar modelo bruto"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="text-[11px]">Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenTestModal(template.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    <span>Personalizar & Enviar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal de Envio e Personalização */}
      <WhatsAppFeedbackModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        candidate={{
          id: "preview-candidato-id",
          firstName: "Nome do Candidato",
          lastName: "Silva",
          phone: "11999999999",
          email: "candidato@exemplo.com.br",
        }}
        job={{
          id: "preview-job-id",
          title: "Vaga em Processo Seletivo",
          organizationName: "Empresa Contratante",
        }}
        stageName="Triagem"
        defaultTemplateId={testModalTemplateId}
        currentRecruiterName="Recrutador Maître"
      />
    </div>
  );
}
