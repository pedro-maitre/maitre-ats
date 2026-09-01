"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Users,
  ChevronRight,
  Trash2,
  Edit,
  Loader2,
  CheckCircle,
  Filter,
  UserCheck,
  Search,
  UserPlus,
  Building2,
} from "lucide-react";
import { deleteJob } from "@/app/actions/delete-actions";
import { assignJobRecruiter } from "@/app/(dashboard)/jobs/actions";
import { useTenant } from "@/lib/tenant-context";

export type RecruiterUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export type JobData = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType?: string | null;
  seniority?: string | null;
  status: string;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationSlug?: string | null;
  recruiterId: string | null;
  hiringManagerId: string | null;
  recruiterName?: string | null;
  applicationsCount: number;
  createdAt: Date;
};

export default function JobDashboardView({
  initialJobs,
  recruiters = [],
  currentUserId,
  userRole,
}: {
  initialJobs: JobData[];
  recruiters?: RecruiterUser[];
  currentUserId?: string;
  userRole?: string;
}) {
  const { selectedTenantId, selectedTenant } = useTenant();
  const [jobs, setJobs] = useState<JobData[]>(initialJobs);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecruiterFilter, setSelectedRecruiterFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [assignmentSuccessId, setAssignmentSuccessId] = useState<string | null>(null);

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const myJobs = jobs.filter(
    (j) => j.recruiterId === currentUserId || j.hiringManagerId === currentUserId
  );

  const baseJobs = tab === "mine" ? myJobs : jobs;

  const displayedJobs = baseJobs.filter((job) => {
    // 1. Filtro por Tenant selecionado na Topbar
    if (selectedTenantId !== "ALL" && job.organizationId !== selectedTenantId) {
      return false;
    }

    // 2. Filtro por busca
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.department && job.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.organizationName && job.organizationName.toLowerCase().includes(searchQuery.toLowerCase()));

    // 3. Filtro por Recrutador
    const matchesRecruiter =
      selectedRecruiterFilter === "ALL"
        ? true
        : selectedRecruiterFilter === "UNASSIGNED"
        ? !job.recruiterId
        : job.recruiterId === selectedRecruiterFilter;

    return matchesSearch && matchesRecruiter;
  });

  const handleDelete = async (jobId: string) => {
    if (!isAdmin) return;
    setDeletingId(jobId);

    try {
      const res = await deleteJob(jobId);
      if (res.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setConfirmDeleteId(null);
      } else {
        alert(res.error || "Erro ao excluir a vaga.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecruiterChange = async (jobId: string, newRecruiterId: string) => {
    if (!isAdmin) return;
    setAssigningJobId(jobId);

    try {
      const res = await assignJobRecruiter(
        jobId,
        newRecruiterId === "none" ? null : newRecruiterId
      );

      if (res.success) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  recruiterId: res.recruiterId ?? null,
                  recruiterName: res.recruiterName === "Sem recrutador" ? null : res.recruiterName,
                }
              : j
          )
        );
        setAssignmentSuccessId(jobId);
        setTimeout(() => setAssignmentSuccessId(null), 3000);
      } else {
        alert(res.error || "Erro ao atribuir recrutador.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao atribuir recrutador.");
    } finally {
      setAssigningJobId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("all")}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                tab === "all"
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <Briefcase size={16} />
              <span>Todas as Vagas ({jobs.length})</span>
            </button>

            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                tab === "mine"
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <UserCheck size={16} className="text-maitre-gold" />
              <span>Minhas Vagas ({myJobs.length})</span>
            </button>
          </div>

          {/* Search and Recruiter Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, área..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all"
              />
            </div>

            {/* Filter by Recruiter (for Admin & Team) */}
            {recruiters.length > 0 && (
              <div className="relative">
                <select
                  value={selectedRecruiterFilter}
                  onChange={(e) => setSelectedRecruiterFilter(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-maitre-gold outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">🔍 Todos os Recrutadores</option>
                  <option value="UNASSIGNED">👤 Sem recrutador atribuído</option>
                  {recruiters.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      👤 {rec.name || rec.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Role Helper Info */}
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2">
          <span>
            {userRole === "SUPER_ADMIN"
              ? "👑 Admin Master • Você pode atribuir recrutadores e gerenciar todas as vagas."
              : userRole === "ADMIN"
              ? "🛡️ Administrador • Atribuição e gestão de vagas liberadas."
              : "💼 Recrutador Maître • Visualize suas vagas atribuídas ou todas as oportunidades."}
          </span>
          <span className="text-[11px] text-slate-400">
            Exibindo {displayedJobs.length} de {jobs.length} vagas
          </span>
        </div>
      </div>

      {/* Grid of Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedJobs.map((job) => {
          const isDeleting = deletingId === job.id;
          const isConfirming = confirmDeleteId === job.id;
          const isAssigning = assigningJobId === job.id;
          const isSuccess = assignmentSuccessId === job.id;

          return (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Header Top Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-maitre-gold/10 text-maitre-gold p-3 rounded-2xl border border-maitre-gold/20">
                    <Briefcase size={22} />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {job.status === "OPEN" ? (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        ABERTA
                      </span>
                    ) : job.status === "PAUSED" ? (
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        PAUSADA
                      </span>
                    ) : (
                      <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        ENCERRADA
                      </span>
                    )}

                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar Vaga"
                    >
                      <Edit size={16} />
                    </Link>

                    {/* Admin Delete Action */}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(isConfirming ? null : job.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Excluir Vaga (Admin Master)"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation Box */}
                {isConfirming && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs space-y-2 animate-in fade-in">
                    <p className="font-bold text-red-700 dark:text-red-400">
                      Confirmar exclusão desta vaga e seus candidatos?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isDeleting && <Loader2 size={12} className="animate-spin" />}
                        Sim, Excluir
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Title & Organization Badge */}
                {selectedTenantId === "ALL" && job.organizationName && (
                  <div className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-maitre-gold bg-maitre-gold/10 border border-maitre-gold/20 px-2 py-0.5 rounded-lg">
                    <Building2 size={11} />
                    <span>{job.organizationName}</span>
                  </div>
                )}

                <Link href={`/jobs/${job.id}/board`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-maitre-gold transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                </Link>

                {/* Details */}
                <div className="flex flex-col gap-2 mt-3 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{job.department || "Geral"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{job.location || "Remoto"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {job.applicationsCount} {job.applicationsCount === 1 ? "candidato" : "candidatos"}
                    </span>
                  </div>
                </div>

                {/* Recruiter Assignment Badge / Dropdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <UserCheck size={12} className="text-maitre-gold" />
                      Responsável:
                    </span>

                    {isSuccess && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle size={12} /> Salvo
                      </span>
                    )}
                  </div>

                  {isAdmin ? (
                    <div className="mt-1.5 relative">
                      <select
                        value={job.recruiterId || "none"}
                        disabled={isAssigning}
                        onChange={(e) => handleRecruiterChange(job.id, e.target.value)}
                        className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-maitre-gold outline-none cursor-pointer transition-all disabled:opacity-50"
                      >
                        <option value="none">-- Sem recrutador atribuído --</option>
                        {recruiters.map((rec) => (
                          <option key={rec.id} value={rec.id}>
                            {rec.name || rec.email}
                          </option>
                        ))}
                      </select>
                      {isAssigning && (
                        <Loader2
                          size={13}
                          className="animate-spin text-maitre-gold absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      <div className="w-4 h-4 rounded-full bg-maitre-gold/20 text-maitre-gold text-[10px] font-black flex items-center justify-center">
                        {job.recruiterName ? job.recruiterName[0].toUpperCase() : "?"}
                      </div>
                      <span className="truncate">{job.recruiterName || "Sem recrutador atribuído"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/jobs/${job.id}/board`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-maitre-gold hover:text-maitre-gold-hover transition-colors"
                >
                  <span>Ver Pipeline Kanban</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}

        {displayedJobs.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-3xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <Briefcase size={36} className="mx-auto text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {searchQuery || selectedRecruiterFilter !== "ALL"
                ? "Nenhuma vaga encontrada com os filtros selecionados"
                : tab === "mine"
                ? "Nenhuma vaga atribuída a você no momento"
                : "Nenhuma vaga cadastrada"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedRecruiterFilter !== "ALL"
                ? "Tente alterar os termos da busca ou selecionar outro recrutador."
                : tab === "mine"
                ? "Você pode visualizar todas as vagas da Maître na aba 'Todas as Vagas'."
                : "Clique no botão 'Criar Nova Vaga' acima para publicar uma nova oportunidade."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

