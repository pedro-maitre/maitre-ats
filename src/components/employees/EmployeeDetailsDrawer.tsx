"use client";

import React, { useState } from "react";
import {
  X,
  User,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Umbrella,
  HeartPulse,
  ExternalLink,
} from "lucide-react";
import { addPositionHistory, addVacationPeriod, addMedicalLeave } from "@/app/(dashboard)/employees/actions";

export interface EmployeeData {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  registrationNumber?: string | null;
  status: string;
  employmentType: string;
  admissionDate: any;
  salary?: number | null;
  workSchedule?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
  organization?: { id: string; name: string } | null;
  candidate?: {
    id: string;
    applications?: Array<{ id: string; jobId: string; job: { title: string } }>;
  } | null;
  positionHistories?: Array<{
    id: string;
    previousSalary?: number | null;
    newSalary: number;
    changeReason: string;
    effectiveDate: any;
    notes?: string | null;
  }>;
  vacations?: Array<{
    id: string;
    acquisitionStart: any;
    acquisitionEnd: any;
    vacationStart: any;
    vacationEnd: any;
    daysCount: number;
    soldDays: number;
    advance13thSalary: boolean;
    status: string;
  }>;
  leaves?: Array<{
    id: string;
    type: string;
    cidCode?: string | null;
    startDate: any;
    endDate?: any;
    status: string;
    notes?: string | null;
  }>;
}

interface EmployeeDetailsDrawerProps {
  employee: EmployeeData | null;
  onClose: () => void;
  departments?: Array<{ id: string; name: string }>;
  positions?: Array<{ id: string; title: string }>;
}

export default function EmployeeDetailsDrawer({
  employee,
  onClose,
  departments = [],
  positions = [],
}: EmployeeDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"FICHA" | "HISTORICO" | "FERIAS" | "AFASTAMENTOS">("FICHA");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // States for sub-forms
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [newSalary, setNewSalary] = useState(employee?.salary?.toString() || "");
  const [changeReason, setChangeReason] = useState("PROMOCAO");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [historyNotes, setHistoryNotes] = useState("");

  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacStart, setVacStart] = useState("");
  const [vacEnd, setVacEnd] = useState("");
  const [acqStart, setAcqStart] = useState("");
  const [acqEnd, setAcqEnd] = useState("");
  const [vacDays, setVacDays] = useState("30");
  const [soldDays, setSoldDays] = useState("0");
  const [advance13th, setAdvance13th] = useState(false);

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState("DOENCA_INSS");
  const [cidCode, setCidCode] = useState("");
  const [leaveStart, setLeaveStart] = useState(new Date().toISOString().split("T")[0]);
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveNotes, setLeaveNotes] = useState("");

  if (!employee) return null;

  const handleSaveHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await addPositionHistory(employee.id, {
        newSalary: Number(newSalary),
        changeReason,
        effectiveDate,
        notes: historyNotes,
      });

      if (res.success) {
        setSuccessMessage("Alteração funcional registrada com sucesso!");
        setShowHistoryForm(false);
      } else {
        setErrorMessage(res.error || "Erro ao registrar alteração.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await addVacationPeriod(employee.id, {
        acquisitionStart: acqStart || new Date().toISOString(),
        acquisitionEnd: acqEnd || new Date().toISOString(),
        vacationStart: vacStart,
        vacationEnd: vacEnd,
        daysCount: Number(vacDays),
        soldDays: Number(soldDays),
        advance13thSalary: advance13th,
      });

      if (res.success) {
        setSuccessMessage("Período de férias agendado com sucesso!");
        setShowVacationForm(false);
      } else {
        setErrorMessage(res.error || "Erro ao agendar férias.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await addMedicalLeave(employee.id, {
        type: leaveType,
        cidCode,
        startDate: leaveStart,
        endDate: leaveEnd || undefined,
        notes: leaveNotes,
      });

      if (res.success) {
        setSuccessMessage("Afastamento médico registrado com sucesso!");
        setShowLeaveForm(false);
      } else {
        setErrorMessage(res.error || "Erro ao registrar afastamento.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-lg border border-purple-500/20">
              {employee.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {employee.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  {employee.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {employee.position?.title || "Colaborador"} &bull; Matrícula: {employee.registrationNumber || "Sem matrícula"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-950/40 text-xs font-bold">
          <button
            onClick={() => setActiveTab("FICHA")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "FICHA"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User size={14} /> Ficha Cadastral
          </button>
          <button
            onClick={() => setActiveTab("HISTORICO")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "HISTORICO"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <TrendingUp size={14} /> Histórico Funcional ({employee.positionHistories?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("FERIAS")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "FERIAS"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Umbrella size={14} /> Férias CLT ({employee.vacations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("AFASTAMENTOS")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "AFASTAMENTOS"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <HeartPulse size={14} /> Afastamentos ({employee.leaves?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMessage && (
            <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertTriangle size={16} /> {errorMessage}
            </div>
          )}

          {/* TAB 1: FICHA CADASTRAL */}
          {activeTab === "FICHA" && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">E-mail Corporativo</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{employee.email}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{employee.phone || "Não informado"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">CPF</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{employee.cpf || "Não informado"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Salário Atual</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {employee.salary ? `R$ ${employee.salary.toLocaleString("pt-BR")}` : "Não informado"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Departamento</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{employee.department?.name || "Geral"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Data de Admissão</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(employee.admissionDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Origem ATS */}
              {employee.candidate && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 block">
                      ✓ Contratado via Processo Seletivo (ATS)
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Vaga de origem: {employee.candidate.applications?.[0]?.job?.title || "Vaga interna"}
                    </p>
                  </div>
                  <a
                    href={`/candidates/${employee.candidate.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
                  >
                    <span>Ver Candidato</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTÓRICO FUNCIONAL */}
          {activeTab === "HISTORICO" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-400">Linha de Carreira & Salários</h3>
                <button
                  onClick={() => setShowHistoryForm(!showHistoryForm)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus size={14} /> Registrar Alteração
                </button>
              </div>

              {showHistoryForm && (
                <form onSubmit={handleSaveHistory} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Nova Alteração Funcional</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Novo Salário (R$)</label>
                      <input
                        type="number"
                        required
                        value={newSalary}
                        onChange={(e) => setNewSalary(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Motivo</label>
                      <select
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="PROMOCAO">Promoção</option>
                        <option value="MERITO">Mérito</option>
                        <option value="DISSIDIO">Dissídio Coletivo</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                        <option value="AJUSTE_MERCADO">Ajuste de Mercado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Data de Vigência</label>
                      <input
                        type="date"
                        required
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Observações</label>
                      <input
                        type="text"
                        value={historyNotes}
                        onChange={(e) => setHistoryNotes(e.target.value)}
                        placeholder="Ex: Aprovado em comitê de remuneração"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowHistoryForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Salvando..." : "Salvar Alteração"}
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline */}
              {employee.positionHistories && employee.positionHistories.length > 0 ? (
                <div className="space-y-3">
                  {employee.positionHistories.map((hist) => (
                    <div key={hist.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-black text-slate-900 dark:text-white">{hist.changeReason}</span>
                        <p className="text-slate-400 mt-0.5">
                          Vigência: {new Date(hist.effectiveDate).toLocaleDateString("pt-BR")}
                        </p>
                        {hist.notes && <p className="text-slate-500 italic mt-1">{hist.notes}</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          R$ {hist.newSalary.toLocaleString("pt-BR")}
                        </span>
                        {hist.previousSalary && (
                          <p className="text-[10px] text-slate-400">Anterior: R$ {hist.previousSalary.toLocaleString("pt-BR")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Nenhuma alteração salarial registrada além da admissão.</p>
              )}
            </div>
          )}

          {/* TAB 3: FÉRIAS CLT */}
          {activeTab === "FERIAS" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-400">Controle de Férias</h3>
                <button
                  onClick={() => setShowVacationForm(!showVacationForm)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus size={14} /> Agendar Férias
                </button>
              </div>

              {showVacationForm && (
                <form onSubmit={handleSaveVacation} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Agendamento de Férias CLT</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Início das Férias</label>
                      <input
                        type="date"
                        required
                        value={vacStart}
                        onChange={(e) => setVacStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Término das Férias</label>
                      <input
                        type="date"
                        required
                        value={vacEnd}
                        onChange={(e) => setVacEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Dias Gozados</label>
                      <input
                        type="number"
                        value={vacDays}
                        onChange={(e) => setVacDays(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Dias Vendidos (Abono)</label>
                      <input
                        type="number"
                        value={soldDays}
                        onChange={(e) => setSoldDays(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="advance13th"
                      checked={advance13th}
                      onChange={(e) => setAdvance13th(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="advance13th" className="text-slate-700 dark:text-slate-300 font-semibold">
                      Adiantamento da 1ª Parcela do 13º Salário
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVacationForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
                    </button>
                  </div>
                </form>
              )}

              {employee.vacations && employee.vacations.length > 0 ? (
                <div className="space-y-3">
                  {employee.vacations.map((vac) => (
                    <div key={vac.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {new Date(vac.vacationStart).toLocaleDateString("pt-BR")} até {new Date(vac.vacationEnd).toLocaleDateString("pt-BR")}
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          {vac.daysCount} dias de descanso {vac.soldDays > 0 && `+ ${vac.soldDays} dias de abono`}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {vac.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum período de férias agendado.</p>
              )}
            </div>
          )}

          {/* TAB 4: AFASTAMENTOS */}
          {activeTab === "AFASTAMENTOS" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-400">Licenças & Atestados</h3>
                <button
                  onClick={() => setShowLeaveForm(!showLeaveForm)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus size={14} /> Registrar Afastamento
                </button>
              </div>

              {showLeaveForm && (
                <form onSubmit={handleSaveLeave} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Novo Afastamento Médico</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Tipo de Licença</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="DOENCA_INSS">Auxílio Doença (INSS)</option>
                        <option value="ACIDENTE_TRABALHO">Acidente de Trabalho</option>
                        <option value="MATERNIDADE">Licença Maternidade</option>
                        <option value="PATERNIDADE">Licença Paternidade</option>
                        <option value="LUTO">Licença Nojo / Luto</option>
                        <option value="CASAMENTO">Licença Gala / Casamento</option>
                        <option value="OUTRO">Outro Afastamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Código CID</label>
                      <input
                        type="text"
                        placeholder="Ex: J06.9"
                        value={cidCode}
                        onChange={(e) => setCidCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Data Início</label>
                      <input
                        type="date"
                        required
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Data Fim (Previsão)</label>
                      <input
                        type="date"
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Observações / Médico Emissor</label>
                    <input
                      type="text"
                      placeholder="Ex: Atestado emitido por CRM 123456"
                      value={leaveNotes}
                      onChange={(e) => setLeaveNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLeaveForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Registrando..." : "Confirmar Afastamento"}
                    </button>
                  </div>
                </form>
              )}

              {employee.leaves && employee.leaves.length > 0 ? (
                <div className="space-y-3">
                  {employee.leaves.map((lv) => (
                    <div key={lv.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{lv.type}</span>
                        {lv.cidCode && <span className="ml-2 font-mono text-[10px] text-slate-400">(CID: {lv.cidCode})</span>}
                        <p className="text-slate-500 mt-0.5">
                          Início: {new Date(lv.startDate).toLocaleDateString("pt-BR")}
                          {lv.endDate && ` até ${new Date(lv.endDate).toLocaleDateString("pt-BR")}`}
                        </p>
                        {lv.notes && <p className="text-slate-500 italic mt-0.5">{lv.notes}</p>}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {lv.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum afastamento registrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
