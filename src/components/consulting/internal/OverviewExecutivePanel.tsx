"use client";

import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
  Calendar,
  Filter,
  FileCheck,
  FolderGit2,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Lock,
  ChevronRight,
  Plus,
} from "lucide-react";
import { InternalUserContext, calculateTeamWorkloadDistribution } from "@/lib/internal-management";

interface OverviewExecutivePanelProps {
  tasks: any[];
  projects: any[];
  teamMembers: any[];
  clients: any[];
  userCtx: InternalUserContext;
  onSelectTask: (task: any) => void;
  onCreateTask: () => void;
  onNavigateTab: (tab: any) => void;
}

export default function OverviewExecutivePanel({
  tasks,
  projects,
  teamMembers,
  clients,
  userCtx,
  onSelectTask,
  onCreateTask,
  onNavigateTab,
}: OverviewExecutivePanelProps) {
  // Filtros
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const now = new Date();
  const oneWeekAhead = new Date();
  oneWeekAhead.setDate(now.getDate() + 7);

  // Aplicação de filtros
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedClient !== "ALL" && t.clientOrganizationId !== selectedClient) return false;
      if (selectedProject !== "ALL" && t.projectId !== selectedProject) return false;
      if (selectedAssignee !== "ALL" && t.assigneeId !== selectedAssignee) return false;
      if (selectedPriority !== "ALL" && t.priority !== selectedPriority) return false;
      if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
      return true;
    });
  }, [tasks, selectedClient, selectedProject, selectedAssignee, selectedPriority, selectedStatus]);

  // Cálculos executivos baseados nas fórmulas documentadas
  const metrics = useMemo(() => {
    // 1. Tarefas Atrasadas: status != COMPLETED && status != CANCELLED && dueDate < now
    const overdue = filteredTasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < now
    );

    // 2. Entregas da Semana: status != COMPLETED && status != CANCELLED && dueDate >= now && dueDate <= now + 7 dias
    const thisWeek = filteredTasks.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETED" || t.status === "CANCELLED") return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= oneWeekAhead;
    });

    // 3. Demandas sem Responsável: status != COMPLETED && status != CANCELLED && assigneeId == null
    const unassigned = filteredTasks.filter(
      (t) => !t.assigneeId && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    );

    // 4. Bloqueios Operacionais Ativos: isBlocked == true && status != COMPLETED
    const blocked = filteredTasks.filter((t) => t.isBlocked && t.status !== "COMPLETED");

    // 5. Aprovações Pendentes: status == 'IN_REVIEW' || (requiresApproval == true && status != COMPLETED)
    const pendingReview = filteredTasks.filter((t) => t.status === "IN_REVIEW");

    // 6. Projetos em Atenção: projetos com tarefas atrasadas ou tarefas bloqueadas
    const troubledProjects = projects.filter((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const hasBlocked = pTasks.some((t) => t.isBlocked && t.status !== "COMPLETED");
      const hasOverdue = pTasks.some(
        (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now
      );
      return hasBlocked || hasOverdue;
    });

    return {
      overdue,
      thisWeek,
      unassigned,
      blocked,
      pendingReview,
      troubledProjects,
    };
  }, [filteredTasks, tasks, projects]);

  // Distribuição operacional por integrante da equipe (não-punitivo)
  const workloadDistribution = useMemo(() => {
    return calculateTeamWorkloadDistribution(teamMembers, tasks);
  }, [teamMembers, tasks]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros Executivos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-semibold pr-2 border-r border-slate-800">
          <Filter size={14} className="text-maitre-gold" />
          <span>Filtros Globais:</span>
        </div>

        {/* Filtro Cliente */}
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:border-maitre-gold focus:outline-none"
        >
          <option value="ALL">Todas Empresas Clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Filtro Projeto */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:border-maitre-gold focus:outline-none"
        >
          <option value="ALL">Todos os Projetos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {/* Filtro Integrante */}
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:border-maitre-gold focus:outline-none"
        >
          <option value="ALL">Toda a Equipe</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Filtro Prioridade */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:border-maitre-gold focus:outline-none"
        >
          <option value="ALL">Todas as Prioridades</option>
          <option value="URGENT">Urgente</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Média</option>
          <option value="LOW">Baixa</option>
        </select>

        {/* Filtro Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:border-maitre-gold focus:outline-none"
        >
          <option value="ALL">Todos os Status</option>
          <option value="TODO">A Fazer</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="IN_REVIEW">Em Revisão</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>

        {(selectedClient !== "ALL" ||
          selectedProject !== "ALL" ||
          selectedAssignee !== "ALL" ||
          selectedPriority !== "ALL" ||
          selectedStatus !== "ALL") && (
          <button
            onClick={() => {
              setSelectedClient("ALL");
              setSelectedProject("ALL");
              setSelectedAssignee("ALL");
              setSelectedPriority("ALL");
              setSelectedStatus("ALL");
            }}
            className="text-xs text-maitre-gold hover:underline ml-auto"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Grid de Métricas Principais (Fórmulas do Painel da Adriana) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Atrasadas */}
        <div
          onClick={() => onNavigateTab("tasks")}
          className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tarefas Atrasadas</span>
            <AlertTriangle size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{metrics.overdue.length}</span>
            <span className="text-[10px] text-slate-500">demanda(s)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Prazo estourado</span>
            <ArrowUpRight size={12} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
          </p>
        </div>

        {/* Card 2: Entregas da Semana */}
        <div
          onClick={() => onNavigateTab("tasks")}
          className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-maitre-gold/50 rounded-2xl p-4 transition-all duration-200 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-maitre-gold/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Entregas da Semana</span>
            <Clock size={16} className="text-maitre-gold group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-maitre-gold">{metrics.thisWeek.length}</span>
            <span className="text-[10px] text-slate-500">nos próx. 7 dias</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Prazos próximos</span>
            <ArrowUpRight size={12} className="text-slate-500 group-hover:text-maitre-gold transition-colors" />
          </p>
        </div>

        {/* Card 3: Atividades Bloqueadas */}
        <div
          onClick={() => onNavigateTab("tasks")}
          className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Bloqueios Ativos</span>
            <Lock size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{metrics.blocked.length}</span>
            <span className="text-[10px] text-slate-500">impedimento(s)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Atenção imediata</span>
            <ArrowUpRight size={12} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </p>
        </div>

        {/* Card 4: Demandas sem Responsável */}
        <div
          onClick={() => onNavigateTab("tasks")}
          className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Sem Responsável</span>
            <Users size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{metrics.unassigned.length}</span>
            <span className="text-[10px] text-slate-500">a delegar</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Aguardando dono</span>
            <ArrowUpRight size={12} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </p>
        </div>

        {/* Card 5: Aprovações Pendentes */}
        <div
          onClick={() => onNavigateTab("approvals")}
          className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Aprovações</span>
            <FileCheck size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{metrics.pendingReview.length}</span>
            <span className="text-[10px] text-slate-500">em revisão</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Exige parecer</span>
            <ArrowUpRight size={12} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </p>
        </div>

        {/* Card 6: Reunião Semanal */}
        <div
          onClick={() => onNavigateTab("meetings")}
          className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Ritual Semanal</span>
            <Calendar size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-purple-400">Seg 15h30</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Pauta inteligente</span>
            <ArrowUpRight size={12} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
          </p>
        </div>
      </div>

      {/* Seção 2: Atenção Imediata (Tarefas Críticas, Bloqueios e Prazos Estourados) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Esquerdo: Bloqueios e Atrasos que exigem decisão da Adriana */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" />
              <h2 className="text-sm font-bold text-white">Demandas que Exigem Atenção Imediata</h2>
            </div>
            <button
              onClick={onCreateTask}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-maitre-gold/20 text-maitre-gold hover:bg-maitre-gold/30 border border-maitre-gold/40 transition-colors"
            >
              <Plus size={13} />
              <span>Nova Tarefa</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {metrics.blocked.length === 0 && metrics.overdue.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                <p className="font-semibold text-slate-400">Nenhum bloqueio ou atraso crítico ativo!</p>
                <p className="mt-1">Todas as demandas da equipe estão dentro do prazo estipulado.</p>
              </div>
            ) : (
              <>
                {/* Bloqueios */}
                {metrics.blocked.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="cursor-pointer p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Bloqueada
                        </span>
                        <h3 className="text-xs font-bold text-white group-hover:text-maitre-gold transition-colors">
                          {t.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-amber-200/90 font-medium italic">
                        Motivo: {t.blockReason || "Impedimento operacional registrado."}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                        <span>Resp: {t.assignee?.name || "Sem responsável"}</span>
                        {t.project && <span>Projeto: {t.project.title}</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-white shrink-0 mt-1" />
                  </div>
                ))}

                {/* Atrasadas */}
                {metrics.overdue
                  .filter((t) => !t.isBlocked)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="cursor-pointer p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/60 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Atrasada
                          </span>
                          <h3 className="text-xs font-bold text-white group-hover:text-maitre-gold transition-colors">
                            {t.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                          <span className="text-rose-300 font-semibold">
                            Prazo: {new Date(t.dueDate).toLocaleDateString("pt-BR")}
                          </span>
                          <span>Resp: {t.assignee?.name || "Sem responsável"}</span>
                          {t.project && <span>Projeto: {t.project.title}</span>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-500 group-hover:text-white shrink-0 mt-1" />
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Painel Direito: Distribuição Operacional da Equipe Maître */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-maitre-gold" />
              <div>
                <h2 className="text-sm font-bold text-white">Distribuição Operacional da Equipe</h2>
                <p className="text-[10px] text-slate-500">
                  Volume de tarefas ativas para balanceamento de carga (não-punitivo)
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("team")}
              className="text-xs text-maitre-gold hover:underline font-semibold"
            >
              Ver Equipe
            </button>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {workloadDistribution.map((m) => {
              const activeCount = m.inProgress + m.inReview;
              return (
                <div key={m.userId} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-maitre-gold/20 border border-maitre-gold/40 flex items-center justify-center text-xs font-bold text-maitre-gold">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{m.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{m.totalAssigned} tarefa(s) atribuída(s)</span>
                          <span>•</span>
                          <span className="text-emerald-400">{m.completed} concluída(s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      {m.blocked > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {m.blocked} bloq.
                        </span>
                      )}
                      {m.overdue > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          {m.overdue} atraso
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold">
                        {activeCount} em curso
                      </span>
                    </div>
                  </div>

                  {/* Barra de progresso visual */}
                  <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{
                        width: `${m.totalAssigned > 0 ? (m.completed / m.totalAssigned) * 100 : 0}%`,
                      }}
                      title="Concluídas"
                    ></div>
                    <div
                      className="bg-maitre-gold h-full transition-all duration-300"
                      style={{
                        width: `${m.totalAssigned > 0 ? (m.inProgress / m.totalAssigned) * 100 : 0}%`,
                      }}
                      title="Em Andamento"
                    ></div>
                    <div
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{
                        width: `${m.totalAssigned > 0 ? (m.blocked / m.totalAssigned) * 100 : 0}%`,
                      }}
                      title="Bloqueadas"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
