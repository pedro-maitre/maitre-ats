/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  ShieldCheck,
  Users,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Copy,
  Check,
  Eye,
  UserX,
  Plus,
} from "lucide-react";
import AdmissionDetailsModal, {
  AdmissionDossierItem,
} from "./AdmissionDetailsModal";
import OffboardingModal from "./OffboardingModal";

interface OperationsDashboardClientProps {
  dossiers: AdmissionDossierItem[];
  canonicalDocsCount: number;
  offboardings?: any[];
  activeEmployees?: any[];
}

export default function OperationsDashboardClient({
  dossiers,
  canonicalDocsCount,
  offboardings = [],
  activeEmployees = [],
}: OperationsDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ONBOARDING" | "OFFBOARDING">("ONBOARDING");

  // Onboarding States
  const [selectedDossier, setSelectedDossier] = useState<AdmissionDossierItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Offboarding States
  const [isOffboardingModalOpen, setIsOffboardingModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any | null>(null);
  const [offboardingSearchQuery, setOffboardingSearchQuery] = useState("");
  const [offboardingStatusFilter, setOffboardingStatusFilter] = useState<string>("ALL");

  // Onboarding Filters
  const filteredDossiers = dossiers.filter((item) => {
    const matchesSearch =
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.employeeCode && item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return item.admissionStatus === "PENDING_DOCUMENTS";
    if (statusFilter === "UNDER_REVIEW") return item.admissionStatus === "UNDER_REVIEW";
    if (statusFilter === "REQUIREMENT") return item.admissionStatus === "REQUIREMENT";
    if (statusFilter === "COMPLETED")
      return item.admissionStatus === "APPROVED" || item.admissionStatus === "MATRICULATED";

    return true;
  });

  // Offboarding Filters
  const filteredOffboardings = offboardings.filter((item) => {
    const emp = item.employee || {};
    const name = emp.fullName || "";
    const reg = emp.registrationNumber || "";
    const dept = emp.department?.name || "";
    const pos = emp.position?.title || "";

    const query = offboardingSearchQuery.toLowerCase();
    const matches =
      name.toLowerCase().includes(query) ||
      reg.toLowerCase().includes(query) ||
      dept.toLowerCase().includes(query) ||
      pos.toLowerCase().includes(query);

    if (!matches) return false;
    if (offboardingStatusFilter === "ALL") return true;
    return item.status === offboardingStatusFilter;
  });

  const handleOpenDossier = (dossier: AdmissionDossierItem) => {
    setSelectedDossier(dossier);
    setIsModalOpen(true);
  };

  const handleCopyLink = (dossier: AdmissionDossierItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dossier.token) {
      const url = `${window.location.origin}/carreiras/${dossier.organizationSlug}/admissao/${dossier.token}`;
      navigator.clipboard.writeText(url);
      setCopiedId(dossier.id);
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  // Onboarding KPIs
  const totalCount = dossiers.length;
  const underReviewCount = dossiers.filter((d) => d.admissionStatus === "UNDER_REVIEW").length;
  const requirementCount = dossiers.filter((d) => d.admissionStatus === "REQUIREMENT").length;
  const completedCount = dossiers.filter(
    (d) => d.admissionStatus === "APPROVED" || d.admissionStatus === "MATRICULATED"
  ).length;

  // Offboarding KPIs
  const offboardingTotal = offboardings.length;
  const offboardingInProgress = offboardings.filter((o) => o.status === "IN_PROGRESS").length;
  const offboardingCompleted = offboardings.filter((o) => o.status === "COMPLETED").length;
  const offboardingCancelled = offboardings.filter((o) => o.status === "CANCELLED").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <FileCheck size={13} /> Conecta Operações
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Departamento Pessoal & DP</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            {activeTab === "ONBOARDING" ? "Admissão Digital & Gestão Documental" : "Desligamentos & Offboarding CLT"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {activeTab === "ONBOARDING"
              ? "Checklist admissional, portal seguro do contratado, integridade SHA-256 e emissão de matrículas."
              : "Rescisões formais CLT, controle de aviso prévio, revogação de acessos e homologação de TRCT."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "OFFBOARDING" && (
            <button
              type="button"
              onClick={() => {
                setSelectedProcess(null);
                setIsOffboardingModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} /> Iniciar Desligamento
            </button>
          )}

          <Link
            href="/employees"
            className="px-5 py-2.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Users size={15} /> Ver Core HR (Colaboradores)
          </Link>
        </div>
      </div>

      {/* Navegação Principal das Abas de Operações */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ONBOARDING")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ONBOARDING"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileCheck size={15} />
          <span>Admissões Digitais ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("OFFBOARDING")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "OFFBOARDING"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <UserX size={15} />
          <span>Desligamentos & Offboarding ({offboardingTotal})</span>
        </button>
      </div>

      {/* ====================================================================
          ABA 1: ADMISSÕES DIGITAIS
          ==================================================================== */}
      {activeTab === "ONBOARDING" && (
        <div className="space-y-6">
          {/* KPI Cards Admissão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total de Processos</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{totalCount}</p>
              <span className="text-xs font-medium text-slate-400">Contratações iniciadas no ATS</span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Em Análise pelo DP</span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-sky-600 dark:text-sky-400">{underReviewCount}</p>
              <span className="text-xs font-medium text-slate-400">Documentos enviados para conferência</span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Pendências / Exigências</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{requirementCount}</p>
              <span className="text-xs font-medium text-slate-400">Aguardando reenvio de documento</span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Concluídas & Ativas</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} /> {canonicalDocsCount} docs com SHA-256
              </span>
            </div>
          </div>

          {/* Tabela de Dossiês de Admissão */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            {/* Barra de Filtros e Busca */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
                {[
                  { id: "ALL", label: "Todas", count: totalCount },
                  { id: "UNDER_REVIEW", label: "Em Análise", count: underReviewCount },
                  { id: "REQUIREMENT", label: "Exigências", count: requirementCount },
                  {
                    id: "PENDING",
                    label: "Pendentes",
                    count: dossiers.filter((d) => d.admissionStatus === "PENDING_DOCUMENTS").length,
                  },
                  { id: "COMPLETED", label: "Concluídas", count: completedCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      statusFilter === tab.id
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        statusFilter === tab.id
                          ? "bg-white/20 dark:bg-slate-900/20 text-current"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Input de Busca */}
              <div className="relative w-full md:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar candidato, vaga, matrícula..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Listagem */}
            {filteredDossiers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Nenhum processo admissional encontrado
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Quando um candidato for aprovado e contratado no Kanban de Recrutamento, o dossiê de admissão aparecerá
                  aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="py-3.5 px-6">Contratado / Candidato</th>
                      <th className="py-3.5 px-6">Cargo & Empresa</th>
                      <th className="py-3.5 px-6">Documentação</th>
                      <th className="py-3.5 px-6">Status Admissão</th>
                      <th className="py-3.5 px-6">Matrícula</th>
                      <th className="py-3.5 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {filteredDossiers.map((item) => {
                      const approvedDocs = item.documents.filter((d) => d.status === "APPROVED").length;
                      const totalDocs = item.documents.length;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 dark:text-white">{item.candidateName}</div>
                            <div className="text-slate-400 text-[11px]">{item.candidateEmail}</div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.jobTitle}</div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Building2 size={11} /> {item.organizationName} • {item.department}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{
                                    width: `${totalDocs > 0 ? (approvedDocs / totalDocs) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                {approvedDocs}/{totalDocs}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">validados pelo DP</span>
                          </td>

                          <td className="py-4 px-6">
                            {item.admissionStatus === "MATRICULATED" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                <CheckCircle2 size={12} /> Efetivado / Ativo
                              </span>
                            )}
                            {item.admissionStatus === "UNDER_REVIEW" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1 w-fit">
                                <Clock size={12} /> Em Análise DP
                              </span>
                            )}
                            {item.admissionStatus === "REQUIREMENT" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                                <AlertTriangle size={12} /> Exigência
                              </span>
                            )}
                            {item.admissionStatus === "PENDING_DOCUMENTS" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 flex items-center gap-1 w-fit">
                                Aguardando Envio
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {item.employeeCode || "—"}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.token && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyLink(item, e)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                                  title="Copiar link do portal do candidato"
                                >
                                  {copiedId === item.id ? (
                                    <Check size={12} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  <span>{copiedId === item.id ? "Copiado!" : "Link"}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenDossier(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                              >
                                <Eye size={12} /> Dossiê
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 2: DESLIGAMENTOS & OFFBOARDING CLT
          ==================================================================== */}
      {activeTab === "OFFBOARDING" && (
        <div className="space-y-6">
          {/* KPI Cards Offboarding */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total de Rescisões</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <UserX size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{offboardingTotal}</p>
              <span className="text-xs font-medium text-slate-400">Processos abertos pelo DP/RH</span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Em Andamento</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{offboardingInProgress}</p>
              <span className="text-xs font-medium text-slate-400">Cumprindo aviso / checklist pendente</span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Homologadas & Baixadas</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{offboardingCompleted}</p>
              <span className="text-xs font-medium text-slate-400">TRCT assinado e colaborador desativado</span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Canceladas</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-600 dark:text-slate-400">{offboardingCancelled}</p>
              <span className="text-xs font-medium text-slate-400">Acordo cancelado ou reintegração</span>
            </div>
          </div>

          {/* Tabela de Processos de Offboarding */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            {/* Barra de Filtros e Busca */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
                {[
                  { id: "ALL", label: "Todos", count: offboardingTotal },
                  { id: "IN_PROGRESS", label: "Em Andamento", count: offboardingInProgress },
                  { id: "COMPLETED", label: "Concluídos", count: offboardingCompleted },
                  { id: "CANCELLED", label: "Cancelados", count: offboardingCancelled },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOffboardingStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      offboardingStatusFilter === tab.id
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        offboardingStatusFilter === tab.id
                          ? "bg-white/20 text-current"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Input de Busca */}
              <div className="relative w-full md:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={offboardingSearchQuery}
                  onChange={(e) => setOffboardingSearchQuery(e.target.value)}
                  placeholder="Buscar colaborador, cargo, matrícula..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Listagem Offboarding */}
            {filteredOffboardings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <UserX size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Nenhum processo de desligamento encontrado
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Clique no botão &quot;Iniciar Desligamento&quot; acima para registrar uma rescisão formal com checklist
                  CLT de conformidade.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="py-3.5 px-6">Colaborador</th>
                      <th className="py-3.5 px-6">Cargo & Área</th>
                      <th className="py-3.5 px-6">Motivo & Aviso</th>
                      <th className="py-3.5 px-6">Último Dia</th>
                      <th className="py-3.5 px-6">Checklist CLT</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {filteredOffboardings.map((item) => {
                      let chkList: any[] = [];
                      try {
                        chkList = JSON.parse(item.checklist || "[]");
                      } catch {
                        chkList = [];
                      }
                      const chkTotal = chkList.length;
                      const chkDone = chkList.filter((c: any) => c.completed).length;
                      const pct = chkTotal > 0 ? Math.round((chkDone / chkTotal) * 100) : 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.employee?.fullName || "Colaborador"}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Matrícula: {item.employee?.registrationNumber || "Sem matrícula"}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {item.employee?.position?.title || "Colaborador"}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              {item.employee?.department?.name || "Geral"}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              {item.terminationType?.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Aviso: <span className="font-semibold">{item.noticeType}</span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {item.lastWorkingDay
                                ? new Date(item.lastWorkingDay).toLocaleDateString("pt-BR")
                                : "—"}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                {chkDone}/{chkTotal} ({pct}%)
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            {item.status === "COMPLETED" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                <CheckCircle2 size={12} /> Homologado
                              </span>
                            )}
                            {item.status === "IN_PROGRESS" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                                <Clock size={12} /> Em Andamento
                              </span>
                            )}
                            {item.status === "CANCELLED" && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 flex items-center gap-1 w-fit">
                                Cancelado
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProcess(item);
                                setIsOffboardingModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-500/20 flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <CheckCircle2 size={13} />
                              <span>Gerenciar Checklist</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes e Validação da Admissão */}
      <AdmissionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dossier={selectedDossier}
        onRefresh={() => router.refresh()}
      />

      {/* Modal de Gestão e Abertura de Desligamento */}
      <OffboardingModal
        isOpen={isOffboardingModalOpen}
        onClose={() => {
          setIsOffboardingModalOpen(false);
          setSelectedProcess(null);
        }}
        activeEmployees={activeEmployees}
        selectedProcess={selectedProcess}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
