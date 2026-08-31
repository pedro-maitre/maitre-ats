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
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  FolderLock,
  ExternalLink,
  Plus,
  Layers,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Sparkles,
} from "lucide-react";
import AdmissionDetailsModal, {
  AdmissionDossierItem,
} from "./AdmissionDetailsModal";

interface OperationsDashboardClientProps {
  dossiers: AdmissionDossierItem[];
  canonicalDocsCount: number;
}

export default function OperationsDashboardClient({
  dossiers,
  canonicalDocsCount,
}: OperationsDashboardClientProps) {
  const router = useRouter();
  const [selectedDossier, setSelectedDossier] = useState<AdmissionDossierItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtros
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

  // KPIs
  const totalCount = dossiers.length;
  const underReviewCount = dossiers.filter((d) => d.admissionStatus === "UNDER_REVIEW").length;
  const requirementCount = dossiers.filter((d) => d.admissionStatus === "REQUIREMENT").length;
  const completedCount = dossiers.filter(
    (d) => d.admissionStatus === "APPROVED" || d.admissionStatus === "MATRICULATED"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <FileCheck size={13} /> Conecta Operações
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Admissão Digital & DP</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Admissão Digital & Gestão Documental
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Checklist admissional, portal seguro do contratado, integridade SHA-256 e emissão de matrículas.
          </p>
        </div>

        <Link
          href="/employees"
          className="px-5 py-2.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Users size={15} /> Ver Core HR (Colaboradores)
        </Link>
      </div>

      {/* KPI Cards */}
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
          {/* Tabs de Status */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: "ALL", label: "Todas", count: totalCount },
              { id: "UNDER_REVIEW", label: "Em Análise", count: underReviewCount },
              { id: "REQUIREMENT", label: "Exigências", count: requirementCount },
              { id: "PENDING", label: "Pendentes", count: dossiers.filter((d) => d.admissionStatus === "PENDING_DOCUMENTS").length },
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
            <FileCheck size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum processo admissional encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Ao avançar um candidato para contratação no Conecta Talentos, a ficha de admissão será criada automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Colaborador & Vaga</th>
                  <th className="py-3.5 px-4">Empresa / Cliente</th>
                  <th className="py-3.5 px-4">Status Admissional</th>
                  <th className="py-3.5 px-4">Documentos Enviados</th>
                  <th className="py-3.5 px-4">Matrícula</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredDossiers.map((item) => {
                  const approvedDocs = item.documents.filter((d) => d.status === "APPROVED").length;
                  const totalDocs = item.documents.length;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDossier(item)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {item.candidateName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block group-hover:text-emerald-500 transition-colors">
                              {item.candidateName}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              {item.jobTitle} {item.department ? `• ${item.department}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400" />
                          {item.organizationName}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            item.admissionStatus === "MATRICULATED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : item.admissionStatus === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                              : item.admissionStatus === "UNDER_REVIEW"
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                              : item.admissionStatus === "REQUIREMENT"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {item.admissionStatus === "MATRICULATED" && <CheckCircle2 size={12} />}
                          {item.admissionStatus === "UNDER_REVIEW" && <Clock size={12} />}
                          {item.admissionStatus === "REQUIREMENT" && <AlertTriangle size={12} />}
                          {item.admissionStatus === "MATRICULATED"
                            ? "Matriculado"
                            : item.admissionStatus === "APPROVED"
                            ? "Aprovado pelo DP"
                            : item.admissionStatus === "UNDER_REVIEW"
                            ? "Em Análise"
                            : item.admissionStatus === "REQUIREMENT"
                            ? "Exigência"
                            : "Pendente"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {totalDocs} docs
                          </span>
                          {approvedDocs > 0 && (
                            <span className="text-[10px] font-bold text-emerald-500">
                              ({approvedDocs} aprovados)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {item.employeeCode || "—"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.token && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyLink(item, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 border border-slate-200 dark:border-slate-700"
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
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 border border-emerald-500/30"
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

      {/* Modal de Detalhes e Validação */}
      <AdmissionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dossier={selectedDossier}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
