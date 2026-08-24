"use client";

import React, { useState } from "react";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import SmartTriagemTable, {
  TriagemCandidate,
  StageOption,
  JobInfo,
} from "@/components/triagem/SmartTriagemTable";
import {
  Kanban,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { batchRecalculateAndPersistFit } from "@/app/(dashboard)/jobs/[id]/board/actions";

export default function JobPipelineContainer({
  initialStages,
  triagemCandidates,
  stagesList,
  job,
}: {
  initialStages: any[];
  triagemCandidates: TriagemCandidate[];
  stagesList: StageOption[];
  job: JobInfo;
}) {
  const [viewMode, setViewMode] = useState<"kanban" | "triagem">("kanban");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateSuccess, setRecalculateSuccess] = useState(false);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setRecalculateSuccess(false);

    try {
      const res = await batchRecalculateAndPersistFit(job.id);
      if (res.success) {
        setRecalculateSuccess(true);
        setTimeout(() => setRecalculateSuccess(false), 3000);
      } else {
        alert(res.error || "Erro ao recalcular Fit.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao recalcular.");
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top View Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Toggle Switcher */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Kanban size={15} className="text-maitre-gold" />
            <span>Pipeline Kanban</span>
          </button>

          <button
            onClick={() => setViewMode("triagem")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === "triagem"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <TableIcon size={15} className="text-maitre-gold" />
            <span>Triagem Inteligente (Fit 3D)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </div>

        {/* Right Action: Sync & Recalculate */}
        <div className="flex items-center gap-3">
          {recalculateSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 size={14} /> Fit Atualizado!
            </span>
          )}

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            title="Recalcular scores de aderência de todos os candidatos"
          >
            {isRecalculating ? (
              <Loader2 size={13} className="animate-spin text-maitre-gold" />
            ) : (
              <RefreshCw size={13} className="text-maitre-gold" />
            )}
            <span>Sincronizar Fit 3D</span>
          </button>
        </div>
      </div>

      {/* Content Area based on Selected Mode */}
      {viewMode === "kanban" ? (
        <div className="animate-in fade-in duration-300">
          <KanbanBoard initialStages={initialStages} />
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <SmartTriagemTable
            initialCandidates={triagemCandidates}
            stages={stagesList}
            job={job}
          />
        </div>
      )}
    </div>
  );
}
