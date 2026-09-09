"use client";

import React, { useMemo } from "react";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Briefcase,
  Mail,
  TrendingUp,
} from "lucide-react";
import { InternalUserContext, calculateTeamWorkloadDistribution } from "@/lib/internal-management";

interface TeamWorkloadViewProps {
  teamMembers: any[];
  tasks: any[];
  userCtx: InternalUserContext;
  onSelectTask: (task: any) => void;
}

export default function TeamWorkloadView({
  teamMembers,
  tasks,
  userCtx,
  onSelectTask,
}: TeamWorkloadViewProps) {
  const workloadStats = useMemo(() => {
    return calculateTeamWorkloadDistribution(teamMembers, tasks);
  }, [teamMembers, tasks]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-maitre-gold" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Equipe da Maître Consultoria & Distribuição Operacional
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão consolidada da equipe, funções, alocações e balanceamento de carga de trabalho para suporte à delegação.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>{teamMembers.length} Integrantes Ativos</span>
        </div>
      </div>

      {/* Grid de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamMembers.map((member) => {
          const stats = workloadStats.find((s) => s.userId === member.id);
          const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
          const isAdriana = member.email === "adriana@maitrework.com.br";

          return (
            <div
              key={member.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all ${
                isAdriana
                  ? "border-maitre-gold/50 ring-1 ring-maitre-gold/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-maitre-gold/20 to-amber-500/5 border border-maitre-gold/30 flex items-center justify-center text-sm font-bold text-maitre-gold shadow-sm">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white">{member.name}</h3>
                        {isAdriana && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/40">
                            Admin Master
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{member.jobTitle || "Consultor"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-500" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-slate-500" />
                    <span>{member.department || "Operações & Consultoria"}</span>
                  </div>
                </div>

                {/* Métricas de Carga */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Carga Operacional Atual
                  </span>

                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="p-1.5 rounded-lg bg-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <strong className="text-xs text-white">{stats?.totalAssigned || 0}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <span className="text-[10px] text-amber-300 block">Em Curso</span>
                      <strong className="text-xs text-amber-300">{stats?.inProgress || 0}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <span className="text-[10px] text-emerald-300 block">Feitas</span>
                      <strong className="text-xs text-emerald-300">{stats?.completed || 0}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-500/10">
                      <span className="text-[10px] text-rose-300 block">Atraso</span>
                      <strong className="text-xs text-rose-300">{stats?.overdue || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Lista rápida de demandas ativas */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Principais Demandas Ativas:
                  </span>
                  <div className="space-y-1">
                    {memberTasks
                      .filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED")
                      .slice(0, 3)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer flex items-center justify-between truncate"
                        >
                          <span className="truncate">{t.title}</span>
                          {t.isBlocked && <Lock size={11} className="text-amber-400 shrink-0" />}
                        </div>
                      ))}
                    {memberTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length === 0 && (
                      <p className="text-slate-500 text-xs italic">Sem demandas ativas no momento.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
