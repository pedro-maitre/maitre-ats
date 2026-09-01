"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FEEDBACK_TEMPLATES,
  FEEDBACK_CATEGORIES,
  FeedbackTemplate,
  applyTemplateVariables,
  generateWhatsAppLink,
  getUnfilledVariables,
  sanitizeBrazilianPhone,
  ANTI_DISCRIMINATION_RULES,
} from "@/lib/feedback-templates";
import { logFeedbackSentAction } from "@/app/actions/feedback-actions";
import {
  X,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Phone,
  ShieldCheck,
  Info,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Search,
} from "lucide-react";

interface WhatsAppFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string;
  };
  job?: {
    id: string;
    title: string;
    organizationName?: string;
    location?: string | null;
  };
  stageName?: string;
  applicationId?: string;
  defaultTemplateId?: string;
  currentRecruiterName?: string;
}

export default function WhatsAppFeedbackModal({
  isOpen,
  onClose,
  candidate,
  job,
  stageName,
  applicationId,
  defaultTemplateId,
  currentRecruiterName,
}: WhatsAppFeedbackModalProps) {
  // Estado do template selecionado
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    defaultTemplateId || "confirmacao-recebimento"
  );
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"compose" | "guidelines">("compose");

  // Estado das variáveis editáveis
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [customPhone, setCustomPhone] = useState(candidate.phone || "");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fecha o modal ao pressionar a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Inicializa variáveis com defaults inteligentes
  useEffect(() => {
    if (isOpen) {
      const defaultRecruiter = currentRecruiterName || "Recrutador Maître";
      const defaultCompany = job?.organizationName || "Maître Consultoria";
      const defaultJobTitle = job?.title || "Vaga em Seleção";
      const defaultStage = stageName || "Triagem Curricular";

      setCustomPhone(candidate.phone || "");

      setVariables((prev) => ({
        NOME: candidate.firstName || "Candidato(a)",
        RECRUTADOR: defaultRecruiter,
        EMPRESA_CONTRATANTE: defaultCompany,
        ORGANIZACAO: defaultCompany,
        VAGA: defaultJobTitle,
        VAGA_ORIGINAL: defaultJobTitle,
        ETAPA_NOME: defaultStage,
        LOCAL_MODALIDADE: job?.location || "Híbrido / Presencial",
        HORARIO: "08:00 às 18:00 (Seg a Sex)",
        REMUNERACAO: "Compatível com o mercado + benefícios",
        ORIGEM_CONTATO: "Hunting especializado no LinkedIn",
        RESUMO_ATIVIDADES: "Atuação estratégica nas rotinas da posição",
        DATA_PRAZO: "5 dias úteis",
        DATA: new Date(Date.now() + 86400000 * 2).toLocaleDateString("pt-BR"),
        NOVA_DATA: new Date(Date.now() + 86400000 * 5).toLocaleDateString("pt-BR"),
        DATA_ANTERIOR: new Date().toLocaleDateString("pt-BR"),
        DATA_HORARIO_LIMITE: `${new Date(Date.now() + 86400000 * 2).toLocaleDateString("pt-BR")} às 18h`,
        FORMATO: "On-line (Google Meet)",
        LOCAL_OU_LINK: "meet.google.com/xyz-maitre",
        DURACAO_ESTIMADA: "45 minutos",
        PRAZO_RESPOSTA: "até amanhã às 12h",
        LINK_PRIVACIDADE: "https://maitreconecta.vercel.app/privacidade",
        CONTATO_PRIVACIDADE: "privacidade@maitreconsultoria.com.br",
        PRAZO_RETENCAO: "12 meses",
        CRITERIO_OBJETIVO: "experiência comprovada nas ferramentas da vaga",
        CRITERIO_PRIORIZADO: "vivência prática com o escopo técnico exigido",
        PONTO_POSITIVO_REAL: "sua sólida comunicação e clareza nas respostas",
        PONTOS_FORTES: "sua dedicação e excelente postura profissional",
        CRITERIO_DECISAO: "experiência prévia em projetos similares",
        ITENS_PENDENTES: "• Comprovante de formação\n• Portfólio atualizado",
        ...prev,
      }));

      if (defaultTemplateId) {
        setSelectedTemplateId(defaultTemplateId);
      }
    }
  }, [isOpen, candidate, job, stageName, currentRecruiterName, defaultTemplateId]);

  // Template ativo atual
  const activeTemplate = useMemo(() => {
    return (
      FEEDBACK_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      FEEDBACK_TEMPLATES[0]
    );
  }, [selectedTemplateId]);

  // Mensagem final formatada
  const finalMessage = useMemo(() => {
    return applyTemplateVariables(activeTemplate.rawTemplate, variables);
  }, [activeTemplate, variables]);

  // Variáveis pendentes de substituição
  const unfilledVariables = useMemo(() => {
    return getUnfilledVariables(finalMessage);
  }, [finalMessage]);

  // Filtro de templates
  const filteredTemplates = useMemo(() => {
    return FEEDBACK_TEMPLATES.filter((t) => {
      const matchesCategory =
        selectedCategory === "ALL" || t.category === selectedCategory;
      const matchesSearch =
        t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.whenToUse.toLowerCase().includes(searchFilter.toLowerCase()) ||
        `#${t.number}`.includes(searchFilter);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchFilter]);

  // Atualiza campo de variável
  const handleVariableChange = (key: string, val: string) => {
    setVariables((prev) => ({ ...prev, [key]: val }));
  };

  // Copia mensagem para a área de transferência
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      // Registra log da atividade
      await logFeedbackSentAction({
        candidateId: candidate.id,
        applicationId,
        templateId: activeTemplate.id,
        templateNumber: activeTemplate.number,
        templateTitle: activeTemplate.title,
        messageText: finalMessage,
        phone: customPhone,
        stageName,
        jobId: job?.id,
      });

      setStatusMessage({
        type: "success",
        text: "Mensagem copiada e envio registrado no histórico do candidato!",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage({ type: "error", text: "Não foi possível copiar o texto." });
    }
  };

  // Disparo via WhatsApp Web / App
  const handleOpenWhatsApp = async () => {
    if (!customPhone) {
      setStatusMessage({ type: "error", text: "Informe um número de telefone com DDD." });
      return;
    }

    setIsSubmitting(true);
    try {
      // Registra a atividade no banco de dados para rastreabilidade
      await logFeedbackSentAction({
        candidateId: candidate.id,
        applicationId,
        templateId: activeTemplate.id,
        templateNumber: activeTemplate.number,
        templateTitle: activeTemplate.title,
        messageText: finalMessage,
        phone: customPhone,
        stageName,
        jobId: job?.id,
      });

      // Gera link e abre WhatsApp
      const waUrl = generateWhatsAppLink(customPhone, finalMessage);
      window.open(waUrl, "_blank", "noopener,noreferrer");

      setStatusMessage({
        type: "success",
        text: "WhatsApp aberto e comunicação registrada com sucesso!",
      });
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Falha ao registrar envio." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <MessageSquare size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="feedback-modal-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Central de Feedback & WhatsApp
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Manual Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidato: <strong className="text-slate-700 dark:text-slate-300">{candidate.firstName} {candidate.lastName}</strong>
                {job?.title && <span> • Vaga: <strong className="text-slate-700 dark:text-slate-300">{job.title}</strong></span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "compose" ? "guidelines" : "compose")}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={14} className="text-maitre-gold" />
              <span>{activeTab === "compose" ? "Guia LGPD & Ética" : "Voltar à Mensagem"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {activeTab === "guidelines" ? (
          /* Aba de Diretrizes e LGPD */
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Princípios Éticos e Legais (Lei 9.029/95 & LGPD)
                </h4>
                <p className="text-xs leading-relaxed">
                  Todas as comunicações devem se basear exclusivamente em requisitos técnicos, comportamentais e operacionais objetivos e comprováveis relacionados à vaga.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                  <X size={16} /> Expressões e Motivos Proibidos
                </h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">❌ “Não tem o perfil da empresa” / “Não encaixou na cultura”</li>
                  <li className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">❌ “Mora muito longe” ou “Mora em zona rural”</li>
                  <li className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">❌ “É jovem/velho demais” ou questões de idade</li>
                  <li className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">❌ Estado civil, filhos, gravidez ou situação familiar</li>
                  <li className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">❌ “Habilidade desqualificadora” ou “Escolhemos alguém melhor”</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <Check size={16} /> Alternativas Profissionais Recomendadas
                </h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">✅ “Neste processo, o critério [X] teve maior peso.”</li>
                  <li className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">✅ “Para esta posição, priorizamos experiência prática em [X].”</li>
                  <li className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">✅ “Não identificamos no currículo informações suficientes sobre [X].”</li>
                  <li className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">✅ “Outros perfis apresentaram maior aderência ao requisito [X].”</li>
                  <li className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">✅ “A decisão está relacionada às necessidades específicas desta vaga.”</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-200">📌 Regra de Ouro do Feedback Maître:</h5>
              <p>
                O silêncio nunca deve substituir o feedback. Quanto mais avançada a etapa do candidato, mais individualizado e rápido deve ser o retorno.
              </p>
            </div>
          </div>
        ) : (
          /* Aba Principal de Composição */
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
            {/* Coluna Esquerda: Seletor de Modelo e Edição de Campos (7 cols) */}
            <div className="lg:col-span-6 xl:col-span-6 p-5 overflow-y-auto border-r border-slate-100 dark:border-slate-800 space-y-5">
              {/* Seleção do Template */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Selecione o Modelo (#{activeTemplate.number})
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {FEEDBACK_TEMPLATES.length} modelos disponíveis
                  </span>
                </div>

                {/* Filtro de Categoria e Busca */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ALL">📁 Todas as Categorias</option>
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar modelo..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Dropdown de Modelos */}
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full text-xs font-bold bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-emerald-950 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {filteredTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      #{tpl.number} — {tpl.title}
                    </option>
                  ))}
                </select>

                {/* Dica de Quando Usar */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Quando utilizar:</strong> {activeTemplate.whenToUse}
                  </p>
                  {activeTemplate.carefulNotes && (
                    <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{activeTemplate.carefulNotes}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Telefone de Destino */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-500" />
                  Telefone / WhatsApp do Candidato
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[11px] px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono flex items-center">
                    DDI +55
                  </span>
                </div>
              </div>

              {/* Campos Dinâmicos do Template */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-maitre-gold" />
                    Personalizar Variáveis do Modelo
                  </label>
                  <span className="text-[10px] text-slate-400">Preenchimento automático</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {activeTemplate.defaultVariables.map((variableKey) => {
                    const isLong = [
                      "CRITERIO_OBJETIVO",
                      "CRITERIO_PRIORIZADO",
                      "PONTO_POSITIVO_REAL",
                      "PONTOS_FORTES",
                      "ITENS_PENDENTES",
                      "RESUMO_ATIVIDADES",
                      "INSTRUCOES_LINK",
                    ].includes(variableKey);

                    return (
                      <div
                        key={variableKey}
                        className={`space-y-1 ${isLong ? "sm:col-span-2" : "col-span-1"}`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                          [{variableKey}]
                        </span>
                        {isLong ? (
                          <textarea
                            rows={2}
                            value={variables[variableKey] || ""}
                            onChange={(e) =>
                              handleVariableChange(variableKey, e.target.value)
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={variables[variableKey] || ""}
                            onChange={(e) =>
                              handleVariableChange(variableKey, e.target.value)
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Pré-visualização WhatsApp Real & Disparo (6 cols) */}
            <div className="lg:col-span-6 xl:col-span-6 p-5 bg-slate-100/70 dark:bg-slate-950/50 flex flex-col justify-between space-y-4">
              <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <MessageSquare size={13} className="text-emerald-500" />
                    Pré-visualização do WhatsApp
                  </div>
                  {unfilledVariables.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      {unfilledVariables.length} campo(s) pendente(s)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCheck size={12} />
                      Pronto para envio
                    </span>
                  )}
                </div>

                {/* Balão WhatsApp estilizado */}
                <div className="flex-1 rounded-2xl bg-[#EFEAE2] dark:bg-[#0b141a] p-3 sm:p-4 border border-slate-200 dark:border-slate-800 overflow-y-auto relative shadow-inner flex flex-col justify-start">
                  {/* Cabeçalho do Chat */}
                  <div className="mb-3 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#202c33]/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      {candidate.firstName} {candidate.lastName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {customPhone ? sanitizeBrazilianPhone(customPhone) : "Sem telefone"}
                    </span>
                  </div>

                  {/* Mensagem em Balão */}
                  <div className="self-end max-w-[95%] bg-[#D9FDD3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tr-sm shadow-md border border-emerald-200 dark:border-emerald-800/40 text-xs leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                    {finalMessage}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-800/70 dark:text-emerald-200/60 pt-1">
                      <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-300" />
                    </div>
                  </div>
                </div>

                {/* Alerta se houver campos [VARIAVEL] não substituídos */}
                {unfilledVariables.length > 0 && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Info size={14} className="shrink-0 text-amber-500" />
                    <span>
                      Atenção: Substitua as tags {unfilledVariables.join(", ")} antes do envio para garantir a personalização profissional.
                    </span>
                  </div>
                )}
              </div>

                {/* Botões de Ação */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-500" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="text-slate-500" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  disabled={isSubmitting || !customPhone}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black tracking-wide transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? "Registrando..." : "Enviar via WhatsApp Web"}</span>
                  <ExternalLink size={13} className="opacity-70" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
