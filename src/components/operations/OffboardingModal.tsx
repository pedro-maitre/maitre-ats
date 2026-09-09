/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserX,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Loader2,
  Clock,
} from "lucide-react";
import {
  startOffboardingProcess,
  updateOffboardingChecklistItem,
  completeOffboardingProcess,
  cancelOffboardingProcess,
} from "@/app/(dashboard)/operations/actions";

interface OffboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEmployees: Array<{
    id: string;
    fullName: string;
    email: string;
    registrationNumber?: string | null;
    department?: { name: string } | null;
    position?: { title: string } | null;
  }>;
  selectedProcess?: any | null; // Se fornecido, abre para gerenciar o checklist existente
  onSuccess?: () => void;
}

export default function OffboardingModal({
  isOpen,
  onClose,
  activeEmployees,
  selectedProcess,
  onSuccess,
}: OffboardingModalProps) {
  const isManageMode = Boolean(selectedProcess);

  // Form states para criação
  const [employeeId, setEmployeeId] = useState(activeEmployees[0]?.id || "");
  const [terminationType, setTerminationType] = useState("SEM_JUSTA_CAUSA");
  const [noticeType, setNoticeType] = useState("TRABALHADO");
  const [noticeDate, setNoticeDate] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [severancePayEstimate, setSeverancePayEstimate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  useEffect(() => {
    if (isOpen && !noticeDate) {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setNoticeDate(today);
      setLastWorkingDay(thirtyDaysAhead);
    }
  }, [isOpen, noticeDate]);

  // Manage states
  const [checklist, setChecklist] = useState<any[]>(() => {
    if (selectedProcess?.checklist) {
      try {
        return JSON.parse(selectedProcess.checklist);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleStartProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const res = await startOffboardingProcess(employeeId, {
      terminationType,
      noticeType,
      noticeDate,
      lastWorkingDay,
      severancePayEstimate: severancePayEstimate ? parseFloat(severancePayEstimate) : undefined,
      interviewNotes,
    });

    setLoading(false);
    if (res.success) {
      setFeedback({ type: "success", text: "Processo de desligamento iniciado com sucesso!" });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } else {
      setFeedback({ type: "error", text: res.error || "Erro ao iniciar desligamento." });
    }
  };

  const handleToggleChecklist = async (key: string, currentCompleted: boolean) => {
    if (!selectedProcess?.id) return;
    setUpdatingKey(key);

    const res = await updateOffboardingChecklistItem(selectedProcess.id, key, !currentCompleted);
    setUpdatingKey(null);

    if (res.success && res.checklist) {
      setChecklist(res.checklist);
      onSuccess?.();
    } else {
      alert(res.error || "Erro ao atualizar item do checklist.");
    }
  };

  const handleCompleteProcess = async () => {
    if (!selectedProcess?.id) return;

    const uncompletedRequired = checklist.filter((item) => item.required && !item.completed);
    if (uncompletedRequired.length > 0) {
      const confirmForce = confirm(
        `Ainda existem ${uncompletedRequired.length} item(ns) obrigatórios pendentes no checklist:\n- ` +
          uncompletedRequired.map((i) => i.label).join("\n- ") +
          `\n\nDeseja homologar a rescisão e desativar o colaborador mesmo assim?`
      );
      if (!confirmForce) return;
    } else {
      if (!confirm("Confirmar a homologação final da rescisão? O status do colaborador será alterado para TERMINATED.")) {
        return;
      }
    }

    setLoading(true);
    const res = await completeOffboardingProcess(selectedProcess.id);
    setLoading(false);

    if (res.success) {
      alert("Rescisão concluída e homologada com sucesso! Colaborador desativado.");
      onSuccess?.();
      onClose();
    } else {
      alert(res.error || "Erro ao concluir processo.");
    }
  };

  const handleCancelProcess = async () => {
    if (!selectedProcess?.id) return;
    const reason = prompt("Informe o motivo do cancelamento do processo:");
    if (reason === null) return;

    setLoading(true);
    const res = await cancelOffboardingProcess(selectedProcess.id, reason);
    setLoading(false);

    if (res.success) {
      alert("Processo de desligamento cancelado.");
      onSuccess?.();
      onClose();
    } else {
      alert(res.error || "Erro ao cancelar processo.");
    }
  };

  // Cálculo de progresso do checklist
  const totalItems = checklist.length;
  const completedItems = checklist.filter((i) => i.completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <UserX size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isManageMode ? "Gestão de Desligamento & Offboarding" : "Iniciar Processo de Desligamento"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isManageMode
                  ? `Colaborador: ${selectedProcess?.employee?.fullName || "Colaborador"}`
                  : "Rescisão formal CLT, revogação de acessos e checklist de DP"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Conteúdo Dinâmico */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isManageMode ? (
            /* ========================================================
               MODO GERENCIAR: CHECKLIST INTERATIVO & DETALHES
               ======================================================== */
            <div className="space-y-6">
              {/* Card Resumo do Colaborador e Rescisão */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedProcess?.employee?.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Matrícula: {selectedProcess?.employee?.registrationNumber || "Sem matrícula"} •{" "}
                      {selectedProcess?.employee?.email}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      selectedProcess?.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : selectedProcess?.status === "CANCELLED"
                        ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {selectedProcess?.status === "COMPLETED"
                      ? "Concluído"
                      : selectedProcess?.status === "CANCELLED"
                      ? "Cancelado"
                      : "Em Andamento"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Tipo de Rescisão</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedProcess?.terminationType?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Aviso Prévio</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedProcess?.noticeType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Último Dia</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedProcess?.lastWorkingDay
                        ? new Date(selectedProcess.lastWorkingDay).toLocaleDateString("pt-BR")
                        : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimativa Verbas</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedProcess?.severancePayEstimate
                        ? `R$ ${selectedProcess.severancePayEstimate.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "A calcular"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso do Checklist */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">
                    Progresso do Checklist Operacional ({completedItems}/{totalItems})
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Lista de Itens do Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens de Conformidade CLT</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {checklist.map((item) => (
                    <div
                      key={item.key}
                      className={`p-3.5 flex items-start justify-between gap-3 transition-colors ${
                        item.completed
                          ? "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          disabled={updatingKey === item.key || selectedProcess?.status === "COMPLETED"}
                          onClick={() => handleToggleChecklist(item.key, item.completed)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            item.completed
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                              : "border-slate-300 dark:border-slate-700 hover:border-rose-500"
                          } disabled:opacity-50`}
                        >
                          {updatingKey === item.key ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : item.completed ? (
                            <CheckCircle2 size={13} />
                          ) : null}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                item.completed
                                  ? "line-through text-slate-400 dark:text-slate-500"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {item.label}
                            </span>
                            {item.required && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                          )}
                          {item.completedAt && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                              <Clock size={10} /> Concluído em: {new Date(item.completedAt).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerta de Prazo Legal CLT */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Atenção ao Prazo Legal CLT (Art. 477):</span>
                  O pagamento de todas as verbas rescisórias e a entrega dos documentos que comprovem a extinção contratual
                  devem ser efetuados em até <strong className="underline">10 dias corridos</strong> contados do término
                  do contrato, sob pena de multa equivalente a um salário do empregado.
                </div>
              </div>

              {/* Botões de Ação para Modo Gerenciar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={loading || selectedProcess?.status !== "IN_PROGRESS"}
                  onClick={handleCancelProcess}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancelar Desligamento
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>

                  {selectedProcess?.status === "IN_PROGRESS" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCompleteProcess}
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading && <Loader2 size={13} className="animate-spin" />}
                      <CheckCircle2 size={14} />
                      <span>Homologar Rescisão & Desativar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
               MODO INICIAR: FORMULÁRIO DE ABERTURA DE DESLIGAMENTO
               ======================================================== */
            <form onSubmit={handleStartProcess} className="space-y-4">
              {/* Seleção do Colaborador */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Colaborador para Desligamento *
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="" disabled>
                    Selecione um colaborador ativo...
                  </option>
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.position?.title || "Sem cargo"} - {emp.department?.name || "Geral"}) [
                      {emp.registrationNumber || "Sem matrícula"}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid: Tipo de Rescisão & Aviso Prévio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Motivo / Tipo de Rescisão *
                  </label>
                  <select
                    value={terminationType}
                    onChange={(e) => setTerminationType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="SEM_JUSTA_CAUSA">Demissão sem Justa Causa (Empresa)</option>
                    <option value="PEDIDO_DEMISSAO">Pedido de Demissão (Colaborador)</option>
                    <option value="COM_JUSTA_CAUSA">Demissão com Justa Causa (Falta Grave - Art. 482)</option>
                    <option value="ACORDO_MUTUO">Acordo Mútuo de Rescisão (Art. 484-A)</option>
                    <option value="TERMINO_CONTRATO">Término de Contrato de Experiência / Temporário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Aviso Prévio *
                  </label>
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="TRABALHADO">Trabalhado (30 dias ou proporcional CLT)</option>
                    <option value="INDENIZADO">Indenizado (Desligamento imediato)</option>
                    <option value="DISPENSADO">Dispensado de Cumprimento</option>
                  </select>
                </div>
              </div>

              {/* Grid: Datas do Aviso e Último Dia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data da Comunicação / Aviso *
                  </label>
                  <input
                    type="date"
                    required
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Último Dia Trabalhado (Data da Baixa) *
                  </label>
                  <input
                    type="date"
                    required
                    value={lastWorkingDay}
                    onChange={(e) => setLastWorkingDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Estimativa de Verbas Rescisórias */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estimativa de Verbas Rescisórias (R$) (Opcional)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 12500.00"
                    value={severancePayEstimate}
                    onChange={(e) => setSeverancePayEstimate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Anotações da Entrevista de Desligamento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Anotações da Entrevista de Desligamento / DHO
                </label>
                <textarea
                  rows={3}
                  placeholder="Feedback sobre liderança, ambiente, motivos apontados pelo colaborador, etc."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !employeeId}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Abrir Processo de Desligamento</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
