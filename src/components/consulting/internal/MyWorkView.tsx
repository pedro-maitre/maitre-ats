"use client";

import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Lock,
  FileCheck,
  Users,
  Plus,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { InternalUserContext } from "@/lib/internal-management";

interface MyWorkViewProps {
  tasks: any[];
  userCtx: InternalUserContext;
  onSelectTask: (task: any) => void;
  onCreateTask: () => void;
  onQuickUpdateStatus: (taskId: string, status: string) => Promise<void>;
  onQuickToggleBlock: (task: any) => void;
}

export default function MyWorkView({
  tasks,
  userCtx,
  onSelectTask,
  onCreateTask,
  onQuickUpdateStatus,
  onQuickToggleBlock,
}: MyWorkViewProps) {
  const [filterSection, setFilterSection] = useState<
    "all" | "today" | "overdue" | "blocked" | "in_review" | "collaborating"
  >("all");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  // Filtragem das tarefas associadas diretamente ao colaborador
  const {
    myAssignedTasks,
    myCollaboratingTasks,
    myPriorities,
    myTodayTasks,
    myOverdueTasks,
    myBlockedTasks,
    myInReviewTasks,
  } = useMemo(() => {
    // 1. Tarefas sob responsabilidade principal do usuário
    const assigned = tasks.filter((t) => t.assigneeId === userCtx.userId);

    // 2. Tarefas onde é colaborador secundário
    const collaborating = tasks.filter(
      (t) => t.assigneeId !== userCtx.userId && t.members?.some((m: any) => m.userId === userCtx.userId)
    );

    // 3. Minhas Prioridades (URGENT ou HIGH não concluídas)
    const priorities = assigned.filter(
      (t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    );

    // 4. Tarefas para Hoje
    const today = assigned.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETED" || t.status === "CANCELLED") return false;
      const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
      return dueStr === todayStr;
    });

    // 5. Atrasadas
    const overdue = assigned.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < now
    );

    // 6. Bloqueadas
    const blocked = assigned.filter((t) => t.isBlocked && t.status !== "COMPLETED");

    // 7. Aguardando Revisão
    const inReview = assigned.filter((t) => t.status === "IN_REVIEW");

    return {
      myAssignedTasks: assigned,
      myCollaboratingTasks: collaborating,
      myPriorities: priorities,
      myTodayTasks: today,
      myOverdueTasks: overdue,
      myBlockedTasks: blocked,
      myInReviewTasks: inReview,
    };
  }, [tasks, userCtx.userId, now, todayStr]);

  // Lista selecionada conforme o filtro ativo
  const displayedTasks = useMemo(() => {
    switch (filterSection) {
      case "today":
        return myTodayTasks;
      case "overdue":
        return myOverdueTasks;
      case "blocked":
        return myBlockedTasks;
      case "in_review":
        return myInReviewTasks;
      case "collaborating":
        return myCollaboratingTasks;
      default:
        return myAssignedTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
    }
  }, [
    filterSection,
    myTodayTasks,
    myOverdueTasks,
    myBlockedTasks,
    myInReviewTasks,
    myCollaboratingTasks,
    myAssignedTasks,
  ]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Meu Trabalho */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-maitre-gold" />
            <h2 className="text-lg font-bold text-white tracking-tight">Meu Trabalho — Foco Semanal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Suas prioridades, entregas imediatas, tarefas em colaboração e pendências sob sua responsabilidade.
          </p>
        </div>

        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 transition-colors shadow-md self-start md:self-auto"
        >
          <Plus size={15} />
          <span>Criar Minha Tarefa</span>
        </button>
      </div>

      {/* Cards de Seletor de Foco Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setFilterSection("all")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterSection === "all"
              ? "bg-maitre-gold/20 border-maitre-gold/50 text-white"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[10px] font-bold block uppercase tracking-wider">Ativas</span>
          <span className="text-xl font-black text-white">
            {myAssignedTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length}
          </span>
        </button>

        <button
          onClick={() => setFilterSection("today")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterSection === "today"
              ? "bg-cyan-500/20 border-cyan-500/50 text-white"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[10px] font-bold block uppercase tracking-wider text-cyan-300">Hoje</span>
          <span className="text-xl font-black text-cyan-400">{myTodayTasks.length}</span>
        </button>

        <button
          onClick={() => setFilterSection("overdue")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterSection === "overdue"
              ? "bg-rose-500/20 border-rose-500/50 text-white"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[10px] font-bold block uppercase tracking-wider text-rose-300">Atrasadas</span>
          <span className="text-xl font-black text-rose-400">{myOverdueTasks.length}</span>
        </button>

        <button
          onClick={() => setFilterSection("blocked")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterSection === "blocked"
              ? "bg-amber-500/20 border-amber-500/50 text-white"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[10px] font-bold block uppercase tracking-wider text-amber-300">Bloqueadas</span>
          <span className="text-xl font-black text-amber-400">{myBlockedTasks.length}</span>
        </button>

        <button
          onClick={() => setFilterSection("in_review")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterSection === "in_review"
              ? "bg-violet-500/20 border-violet-500/50 text-white"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[10px] font-bold block uppercase tracking-wider text-violet-300">Em Revisão</span>
          <span className="text-xl font-black text-violet-400">{myInReviewTasks.length}</span>
        </button>

        <button
          onClick={() => setFilterSection("collaborating")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterSection === "collaborating"
              ? "bg-emerald-500/20 border-emerald-500/50 text-white"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[10px] font-bold block uppercase tracking-wider text-emerald-300">Colaborando</span>
          <span className="text-xl font-black text-emerald-400">{myCollaboratingTasks.length}</span>
        </button>
      </div>

      {/* Lista de Tarefas com Ações Rápidas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {filterSection === "all" && "Todas as Minhas Demandas Ativas"}
            {filterSection === "today" && "Entregas Previstas para Hoje"}
            {filterSection === "overdue" && "Demandas em Atraso"}
            {filterSection === "blocked" && "Demandas Bloqueadas (Aguardando Desbloqueio)"}
            {filterSection === "in_review" && "Demandas em Análise pelo Revisor"}
            {filterSection === "collaborating" && "Tarefas em que Atuo como Colaborador"}
          </h3>
          <span className="text-xs text-slate-500">{displayedTasks.length} registro(s)</span>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400/60" />
            <p className="font-semibold text-slate-400">Tudo em dia nesta seção!</p>
            <p className="mt-1">Nenhuma demanda ativa corresponde a este filtro.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {displayedTasks.map((task) => {
              const isOverdue =
                task.dueDate && new Date(task.dueDate) < now && task.status !== "COMPLETED";

              return (
                <div
                  key={task.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 p-2 rounded-xl transition-colors"
                >
                  <div
                    onClick={() => onSelectTask(task)}
                    className="cursor-pointer space-y-1 flex-1 pr-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.isBlocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Lock size={10} />
                          Bloqueada
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          task.priority === "URGENT"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : task.priority === "HIGH"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {task.priority}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          task.status === "IN_PROGRESS"
                            ? "bg-maitre-gold/20 text-maitre-gold border-maitre-gold/40"
                            : task.status === "IN_REVIEW"
                            ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                            : task.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {task.status === "TODO" && "A Fazer"}
                        {task.status === "IN_PROGRESS" && "Em Andamento"}
                        {task.status === "IN_REVIEW" && "Em Revisão"}
                        {task.status === "COMPLETED" && "Concluída"}
                        {task.status === "CANCELLED" && "Cancelada"}
                      </span>

                      <h4 className="text-xs font-bold text-white hover:text-maitre-gold transition-colors">
                        {task.title}
                      </h4>
                    </div>

                    {task.isBlocked && task.blockReason && (
                      <p className="text-xs text-amber-300/90 italic font-medium">
                        Motivo do bloqueio: {task.blockReason}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      {task.project && <span>Projeto: {task.project.title}</span>}
                      {task.clientOrganization && <span>Cliente: {task.clientOrganization.name}</span>}
                      {task.dueDate && (
                        <span className={isOverdue ? "text-rose-400 font-bold" : ""}>
                          Prazo: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {task.checklists && task.checklists.length > 0 && (
                        <span>
                          Checklist: {task.checklists.filter((c: any) => c.isCompleted).length}/
                          {task.checklists.length}
                        </span>
                      )}
                      {task.comments && task.comments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} /> {task.comments.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações Rápidas do Integrante */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    {/* Botão de Bloqueio Rápido */}
                    <button
                      onClick={() => onQuickToggleBlock(task)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                        task.isBlocked
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                      title={task.isBlocked ? "Remover bloqueio" : "Registrar impedimento"}
                    >
                      <Lock size={12} />
                      <span className="hidden sm:inline">
                        {task.isBlocked ? "Desbloquear" : "Bloquear"}
                      </span>
                    </button>

                    {/* Mudar Status Rápido */}
                    {task.status === "TODO" && (
                      <button
                        onClick={() => onQuickUpdateStatus(task.id, "IN_PROGRESS")}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-maitre-gold/20 text-maitre-gold hover:bg-maitre-gold/30 border border-maitre-gold/40 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}

                    {task.status === "IN_PROGRESS" && (
                      <>
                        {task.requiresApproval ? (
                          <button
                            onClick={() => onQuickUpdateStatus(task.id, "IN_REVIEW")}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/40 transition-colors"
                          >
                            Enviar p/ Revisão
                          </button>
                        ) : (
                          <button
                            onClick={() => onQuickUpdateStatus(task.id, "COMPLETED")}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            <span>Concluir</span>
                          </button>
                        )}
                      </>
                    )}

                    {task.status === "COMPLETED" && (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 size={13} /> Feita
                      </span>
                    )}

                    <button
                      onClick={() => onSelectTask(task)}
                      className="p-1 text-slate-500 hover:text-white"
                      title="Abrir detalhes completos"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
