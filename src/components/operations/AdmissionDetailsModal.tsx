/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  Home,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Copy,
  Mail,
  Send,
  Building2,
  Briefcase,
  DollarSign,
  Lock,
} from "lucide-react";
import {
  validateDocument,
  requestRequirement,
  finalizeAdmission,
} from "@/app/(dashboard)/operations/actions";

export interface AdmissionDossierItem {
  id: string; // Conversion ID
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  jobTitle: string;
  department: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  admissionStatus: string;
  employeeCode: string | null;
  token: string | null;
  notes: string | null;
  salaryOffered: number | null;
  employmentType: string;
  convertedAt: string;
  additionalData: Record<string, any>;
  documents: {
    id: string;
    classification: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string | null;
    status: string;
    storageKey: string;
    rejectionReason: string | null;
    createdAt: string;
  }[];
}

interface AdmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: AdmissionDossierItem | null;
  onRefresh?: () => void;
}

const DOC_TITLES: Record<string, string> = {
  RG_CNH: "Documento de Identidade (RG ou CNH)",
  CPF: "Comprovante de CPF",
  CTPS: "Carteira de Trabalho Digital (CTPS)",
  RESIDENCIA: "Comprovante de Residência",
  DIPLOMA: "Comprovante de Escolaridade / Diploma",
  TITULO_ELEITOR: "Título de Eleitor & Quitação",
  ASO: "Atestado de Saúde Ocupacional (ASO)",
  DADOS_BANCARIOS: "Comprovante de Conta Bancária",
  CURRICULO: "Currículo Original",
};

export default function AdmissionDetailsModal({
  isOpen,
  onClose,
  dossier,
  onRefresh,
}: AdmissionDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"docs" | "personal" | "finalize">("docs");
  const [requirementText, setRequirementText] = useState("");
  const [isRequirementOpen, setIsRequirementOpen] = useState(false);
  const [customEmployeeCode, setCustomEmployeeCode] = useState(dossier?.employeeCode || "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !dossier) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicAdmissionUrl = dossier.token
    ? `${baseUrl}/carreiras/${dossier.organizationSlug}/admissao/${dossier.token}`
    : null;

  const handleCopyLink = () => {
    if (publicAdmissionUrl) {
      navigator.clipboard.writeText(publicAdmissionUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleValidateDoc = (docId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    startTransition(async () => {
      setActionError(null);
      const res = await validateDocument(docId, status, reason);
      if (res.success) {
        setActionSuccess(`Documento ${status === "APPROVED" ? "aprovado" : "marcado com exigência"}!`);
        if (onRefresh) onRefresh();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError(res.error || "Erro ao validar documento.");
      }
    });
  };

  const handleSendRequirement = () => {
    if (!requirementText.trim()) return;
    startTransition(async () => {
      setActionError(null);
      const res = await requestRequirement(dossier.id, requirementText);
      if (res.success) {
        setActionSuccess("Notificação de pendência enviada ao candidato!");
        setIsRequirementOpen(false);
        setRequirementText("");
        if (onRefresh) onRefresh();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError(res.error || "Erro ao solicitar exigência.");
      }
    });
  };

  const handleFinalize = () => {
    startTransition(async () => {
      setActionError(null);
      const res = await finalizeAdmission(dossier.id, customEmployeeCode);
      if (res.success) {
        setActionSuccess(`Admissão concluída com sucesso! Matrícula: ${res.employeeCode}`);
        if (onRefresh) onRefresh();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError(res.error || "Erro ao efetivar admissão.");
      }
    });
  };

  const formatCurrency = (val: number | null) => {
    if (!val) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Suporte a fechamento com a tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admission-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="admission-details-title" className="text-lg font-black tracking-tight text-white">
                  Dossiê de Admissão: {dossier.candidateName}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {dossier.admissionStatus === "MATRICULATED"
                    ? `Matriculado (${dossier.employeeCode})`
                    : dossier.admissionStatus === "APPROVED"
                    ? "Aprovado pelo DP"
                    : dossier.admissionStatus === "UNDER_REVIEW"
                    ? "Em Análise"
                    : dossier.admissionStatus === "REQUIREMENT"
                    ? "Exigência"
                    : "Pendente"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vaga: <span className="text-slate-200 font-semibold">{dossier.jobTitle}</span> • {dossier.organizationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {publicAdmissionUrl && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
                title="Copiar link do portal do candidato"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedLink ? "Link Copiado!" : "Link do Candidato"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Feedback */}
        {actionSuccess && (
          <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="px-6 py-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> {actionError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "docs"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FileText size={14} className={activeTab === "docs" ? "text-emerald-500" : ""} />
            Documentos & SHA-256 ({dossier.documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "personal"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <User size={14} className={activeTab === "personal" ? "text-emerald-500" : ""} />
            Ficha Cadastral & Bancária
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finalize")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "finalize"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck size={14} className={activeTab === "finalize" ? "text-emerald-500" : ""} />
            Conclusão & Matrícula
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Documentos */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Documentos Enviados pelo Candidato
                </h3>

                <button
                  type="button"
                  onClick={() => setIsRequirementOpen(!isRequirementOpen)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
                >
                  <AlertCircle size={13} />
                  <span>Solicitar Ajuste / Exigência</span>
                </button>
              </div>

              {/* Box de Exigência */}
              {isRequirementOpen && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Solicitar Reenvio de Documento
                  </h4>
                  <textarea
                    value={requirementText}
                    onChange={(e) => setRequirementText(e.target.value)}
                    placeholder="Descreva a exigência para o candidato (ex: O comprovante de residência enviado possui mais de 90 dias, favor reenviar conta recente)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-500/40 text-xs text-slate-800 dark:text-slate-200 focus:outline-none min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRequirementOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSendRequirement}
                      disabled={isPending || !requirementText.trim()}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      Notificar Candidato
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Documentos */}
              {dossier.documents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Nenhum documento anexado ainda
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    O candidato ainda não fez o upload dos documentos no portal de admissão.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dossier.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                            {DOC_TITLES[doc.classification] || doc.classification}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                            {doc.originalName}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {(doc.sizeBytes / 1024).toFixed(0)} KB • {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            doc.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : doc.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-sky-500/10 text-sky-500 border-sky-500/20"
                          }`}
                        >
                          {doc.status === "APPROVED"
                            ? "Aprovado"
                            : doc.status === "REJECTED"
                            ? "Exigência"
                            : "Pendente"}
                        </span>
                      </div>

                      {/* Hash SHA-256 */}
                      {doc.checksum && (
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
                          <span className="truncate">SHA-256: {doc.checksum.substring(0, 20)}...</span>
                          <ShieldCheck size={13} className="text-emerald-500 shrink-0 ml-1" />
                        </div>
                      )}

                      {/* Ações do DP para o documento */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                        {doc.storageKey && (
                          <a
                            href={doc.storageKey}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Visualizar
                          </a>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleValidateDoc(doc.id, "REJECTED", "Documento ilegível ou incorreto")}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all"
                          >
                            Rejeitar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleValidateDoc(doc.id, "APPROVED")}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Check size={12} /> Aprovar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Ficha Cadastral & Bancária */}
          {activeTab === "personal" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">CPF</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dossier.additionalData?.cpf || "Não informado"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">RG / Órgão</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dossier.additionalData?.rgNumber || "Não informado"}{" "}
                    {dossier.additionalData?.rgIssuer ? `(${dossier.additionalData.rgIssuer})` : ""}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Data de Nascimento</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dossier.additionalData?.birthDate || "Não informada"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">PIS / PASEP</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dossier.additionalData?.pisPasep || "Não informado"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Estado Civil</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dossier.additionalData?.maritalStatus || "Não informado"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Nome da Mãe</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {dossier.additionalData?.motherName || "Não informado"}
                  </p>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                  <Home size={14} className="text-sky-500" /> Endereço Residencial
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {dossier.additionalData?.addressStreet
                    ? `${dossier.additionalData.addressStreet}, Nº ${dossier.additionalData.addressNumber || "S/N"} - ${dossier.additionalData.addressDistrict || ""}, ${dossier.additionalData.addressCity || ""} / ${dossier.additionalData.addressState || ""} - CEP: ${dossier.additionalData.addressZip || ""}`
                    : "Endereço ainda não preenchido pelo contratado."}
                </p>
              </div>

              {/* Dados Bancários */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-500" /> Conta para Pagamento de Salário
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Banco:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {dossier.additionalData?.bankName || "Não informado"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Agência / Conta:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      Ag: {dossier.additionalData?.bankAgency || "—"} • CC: {dossier.additionalData?.bankAccount || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Chave PIX:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {dossier.additionalData?.pixKey || "Não informada"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Conclusão & Matrícula */}
          {activeTab === "finalize" && (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Efetivação de Matrícula no Core HR
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Ao concluir a admissão, o colaborador receberá o número oficial de matrícula e será ativado no módulo <strong>Conecta Pessoas</strong> para controle funcional e folha.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Número de Matrícula Oficial (ou deixe em branco para gerar automático):
                  </label>
                  <input
                    type="text"
                    value={customEmployeeCode}
                    onChange={(e) => setCustomEmployeeCode(e.target.value)}
                    placeholder="Ex: MAT-10045"
                    className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isPending}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Efetivando Matrícula...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} /> Confirmar Admissão e Gerar Matrícula
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
