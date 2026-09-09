"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FolderGit2,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Calendar,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  X,
  Loader2,
  Timer,
  FileSignature,
  Check,
  Ban,
  MessageSquare,
  Lock,
} from "lucide-react";
import {
  createConsultingProject,
  updateDeliverableStatus,
  updateProjectStatus,
  logConsultingHours,
  approveTimesheetEntry,
  approveDeliverableByClient,
  rejectDeliverableByClient,
} from "@/app/(dashboard)/consulting/actions";
import {
  updateInternalTask,
} from "@/app/(dashboard)/consulting/internal-actions";

// Subcomponentes da Central Interna
import InternalHubHeader, { InternalTabType } from "./internal/InternalHubHeader";
import OverviewExecutivePanel from "./internal/OverviewExecutivePanel";
import MyWorkView from "./internal/MyWorkView";
import ProjectsServicesView from "./internal/ProjectsServicesView";
import TaskBoardView from "./internal/TaskBoardView";
import InternalCalendarView from "./internal/InternalCalendarView";
import WeeklyMeetingHub from "./internal/WeeklyMeetingHub";
import ApprovalsQueueView from "./internal/ApprovalsQueueView";
import TeamWorkloadView from "./internal/TeamWorkloadView";
import NotificationsCenter from "./internal/NotificationsCenter";
import InternalSettingsView from "./internal/InternalSettingsView";
import CreateTaskModal from "./internal/CreateTaskModal";
import TaskModal from "./internal/TaskModal";

interface ConsultingDashboardClientProps {
  initialProjects: any[];
  organizations: Array<{ id: string; name: string; slug: string }>;
  isAdmin: boolean;
  initialInternalData?: any | null;
  initialTab?: InternalTabType;
}

export default function ConsultingDashboardClient({
  initialProjects,
  organizations,
  isAdmin,
  initialInternalData,
  initialTab = "overview",
}: ConsultingDashboardClientProps) {
  const router = useRouter();

  // Projetos B2B e Consultoria
  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<InternalTabType>(initialTab);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  // Dados da Central Interna
  const [internalData, setInternalData] = useState<any>(initialInternalData);
  const tasks = internalData?.tasks || [];
  const teamMembers = internalData?.teamMembers || [];
  const clients = internalData?.clients || [];
  const meetings = internalData?.meetings || [];
  const notifications = internalData?.notifications || [];
  const userCtx = internalData?.userCtx || {
    userId: "guest",
    email: "",
    name: "Visitante",
    role: "RECRUITER",
    organizationId: "",
    isMasterOrg: true,
    isAdminMaster: false,
  };
  const config = internalData?.config || null;

  // Modais de Tarefas
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedTaskModal, setSelectedTaskModal] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Modais de Projetos e Timesheets Legados
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [tsProjectId, setTsProjectId] = useState(projects[0]?.id || "");
  const [tsConsultantName, setTsConsultantName] = useState("Consultor Maître");
  const [tsHours, setTsHours] = useState("4");
  const [tsDesc, setTsDesc] = useState("");
  const [tsBillable, setTsBillable] = useState(true);
  const [tsHourlyRate, setTsHourlyRate] = useState("250");
  const [tsWorkDate, setTsWorkDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Modal de Aceite do Cliente
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDeliverable, setReviewDeliverable] = useState<any | null>(null);
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Formulário de Criação de Projeto
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjOrgId, setNewProjOrgId] = useState(organizations[0]?.id || "");
  const [newProjCategory, setNewProjCategory] = useState("HUNTING_EXECUTIVO");
  const [newProjType, setNewProjType] = useState("PROJECT");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjConsultantName, setNewProjConsultantName] = useState("Adriana");
  const [newProjBudget, setNewProjBudget] = useState("");
  const [newProjTargetDate, setNewProjTargetDate] = useState("");

  // Recalcula contagens para badges do Header
  const headerCounts = useMemo(() => {
    const now = new Date();
    const overdue = tasks.filter(
      (t: any) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < now
    ).length;

    const blocked = tasks.filter((t: any) => t.isBlocked && t.status !== "COMPLETED").length;
    const pendingReview = tasks.filter((t: any) => t.status === "IN_REVIEW").length;
    const unreadNotifications = notifications.filter((n: any) => !n.isRead).length;
    const myTasksCount = tasks.filter(
      (t: any) => t.assigneeId === userCtx.userId && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ).length;

    return {
      overdue,
      blocked,
      pendingReview,
      unreadNotifications,
      myTasksCount,
    };
  }, [tasks, notifications, userCtx.userId]);

  // Atualização rápida de status de tarefa
  const handleQuickUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const res = await updateInternalTask(taskId, { status: newStatus as any });
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Erro ao atualizar status.");
    }
  };

  // Toggle rápido de bloqueio
  const handleQuickToggleBlock = (task: any) => {
    setSelectedTaskModal(task);
    setIsTaskModalOpen(true);
  };

  // Criação de projeto
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("title", newProjTitle);
    formData.append("organizationId", newProjOrgId);
    formData.append("category", newProjCategory);
    formData.append("description", newProjDesc);
    formData.append("consultantName", newProjConsultantName);
    formData.append("budget", newProjBudget);
    formData.append("targetDate", newProjTargetDate);

    try {
      const res = await createConsultingProject(formData);
      if (res.success) {
        setIsProjectModalOpen(false);
        setNewProjTitle("");
        setNewProjDesc("");
        setFeedback({ type: "success", text: "Projeto corporativo criado com sucesso!" });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao criar projeto." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro de conexão ao salvar projeto." });
    } finally {
      setLoading(false);
    }
  };

  // Lançamento de Timesheet
  const handleLogHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tsProjectId || !tsDesc.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const fd = new FormData();
      fd.append("projectId", tsProjectId);
      fd.append("hours", tsHours);
      fd.append("activityDescription", tsDesc);
      fd.append("consultantName", tsConsultantName);
      fd.append("billable", tsBillable ? "true" : "false");
      fd.append("hourlyRate", tsHourlyRate);
      if (tsWorkDate) fd.append("workDate", tsWorkDate);

      const res = await logConsultingHours(fd);

      if (res.success) {
        setIsTimesheetModalOpen(false);
        setTsDesc("");
        setFeedback({ type: "success", text: "Horas consultivas apontadas com sucesso!" });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao apontar horas." });
      }
    } catch {
      setFeedback({ type: "error", text: "Falha de comunicação ao apontar horas." });
    } finally {
      setLoading(false);
    }
  };

  // Aprovação de Timesheet
  const handleApproveTimesheet = async (timesheetId: string) => {
    setLoading(true);
    try {
      const res = await approveTimesheetEntry(timesheetId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Erro ao aprovar horas.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-16">
      {/* Header com 10 Abas da Central Interna */}
      <InternalHubHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userCtx={userCtx}
        counts={headerCounts}
      />

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ABA 1: VISÃO GERAL (PAINEL DA ADRIANA) */}
      {activeTab === "overview" && (
        <OverviewExecutivePanel
          tasks={tasks}
          projects={projects}
          teamMembers={teamMembers}
          clients={clients}
          userCtx={userCtx}
          onSelectTask={(task) => {
            setSelectedTaskModal(task);
            setIsTaskModalOpen(true);
          }}
          onCreateTask={() => setIsCreateTaskModalOpen(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* ABA 2: MEU TRABALHO */}
      {activeTab === "my-work" && (
        <MyWorkView
          tasks={tasks}
          userCtx={userCtx}
          onSelectTask={(task) => {
            setSelectedTaskModal(task);
            setIsTaskModalOpen(true);
          }}
          onCreateTask={() => setIsCreateTaskModalOpen(true)}
          onQuickUpdateStatus={handleQuickUpdateTaskStatus}
          onQuickToggleBlock={handleQuickToggleBlock}
        />
      )}

      {/* ABA 3: PROJETOS E SERVIÇOS RECORRENTES */}
      {activeTab === "projects" && (
        <ProjectsServicesView
          projects={projects}
          tasks={tasks}
          clients={clients}
          teamMembers={teamMembers}
          userCtx={userCtx}
          onOpenCreateProjectModal={() => setIsProjectModalOpen(true)}
        />
      )}

      {/* ABA 4: QUADRO DE TAREFAS (LISTA + KANBAN) */}
      {activeTab === "tasks" && (
        <TaskBoardView
          tasks={tasks}
          projects={projects}
          clients={clients}
          teamMembers={teamMembers}
          userCtx={userCtx}
          onUpdateTaskStatus={async (taskId, newStatus) => {
            await handleQuickUpdateTaskStatus(taskId, newStatus);
          }}
          onCreateTask={() => setIsCreateTaskModalOpen(true)}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* ABA 5: AGENDA SEMANAL NO FUSO CONFIGURADO */}
      {activeTab === "calendar" && (
        <InternalCalendarView
          tasks={tasks}
          meetings={meetings}
          config={config}
          userCtx={userCtx}
          onSelectTask={(task) => {
            setSelectedTaskModal(task);
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {/* ABA 6: REUNIÃO SEMANAL (SEGUNDAS 15H30) */}
      {activeTab === "meetings" && (
        <WeeklyMeetingHub
          meetings={meetings}
          tasks={tasks}
          projects={projects}
          clients={clients}
          teamMembers={teamMembers}
          userCtx={userCtx}
          config={config}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* ABA 7: FILA FORMAL DE APROVAÇÕES */}
      {activeTab === "approvals" && (
        <ApprovalsQueueView
          tasks={tasks}
          userCtx={userCtx}
          onRefresh={() => router.refresh()}
          onSelectTask={(task) => {
            setSelectedTaskModal(task);
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {/* ABA 8: EQUIPE DA MAÎTRE & DISTRIBUIÇÃO */}
      {activeTab === "team" && (
        <TeamWorkloadView
          teamMembers={teamMembers}
          tasks={tasks}
          userCtx={userCtx}
          onSelectTask={(task) => {
            setSelectedTaskModal(task);
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {/* ABA 9: NOTIFICAÇÕES IN-APP */}
      {activeTab === "notifications" && (
        <NotificationsCenter
          notifications={notifications}
          onRefresh={() => router.refresh()}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* ABA 10: CONFIGURAÇÕES DA CENTRAL (ADMIN MASTER) */}
      {activeTab === "settings" && (
        <InternalSettingsView
          config={config}
          userCtx={userCtx}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* ABA LEGADA: TIMESHEET & APONTAMENTO DE HORAS */}
      {activeTab === "timesheet" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Timer size={20} className="text-maitre-gold" />
                <h2 className="text-lg font-bold text-white tracking-tight">Timesheet Consultivo</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Apontamento de horas dedicadas a projetos de consultoria e executive search.
              </p>
            </div>
            <button
              onClick={() => setIsTimesheetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-amber-950 hover:bg-amber-400 transition-colors shadow-md flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Apontar Horas</span>
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="p-3.5">Consultor</th>
                  <th className="p-3.5">Projeto</th>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Horas</th>
                  <th className="p-3.5">Atividade</th>
                  <th className="p-3.5">Status</th>
                  {isAdmin && <th className="p-3.5 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projects.flatMap((p) => p.timesheets || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                      Nenhum apontamento de horas registrado ainda.
                    </td>
                  </tr>
                ) : (
                  projects.flatMap((p) => p.timesheets || []).map((ts: any) => (
                    <tr key={ts.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-white">{ts.consultantName}</td>
                      <td className="p-3.5 text-slate-300">{ts.project?.title || "Projeto"}</td>
                      <td className="p-3.5 text-slate-400">{new Date(ts.workDate).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3.5 font-bold text-maitre-gold">{ts.hours}h</td>
                      <td className="p-3.5 text-slate-300 max-w-xs truncate">{ts.activityDescription}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                            ts.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {ts.status === "APPROVED" ? "Aprovado" : "Submetido"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-right">
                          {ts.status !== "APPROVED" && (
                            <button
                              onClick={() => handleApproveTimesheet(ts.id)}
                              disabled={loading}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                            >
                              Aprovar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA LEGADA: PORTAL CLIENTE */}
      {activeTab === "client-portal" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Portal do Cliente Corporativo</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Validação de entregáveis corporativos publicados para aceite formal dos clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.flatMap((p) => p.deliverables || []).map((deliv: any) => (
              <div key={deliv.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      deliv.approvedByClient
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {deliv.approvedByClient ? "Aprovado pelo Cliente" : "Aguardando Aceite"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{deliv.title}</h4>
                <p className="text-xs text-slate-400">{deliv.description || "Entregável do projeto."}</p>
                {deliv.clientFeedback && (
                  <p className="text-[11px] text-slate-300 italic pt-2 border-t border-slate-800">
                    Feedback do Cliente: "{deliv.clientFeedback}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE TAREFA */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        userCtx={userCtx}
        teamMembers={teamMembers}
        projects={projects}
        clients={clients}
        onTaskCreated={() => router.refresh()}
      />

      {/* MODAL DE DETALHES DE TAREFA */}
      {selectedTaskModal && (
        <TaskModal
          task={selectedTaskModal}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTaskModal(null);
          }}
          userCtx={userCtx}
          teamMembers={teamMembers}
          projects={projects}
          clients={clients}
          onTaskUpdated={() => {
            router.refresh();
            setIsTaskModalOpen(false);
          }}
        />
      )}

      {/* MODAL DE CRIAÇÃO DE PROJETO */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Novo Projeto / Serviço</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título do Projeto</label>
                <input
                  type="text"
                  required
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="Ex: Hunting Executivo C-Level..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-maitre-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                <select
                  value={newProjType}
                  onChange={(e) => setNewProjType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="PROJECT">Projeto Fechado (Escopo delimitado)</option>
                  <option value="RECURRING_SERVICE">Serviço Recorrente (BPO continuado)</option>
                  <option value="INTERNAL_ACTIVITY">Atividade Interna Maître</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Empresa Cliente</label>
                <select
                  value={newProjOrgId}
                  onChange={(e) => setNewProjOrgId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Consultor Responsável</label>
                <select
                  value={newProjConsultantName}
                  onChange={(e) => setNewProjConsultantName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.jobTitle || m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl font-bold bg-maitre-gold text-amber-950 hover:bg-amber-400"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE APONTAMENTO DE TIMESHEET */}
      {isTimesheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Apontar Horas de Consultoria</h3>
              <button onClick={() => setIsTimesheetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogHoursSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Projeto</label>
                <select
                  value={tsProjectId}
                  onChange={(e) => setTsProjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Horas</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={tsHours}
                    onChange={(e) => setTsHours(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Data</label>
                  <input
                    type="date"
                    required
                    value={tsWorkDate}
                    onChange={(e) => setTsWorkDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição da Atividade</label>
                <textarea
                  rows={3}
                  required
                  value={tsDesc}
                  onChange={(e) => setTsDesc(e.target.value)}
                  placeholder="Descreva as entregas realizadas no período..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimesheetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl font-bold bg-maitre-gold text-amber-950 hover:bg-amber-400"
                >
                  Salvar Horas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
