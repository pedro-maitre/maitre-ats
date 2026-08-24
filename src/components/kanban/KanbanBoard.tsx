"use client";

import React, { useState, useEffect } from "react";
import { moveCandidate } from "@/app/(dashboard)/jobs/[id]/board/actions";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { ExternalLink, Clock, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

type Candidate = {
  id: string; // This is the applicationId
  candidateId: string;
  name: string;
  score: number;
  priority: string;
  fitCategory: string | null;
  enteredStageAt: Date;
  source: string | null;
  tags: string | null;
};

type Stage = {
  id: string;
  name: string;
  candidates: Candidate[];
};

function getTimeInStage(date: Date) {
  const diffInMs = new Date().getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

function parseTags(tagsString: string | null) {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString).slice(0, 3);
  } catch {
    return tagsString.split(",").map(t => t.trim()).slice(0, 3);
  }
}

export default function KanbanBoard({ initialStages }: { initialStages: Stage[] }) {
  const [stages, setStages] = useState(initialStages);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic UI update
    setStages((prev) => {
      const newStages = JSON.parse(JSON.stringify(prev)) as Stage[];
      const sourceStage = newStages.find((s) => s.id === source.droppableId);
      const destStage = newStages.find((s) => s.id === destination.droppableId);
      
      if (sourceStage && destStage) {
        const [movedCard] = sourceStage.candidates.splice(source.index, 1);
        movedCard.enteredStageAt = new Date(); // Reset time visually
        destStage.candidates.splice(destination.index, 0, movedCard);
      }
      
      return newStages;
    });

    // Save to DB
    if (source.droppableId !== destination.droppableId) {
      await moveCandidate(draggableId, destination.droppableId);
    }
  };

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-8 h-[calc(100vh-200px)]">
        {stages.map((stage) => (
          <Droppable droppableId={stage.id} key={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col transition-colors border ${
                  snapshot.isDraggingOver ? "border-maitre-gold/30 bg-maitre-gold/5 dark:bg-maitre-gold/10" : "border-transparent"
                }`}
              >
                <div className="p-4 flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{stage.name}</h3>
                  <span className="bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium">
                    {stage.candidates.length}
                  </span>
                </div>
                
                <div className="flex-1 px-3 pb-3 overflow-y-auto min-h-[150px]">
                  <div className="space-y-3">
                    {stage.candidates.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl opacity-60">
                         <span className="text-xs font-medium text-slate-400">Vazio</span>
                      </div>
                    )}
                    {stage.candidates.map((candidate, index) => {
                      const tags = parseTags(candidate.tags);
                      
                      return (
                        <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`bg-white dark:bg-slate-900 p-4 rounded-xl transition-all ${
                                snapshot.isDragging 
                                  ? "shadow-2xl scale-105 rotate-2 z-50 cursor-grabbing ring-2 ring-maitre-gold" 
                                  : "shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5 hover:shadow-md cursor-grab"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-inner shrink-0">
                                    {getInitials(candidate.name)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white leading-tight">{candidate.name}</div>
                                    <div className="text-xs text-slate-500 font-medium">{candidate.source || "Banco"}</div>
                                  </div>
                                </div>
                                <Link 
                                  href={`/candidates/${candidate.candidateId}`}
                                  target="_blank"
                                  className="text-slate-400 hover:text-maitre-gold transition-colors p-1"
                                  title="Abrir Perfil"
                                >
                                  <ExternalLink size={16} />
                                </Link>
                              </div>

                              {/* Badges & Tags */}
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {tags.map((tag: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                                <div className="flex flex-col gap-1">
                                  <span className="text-slate-400 font-medium">Tempo</span>
                                  <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                    <Clock size={12} className="text-slate-400" />
                                    {getTimeInStage(candidate.enteredStageAt)}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1 items-end">
                                  <span className="text-slate-400 font-medium">Classificação Fit</span>
                                  <div className="flex items-center gap-1">
                                    {candidate.fitCategory === "ALTO_FIT" ? (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                        <CheckCircle size={11} /> Alto Fit
                                      </span>
                                    ) : candidate.fitCategory === "MEDIO_FIT" ? (
                                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                        <HelpCircle size={11} /> Médio Fit
                                      </span>
                                    ) : candidate.fitCategory === "BAIXO_FIT" ? (
                                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                        <AlertTriangle size={11} /> Baixo Fit
                                      </span>
                                    ) : candidate.priority === "PRIORIZADO" ? (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-[11px]">
                                        <CheckCircle size={11} /> Priori.
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                        Em Triagem
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
