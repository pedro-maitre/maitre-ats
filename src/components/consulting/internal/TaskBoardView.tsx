"use client";

import React, { useState, useMemo } from "react";
import {
  Columns3,
  List,
  Filter,
  Plus,
  Lock,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Search,
  User,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { InternalUserContext, TaskStatus, TaskPriority } from "@/lib/internal-management";
import TaskModal from "./TaskModal";

interface TaskBoardViewProps {
  tasks: any[];
  projects: any[];
  clients: any[];
  teamMembers: any[];
  userCtx: InternalUserContext;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onCreateTask: () => void;
  onRefresh: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; badge: string }[] = [
  {
    id: "TODO",
    title: "A Fazer",
    color: "border-slate-700 bg-slate-900/60",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  {
    id: "IN_PROGRESS",
    title: "Em Andamento",
    color: "border-amber-500/40 bg-amber-500/5",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    id: "IN_REVIEW",
    title: "Em Revisão",
    color: "border-violet-500/40 bg-violet-500/5",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  {
    id: "COMPLETED",
    title: "Concluída",
    color: "border-emerald-500/40 bg-emerald-500/5",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "CANCELLED",
    title: "Cancelada",
    color: "border-rose-500/40 bg-rose-500/5",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
];

export default function TaskBoardView({
  tasks,
  projects,
  clients,
  teamMembers,
  userCtx,
  onUpdateTaskStatus,
  onCreateTask,
  onRefresh,
}: TaskBoardViewProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedBlockedOnly, setSelectedBlockedOnly] = useState(false);

  // Modal de detalhes da tarefa
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros aplicados
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProject !== "ALL" && t.projectId !== selectedProject) return false;
      if (selectedAssignee !== "ALL" && t.assigneeId !== selectedAssignee) return false;
      if (selectedPriority !== "ALL" && t.priority !== selectedPriority) return false;
      if (selectedBlockedOnly && !t.isBlocked) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(term);
        const matchesDesc = t.description?.toLowerCase().includes(term);
        const matchesAssignee = t.assignee?.name?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }
      return true;
    });
  }, [tasks, selectedProject, selectedAssignee, selectedPriority, selectedBlockedOnly, searchTerm]);

  // Manipulador de Drag and Drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    await onUpdateTaskStatus(draggableId, newStatus);
  };

  const handleOpenTask = (task: any) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas: Busca, Filtros, Alternância Lista/Kanban e Nova Tarefa */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, responsável..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-maitre-gold"
            />
          </div>

          {/* Filtro Projeto */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Filtro Responsável */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">Toda a Equipe</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Filtro Bloqueadas */}
          <button
            onClick={() => setSelectedBlockedOnly(!selectedBlockedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              selectedBlockedOnly
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <Lock size={12} />
            <span>Apenas Bloqueadas</span>
          </button>
        </div>

        {/* Alternador de Modo de Visão & Botão Nova Tarefa */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === "kanban"
                  ? "bg-maitre-gold text-amber-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Columns3 size={13} />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === "list"
                  ? "bg-maitre-gold text-amber-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List size={13} />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={onCreateTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 transition-colors shadow-md"
          >
            <Plus size={15} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Visão 1: KANBAN COM DRAG-AND-DROP */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className={`rounded-2xl border ${col.color} p-3 flex flex-col min-h-[480px] max-h-[75vh] shadow-lg`}
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">{col.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${col.badge}`}>
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Área Droppable */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 ${
                          snapshot.isDraggingOver ? "bg-slate-800/40 rounded-xl" : ""
                        }`}
                      >
                        {colTasks.map((task, index) => {
                          const isOverdue =
                            task.dueDate &&
                            new Date(task.dueDate) < new Date() &&
                            task.status !== "COMPLETED";

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => handleOpenTask(task)}
                                  className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-slate-800/90 hover:bg-slate-800 hover:border-slate-600 shadow-sm ${
                                    dragSnapshot.isDragging ? "shadow-2xl ring-2 ring-maitre-gold" : ""
                                  } ${
                                    task.isBlocked
                                      ? "border-amber-500/40 bg-amber-500/5"
                                      : "border-slate-700/80"
                                  }`}
                                >
                                  {/* Badges de Topo */}
                                  <div className="flex items-center justify-between gap-1 mb-2">
                                    <span
                                      className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                        task.priority === "URGENT"
                                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                          : task.priority === "HIGH"
                                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                          : "bg-slate-700 text-slate-300 border-slate-600"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>

                                    {task.isBlocked && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                        <Lock size={10} /> Bloqueada
                                      </span>
                                    )}
                                  </div>

                                  {/* Título */}
                                  <h4 className="text-xs font-bold text-white mb-2 line-clamp-2">
                                    {task.title}
                                  </h4>

                                  {/* Informações Complementares */}
                                  <div className="space-y-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-700/50">
                                    {task.project && (
                                      <div className="truncate text-slate-300 font-medium">
                                        📁 {task.project.title}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-slate-300">
                                        {task.assignee?.name || "Sem responsável"}
                                      </span>
                                      {task.dueDate && (
                                        <span className={isOverdue ? "text-rose-400 font-bold" : ""}>
                                          {new Date(task.dueDate).toLocaleDateString("pt-BR")}
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
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Visão 2: LISTA DETALHADA E ORDENÁVEL */}
      {viewMode === "list" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Título da Tarefa</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Prioridade</th>
                  <th className="p-3.5">Responsável</th>
                  <th className="p-3.5">Projeto / Cliente</th>
                  <th className="p-3.5">Prazo</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                      Nenhuma tarefa encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => handleOpenTask(task)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        {task.isBlocked && <Lock size={12} className="text-amber-400 shrink-0" />}
                        <span className="hover:text-maitre-gold transition-colors">{task.title}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            COLUMNS.find((c) => c.id === task.status)?.badge || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {COLUMNS.find((c) => c.id === task.status)?.title || task.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            task.priority === "URGENT"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : task.priority === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {task.assignee?.name || <span className="text-slate-500 italic">Sem dono</span>}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {task.project?.title || "-"}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="p-3.5 text-right text-slate-500">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalhado de Edição e Tarefa */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userCtx={userCtx}
          teamMembers={teamMembers}
          projects={projects}
          clients={clients}
          onTaskUpdated={() => {
            onRefresh();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
