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
} from "lucide-react";
import { deleteJob } from "@/app/actions/delete-actions";

type JobData = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: string;
  recruiterId: string | null;
  hiringManagerId: string | null;
  recruiterName?: string | null;
  applicationsCount: number;
  createdAt: Date;
};

export default function JobDashboardView({
  initialJobs,
  currentUserId,
  userRole,
}: {
  initialJobs: JobData[];
  currentUserId?: string;
  userRole?: string;
}) {
  const [jobs, setJobs] = useState<JobData[]>(initialJobs);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const myJobs = jobs.filter(
    (j) => j.recruiterId === currentUserId || j.hiringManagerId === currentUserId
  );

  const displayedJobs = tab === "mine" ? myJobs : jobs;

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

  return (
    <div className="space-y-6">
      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === "mine"
                ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <UserCheck size={16} className="text-maitre-gold" />
            <span>Minhas Vagas ({myJobs.length})</span>
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3">
          {userRole === "SUPER_ADMIN"
            ? "👑 Admin Master (Controle Total & Exclusão)"
            : userRole === "ADMIN"
            ? "Administrador"
            : "💼 Recrutador Maître (Acesso a Todas as Vagas)"}
        </div>
      </div>

      {/* Grid of Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedJobs.map((job) => {
          const isDeleting = deletingId === job.id;
          const isConfirming = confirmDeleteId === job.id;

          return (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl p-6 hover:shadow-xl transition-all flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-maitre-gold/10 text-maitre-gold p-3 rounded-xl border border-maitre-gold/20">
                    <Briefcase size={22} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {job.status === "OPEN" ? "ABERTA" : job.status}
                    </span>

                    {/* Admin Delete Action */}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(isConfirming ? null : job.id);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Excluir Vaga (Admin Master)"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation Box */}
                {isConfirming && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-red-700 dark:text-red-400">
                      Confirmar exclusão desta vaga e seus candidatos?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                      >
                        {isDeleting && <Loader2 size={12} className="animate-spin" />}
                        Sim, Excluir
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <Link href={`/jobs/${job.id}/board`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-maitre-gold transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                </Link>

                <div className="flex flex-col gap-2 mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">{job.location || "Remoto"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {job.applicationsCount} {job.applicationsCount === 1 ? "candidato" : "candidatos"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
              {tab === "mine" ? "Nenhuma vaga atribuída a você no momento" : "Nenhuma vaga cadastrada"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {tab === "mine"
                ? "Você pode visualizar todas as vagas da Maître na aba 'Todas as Vagas'."
                : "Clique no botão 'Nova Vaga' acima para abrir um novo processo seletivo."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
