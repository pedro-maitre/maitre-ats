"use client";

import React, { useState } from "react";
import Link from "next/link";
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

interface ConsultingDashboardClientProps {
  initialProjects: any[];
  organizations: Array<{ id: string; name: string; slug: string }>;
  isAdmin: boolean;
}

export default function ConsultingDashboardClient({
  initialProjects,
  organizations,
  isAdmin,
}: ConsultingDashboardClientProps) {
  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<"projects" | "timesheet" | "client-portal">("projects");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados de Timesheet
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [tsProjectId, setTsProjectId] = useState(projects[0]?.id || "");
  const [tsConsultantName, setTsConsultantName] = useState("Consultor Maître");
  const [tsHours, setTsHours] = useState("4");
  const [tsDesc, setTsDesc] = useState("");
  const [tsBillable, setTsBillable] = useState(true);
  const [tsHourlyRate, setTsHourlyRate] = useState("250");
  const [tsWorkDate, setTsWorkDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Estados de Portal do Cliente (Revisão Formal)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDeliverable, setReviewDeliverable] = useState<any | null>(null);
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [category, setCategory] = useState("HUNTING_EXECUTIVO");
  const [description, setDescription] = useState("");
  const [consultantName, setConsultantName] = useState("Erika");
  const [budget, setBudget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const categories = [
    { value: "HUNTING_EXECUTIVO", label: "Hunting Executivo" },
    { value: "CARGOS_SALARIOS", label: "Cargos & Salários" },
    { value: "DIAGNOSTICO_CLIMA", label: "Diagnóstico de Clima & DHO" },
    { value: "MENTORIA_LIDERANCA", label: "Mentoria de Liderança" },
    { value: "GOVERNANCA_RH", label: "Governança & Políticas de RH" },
  ];

  const filtered = projects.filter((p) => {
    const matchesOrg = selectedOrgFilter === "ALL" || p.organizationId === selectedOrgFilter;
    const matchesCategory = selectedCategoryFilter === "ALL" || p.category === selectedCategoryFilter;
    return matchesOrg && matchesCategory;
  });

  const totalProjects = projects.length;
  const inProgressCount = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  const handleToggleDeliverable = async (deliverableId: string, currentStatus: string, projectId: string) => {
    const nextStatus = currentStatus === "APPROVED" ? "IN_PROGRESS" : "APPROVED";

    try {
      const res = await updateDeliverableStatus(deliverableId, nextStatus);
      if (res.success) {
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== projectId) return proj;
            const updatedDeliverables = proj.deliverables.map((d: any) =>
              d.id === deliverableId ? { ...d, status: nextStatus } : d
            );
            return {
              ...proj,
              deliverables: updatedDeliverables,
              progressPercent: res.progressPercent,
              status: res.progressPercent === 100 ? "COMPLETED" : "IN_PROGRESS",
            };
          })
        );
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Erro ao atualizar marco." });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("organizationId", organizationId);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("consultantName", consultantName);
      formData.append("budget", budget);
      formData.append("targetDate", targetDate);
      formData.append("deliverables", deliverables);

      const res = await createConsultingProject(formData);
      if (!res.success) throw new Error(res.error);

      setFeedback({ type: "success", text: "Projeto de consultoria criado com sucesso!" });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Consolidação de Timesheets de todos os projetos
  const allTimesheets = projects.flatMap((p) =>
    (p.timesheets || []).map((t: any) => ({
      ...t,
      projectTitle: p.title,
      orgName: p.organization?.name || "Empresa",
    }))
  );

  const totalLoggedHours = allTimesheets.reduce((acc, t) => acc + (t.hours || 0), 0);
  const billableHours = allTimesheets.filter((t) => t.billable).reduce((acc, t) => acc + (t.hours || 0), 0);
  const totalBilledValue = allTimesheets.filter((t) => t.billable).reduce((acc, t) => acc + (t.hours * (t.hourlyRate || 250)), 0);

  // Consolidação de Entregáveis para o Portal do Cliente
  const allDeliverables = projects.flatMap((p) =>
    (p.deliverables || []).map((d: any) => ({
      ...d,
      projectId: p.id,
      projectTitle: p.title,
      orgName: p.organization?.name || "Empresa",
      category: p.category,
    }))
  );

  // Handler de Apontamento de Horas
  const handleLogHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("projectId", tsProjectId);
    formData.append("hours", tsHours);
    formData.append("activityDescription", tsDesc);
    formData.append("consultantName", tsConsultantName);
    formData.append("billable", String(tsBillable));
    formData.append("hourlyRate", tsHourlyRate);
    formData.append("workDate", tsWorkDate);

    try {
      const res = await logConsultingHours(formData);
      if (res.success && res.timesheet) {
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== tsProjectId) return proj;
            return {
              ...proj,
              timesheets: [res.timesheet, ...(proj.timesheets || [])],
            };
          })
        );
        setFeedback({ type: "success", text: "Apontamento de horas registrado com sucesso!" });
        setIsTimesheetModalOpen(false);
        setTsDesc("");
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao apontar horas." });
      }
    } catch {
      setFeedback({ type: "error", text: "Falha ao registrar apontamento." });
    } finally {
      setLoading(false);
    }
  };

  // Handler de Aprovação de Timesheet
  const handleApproveTimesheet = async (timesheetId: string, projectId: string) => {
    setLoading(true);
    try {
      const res = await approveTimesheetEntry(timesheetId);
      if (res.success) {
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== projectId) return proj;
            return {
              ...proj,
              timesheets: (proj.timesheets || []).map((t: any) =>
                t.id === timesheetId ? { ...t, status: "APPROVED" } : t
              ),
            };
          })
        );
        setFeedback({ type: "success", text: "Horas aprovadas formalmente!" });
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao aprovar horas." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao processar aprovação." });
    } finally {
      setLoading(false);
    }
  };

  // Handler de Aceite / Rejeição de Entregável pelo Cliente
  const handleSubmitClientReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDeliverable) return;
    setLoading(true);
    setFeedback(null);

    try {
      if (reviewAction === "APPROVE") {
        const res = await approveDeliverableByClient(
          reviewDeliverable.id,
          reviewEmail || "cliente@empresa.com",
          reviewFeedback
        );
        if (res.success) {
          setProjects((prev) =>
            prev.map((proj) => {
              if (proj.id !== reviewDeliverable.projectId) return proj;
              const updated = (proj.deliverables || []).map((d: any) =>
                d.id === reviewDeliverable.id ? res.deliverable : d
              );
              return {
                ...proj,
                deliverables: updated,
                progressPercent: res.progressPercent,
              };
            })
          );
          setFeedback({ type: "success", text: "Aceite formal do entregável concedido com sucesso!" });
          setIsReviewModalOpen(false);
        } else {
          setFeedback({ type: "error", text: res.error || "Erro ao conceder aceite." });
        }
      } else {
        const res = await rejectDeliverableByClient(
          reviewDeliverable.id,
          reviewEmail || "cliente@empresa.com",
          reviewFeedback
        );
        if (res.success) {
          setProjects((prev) =>
            prev.map((proj) => {
              if (proj.id !== reviewDeliverable.projectId) return proj;
              const updated = (proj.deliverables || []).map((d: any) =>
                d.id === reviewDeliverable.id ? res.deliverable : d
              );
              return { ...proj, deliverables: updated };
            })
          );
          setFeedback({ type: "success", text: "Solicitação de revisão enviada à equipe da Maître." });
          setIsReviewModalOpen(false);
        } else {
          setFeedback({ type: "error", text: res.error || "Erro ao solicitar revisão." });
        }
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao processar revisão do cliente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
              <Sparkles size={13} /> Conecta Consultoria
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Projetos Especializados Maître</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Projetos, Timesheet & Portal do Cliente
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Acompanhe projetos estratégicos, aponte horas consultivas e emita aceite formal de entregáveis corporativos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "projects" && isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Novo Projeto</span>
            </button>
          )}

          {activeTab === "timesheet" && (
            <button
              onClick={() => {
                if (projects[0]) setTsProjectId(projects[0].id);
                setIsTimesheetModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Timer size={16} />
              <span>Apontar Horas</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "projects"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FolderGit2 size={15} /> Projetos Estratégicos ({projects.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("timesheet")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "timesheet"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Timer size={15} /> Apontamento de Horas / Timesheet ({totalLoggedHours}h)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("client-portal")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "client-portal"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FileSignature size={15} /> Portal do Cliente (Aceite Formal)
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ABA 1: PROJETOS ESTRATÉGICOS (EXISTENTE) */}
      {activeTab === "projects" && (
        <div className="space-y-8 animate-in fade-in">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Projetos</span>
            <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
              <FolderGit2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalProjects}</p>
          <span className="text-xs font-medium text-slate-400">Contratos consultivos</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Em Andamento</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{inProgressCount}</p>
          <span className="text-xs font-medium text-cyan-400">Com marcos em execução</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Concluídos & Homologados</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{completedCount}</p>
          <span className="text-xs font-medium text-emerald-400">100% entregues ao cliente</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Valor Contratado</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalBudget)}</p>
          <span className="text-xs font-medium text-slate-400">Escopo fechado</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Cliente Parceiro:</span>
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
            >
              <option value="ALL">Todos os Clientes</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Categoria:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
            >
              <option value="ALL">Todas as Especialidades</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Projetos de Consultoria */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <FolderGit2 size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum projeto de consultoria encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Abra um novo projeto para gerenciar marcos, entregáveis e o avanço dos serviços para os clientes atendidos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => {
            const completedDels = proj.deliverables?.filter((d: any) => d.status === "APPROVED").length || 0;
            const totalDels = proj.deliverables?.length || 0;

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Topo do Card de Projeto */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clients/${proj.organizationId}`}
                          className="text-[11px] font-black uppercase tracking-wider text-maitre-gold hover:underline flex items-center gap-1"
                        >
                          <Building2 size={12} />
                          <span>{proj.organization?.name || "Cliente Parceiro"}</span>
                        </Link>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-snug">
                        {proj.title}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                        proj.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      }`}
                    >
                      {proj.status === "COMPLETED" ? "Concluído" : "Em Andamento"}
                    </span>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  {/* Barra de Progresso */}
                  <div className="my-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Progresso Geral</span>
                      <span className="text-maitre-gold">{proj.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-maitre-gold to-amber-400 transition-all duration-500"
                        style={{ width: `${proj.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Marcos e Entregáveis */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Marcos & Entregáveis ({completedDels}/{totalDels})</span>
                      <span className="text-[10px] text-slate-500">Clique para aprovar</span>
                    </div>

                    <div className="space-y-1.5">
                      {proj.deliverables?.map((del: any) => {
                        const isDone = del.status === "APPROVED";
                        return (
                          <button
                            key={del.id}
                            type="button"
                            onClick={() => handleToggleDeliverable(del.id, del.status, proj.id)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isDone
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                                  isDone
                                    ? "bg-emerald-600 text-white font-black shadow-sm"
                                    : "border border-slate-500"
                                }`}
                              >
                                {isDone && "✓"}
                              </div>
                              <span className={`truncate font-medium ${isDone ? "line-through opacity-80" : ""}`}>
                                {del.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 opacity-70">
                              {isDone ? "Aprovado" : "Pendente"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-maitre-gold" />
                    <span>Consultor: <strong className="text-slate-900 dark:text-white">{proj.consultantName || "Equipe Maître"}</strong></span>
                  </div>

                  {proj.budget && (
                    <span className="font-bold text-emerald-500">
                      {formatCurrency(proj.budget)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )}

      {/* Modal de Criação de Projeto de Consultoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Novo Projeto de Consultoria
                </h3>
                <p className="text-xs text-slate-400">
                  Vincule o projeto ao cliente e defina o escopo de entregáveis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal de novo projeto"
                className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Empresa Cliente Parceira *
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Título do Projeto *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hunting Executivo: Diretor de Operações"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Especialidade / Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Consultor Responsável (Maître)
                  </label>
                  <input
                    type="text"
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    placeholder="Ex: Erika, Adriana, Pedro"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Valor dos Honorários (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 15000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Previsão de Conclusão
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Descrição & Escopo Estratégico
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva o escopo e os objetivos centrais deste projeto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Marcos / Entregáveis Customizados (1 por linha)
                </label>
                <textarea
                  rows={3}
                  placeholder="Deixe em branco para preencher automaticamente com a metodologia padrão da Maître..."
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-maitre-gold text-slate-950 hover:brightness-105 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Criar Projeto de Consultoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 2: APONTAMENTO DE HORAS (TIMESHEET) */}
      {activeTab === "timesheet" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Cards de Métricas de Horas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total de Horas Apontadas</span>
                <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
                  <Timer size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{totalLoggedHours}h</p>
              <span className="text-xs font-medium text-slate-400">Tempo dedicado a projetos</span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Horas Faturáveis</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-500">{billableHours}h</p>
              <span className="text-xs font-medium text-emerald-400">
                {totalLoggedHours > 0 ? Math.round((billableHours / totalLoggedHours) * 100) : 100}% de aproveitamento faturável
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Valor Faturável Acumulado</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-500">{formatCurrency(totalBilledValue)}</p>
              <span className="text-xs font-medium text-slate-400">Honorários calculados por taxa horária</span>
            </div>
          </div>

          {/* Tabela de Lançamentos de Timesheet */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={18} className="text-maitre-gold" />
                  Extrato de Lançamentos de Horas Consultivas
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Apontamentos por consultor com validação de status</p>
              </div>
            </div>

            {allTimesheets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Projeto & Empresa</th>
                      <th className="pb-3">Consultor</th>
                      <th className="pb-3">Atividade Realizada</th>
                      <th className="pb-3 text-center">Horas</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {allTimesheets.map((ts) => (
                      <tr key={ts.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(ts.workDate).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{ts.projectTitle}</p>
                          <p className="text-[11px] text-slate-400">{ts.orgName}</p>
                        </td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{ts.consultantName}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{ts.activityDescription}</td>
                        <td className="py-3 text-center font-black text-slate-900 dark:text-white">{ts.hours}h</td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              ts.status === "APPROVED"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {ts.status === "APPROVED" ? "Aprovado" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {ts.status !== "APPROVED" && (
                            <button
                              onClick={() => handleApproveTimesheet(ts.id, ts.projectId)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-all"
                            >
                              Aprovar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Nenhum apontamento de horas registrado ainda. Utilize o botão acima para registrar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: PORTAL DO CLIENTE (ACEITE FORMAL DE ENTREGÁVEIS) */}
      {activeTab === "client-portal" && (
        <div className="space-y-8 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="text-base font-black text-white">Portal de Homologação & Aceite pelo Cliente</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Área corporativa de transparência onde o sponsor da empresa cliente pode revisar entregáveis, laudos e relatórios diagnósticos emitidos pelos consultores da Maître, registrando o aceite formal ou solicitando ajustes com rastreabilidade completa.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {allDeliverables.map((deliv) => (
              <div
                key={deliv.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30">
                      {deliv.orgName}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">• Projeto: {deliv.projectTitle}</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {deliv.title}
                  </h4>
                  {deliv.description && <p className="text-xs text-slate-400">{deliv.description}</p>}

                  {/* Auditoria de Aceite */}
                  {deliv.approvedByClient && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-500 font-bold">
                      <CheckCircle2 size={13} />
                      <span>
                        Aceite formal concedido por {deliv.clientApproverEmail || "Cliente"} em{" "}
                        {deliv.clientApprovedAt ? new Date(deliv.clientApprovedAt).toLocaleDateString("pt-BR") : "recentemente"}
                      </span>
                    </div>
                  )}

                  {deliv.clientFeedback && (
                    <p className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      &quot;{deliv.clientFeedback}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {!deliv.approvedByClient ? (
                    <>
                      <button
                        onClick={() => {
                          setReviewDeliverable(deliv);
                          setReviewAction("APPROVE");
                          setReviewFeedback("Entregável analisado e aprovado sem ressalvas.");
                          setIsReviewModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Conceder Aceite</span>
                      </button>

                      <button
                        onClick={() => {
                          setReviewDeliverable(deliv);
                          setReviewAction("REJECT");
                          setReviewFeedback("");
                          setIsReviewModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Ban size={14} />
                        <span>Solicitar Ajustes</span>
                      </button>
                    </>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Homologado</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE APONTAMENTO DE HORAS (TIMESHEET) */}
      {isTimesheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Timer size={20} className="text-maitre-gold" />
                  Apontar Horas de Consultoria
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Registre suas atividades dedicadas ao projeto</p>
              </div>
              <button onClick={() => setIsTimesheetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogHoursSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Projeto de Consultoria *
                </label>
                <select
                  value={tsProjectId}
                  onChange={(e) => setTsProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.organization?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Nome do Consultor *
                  </label>
                  <input
                    type="text"
                    value={tsConsultantName}
                    onChange={(e) => setTsConsultantName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Horas Trabalhadas *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={tsHours}
                    onChange={(e) => setTsHours(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Data da Atividade
                  </label>
                  <input
                    type="date"
                    value={tsWorkDate}
                    onChange={(e) => setTsWorkDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Taxa Horária (R$)
                  </label>
                  <input
                    type="number"
                    value={tsHourlyRate}
                    onChange={(e) => setTsHourlyRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Descrição da Atividade Realizada *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Condução de entrevistas de Hunting para Head de Engenharia, alinhamento de perfil..."
                  value={tsDesc}
                  onChange={(e) => setTsDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billableCheck"
                  checked={tsBillable}
                  onChange={(e) => setTsBillable(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <label htmlFor="billableCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Horas faturáveis ao cliente corporativo
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTimesheetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-maitre-gold text-slate-950 hover:brightness-105 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Registrar Horas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ACEITE FORMAL / REVISÃO DO CLIENTE */}
      {isReviewModalOpen && reviewDeliverable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSignature size={20} className="text-maitre-gold" />
                  {reviewAction === "APPROVE" ? "Conceder Aceite Formal" : "Solicitar Revisão de Entregável"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Entregável: {reviewDeliverable.title}</p>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitClientReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  E-mail do Responsável pelo Aceite (Sponsor do Cliente) *
                </label>
                <input
                  type="email"
                  placeholder="diretor@empresa.com"
                  value={reviewEmail}
                  onChange={(e) => setReviewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  {reviewAction === "APPROVE" ? "Parecer Técnico / Comentários de Homologação" : "Pontos a Revisar / Ajustes Necessários *"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "Ex: Relatório revisado pelo comitê de remuneração e aprovado na íntegra."
                      : "Ex: Necessário aprofundar a análise salarial para os cargos de liderança técnica..."
                  }
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:border-maitre-gold"
                  required={reviewAction === "REJECT"}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    reviewAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>{reviewAction === "APPROVE" ? "Confirmar Aceite Formal" : "Enviar Solicitação"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
