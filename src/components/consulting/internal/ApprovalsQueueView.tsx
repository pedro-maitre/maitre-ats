"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Check,
  X,
  Loader2,
  ShieldCheck,
  FolderGit2,
} from "lucide-react";
import { InternalUserContext } from "@/lib/internal-management";
import { submitTaskReviewDecision } from "@/app/(dashboard)/consulting/internal-actions";

interface ApprovalsQueueViewProps {
  tasks: any[];
  userCtx: InternalUserContext;
  onRefresh: () => void;
  onSelectTask: (task: any) => void;
}

export default function ApprovalsQueueView({
  tasks,
  userCtx,
  onRefresh,
  onSelectTask,
}: ApprovalsQueueViewProps) {
  // Entregas que estão em revisão ou exigem aprovação
  const pendingApprovals = tasks.filter(
    (t) => t.status === "IN_REVIEW" || (t.requiresApproval && t.status === "IN_PROGRESS")
  );

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "CHANGES_REQUESTED">("APPROVED");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmitDecision = async () => {
    if (!selectedTask) return;
    setLoading(true);
    setFeedback(null);

    const res = await submitTaskReviewDecision({
      taskId: selectedTask.id,
      decision,
      comments,
    });

    setLoading(false);

    if (res.success) {
      setFeedback(
        decision === "APPROVED"
          ? "Entrega aprovada com sucesso!"
          : "Solicitação de ajustes enviada ao responsável!"
      );
      setSelectedTask(null);
      setComments("");
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      alert(res.error || "Falha ao registrar aprovação.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 size={20} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Fila Formal de Aprovações</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Entregáveis e demandas sob revisão com histórico de decisões auditadas e controle de versão.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          {pendingApprovals.length} item(ns) pendente(s)
        </span>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Entregas Pendentes */}
        <div className="lg:col-span-2 space-y-3">
          {pendingApprovals.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400/60" />
              <p className="font-semibold text-slate-400">Nenhuma aprovação pendente no momento!</p>
              <p className="mt-1">Todas as entregas submetidas já foram analisadas.</p>
            </div>
          ) : (
            pendingApprovals.map((task) => {
              const canReview =
                userCtx.isAdminMaster || (task.reviewerId && task.reviewerId === userCtx.userId);

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all bg-slate-900/90 ${
                    selectedTask?.id === task.id
                      ? "border-maitre-gold shadow-lg ring-1 ring-maitre-gold/30"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          {task.status === "IN_REVIEW" ? "Aguardando Parecer" : "Em Andamento"}
                        </span>
                        <h3 className="text-sm font-bold text-white">{task.title}</h3>
                      </div>
                      {task.project && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <FolderGit2 size={13} className="text-maitre-gold" />
                          <span>Projeto: {task.project.title}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canReview ? (
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 transition-colors shadow"
                        >
                          Avaliar Entrega
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Revisor: {task.reviewer?.name || "Aguardando"}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                    {task.description || "Sem descrição detalhada."}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-800">
                    <span>Responsável: <strong className="text-slate-300">{task.assignee?.name || "Sem dono"}</strong></span>
                    {task.dueDate && (
                      <span>Prazo: {new Date(task.dueDate).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulário Lateral de Emissão de Parecer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl h-fit space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck size={18} className="text-maitre-gold" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Painel de Avaliação Formal
            </h3>
          </div>

          {!selectedTask ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Selecione uma entrega na lista ao lado para emitir o parecer de aprovação ou solicitar ajustes.
            </p>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Entrega Selecionada</span>
                <p className="text-sm font-bold text-white mt-0.5">{selectedTask.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">Resp: {selectedTask.assignee?.name}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Decisão Formal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("APPROVED")}
                    className={`py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      decision === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    <Check size={13} />
                    <span>Aprovar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("CHANGES_REQUESTED")}
                    className={`py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      decision === "CHANGES_REQUESTED"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    <AlertTriangle size={13} />
                    <span>Ajustes</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Parecer / Comentários</label>
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Justificativa da decisão, apontamento de melhorias..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-maitre-gold"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitDecision}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 disabled:opacity-50 transition-colors shadow flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Registrar Decisão Homologada</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
