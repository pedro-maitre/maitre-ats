"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ExternalLink,
  Check,
  Calendar,
} from "lucide-react";
import { markNotificationAsRead } from "@/app/(dashboard)/consulting/internal-actions";

interface NotificationsCenterProps {
  notifications: any[];
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
}

export default function NotificationsCenter({
  notifications,
  onRefresh,
  onNavigateTab,
}: NotificationsCenterProps) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const displayed = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    onRefresh();
  };

  const handleMarkAllAsRead = async () => {
    for (const n of notifications.filter((item) => !item.isRead)) {
      await markNotificationAsRead(n.id);
    }
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Central de Notificações Internas</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Avisos em tempo real sobre delegações, prazos estipulados, decisões de aprovação e atas de reuniões.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === "ALL" ? "bg-maitre-gold text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === "UNREAD" ? "bg-maitre-gold text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Não lidas ({notifications.filter((n) => !n.isRead).length})
            </button>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Marcar todas como lidas
          </button>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        {displayed.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Bell size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-400">Nenhuma notificação encontrada.</p>
            <p className="mt-1">Você está em dia com todos os avisos da plataforma!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {displayed.map((n) => (
              <div
                key={n.id}
                className={`py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? "bg-blue-500/5 -mx-3 px-3 rounded-xl" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>}
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Marcar como lida"
                    >
                      <Check size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
