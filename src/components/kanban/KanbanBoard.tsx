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
                className={`flex-shrink-0 w-80 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl flex flex-col border transition-colors ${
                  snapshot.isDraggingOver ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{stage.name}</h3>
                  <span className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-slate-200 dark:border-slate-700 shadow-sm">
                    {stage.candidates.length}
                  </span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                  <div className="space-y-3">
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
                              className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border transition-all ${
                                snapshot.isDragging 
                                  ? "border-[#c89650] shadow-xl scale-105 rotate-2 z-50 cursor-grabbing ring-4 ring-[#c89650]/20" 
                                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-grab hover:shadow-md"
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
                                  className="text-slate-400 hover:text-[#c89650] transition-colors p-1"
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
                                  <span className="text-slate-400 font-medium">Status AI</span>
                                  <div className="flex items-center gap-1">
                                    {candidate.priority === "PRIORIZADO" ? (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                        <CheckCircle size={12} /> Priori.
                                      </span>
                                    ) : candidate.priority === "DUVIDA" ? (
                                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                        <HelpCircle size={12} /> Dúvida
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                        Normal
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
