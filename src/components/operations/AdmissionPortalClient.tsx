/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useTransition } from "react";
import {
  FileCheck,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Briefcase,
  DollarSign,
  User,
  CreditCard,
  Home,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  uploadAdmissionDocument,
  saveAdmissionPersonalData,
  AdmissionDocumentInfo,
} from "@/app/carreiras/[companySlug]/admissao/[token]/actions";

interface AdmissionPortalClientProps {
  initialData: {
    conversionId: string;
    applicationId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string | null;
    jobTitle: string;
    department: string | null;
    companyName: string;
    companySlug: string;
    primaryColor: string;
    logoUrl: string | null;
    admissionStatus: string;
    notes: string | null;
    employeeCode: string | null;
    salaryOffered: number | null;
    employmentType: string;
    documents: AdmissionDocumentInfo[];
    additionalData: Record<string, any>;
  };
  token: string;
}

const MANDATORY_DOCS = [
  {
    key: "RG_CNH",
    title: "Documento de Identidade (RG ou CNH)",
    desc: "Cópia legível da CNH ou RG (frente e verso).",
    required: true,
  },
  {
    key: "CPF",
    title: "Comprovante de Inscrição no CPF",
    desc: "Caso o número não conste na CNH ou RG.",
    required: true,
  },
  {
    key: "CTPS",
    title: "Carteira de Trabalho Digital (CTPS)",
    desc: "Exportação em PDF do aplicativo Carteira de Trabalho Digital.",
    required: true,
  },
  {
    key: "RESIDENCIA",
    title: "Comprovante de Residência",
    desc: "Conta de água, luz, gás ou internet emitida nos últimos 90 dias.",
    required: true,
  },
  {
    key: "DIPLOMA",
    title: "Comprovante de Escolaridade / Diploma",
    desc: "Certificado de conclusão de Ensino Médio, Técnico ou Superior.",
    required: true,
  },
  {
    key: "TITULO_ELEITOR",
    title: "Título de Eleitor & Quitação",
    desc: "Certidão de quitação eleitoral emitida no site do TSE.",
    required: false,
  },
  {
    key: "ASO",
    title: "Atestado de Saúde Ocupacional (ASO)",
    desc: "Atestado Admissional emitido pela clínica credenciada de medicina do trabalho.",
    required: false,
  },
  {
    key: "DADOS_BANCARIOS",
    title: "Comprovante de Conta Bancária",
    desc: "Extrato ou print do app bancário contendo agência e conta corrente para crédito de salário.",
    required: true,
  },
];

export default function AdmissionPortalClient({
  initialData,
  token,
}: AdmissionPortalClientProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"docs" | "personal">("docs");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Formulário de dados cadastrais
  const [formData, setFormData] = useState({
    cpf: data.additionalData?.cpf || "",
    rgNumber: data.additionalData?.rgNumber || "",
    rgIssuer: data.additionalData?.rgIssuer || "",
    birthDate: data.additionalData?.birthDate || "",
    maritalStatus: data.additionalData?.maritalStatus || "Solteiro(a)",
    motherName: data.additionalData?.motherName || "",
    pisPasep: data.additionalData?.pisPasep || "",
    phone: data.candidatePhone || data.additionalData?.phone || "",
    addressZip: data.additionalData?.addressZip || "",
    addressStreet: data.additionalData?.addressStreet || "",
    addressNumber: data.additionalData?.addressNumber || "",
    addressDistrict: data.additionalData?.addressDistrict || "",
    addressCity: data.additionalData?.addressCity || "",
    addressState: data.additionalData?.addressState || "SP",
    bankName: data.additionalData?.bankName || "",
    bankAgency: data.additionalData?.bankAgency || "",
    bankAccount: data.additionalData?.bankAccount || "",
    bankAccountType: data.additionalData?.bankAccountType || "CORRENTE",
    pixKey: data.additionalData?.pixKey || "",
    dependentsCount: data.additionalData?.dependentsCount || "0",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (classification: string, file: File) => {
    setUploadingKey(classification);
    setUploadError(null);

    const fd = new FormData();
    fd.append("token", token);
    fd.append("classification", classification);
    fd.append("file", file);

    try {
      const res = await uploadAdmissionDocument(fd);
      if (res.success && res.document) {
        // Atualiza a lista de documentos localmente
        setData((prev) => {
          const filtered = prev.documents.filter((d) => d.classification !== classification);
          return {
            ...prev,
            admissionStatus: prev.admissionStatus === "PENDING_DOCUMENTS" ? "UNDER_REVIEW" : prev.admissionStatus,
            documents: [res.document as AdmissionDocumentInfo, ...filtered],
          };
        });
      } else {
        setUploadError(res.error || "Erro no upload do arquivo.");
      }
    } catch {
      setUploadError("Falha de conexão durante o upload.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSavePersonalData = () => {
    startTransition(async () => {
      setSaveSuccessMessage(null);
      const res = await saveAdmissionPersonalData({
        token,
        additionalData: formData,
      });

      if (res.success) {
        setSaveSuccessMessage("Dados cadastrais salvos com sucesso!");
        setData((prev) => ({
          ...prev,
          additionalData: formData,
          admissionStatus: prev.admissionStatus === "PENDING_DOCUMENTS" ? "UNDER_REVIEW" : prev.admissionStatus,
        }));
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      } else {
        setUploadError(res.error || "Erro ao salvar dados.");
      }
    });
  };

  // Cálculo de progresso
  const uploadedClassifications = new Set(data.documents.map((d) => d.classification));
  const requiredCount = MANDATORY_DOCS.filter((d) => d.required).length;
  const uploadedRequiredCount = MANDATORY_DOCS.filter(
    (d) => d.required && uploadedClassifications.has(d.key)
  ).length;
  const progressPercent = Math.round((uploadedRequiredCount / requiredCount) * 100);

  const formatCurrency = (val: number | null) => {
    if (!val) return "A combinar";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner de Identidade da Empresa */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt={data.companyName}
                className="w-10 h-10 object-contain rounded-xl bg-white p-1"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md"
                style={{ backgroundColor: data.primaryColor }}
              >
                {data.companyName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base font-black text-white leading-tight">
                {data.companyName}
              </h1>
              <p className="text-xs text-slate-400">Portal de Admissão Digital do Colaborador</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Lock size={12} /> Conexão Segura SHA-256
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
        {/* Welcome Card & Vaga */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
                <Sparkles size={13} /> Parabéns pela sua contratação!
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Olá, {data.candidateName}!
              </h2>
              <p className="text-slate-300 text-sm max-w-xl">
                Seja muito bem-vindo(a) à equipe da <strong className="text-white">{data.companyName}</strong>. 
                Envie seus documentos e preencha sua ficha cadastral abaixo para formalizarmos sua admissão.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shrink-0 space-y-2 min-w-[220px]">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Briefcase size={14} className="text-maitre-gold" />
                <span className="font-semibold text-slate-200">{data.jobTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 size={14} className="text-slate-400" />
                <span>{data.department || "Departamento Geral"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <DollarSign size={14} className="text-emerald-400" />
                <span className="font-bold text-emerald-400">
                  {formatCurrency(data.salaryOffered)} ({data.employmentType})
                </span>
              </div>
            </div>
          </div>

          {/* Status do Processo Admissional */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {data.admissionStatus === "APPROVED" || data.admissionStatus === "MATRICULATED" ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
              ) : data.admissionStatus === "UNDER_REVIEW" ? (
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Status da Admissão
                </span>
                <p className="text-sm font-black text-white mt-0.5">
                  {data.admissionStatus === "MATRICULATED"
                    ? `🎉 Admissão Concluída (Matrícula: ${data.employeeCode || "Gerada"})`
                    : data.admissionStatus === "APPROVED"
                    ? "✅ Documentação 100% Aprovada pelo DP"
                    : data.admissionStatus === "UNDER_REVIEW"
                    ? "⏳ Documentos em Análise pelo Departamento Pessoal"
                    : data.admissionStatus === "REQUIREMENT"
                    ? "⚠️ Pendência de Documentos (Ajuste Solicitado)"
                    : "📝 Aguardando Envio dos Documentos"}
                </p>
              </div>
            </div>

            {/* Progresso de Envio */}
            <div className="space-y-1.5 min-w-[200px]">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Checklist Obrigatório</span>
                <span className="text-emerald-400 font-mono">{uploadedRequiredCount}/{requiredCount} ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {uploadError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-in fade-in">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {saveSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={`px-5 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all ${
              activeTab === "docs"
                ? "bg-slate-900 text-white border border-slate-700 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <FileText size={16} className={activeTab === "docs" ? "text-emerald-400" : ""} />
            1. Documentos Obrigatórios ({data.documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`px-5 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all ${
              activeTab === "personal"
                ? "bg-slate-900 text-white border border-slate-700 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <User size={16} className={activeTab === "personal" ? "text-emerald-400" : ""} />
            2. Dados Cadastrais & Bancários
          </button>
        </div>

        {/* TAB 1: Documentos Obrigatórios */}
        {activeTab === "docs" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <span>
                Formatos aceitos: <strong>PDF, JPG, PNG</strong> (máx. 15MB por arquivo). Todos os documentos são protegidos com hash de integridade SHA-256 e visualizados apenas pelo DP da sua empresa.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MANDATORY_DOCS.map((doc) => {
                const uploadedDoc = data.documents.find((d) => d.classification === doc.key);
                const isUploading = uploadingKey === doc.key;

                return (
                  <div
                    key={doc.key}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      uploadedDoc
                        ? "bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              uploadedDoc
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {uploadedDoc ? <Check size={14} /> : <FileText size={14} />}
                          </span>
                          <h4 className="text-sm font-black text-white">{doc.title}</h4>
                        </div>

                        {doc.required ? (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                            Obrigatório
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 shrink-0">
                            Opcional
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">{doc.desc}</p>
                    </div>

                    {/* Área de Estado do Documento ou Botão de Upload */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80">
                      {uploadedDoc ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                                📄 {uploadedDoc.originalName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {(uploadedDoc.sizeBytes / 1024).toFixed(0)} KB
                              </span>
                            </div>

                            {uploadedDoc.checksum && (
                              <div className="text-[10px] font-mono text-emerald-400/80 truncate">
                                SHA-256: {uploadedDoc.checksum.substring(0, 16)}...
                              </div>
                            )}

                            {uploadedDoc.status === "APPROVED" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
                                <CheckCircle2 size={12} /> Aprovado pelo DP
                              </span>
                            )}
                            {uploadedDoc.status === "PENDING" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 mt-1">
                                <Clock size={12} /> Aguardando Validação
                              </span>
                            )}
                            {uploadedDoc.status === "REJECTED" && (
                              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mt-1">
                                <span className="font-bold">Ajuste solicitado:</span> {uploadedDoc.rejectionReason || "Reenvie um documento mais legível."}
                              </div>
                            )}
                          </div>

                          {/* Botão de Substituir */}
                          <label className="cursor-pointer block text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all border border-slate-700">
                            {isUploading ? (
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 size={13} className="animate-spin text-emerald-400" /> Enviando...
                              </span>
                            ) : (
                              "Substituir Arquivo"
                            )}
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(doc.key, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer block text-center py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-black transition-all">
                          {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin text-emerald-400" /> Processando e Criptografando...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Upload size={14} /> Selecionar Arquivo
                            </span>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(doc.key, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Dados Cadastrais & Bancários */}
        {activeTab === "personal" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-8 animate-in fade-in">
            {/* Bloco 1: Documentos Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <User size={18} className="text-maitre-gold" />
                <h3 className="text-base font-black text-white">Dados de Identificação Pessoal</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">CPF *</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Número do RG *</label>
                  <input
                    type="text"
                    value={formData.rgNumber}
                    onChange={(e) => handleInputChange("rgNumber", e.target.value)}
                    placeholder="00.000.000-0"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Órgão Emissor / UF</label>
                  <input
                    type="text"
                    value={formData.rgIssuer}
                    onChange={(e) => handleInputChange("rgIssuer", e.target.value)}
                    placeholder="SSP/SP"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Data de Nascimento *</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Estado Civil</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Número PIS / PASEP</label>
                  <input
                    type="text"
                    value={formData.pisPasep}
                    onChange={(e) => handleInputChange("pisPasep", e.target.value)}
                    placeholder="000.00000.00-0"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo da Mãe *</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => handleInputChange("motherName", e.target.value)}
                    placeholder="Nome completo sem abreviações"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nº de Dependentes (IR/Família)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formData.dependentsCount}
                    onChange={(e) => handleInputChange("dependentsCount", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Endereço Residencial */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <Home size={18} className="text-sky-400" />
                <h3 className="text-base font-black text-white">Endereço Residencial</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">CEP *</label>
                  <input
                    type="text"
                    value={formData.addressZip}
                    onChange={(e) => handleInputChange("addressZip", e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Logradouro (Rua/Avenida) *</label>
                  <input
                    type="text"
                    value={formData.addressStreet}
                    onChange={(e) => handleInputChange("addressStreet", e.target.value)}
                    placeholder="Ex: Av. Paulista"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Número *</label>
                  <input
                    type="text"
                    value={formData.addressNumber}
                    onChange={(e) => handleInputChange("addressNumber", e.target.value)}
                    placeholder="Ex: 1000, Apto 42"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Bairro</label>
                  <input
                    type="text"
                    value={formData.addressDistrict}
                    onChange={(e) => handleInputChange("addressDistrict", e.target.value)}
                    placeholder="Ex: Bela Vista"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Cidade / UF</label>
                  <input
                    type="text"
                    value={formData.addressCity}
                    onChange={(e) => handleInputChange("addressCity", e.target.value)}
                    placeholder="Ex: São Paulo / SP"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Dados Bancários para Salário */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <CreditCard size={18} className="text-emerald-400" />
                <h3 className="text-base font-black text-white">Dados Bancários para Pagamento de Salário</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Instituição Bancária *</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    placeholder="Ex: Itaú, Bradesco, Nubank..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Agência (com dígito) *</label>
                  <input
                    type="text"
                    value={formData.bankAgency}
                    onChange={(e) => handleInputChange("bankAgency", e.target.value)}
                    placeholder="Ex: 0001-9"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Conta Corrente / Salário *</label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                    placeholder="Ex: 12345-6"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Chave PIX (Opcional)</label>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) => handleInputChange("pixKey", e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ação de Salvar Ficha Cadastral */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSavePersonalData}
                disabled={isPending}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Salvar Ficha Cadastral
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
