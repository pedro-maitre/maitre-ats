"use client";

import React, { useState } from "react";
import {
  FolderGit2,
  RefreshCw,
  Sparkles,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
} from "lucide-react";
import { InternalUserContext } from "@/lib/internal-management";

interface ProjectsServicesViewProps {
  projects: any[];
  tasks: any[];
  clients: any[];
  teamMembers: any[];
  userCtx: InternalUserContext;
  onOpenCreateProjectModal?: () => void;
  onSelectProject?: (proj: any) => void;
}

export default function ProjectsServicesView({
  projects,
  tasks,
  clients,
  teamMembers,
  userCtx,
  onOpenCreateProjectModal,
  onSelectProject,
}: ProjectsServicesViewProps) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PROJECT" | "RECURRING_SERVICE" | "INTERNAL_ACTIVITY">("ALL");
  const [selectedClient, setSelectedClient] = useState("ALL");

  const filteredProjects = projects.filter((p) => {
    if (typeFilter !== "ALL" && (p.projectType || "PROJECT") !== typeFilter) return false;
    if (selectedClient !== "ALL" && p.clientOrganizationId !== selectedClient) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 size={20} className="text-maitre-gold" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Projetos & Serviços Recorrentes da Maître
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Segmentação entre projetos com escopo fechado, serviços contínuos (BPO) e atividades internas de gestão.
          </p>
        </div>

        {userCtx.isAdminMaster && onOpenCreateProjectModal && (
          <button
            onClick={onOpenCreateProjectModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 transition-colors shadow-md self-start md:self-auto"
          >
            <Plus size={15} />
            <span>Novo Projeto / Serviço</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              typeFilter === "ALL" ? "bg-maitre-gold text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            onClick={() => setTypeFilter("PROJECT")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              typeFilter === "PROJECT" ? "bg-maitre-gold text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderGit2 size={13} />
            <span>Projetos Fechados</span>
          </button>
          <button
            onClick={() => setTypeFilter("RECURRING_SERVICE")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              typeFilter === "RECURRING_SERVICE"
                ? "bg-maitre-gold text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <RefreshCw size={13} />
            <span>Serviços Recorrentes</span>
          </button>
          <button
            onClick={() => setTypeFilter("INTERNAL_ACTIVITY")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              typeFilter === "INTERNAL_ACTIVITY"
                ? "bg-maitre-gold text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={13} />
            <span>Atividades Internas</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Cliente:</span>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Projetos / Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            <FolderGit2 size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-400">Nenhum projeto ou serviço encontrado nesta categoria.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const completedTasks = projectTasks.filter((t) => t.status === "COMPLETED").length;
            const blockedTasks = projectTasks.filter((t) => t.isBlocked && t.status !== "COMPLETED").length;

            const isRecurring = project.projectType === "RECURRING_SERVICE";
            const isInternal = project.projectType === "INTERNAL_ACTIVITY";

            return (
              <div
                key={project.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        isRecurring
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          : isInternal
                          ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                          : "bg-maitre-gold/20 text-maitre-gold border-maitre-gold/30"
                      }`}
                    >
                      {isRecurring
                        ? "Serviço Recorrente"
                        : isInternal
                        ? "Atividade Interna"
                        : "Projeto"}
                    </span>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {project.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-maitre-gold transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {project.description || "Sem descrição cadastrada."}
                    </p>
                  </div>

                  {project.clientOrganization && (
                    <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                      <Building2 size={13} className="text-cyan-400 shrink-0" />
                      <span className="font-semibold">{project.clientOrganization.name}</span>
                    </div>
                  )}

                  {/* Status das Tarefas Conectadas */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Demandas: {projectTasks.length} total</span>
                      <span className="text-emerald-400 font-bold">{completedTasks} concluída(s)</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-maitre-gold h-full transition-all"
                        style={{
                          width: `${projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Resp: <strong className="text-slate-300">{project.consultantName || "Equipe Maître"}</strong></span>
                  {blockedTasks > 0 && (
                    <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {blockedTasks} bloq.
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
