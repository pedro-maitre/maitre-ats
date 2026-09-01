"use client";

import React, { useState } from "react";
import {
  X,
  MessageCircle,
  Send,
  Copy,
  Check,
  Sparkles,
  Calendar,
  UserCheck,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { logWhatsAppActivity } from "@/app/(dashboard)/jobs/[id]/board/actions";

interface WhatsAppQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  candidatePhone: string | null;
  jobTitle: string;
  companyName: string;
}

type TemplateKey = "INTERVIEW" | "NEXT_STAGE" | "OFFER_ALIGNMENT" | "INITIAL_CONTACT" | "CUSTOM";

export default function WhatsAppQuickActionModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  candidatePhone,
  jobTitle,
  companyName,
}: WhatsAppQuickActionModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("INTERVIEW");
  const [customMessage, setCustomMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const firstName = candidateName ? candidateName.split(" ")[0] : "Candidato";

  // Templates pré-definidos dinâmicos
  const templates: Record<TemplateKey, { title: string; desc: string; icon: any; text: string }> = {
    INTERVIEW: {
      title: "Convite para Entrevista",
      desc: "Convidar o candidato para uma etapa de entrevista",
      icon: Calendar,
      text: `Olá, ${firstName}! Tudo bem? Aqui é da equipe de Atração & Seleção da ${companyName}.\n\nGostamos muito do seu perfil para a vaga de *${jobTitle}* e gostaríamos de agendar uma conversa. Você teria disponibilidade nos próximos dias para realizarmos essa etapa?`,
    },
    NEXT_STAGE: {
      title: "Avanço de Etapa",
      desc: "Informar que o candidato avançou no processo",
      icon: Sparkles,
      text: `Olá, ${firstName}! Boas notícias! 🎉\n\nVocê avançou para a próxima etapa do processo seletivo para a posição de *${jobTitle}* na ${companyName}.\n\nEm breve entraremos em contato com as instruções detalhadas dos próximos passos. Parabéns!`,
    },
    OFFER_ALIGNMENT: {
      title: "Alinhamento de Proposta",
      desc: "Iniciar o alinhamento da proposta final de contratação",
      icon: UserCheck,
      text: `Olá, ${firstName}! Como vai? Aqui é da equipe da ${companyName}.\n\nChegamos na reta final do processo seletivo para *${jobTitle}* e gostaríamos de alinhar os detalhes da nossa proposta com você. Podemos conversar hoje?`,
    },
    INITIAL_CONTACT: {
      title: "Primeiro Contato / Triagem",
      desc: "Confirmar interesse e disponibilidade",
      icon: Clock,
      text: `Olá, ${firstName}! Vimos sua candidatura para a vaga de *${jobTitle}* na ${companyName} e gostaríamos de validar algumas informações rápidas sobre sua disponibilidade e expectativas. Podemos bater um papo rápido?`,
    },
    CUSTOM: {
      title: "Mensagem Personalizada",
      desc: "Escrever um texto livre customizado",
      icon: MessageCircle,
      text: customMessage || `Olá, ${firstName}! Entramos em contato referente ao processo de *${jobTitle}* na ${companyName}.`,
    },
  };

  const currentText =
    selectedTemplate === "CUSTOM"
      ? customMessage || templates.CUSTOM.text
      : templates[selectedTemplate].text;

  // Sanitiza número de telefone para formato internacional WhatsApp (ex: 5511999999999)
  const cleanPhone = (phoneStr: string | null) => {
    if (!phoneStr) return "";
    let digits = phoneStr.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 11) {
      digits = "55" + digits;
    }
    return digits;
  };

  const formattedPhone = cleanPhone(candidatePhone);
  const isValidPhone = formattedPhone.length >= 12;

  const handleSendWhatsApp = async () => {
    if (!isValidPhone) return;

    setIsSending(true);
    try {
      // Registra a atividade no histórico do candidato
      await logWhatsAppActivity({
        applicationId,
        candidatePhone: formattedPhone,
        templateType: selectedTemplate,
        messageText: currentText,
      });

      const encodedMessage = encodeURIComponent(currentText);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

      // Abre o WhatsApp Web / App em nova aba
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      onClose();
    } catch (err) {
      console.error("Erro ao registrar ação de WhatsApp:", err);
      // Mesmo se falhar o log, permite abrir o WhatsApp
      const encodedMessage = encodeURIComponent(currentText);
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Ação Rápida WhatsApp
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/40 border border-emerald-400/30">
                  1-Click
                </span>
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Contato com {candidateName} • Vaga: {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Validação de Telefone */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isValidPhone ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-amber-500 ring-4 ring-amber-500/20"
                }`}
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Telefone de Destino:
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {candidatePhone ? candidatePhone : "Não informado no currículo"}
              </span>
            </div>
            {isValidPhone && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Pronto para envio (+{formattedPhone})
              </span>
            )}
          </div>

          {/* Seleção de Templates */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Selecione o Modelo de Mensagem:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(templates) as TemplateKey[]).map((key) => {
                const item = templates[key];
                const IconComponent = item.icon;
                const isSelected = selectedTemplate === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplate(key)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isSelected ? "text-emerald-900 dark:text-emerald-300" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prévia da Mensagem / Edição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Prévia da Mensagem (pode ser editada):
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? "Copiado!" : "Copiar texto"}
              </button>
            </div>

            {selectedTemplate === "CUSTOM" ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escreva sua mensagem personalizada..."
                rows={5}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs font-sans text-emerald-950 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                {currentText}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isValidPhone || isSending}
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSending ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Abrir no WhatsApp</span>
                  <ExternalLink size={13} className="opacity-75" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
