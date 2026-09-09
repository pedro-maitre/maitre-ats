"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Clock,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { InternalUserContext } from "@/lib/internal-management";
import { updateInternalConfig } from "@/app/(dashboard)/consulting/internal-actions";

interface InternalSettingsViewProps {
  config: any;
  userCtx: InternalUserContext;
  onRefresh: () => void;
}

export default function InternalSettingsView({
  config,
  userCtx,
  onRefresh,
}: InternalSettingsViewProps) {
  const [timezone, setTimezone] = useState(config?.defaultTimezone || "America/Fortaleza");
  const [meetingDay, setMeetingDay] = useState(config?.weeklyMeetingDay ?? 1);
  const [meetingTime, setMeetingTime] = useState(config?.weeklyMeetingTime || "15:30");
  const [duration, setDuration] = useState(config?.weeklyMeetingDuration ?? 60);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await updateInternalConfig({
      defaultTimezone: timezone,
      weeklyMeetingDay: Number(meetingDay),
      weeklyMeetingTime: meetingTime,
      weeklyMeetingDuration: Number(duration),
    });

    setSaving(false);

    if (res.success) {
      setFeedback({ type: "success", text: "Configurações da Central salvas com sucesso!" });
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: "error", text: res.error || "Erro ao salvar configurações." });
    }
  };

  if (!userCtx.isAdminMaster) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
        <Lock size={36} className="mx-auto mb-2 text-rose-400 opacity-60" />
        <p className="font-semibold text-white text-sm">Acesso Restrito à Admin Master</p>
        <p className="mt-1">
          Apenas a Adriana Pinheiro possui autorização para parametrizar a governança e horários da Central Interna.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-maitre-gold" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Configurações & Governança da Central Interna
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Parametrização exclusiva da Admin Master para agenda semanal, fusos horários e governança da Maître.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/40 flex items-center gap-1.5">
          <ShieldCheck size={14} />
          <span>Adriana Pinheiro</span>
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Formulário de Configurações */}
      <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
        {/* Sessão 1: Reunião Semanal de Alinhamento */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Clock size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ritual Semanal da Equipe
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Dia da Semana</label>
              <select
                value={meetingDay}
                onChange={(e) => setMeetingDay(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-maitre-gold"
              >
                <option value={1}>Segunda-feira (Padrão)</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Horário de Início</label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="15:30"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-maitre-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Duração Estimada (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-maitre-gold"
              />
            </div>
          </div>
        </div>

        {/* Sessão 2: Fuso Horário e Convenções */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Calendar size={16} className="text-maitre-gold" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Convenções de Data & Fuso Horário
            </h3>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fuso Horário Padrão</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full sm:w-1/2 bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-maitre-gold"
            >
              <option value="America/Fortaleza">America/Fortaleza (UTC-3 - Padrão)</option>
              <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
              <option value="America/Recife">America/Recife (UTC-3)</option>
              <option value="America/Manaus">America/Manaus (UTC-4)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Garante que todos os cálculos de datas de entrega e reuniões sejam processados com consistência sem deslocamentos indevidos de fuso.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold bg-maitre-gold text-amber-950 hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-md text-xs"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Salvar Configurações da Central</span>
          </button>
        </div>
      </form>
    </div>
  );
}
