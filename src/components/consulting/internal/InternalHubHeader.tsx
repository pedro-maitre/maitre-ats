"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderGit2,
  Columns3,
  Calendar,
  Users2,
  FileCheck2,
  Users,
  Bell,
  Settings,
  ShieldAlert,
  Clock,
  Timer,
  ExternalLink,
} from "lucide-react";
import { InternalUserContext } from "@/lib/internal-management";

export type InternalTabType =
  | "overview"
  | "my-work"
  | "projects"
  | "tasks"
  | "calendar"
  | "meetings"
  | "approvals"
  | "team"
  | "notifications"
  | "settings"
  | "timesheet"
  | "client-portal";

interface InternalHubHeaderProps {
  activeTab: InternalTabType;
  setActiveTab: (tab: InternalTabType) => void;
  userCtx: InternalUserContext;
  counts: {
    overdue: number;
    blocked: number;
    pendingReview: number;
    unreadNotifications: number;
    myTasksCount: number;
  };
}

export default function InternalHubHeader({
  activeTab,
  setActiveTab,
  userCtx,
  counts,
}: InternalHubHeaderProps) {
  const tabs = [
    {
      id: "overview" as InternalTabType,
      label: "Visão Geral",
      icon: LayoutDashboard,
      badge: counts.blocked > 0 ? `${counts.blocked} bloq.` : null,
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    },
    {
      id: "my-work" as InternalTabType,
      label: "Meu Trabalho",
      icon: CheckSquare,
      badge: counts.myTasksCount > 0 ? `${counts.myTasksCount}` : null,
      badgeColor: "bg-maitre-gold/20 text-maitre-gold border-maitre-gold/40",
    },
    {
      id: "projects" as InternalTabType,
      label: "Projetos & Serviços",
      icon: FolderGit2,
      badge: null,
    },
    {
      id: "tasks" as InternalTabType,
      label: "Quadro de Tarefas",
      icon: Columns3,
      badge: counts.overdue > 0 ? `${counts.overdue} atraso` : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    {
      id: "calendar" as InternalTabType,
      label: "Agenda",
      icon: Calendar,
      badge: null,
    },
    {
      id: "meetings" as InternalTabType,
      label: "Reunião Semanal",
      icon: Clock,
      badge: "Seg 15h30",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    {
      id: "approvals" as InternalTabType,
      label: "Aprovações",
      icon: FileCheck2,
      badge: counts.pendingReview > 0 ? `${counts.pendingReview}` : null,
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "team" as InternalTabType,
      label: "Equipe",
      icon: Users,
      badge: null,
    },
    {
      id: "notifications" as InternalTabType,
      label: "Notificações",
      icon: Bell,
      badge: counts.unreadNotifications > 0 ? `${counts.unreadNotifications}` : null,
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      id: "settings" as InternalTabType,
      label: "Configurações",
      icon: Settings,
      badge: userCtx.isAdminMaster ? "Admin" : null,
      badgeColor: "bg-slate-700 text-slate-300 border-slate-600",
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl mb-6">
      {/* Top Banner: Central de Gestão & Status da Adriana */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maitre-gold/20 via-amber-500/10 to-transparent border border-maitre-gold/30 flex items-center justify-center text-maitre-gold shadow-md">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Central de Gestão Interna
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-maitre-gold/20 text-maitre-gold border border-maitre-gold/30">
                Maître Consultoria
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Planejamento de demandas, projetos, delegações e condução do ritual semanal de alinhamento.
            </p>
          </div>
        </div>

        {/* User Context Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {userCtx.isAdminMaster ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-maitre-gold/20 to-amber-500/10 border border-maitre-gold/40 text-maitre-gold text-xs font-semibold shadow-sm">
              <ShieldAlert size={14} className="text-maitre-gold animate-pulse" />
              <span>Adriana Pinheiro — Admin Master</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>{userCtx.name} ({userCtx.role})</span>
            </div>
          )}

          {/* Atalho para os submódulos de timesheet & portal cliente */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              onClick={() => setActiveTab("timesheet")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "timesheet"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
              title="Timesheet de horas da consultoria"
            >
              <Timer size={13} />
              <span className="hidden sm:inline">Timesheet</span>
            </button>
            <button
              onClick={() => setActiveTab("client-portal")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "client-portal"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
              title="Aprovações formais com empresas clientes"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Portal Clientes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-3 -mb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? "bg-gradient-to-r from-maitre-gold/20 via-maitre-gold/15 to-transparent text-white border-maitre-gold/50 shadow-sm"
                  : "bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent"
              }`}
            >
              <Icon size={14} className={isActive ? "text-maitre-gold" : "text-slate-400"} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                    t.badgeColor || "bg-slate-700 text-slate-300 border-slate-600"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
