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
} from "lucide-react";
import {
  createConsultingProject,
  updateDeliverableStatus,
  updateProjectStatus,
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
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
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
            Governança de Projetos & Entregáveis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Acompanhamento em tempo real de Hunting Executivo, Diagnóstico Organizacional, Cargos & Salários e DHO.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Novo Projeto de Consultoria</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
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
                                    ? "bg-emerald-500 text-slate-950 font-bold"
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
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
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
    </div>
  );
}
