/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Calendar,
  Briefcase,
  ExternalLink,
  Plus,
  ShieldCheck,
  Clock,
  Sparkles,
  FileText,
  Search,
  Filter,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Award,
} from "lucide-react";
import { updateEmployeeOnboardingStatus, createDirectEmployee } from "./actions";

export default function EmployeeTableClient({ conversions }: { conversions: any[] }) {
  const [list, setList] = useState(conversions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states para criação manual
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "Tecnologia",
    salary: "",
    employeeCode: `MC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  const departments = Array.from(
    new Set(list.map((c) => c.application.job.department).filter(Boolean))
  );

  const filtered = list.filter((item) => {
    const candidate = item.application.candidate;
    const job = item.application.job;
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      candidate.firstName.toLowerCase().includes(query) ||
      candidate.lastName.toLowerCase().includes(query) ||
      candidate.email.toLowerCase().includes(query) ||
      (item.employeeCode && item.employeeCode.toLowerCase().includes(query)) ||
      job.title.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesDept = departmentFilter === "ALL" || job.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleStatusChange = async (conversionId: string, newStatus: any) => {
    try {
      const res = await updateEmployeeOnboardingStatus(conversionId, newStatus);
      if (res.success) {
        setList((prev) =>
          prev.map((c) => (c.id === conversionId ? { ...c, status: newStatus } : c))
        );
        setFeedback({ type: "success", text: "Status de onboarding atualizado com sucesso!" });
      } else {
        setFeedback({ type: "error", text: res.error || "Falha ao atualizar status." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const data = new FormData();
      data.append("firstName", form.firstName);
      data.append("lastName", form.lastName);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("jobTitle", form.jobTitle);
      data.append("department", form.department);
      data.append("salary", form.salary);
      data.append("employeeCode", form.employeeCode);

      const res = await createDirectEmployee(data);
      if (!res.success) throw new Error(res.error);

      setFeedback({ type: "success", text: "Colaborador admitido com sucesso no Core HR!" });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Barra de Filtros & Admissão */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, matrícula ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">📌 Todos os Status</option>
            <option value="ACTIVE">🟢 Ativo</option>
            <option value="PENDING_ONBOARDING">🟡 Pendente Onboarding</option>
            <option value="CONVERTED">🔵 Recém-Convertido</option>
          </select>

          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="ALL">🏢 Todos os Departamentos</option>
              {departments.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shrink-0"
        >
          <Plus size={16} />
          <span>Admissão Direta</span>
        </button>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider bg-slate-50/50 dark:bg-slate-950/40">
                <th className="p-4 pl-6">Colaborador / Contato</th>
                <th className="p-4">Matrícula</th>
                <th className="p-4">Cargo & Departamento</th>
                <th className="p-4">Remuneração</th>
                <th className="p-4">Data de Início</th>
                <th className="p-4">Status Onboarding</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filtered.map((item) => {
                const cand = item.application.candidate;
                const job = item.application.job;
                const offer = item.application.offers[0];
                const salary = offer?.salaryOffered || item.application.salaryExpectation || job.salaryMax || 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Colaborador */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {cand.firstName[0]}
                          {cand.lastName?.[0] || ""}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {cand.firstName} {cand.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                            <span>{cand.email}</span>
                            {cand.phone && (
                              <a
                                href={`https://wa.me/${cand.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:underline flex items-center gap-0.5"
                                title="Abrir WhatsApp"
                              >
                                <Phone size={10} />
                                <span>{cand.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Matrícula */}
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {item.employeeCode || "SEM_MATRICULA"}
                      </span>
                    </td>

                    {/* Cargo & Depto */}
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{job.title}</p>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Building2 size={12} /> {job.department || "Geral"}
                        </p>
                      </div>
                    </td>

                    {/* Remuneração */}
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(salary)}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {offer?.employmentType || "CLT"}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(item.convertedAt).toLocaleDateString("pt-BR")}
                    </td>

                    {/* Status Onboarding */}
                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="ACTIVE">🟢 Ativo (Efetivado)</option>
                        <option value="PENDING_ONBOARDING">🟡 Em Onboarding / DHO</option>
                        <option value="CONVERTED">🔵 Recém-Contratado</option>
                      </select>
                    </td>

                    {/* Ações */}
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {cand.resumeUrl && (
                          <a
                            href={cand.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Ver Currículo PDF Arquivado"
                          >
                            <FileText size={16} />
                          </a>
                        )}

                        <Link
                          href={`/candidates/${cand.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline p-1"
                          title="Abrir Ficha do Colaborador"
                        >
                          <span>Ficha</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users size={36} className="text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        Nenhum colaborador registrado no Core HR
                      </p>
                      <p className="text-xs text-slate-400">
                        Quando você autorizar contratações no Kanban ou clicar em "Admissão Direta", os colaboradores aparecerão aqui.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Admissão Direta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Admissão Direta no Core HR
                  </h3>
                  <span className="text-xs text-slate-400">Cadastro de colaborador sem processo seletivo</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Engenheiro de Dados Sênior"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Salário Bruto (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 12000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={form.employeeCode}
                    onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                <span>Concluir Admissão no Core HR</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
