"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Lock,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  FolderGit2,
  AlertCircle,
} from "lucide-react";
import { InternalUserContext } from "@/lib/internal-management";

interface InternalCalendarViewProps {
  tasks: any[];
  meetings: any[];
  config: any;
  userCtx: InternalUserContext;
  onSelectTask: (task: any) => void;
}

export default function InternalCalendarView({
  tasks,
  meetings,
  config,
  userCtx,
  onSelectTask,
}: InternalCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calcula os 7 dias da semana atual
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0 = Dom, 1 = Seg...
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para iniciar na Segunda-feira

    const monday = new Date(curr.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Agenda */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-maitre-gold" />
            <h2 className="text-lg font-bold text-white tracking-tight">Agenda Semanal & Compromissos</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Fuso: {config?.defaultTimezone || "America/Fortaleza"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Distingue compromissos com horário marcado (como o alinhamento de segunda 15h30) de prazos de entrega de tarefas.
          </p>
        </div>

        {/* Navegação de Semana */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Semana Atual
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legenda de Distinção */}
      <div className="flex items-center gap-6 text-xs text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-maitre-gold"></div>
          <span>Compromisso com Horário (Reunião)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <span>Prazo de Entrega (Tarefa)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span>Prazo Atrasado</span>
        </div>
      </div>

      {/* Grid Semanal (7 Colunas: Seg a Dom) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const dayStr = day.toISOString().split("T")[0];
          const isToday = new Date().toISOString().split("T")[0] === dayStr;
          const isMonday = day.getDay() === 1;

          // Tarefas cujo dueDate é neste dia
          const dayTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const tDate = new Date(t.dueDate).toISOString().split("T")[0];
            return tDate === dayStr;
          });

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-3.5 min-h-[320px] flex flex-col justify-between shadow-md transition-colors ${
                isToday
                  ? "bg-slate-900 border-maitre-gold/50 ring-1 ring-maitre-gold/30"
                  : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <div>
                {/* Cabeçalho do Dia */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][idx]}
                    </span>
                    <p className={`text-sm font-black ${isToday ? "text-maitre-gold" : "text-white"}`}>
                      {day.getDate()} {day.toLocaleDateString("pt-BR", { month: "short" })}
                    </p>
                  </div>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/40">
                      Hoje
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Reunião Semanal fixa nas Segundas-feiras */}
                  {isMonday && (
                    <div className="p-2.5 rounded-xl bg-maitre-gold/15 border border-maitre-gold/40 text-amber-200 text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-maitre-gold">
                          <Clock size={12} className="text-maitre-gold" />
                          {config?.weeklyMeetingTime || "15:30"}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider bg-maitre-gold/25 text-maitre-gold font-bold px-1.5 py-0.5 rounded">
                          Alinhamento
                        </span>
                      </div>
                      <p className="font-bold text-white text-xs">Reunião Geral da Equipe</p>
                      <p className="text-[10px] text-maitre-gold/90 font-medium">Facilitadora: Adriana Pinheiro</p>
                    </div>
                  )}

                  {/* Prazos de Tarefas neste dia */}
                  {dayTasks.map((t) => {
                    const isOverdue =
                      new Date(t.dueDate) < new Date() && t.status !== "COMPLETED";

                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer hover:scale-[1.02] transition-all space-y-1 ${
                          isOverdue
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-200"
                            : t.isBlocked
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
                            : "bg-slate-800/90 border-slate-700 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>Prazo Entrega</span>
                          {t.isBlocked && <Lock size={10} className="text-amber-400" />}
                        </div>
                        <p className="font-semibold text-white truncate text-xs">{t.title}</p>
                        <p className="text-[10px] text-slate-400">{t.assignee?.name || "Sem dono"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <span className="text-[10px] text-slate-500 text-center pt-2">
                {dayTasks.length + (isMonday ? 1 : 0)} evento(s)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
