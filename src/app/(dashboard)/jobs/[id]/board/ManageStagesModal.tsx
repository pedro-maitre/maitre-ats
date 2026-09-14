"use client";

import React, { useState } from "react";
import { Plus, Edit2, Check, X, Layers, Loader2 } from "lucide-react";
import { createJobStage, renameJobStage } from "./actions";

interface StageItem {
  id: string;
  name: string;
  order: number;
}

interface ManageStagesModalProps {
  jobId: string;
  stages: StageItem[];
}

export default function ManageStagesModal({ jobId, stages }: ManageStagesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stagesList, setStagesList] = useState<StageItem[]>(stages);
  const [newStageName, setNewStageName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createJobStage(jobId, newStageName.trim());
      if (res.success && res.stage) {
        setStagesList([...stagesList, { id: res.stage.id, name: res.stage.name, order: res.stage.order }]);
        setNewStageName("");
      } else {
        setErrorMessage(res.error || "Erro ao criar etapa.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRename = async (stageId: string) => {
    if (!editingName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await renameJobStage(stageId, editingName.trim());
      if (res.success) {
        setStagesList(
          stagesList.map((s) => (s.id === stageId ? { ...s, name: editingName.trim() } : s))
        );
        setEditingId(null);
        setEditingName("");
      } else {
        setErrorMessage(res.error || "Erro ao renomear etapa.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-sm"
      >
        <Layers size={14} className="text-maitre-gold" />
        <span>Configurar Etapas</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-maitre-gold/10 text-maitre-gold">
                  <Layers size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Etapas do Processo Seletivo
                  </h2>
                  <p className="text-xs text-slate-500">Funil de etapas customizado desta vaga</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold">
                {errorMessage}
              </div>
            )}

            {/* List of Stages */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {stagesList.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-sm"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {editingId === stage.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-maitre-gold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {stage.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId === stage.id ? (
                      <>
                        <button
                          onClick={() => handleSaveRename(stage.id)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-xs"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-xs"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(stage.id);
                          setEditingName(stage.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-maitre-gold hover:bg-maitre-gold/10 transition-colors"
                        title="Renomear etapa"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Stage Form */}
            <form onSubmit={handleAddStage} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da nova etapa (ex: Painel de Case)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-maitre-gold"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newStageName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-maitre-gold text-slate-950 text-xs font-black hover:brightness-105 transition-all disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Adicionar</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
