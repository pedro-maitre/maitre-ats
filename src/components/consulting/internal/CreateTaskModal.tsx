"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  FolderGit2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { InternalUserContext, TaskPriority } from "@/lib/internal-management";
import { createInternalTask } from "@/app/(dashboard)/consulting/internal-actions";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCtx: InternalUserContext;
  teamMembers: any[];
  projects: any[];
  clients: any[];
  onTaskCreated: () => void;
  originMeetingId?: string;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  userCtx,
  teamMembers,
  projects,
  clients,
  onTaskCreated,
  originMeetingId,
}: CreateTaskModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientOrganizationId, setClientOrganizationId] = useState("");
  const [assigneeId, setAssigneeId] = useState(userCtx.userId || "");
  const [reviewerId, setReviewerId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Checklists dinâmicos
  const [checklists, setChecklists] = useState<string[]>([""]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddChecklist = () => {
    setChecklists([...checklists, ""]);
  };

  const handleUpdateChecklist = (index: number, val: string) => {
    const updated = [...checklists];
    updated[index] = val;
    setChecklists(updated);
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("O título da demanda é obrigatório.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await createInternalTask({
      title,
      description,
      projectId: projectId || undefined,
      clientOrganizationId: clientOrganizationId || undefined,
      assigneeId: assigneeId || undefined,
      reviewerId: reviewerId || undefined,
      priority,
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      requiresApproval,
      checklists: checklists.filter((c) => c.trim().length > 0),
      originMeetingId,
    });

    setSaving(false);

    if (res.success) {
      onTaskCreated();
      onClose();
    } else {
      setError(res.error || "Falha ao criar demanda.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Nova Demanda / Tarefa Interna</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Crie uma atividade conectada a projetos, delegue para a equipe ou registre compromisso semanal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
          {/* Título */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Demanda *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mapeamento de Longlist para vaga de Tech Lead..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-maitre-gold"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição e Objetivos</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o escopo, orientações e contexto..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-maitre-gold"
            />
          </div>

          {/* Vínculo de Projeto e Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Projeto / Serviço Relacionado</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none"
              >
                <option value="">Nenhum (Demanda Interna Avulsa)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Empresa Cliente Atendida (Opcional)</label>
              <select
                value={clientOrganizationId}
                onChange={(e) => setClientOrganizationId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none"
              >
                <option value="">Apenas Interno Maître</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsável e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Responsável Principal</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none"
              >
                <option value="">Aguardando Delegação (Sem Dono)</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.jobTitle || m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nível de Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          {/* Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Data Planejada de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 focus:outline-none"
              >
              </input>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Prazo Final de Entrega</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 focus:outline-none"
              >
              </input>
            </div>
          </div>

          {/* Governança e Revisão */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-maitre-gold focus:ring-0"
              />
              <span className="font-semibold text-white">Exige aprovação formal antes de ser concluída</span>
            </label>

            {requiresApproval && (
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Revisor Designado</label>
                <select
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 focus:outline-none"
                >
                  <option value="">Selecione o Revisor (ex: Adriana Pinheiro)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Checklist Inicial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Checklist de Verificação</label>
              <button
                type="button"
                onClick={handleAddChecklist}
                className="text-[10px] font-bold text-maitre-gold hover:underline flex items-center gap-1"
              >
                <Plus size={11} /> Adicionar Item
              </button>
            </div>

            {checklists.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={c}
                  onChange={(e) => handleUpdateChecklist(idx, e.target.value)}
                  placeholder={`Item ${idx + 1}...`}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                />
                {checklists.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-md flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Criar Demanda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
