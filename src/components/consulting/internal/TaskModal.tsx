"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Users,
  Calendar,
  FolderGit2,
  FileCheck2,
  MessageSquare,
  Paperclip,
  Check,
  Send,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { InternalUserContext, TaskPriority, TaskStatus } from "@/lib/internal-management";
import {
  updateInternalTask,
  addTaskComment,
  toggleTaskChecklistItem,
  toggleSubtask,
  submitTaskReviewDecision,
} from "@/app/(dashboard)/consulting/internal-actions";

interface TaskModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  userCtx: InternalUserContext;
  teamMembers: any[];
  projects: any[];
  clients: any[];
  onTaskUpdated: () => void;
}

export default function TaskModal({
  task,
  isOpen,
  onClose,
  userCtx,
  teamMembers,
  projects,
  clients,
  onTaskUpdated,
}: TaskModalProps) {
  // Estados locais para edição
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "TODO");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "MEDIUM");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [reviewerId, setReviewerId] = useState(task?.reviewerId || "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );

  // Estados de bloqueio
  const [isBlocked, setIsBlocked] = useState(task?.isBlocked || false);
  const [blockReason, setBlockReason] = useState(task?.blockReason || "");
  const [showBlockInput, setShowBlockInput] = useState(false);

  // Estados de cancelamento
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);

  // Comentários
  const [comments, setComments] = useState<any[]>(task?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);

  // Checklist
  const [checklists, setChecklists] = useState(task?.checklists || []);
  const [newChecklistText, setNewChecklistText] = useState("");

  // Subtarefas
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);

  // Revisão
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "CHANGES_REQUESTED">("APPROVED");
  const [reviewComments, setReviewComments] = useState("");
  const [loadingReview, setLoadingReview] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sincroniza estados caso a task selecionada mude
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "TODO");
      setPriority(task.priority || "MEDIUM");
      setAssigneeId(task.assigneeId || "");
      setReviewerId(task.reviewerId || "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setIsBlocked(task.isBlocked || false);
      setBlockReason(task.blockReason || "");
      setShowBlockInput(false);
      setCancellationReason("");
      setShowCancelInput(false);
      setChecklists(task.checklists || []);
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
      setFeedback(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const isReviewerOrAdmin =
    userCtx?.isAdminMaster || (task?.reviewerId && task.reviewerId === userCtx?.userId);

  // Salva alterações gerais da tarefa
  const handleSaveGeneral = async () => {
    setSaving(true);
    setFeedback(null);

    const payload: any = {
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || null,
      reviewerId: reviewerId || null,
      dueDate: dueDate || null,
      isBlocked,
      blockReason: isBlocked ? blockReason : null,
      cancellationReason: status === "CANCELLED" ? cancellationReason : null,
    };

    const res = await updateInternalTask(task.id, payload);
    setSaving(false);

    if (res.success) {
      setFeedback({ type: "success", text: "Tarefa atualizada com sucesso!" });
      onTaskUpdated();
      setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback({ type: "error", text: res.error || "Erro ao salvar tarefa." });
    }
  };

  // Adiciona comentário
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoadingComment(true);
    const res = await addTaskComment(task.id, newComment);
    setLoadingComment(false);

    if (res.success) {
      if (res.comment) {
        setComments((prev: any[]) => [...prev, res.comment]);
      }
      setNewComment("");
      onTaskUpdated();
    }
  };

  // Alterna item de checklist
  const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
    setChecklists((prev: any[]) =>
      prev.map((c) => (c.id === itemId ? { ...c, isCompleted } : c))
    );
    await toggleTaskChecklistItem(itemId, isCompleted);
    onTaskUpdated();
  };

  // Alterna subtarefa
  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    setSubtasks((prev: any[]) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, isCompleted } : s))
    );
    await toggleSubtask(subtaskId, isCompleted);
    onTaskUpdated();
  };

  // Submete parecer de revisão
  const handleSubmitReview = async () => {
    setLoadingReview(true);
    const res = await submitTaskReviewDecision({
      taskId: task.id,
      decision: reviewAction,
      comments: reviewComments,
    });
    setLoadingReview(false);

    if (res.success) {
      setFeedback({
        type: "success",
        text: reviewAction === "APPROVED" ? "Entrega aprovada!" : "Ajustes solicitados ao responsável!",
      });
      setStatus(reviewAction === "APPROVED" ? "COMPLETED" : "IN_PROGRESS");
      onTaskUpdated();
    } else {
      setFeedback({ type: "error", text: res.error || "Erro ao registrar revisão." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0 bg-slate-900/90">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isBlocked && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Lock size={11} /> Bloqueada
                </span>
              )}
              {task.originType === "WEEKLY_MEETING" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/30">
                  Origem: Reunião Semanal
                </span>
              )}
              {task.project && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {task.project.title}
                </span>
              )}
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base sm:text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-maitre-gold focus:outline-none w-full transition-colors"
            />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 border-b border-rose-500/30"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Conteúdo Principal (2 Colunas) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Descrição, Checklist, Subtarefas, Comentários */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Descrição e Escopo da Entrega
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhe o contexto, requisitos e resultado esperado para esta entrega..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-maitre-gold focus:outline-none transition-colors"
              />
            </div>

            {/* Gestão de Bloqueio Operacional */}
            <div
              className={`p-4 rounded-xl border transition-colors ${
                isBlocked
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-slate-800/40 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isBlocked ? (
                    <Lock size={16} className="text-amber-400" />
                  ) : (
                    <Unlock size={16} className="text-slate-400" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {isBlocked ? "Impedimento / Bloqueio Ativo" : "Bloqueio Operacional"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Sinalize quando a demanda depender de aprovação de cliente, insumo externo ou terceiro.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isBlocked) {
                      setIsBlocked(false);
                      setBlockReason("");
                    } else {
                      setIsBlocked(true);
                      setShowBlockInput(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    isBlocked
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  }`}
                >
                  {isBlocked ? "Remover Bloqueio" : "Registrar Bloqueio"}
                </button>
              </div>

              {isBlocked && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-1">
                  <label className="text-[10px] font-bold text-amber-300 uppercase">
                    Motivo e Dependência do Bloqueio:
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Aguardando retorno da proposta salarial pelo cliente..."
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Checklist de Critérios ({checklists.filter((c: any) => c.isCompleted).length}/
                  {checklists.length})
                </span>
              </div>

              <div className="space-y-2">
                {checklists.map((item: any) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-maitre-gold focus:ring-0 focus:outline-none"
                    />
                    <span
                      className={
                        item.isCompleted ? "line-through text-slate-500" : "text-slate-200"
                      }
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subtarefas */}
            {subtasks.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Subtarefas Independentes
                </span>
                <div className="space-y-2">
                  {subtasks.map((sub: any) => (
                    <label
                      key={sub.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sub.isCompleted}
                          onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-maitre-gold focus:ring-0"
                        />
                        <span
                          className={
                            sub.isCompleted ? "line-through text-slate-500" : "text-slate-200"
                          }
                        >
                          {sub.title}
                        </span>
                      </div>
                      {sub.assignee && (
                        <span className="text-[10px] text-slate-400">{sub.assignee.name}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Aprovação / Parecer Formal do Revisor */}
            {task.requiresApproval && (
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-violet-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Revisão e Aprovação Obrigatória</h4>
                    <p className="text-[10px] text-slate-400">
                      Revisor designado:{" "}
                      <strong className="text-violet-300">
                        {task.reviewer?.name || "Não atribuído"}
                      </strong>
                    </p>
                  </div>
                </div>

                {isReviewerOrAdmin && task.status === "IN_REVIEW" && (
                  <div className="pt-2 border-t border-violet-500/20 space-y-2">
                    <label className="text-[10px] font-bold text-violet-300 uppercase block">
                      Parecer da Revisão:
                    </label>
                    <textarea
                      rows={2}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Insira comentários, feedback ou justificativa da aprovação/ajuste..."
                      className="w-full bg-slate-900 border border-violet-500/40 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewAction("APPROVED");
                          handleSubmitReview();
                        }}
                        disabled={loadingReview}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1 shadow"
                      >
                        <Check size={14} />
                        <span>Aprovar Entrega</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewAction("CHANGES_REQUESTED");
                          handleSubmitReview();
                        }}
                        disabled={loadingReview}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <AlertTriangle size={14} />
                        <span>Solicitar Ajustes</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Histórico de Decisões */}
                {task.reviews && task.reviews.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Decisões Registradas:
                    </span>
                    {task.reviews.map((r: any) => (
                      <div key={r.id} className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className={`font-bold ${r.decision === "APPROVED" ? "text-emerald-400" : "text-amber-400"}`}>
                          {r.decision === "APPROVED" ? "Aprovado" : "Ajustes Solicitados"}
                        </span>{" "}
                        por {r.reviewer?.name} em {new Date(r.decidedAt).toLocaleDateString("pt-BR")}:
                        <p className="italic text-slate-400 mt-0.5">{r.comments || "Sem notas."}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comentários */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} />
                Comentários e Alinhamentos ({comments.length})
              </span>

              <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {comments.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">
                    Nenhum comentário registrado ainda.
                  </p>
                ) : (
                  comments.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-800/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-300">{c.author?.name}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <p className="text-slate-200">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Caixa para novo comentário */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário ou atualização..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-maitre-gold"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={loadingComment || !newComment.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Lateral: Status, Prioridade, Responsável, Datas */}
          <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 h-fit text-xs">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
              >
                <option value="TODO">A Fazer</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="IN_REVIEW">Em Revisão</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            {status === "CANCELLED" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-300 uppercase">
                  Motivo do Cancelamento:
                </label>
                <input
                  type="text"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Motivo obrigatório..."
                  className="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {/* Prioridade */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            {/* Responsável Principal */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Responsável Principal
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
              >
                <option value="">Sem Responsável (Aguardando)</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.jobTitle || m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Revisor Designado */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Revisor Designado
              </label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
              >
                <option value="">Sem Revisor</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prazo */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Prazo de Entrega
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
              />
            </div>

            {/* Criador e Auditoria */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
              <p>Criado por: {task.creator?.name || "Sistema"}</p>
              <p>Em: {new Date(task.createdAt).toLocaleDateString("pt-BR")}</p>
              {task.completedAt && (
                <p className="text-emerald-400">
                  Concluído em: {new Date(task.completedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            {/* Botão de Salvar Alterações */}
            <button
              type="button"
              onClick={handleSaveGeneral}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-md mt-4"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
