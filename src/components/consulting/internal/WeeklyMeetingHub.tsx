"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  FileText,
  FileCheck2,
  Save,
  Send,
  Loader2,
  ShieldCheck,
  ChevronRight,
  ListOrdered,
  History,
  Check,
} from "lucide-react";
import { InternalUserContext, getNextWeeklyMeetingDate } from "@/lib/internal-management";
import {
  saveWeeklyMeeting,
  concludeWeeklyMeeting,
} from "@/app/(dashboard)/consulting/internal-actions";
import CreateTaskModal from "./CreateTaskModal";

interface WeeklyMeetingHubProps {
  meetings: any[];
  tasks: any[];
  projects: any[];
  clients: any[];
  teamMembers: any[];
  userCtx: InternalUserContext;
  config: any;
  onRefresh: () => void;
}

export default function WeeklyMeetingHub({
  meetings,
  tasks,
  projects,
  clients,
  teamMembers,
  userCtx,
  config,
  onRefresh,
}: WeeklyMeetingHubProps) {
  // Próxima reunião calculada
  const nextMeetingDate = useMemo(() => {
    return getNextWeeklyMeetingDate(
      new Date(),
      config?.weeklyMeetingDay ?? 1,
      config?.weeklyMeetingTime ?? "15:30",
      config?.defaultTimezone ?? "America/Fortaleza"
    );
  }, [config]);

  // Reunião em andamento ou última agendada
  const activeMeeting = useMemo(() => {
    return (
      meetings.find((m) => m.status === "IN_PROGRESS") ||
      meetings.find((m) => m.status === "SCHEDULED") ||
      null
    );
  }, [meetings]);

  // Estados locais para a sala de reunião
  const [meetingTitle, setMeetingTitle] = useState(
    activeMeeting?.title ||
      `Alinhamento Semanal Maître — ${nextMeetingDate.toLocaleDateString("pt-BR")}`
  );
  const [notes, setNotes] = useState(activeMeeting?.notesMarkdown || "");
  const [decisions, setDecisions] = useState<string[]>(() => {
    try {
      return activeMeeting?.decisionsJson ? JSON.parse(activeMeeting.decisionsJson) : [];
    } catch {
      return [];
    }
  });
  const [newDecision, setNewDecision] = useState("");
  const [presentMemberIds, setPresentMemberIds] = useState<string[]>(() => {
    try {
      return activeMeeting?.participantsJson
        ? JSON.parse(activeMeeting.participantsJson)
        : teamMembers.map((m) => m.id);
    } catch {
      return teamMembers.map((m) => m.id);
    }
  });

  // Modal de criação de tarefa a partir da ata
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [savingMeeting, setSavingMeeting] = useState(false);
  const [concludingMeeting, setConcludingMeeting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Pauta dinâmica gerada automaticamente a partir do estado operacional
  const smartAgenda = useMemo(() => {
    const overdue = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && new Date(t.dueDate) < new Date()
    );
    const blocked = tasks.filter((t) => t.isBlocked && t.status !== "COMPLETED");
    const inReview = tasks.filter((t) => t.status === "IN_REVIEW");
    const recentlyCompleted = tasks.filter((t) => t.status === "COMPLETED");

    return {
      recentlyCompleted: recentlyCompleted.slice(0, 5),
      blocked,
      overdue,
      inReview,
    };
  }, [tasks]);

  const handleToggleParticipant = (memberId: string) => {
    if (presentMemberIds.includes(memberId)) {
      setPresentMemberIds(presentMemberIds.filter((id) => id !== memberId));
    } else {
      setPresentMemberIds([...presentMemberIds, memberId]);
    }
  };

  const handleAddDecision = () => {
    if (!newDecision.trim()) return;
    setDecisions([...decisions, newDecision.trim()]);
    setNewDecision("");
  };

  const handleSaveDraft = async () => {
    setSavingMeeting(true);
    setFeedback(null);

    const res = await saveWeeklyMeeting({
      meetingId: activeMeeting?.id,
      title: meetingTitle,
      scheduledAt: nextMeetingDate.toISOString(),
      status: "IN_PROGRESS",
      participantsJson: JSON.stringify(presentMemberIds),
      notesMarkdown: notes,
      decisionsJson: JSON.stringify(decisions),
    });

    setSavingMeeting(false);
    if (res.success) {
      setFeedback("Ata e notas salvas com sucesso!");
      onRefresh();
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleConcludeMeeting = async () => {
    if (!activeMeeting?.id) {
      alert("Por favor, inicie ou salve o rascunho da reunião antes de homologar a ata.");
      return;
    }

    setConcludingMeeting(true);

    const structuredSummary = JSON.stringify({
      title: meetingTitle,
      concludedAt: new Date().toISOString(),
      facilitator: userCtx.name,
      participantsCount: presentMemberIds.length,
      decisionsCount: decisions.length,
      decisions,
      notesSnapshot: notes,
    });

    const res = await concludeWeeklyMeeting({
      meetingId: activeMeeting.id,
      concludedSummary: structuredSummary,
    });

    setConcludingMeeting(false);
    if (res.success) {
      setFeedback("Reunião semanal concluída e ata homologada com sucesso!");
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner da Reunião Semanal */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-maitre-gold/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-maitre-gold" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Ritual Semanal de Alinhamento — Segundas às {config?.weeklyMeetingTime || "15:30"}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30">
              Fuso: {config?.defaultTimezone || "America/Fortaleza"}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Reunião executiva para passar demandas, revisar projetos, alinhar tarefas individuais, destravar bloqueios e definir prioridades.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {userCtx.isAdminMaster && (
            <button
              onClick={handleSaveDraft}
              disabled={savingMeeting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              {savingMeeting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Salvar Notas</span>
            </button>
          )}

          {userCtx.isAdminMaster && (
            <button
              onClick={handleConcludeMeeting}
              disabled={concludingMeeting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-opacity shadow-md"
            >
              {concludingMeeting ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>Homologar e Fechar Ata</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid: 2 Colunas (Pauta Viva e Sala de Ata) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Pauta Inteligente com dados reais */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ListOrdered size={16} className="text-maitre-gold" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pauta Viva do Alinhamento
              </h3>
            </div>

            {/* Tópico 1: Entregas Recentes */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> 1. Entregas Recentes ({smartAgenda.recentlyCompleted.length})
              </span>
              <div className="pl-4 space-y-1 text-slate-400">
                {smartAgenda.recentlyCompleted.length === 0 ? (
                  <p className="italic text-slate-600">Nenhuma entrega recente registrada.</p>
                ) : (
                  smartAgenda.recentlyCompleted.map((t) => (
                    <div key={t.id} className="truncate">
                      • {t.title} ({t.assignee?.name || "Equipe"})
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tópico 2: Bloqueios e Impedimentos */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/60">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Lock size={13} /> 2. Pendências & Bloqueios ({smartAgenda.blocked.length})
              </span>
              <div className="pl-4 space-y-1 text-slate-400">
                {smartAgenda.blocked.length === 0 ? (
                  <p className="italic text-slate-600">Sem bloqueios ativos no momento.</p>
                ) : (
                  smartAgenda.blocked.map((t) => (
                    <div key={t.id} className="text-amber-200/90 font-medium truncate">
                      • {t.title}: <span className="italic">{t.blockReason}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tópico 3: Prazos e Atrasos */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/60">
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle size={13} /> 3. Prazos Críticos ({smartAgenda.overdue.length})
              </span>
              <div className="pl-4 space-y-1 text-slate-400">
                {smartAgenda.overdue.length === 0 ? (
                  <p className="italic text-slate-600">Sem atrasos pendentes.</p>
                ) : (
                  smartAgenda.overdue.map((t) => (
                    <div key={t.id} className="truncate">
                      • {t.title} ({t.assignee?.name})
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tópico 4: Aprovações em Análise */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/60">
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                <FileCheck2 size={13} /> 4. Aprovações Pendentes ({smartAgenda.inReview.length})
              </span>
              <div className="pl-4 space-y-1 text-slate-400">
                {smartAgenda.inReview.length === 0 ? (
                  <p className="italic text-slate-600">Nenhuma entrega em revisão.</p>
                ) : (
                  smartAgenda.inReview.map((t) => (
                    <div key={t.id} className="truncate">
                      • {t.title} (Revisor: {t.reviewer?.name})
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Participantes Presentes */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-maitre-gold" />
              Presença da Equipe Maître
            </h4>
            <div className="space-y-1.5">
              {teamMembers.map((member) => {
                const isPresent = presentMemberIds.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPresent}
                        onChange={() => handleToggleParticipant(member.id)}
                        className="w-3.5 h-3.5 rounded border-slate-700 text-maitre-gold focus:ring-0"
                      />
                      <span className={isPresent ? "text-white font-medium" : "text-slate-500"}>
                        {member.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{member.jobTitle || member.role}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Ata Ativa, Decisões e Criação de Tarefas Vinculadas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-maitre-gold" />
                <h3 className="text-sm font-bold text-white">Ata & Registro de Decisões</h3>
              </div>

              {/* Botão de Criação de Tarefa Direta a Partir da Reunião */}
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-maitre-gold text-amber-950 hover:bg-amber-300 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Criar Tarefa na Reunião</span>
              </button>
            </div>

            {/* Título da Sessão */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Ata</label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-maitre-gold"
              />
            </div>

            {/* Notas e Discussões da Reunião */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Anotações e Alinhamentos Gerais (Markdown)
              </label>
              <textarea
                rows={7}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Registre os pontos discutidos, prioridades repassadas para a semana, prazos acordados..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-maitre-gold focus:outline-none"
              />
            </div>

            {/* Decisões Registradas */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">
                Decisões Formais da Reunião ({decisions.length})
              </label>

              <div className="space-y-1.5">
                {decisions.map((d, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg bg-slate-800/60 text-xs text-slate-200 flex items-start gap-2"
                  >
                    <span className="font-bold text-maitre-gold shrink-0">#{index + 1}</span>
                    <span className="flex-1">{d}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  placeholder="Nova decisão tomada na reunião..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDecision()}
                />
                <button
                  type="button"
                  onClick={handleAddDecision}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-maitre-gold hover:bg-slate-700 border border-slate-700"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>

          {/* Histórico de Reuniões Concluídas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} className="text-slate-400" />
              Atas Anteriores Homologadas
            </h4>

            <div className="space-y-2">
              {meetings
                .filter((m) => m.status === "CONCLUDED")
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{m.title}</span>
                      <p className="text-[10px] text-slate-400">
                        Encerrada em: {m.endedAt ? new Date(m.endedAt).toLocaleDateString("pt-BR") : "-"} • Facilitador: {m.facilitator?.name}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Homologada
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para criar tarefa vinculada a esta reunião */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        userCtx={userCtx}
        teamMembers={teamMembers}
        projects={projects}
        clients={clients}
        originMeetingId={activeMeeting?.id}
        onTaskCreated={() => {
          onRefresh();
        }}
      />
    </div>
  );
}
