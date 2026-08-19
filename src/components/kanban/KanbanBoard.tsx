"use client";

import React, { useState, useEffect } from "react";
import { moveCandidate } from "@/app/(dashboard)/jobs/[id]/board/actions";
import CandidateModal from "@/components/candidates/CandidateModal";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Candidate = {
  id: string; // This is the applicationId
  name: string;
  score: number;
};

type Stage = {
  id: string;
  name: string;
  candidates: Candidate[];
};

export default function KanbanBoard({ initialStages }: { initialStages: Stage[] }) {
  const [stages, setStages] = useState(initialStages);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // This is needed to prevent hydration mismatch with beautiful-dnd
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
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-8 h-[calc(100vh-200px)]">
          {stages.map((stage) => (
            <Droppable droppableId={stage.id} key={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-80 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col border transition-colors ${
                    snapshot.isDraggingOver ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{stage.name}</h3>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">
                      {stage.candidates.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                    <div className="space-y-3">
                      {stage.candidates.map((candidate, index) => (
                        <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedCandidate(candidate)}
                              style={{ ...provided.draggableProps.style }}
                              className={`bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border transition-all ${
                                snapshot.isDragging 
                                  ? "border-blue-500 shadow-xl scale-105 rotate-2 z-50 cursor-grabbing" 
                                  : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-grab"
                              }`}
                            >
                              <div className="font-medium text-slate-800 dark:text-slate-100 mb-1">{candidate.name}</div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Aderência</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{candidate.score}%</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <CandidateModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />
    </>
  );
}
