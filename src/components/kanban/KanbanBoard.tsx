/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { moveCandidate } from "@/app/(dashboard)/jobs/[id]/board/actions";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import {
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Award,
  Sparkles,
  Eye,
  EyeOff,
  FileText,
  MessageCircle,
  Phone,
  Shield,
} from "lucide-react";
import ApplicationActionModal from "./ApplicationActionModal";
import ResumeSplitViewer from "@/components/candidates/ResumeSplitViewer";
import WhatsAppQuickActionModal from "@/components/ui/WhatsAppQuickActionModal";

export type KanbanCandidate = {
  id: string; // applicationId
  candidateId: string;
  name: string;
  email?: string;
  phone?: string | null;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  salaryExpectation?: number | null;
  score: number;
  priority: string;
  fitCategory: string | null;
  enteredStageAt: Date;
  source: string | null;
  tags: string | null;
};

export type KanbanStage = {
  id: string;
  name: string;
  candidates: KanbanCandidate[];
};

// Calcula tempo de permanência na etapa e status do SLA
function getStageSlaInfo(date: Date) {
  const diffInMs = new Date().getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  let label = `${diffInHours}h`;
  if (diffInHours >= 24) {
    label = `${diffInDays}d`;
  }

  // SLA Rules: > 7 dias = Crítico (vermelho), > 3 dias = Atenção (âmbar), <= 3 dias = Normal
  let slaLevel: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
  if (diffInDays >= 7) {
    slaLevel = "CRITICAL";
  } else if (diffInDays >= 3) {
    slaLevel = "WARNING";
  }

  return { label, diffInDays, slaLevel };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function parseTags(tagsString: string | null | undefined) {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString).slice(0, 3);
  } catch {
    return tagsString.split(",").map((t) => t.trim()).slice(0, 3);
  }
}

export default function KanbanBoard({
  initialStages,
  jobTitle = "Vaga",
  companyName = "Maître Conecta",
}: {
  initialStages: KanbanStage[];
  jobTitle?: string;
  companyName?: string;
}) {
  const [stages, setStages] = useState(initialStages);
  const [isMounted, setIsMounted] = useState(false);
  const [isBlindRecruitment, setIsBlindRecruitment] = useState(false);

  // Modais
  const [selectedApp, setSelectedApp] = useState<{ id: string; name: string } | null>(null);
  const [splitCandidate, setSplitCandidate] = useState<KanbanCandidate | null>(null);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<KanbanCandidate | null>(null);

  useEffect(() => {
    setStages(initialStages);
  }, [initialStages]);

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
      const newStages = JSON.parse(JSON.stringify(prev)) as KanbanStage[];
      const sourceStage = newStages.find((s) => s.id === source.droppableId);
      const destStage = newStages.find((s) => s.id === destination.droppableId);

      if (sourceStage && destStage) {
        const [movedCard] = sourceStage.candidates.splice(source.index, 1);
        movedCard.enteredStageAt = new Date(); // Reset time visually
        destStage.candidates.splice(destination.index, 0, movedCard);
      }

      return newStages;
    });

    // Save to DB com transação atômica e histórico
    if (source.droppableId !== destination.droppableId) {
      await moveCandidate(draggableId, destination.droppableId);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-4">
      {/* Barra de Controles Rápidos do Kanban */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBlindRecruitment(!isBlindRecruitment)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isBlindRecruitment
                ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            }`}
            title="Oculta nomes e dados pessoais para avaliação 100% focada em competências"
          >
            {isBlindRecruitment ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>Triagem Cega (Blind Recruitment)</span>
            {isBlindRecruitment && (
              <span className="px-1.5 py-0.2 rounded bg-purple-800 text-[10px] uppercase font-black">
                Ativo
              </span>
            )}
          </button>
        </div>

        {/* Legenda de SLA */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            SLA Normal (&le; 2d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Atenção (&ge; 3d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Crítico (&ge; 7d)
          </span>
        </div>
      </div>

      {/* Board Drag-and-Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-8 h-[calc(100vh-230px)]">
          {stages.map((stage) => (
            <Droppable droppableId={stage.id} key={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-850 rounded-3xl flex flex-col transition-colors border ${
                    snapshot.isDraggingOver
                      ? "border-maitre-gold/30 bg-maitre-gold/5 dark:bg-maitre-gold/10"
                      : "border-slate-200/80 dark:border-slate-800/80"
                  }`}
                >
                  {/* Header da Coluna */}
                  <div className="p-4 flex justify-between items-center mb-1 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-black">
                      {stage.candidates.length}
                    </span>
                  </div>

                  {/* Lista de Cards da Etapa */}
                  <div className="flex-1 px-3 py-3 overflow-y-auto min-h-[150px]">
                    <div className="space-y-3">
                      {stage.candidates.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl opacity-60">
                          <span className="text-xs font-bold text-slate-400">Nenhum candidato nesta etapa</span>
                        </div>
                      )}
                      {stage.candidates.map((candidate, index) => {
                        const tags = parseTags(candidate.tags);
                        const sla = getStageSlaInfo(candidate.enteredStageAt);

                        const displayName = isBlindRecruitment
                          ? `Candidato #${candidate.candidateId.substring(0, 5).toUpperCase()}`
                          : candidate.name;

                        return (
                          <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                className={`bg-white dark:bg-slate-900 p-4 rounded-2xl transition-all group border ${
                                  snapshot.isDragging
                                    ? "shadow-2xl scale-105 rotate-1 z-50 cursor-grabbing border-maitre-gold ring-2 ring-maitre-gold/30"
                                    : "shadow-sm border-slate-200/80 dark:border-slate-800 hover:border-maitre-gold/40 hover:shadow-md cursor-grab"
                                }`}
                              >
                                {/* Topo do Card: Avatar, Nome e Botões Rápidos */}
                                <div className="flex justify-between items-start mb-3">
                                  <div
                                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                                    onClick={() => setSplitCandidate(candidate)}
                                    title="Clique para abrir Leitor de Currículo (Split View)"
                                  >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-inner shrink-0">
                                      {isBlindRecruitment ? <Shield size={14} className="text-purple-500" /> : getInitials(candidate.name)}
                                    </div>
                                    <div className="overflow-hidden">
                                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight group-hover:text-maitre-gold transition-colors truncate">
                                        {displayName}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-medium truncate">
                                        {isBlindRecruitment ? "Perfil Anonimizado" : candidate.source || "Banco de Talentos"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botões de Ação do Card */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Botão Split View (Leitor) */}
                                    <button
                                      type="button"
                                      onClick={() => setSplitCandidate(candidate)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      title="Visualizar Currículo (Split View)"
                                    >
                                      <FileText size={15} />
                                    </button>

                                    {/* Botão WhatsApp 1-Click */}
                                    {!isBlindRecruitment && candidate.phone && (
                                      <button
                                        type="button"
                                        onClick={() => setWhatsAppCandidate(candidate)}
                                        className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                        title="Enviar WhatsApp Rápido (1-Click)"
                                      >
                                        <MessageCircle size={15} />
                                      </button>
                                    )}

                                    {/* Mais Ações */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedApp({
                                          id: candidate.id,
                                          name: candidate.name,
                                        })
                                      }
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      title="Ações (Entrevista, Proposta, Fit)"
                                    >
                                      <MoreHorizontal size={15} />
                                    </button>
                                  </div>
                                </div>

                                {/* Tags de Competências */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {tags.map((tag: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Rodapé do Card: SLA e Fit Badge */}
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs items-center">
                                  {/* Indicador de SLA */}
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                        sla.slaLevel === "CRITICAL"
                                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                          : sla.slaLevel === "WARNING"
                                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                      }`}
                                      title={`Permanência na etapa: ${sla.label}`}
                                    >
                                      <Clock size={10} />
                                      <span>{sla.label}</span>
                                    </span>
                                  </div>

                                  {/* Fit Category Badge */}
                                  <div className="flex items-center justify-end">
                                    {candidate.fitCategory === "ALTO_FIT" ? (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px]">
                                        <CheckCircle size={10} /> Alto Fit
                                      </span>
                                    ) : candidate.fitCategory === "MEDIO_FIT" ? (
                                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px]">
                                        <HelpCircle size={10} /> Médio Fit
                                      </span>
                                    ) : candidate.fitCategory === "BAIXO_FIT" ? (
                                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded-md text-[10px]">
                                        <AlertTriangle size={10} /> Baixo Fit
                                      </span>
                                    ) : candidate.priority === "PRIORIZADO" ? (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md text-[10px]">
                                        <CheckCircle size={10} /> Prioritário
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">
                                        Em Triagem
                                      </span>
                                    )}
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

      {/* Split Viewer Modal */}
      {splitCandidate && (
        <ResumeSplitViewer
          isOpen={!!splitCandidate}
          onClose={() => setSplitCandidate(null)}
          candidate={{
            id: splitCandidate.id,
            candidateId: splitCandidate.candidateId,
            name: splitCandidate.name,
            email: splitCandidate.email || "",
            phone: splitCandidate.phone || null,
            resumeUrl: splitCandidate.resumeUrl || null,
            linkedinUrl: splitCandidate.linkedinUrl || null,
            source: splitCandidate.source,
            tags: splitCandidate.tags,
            salaryExpectation: splitCandidate.salaryExpectation || null,
            priority: splitCandidate.priority,
          }}
          jobTitle={jobTitle}
          companyName={companyName}
          onOpenActionsModal={(appId, name) => setSelectedApp({ id: appId, name })}
        />
      )}

      {/* WhatsApp Quick Action Modal */}
      {whatsAppCandidate && (
        <WhatsAppQuickActionModal
          isOpen={!!whatsAppCandidate}
          onClose={() => setWhatsAppCandidate(null)}
          applicationId={whatsAppCandidate.id}
          candidateName={whatsAppCandidate.name}
          candidatePhone={whatsAppCandidate.phone || null}
          jobTitle={jobTitle}
          companyName={companyName}
        />
      )}

      {/* Enterprise Action Modal */}
      {selectedApp && (
        <ApplicationActionModal
          applicationId={selectedApp.id}
          candidateName={selectedApp.name}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
