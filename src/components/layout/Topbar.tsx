"use client";

import React from "react";
import TenantSwitcher from "./TenantSwitcher";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTenant } from "@/lib/tenant-context";

export default function Topbar() {
  const { selectedTenant, selectedTenantId } = useTenant();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 mb-8 -mx-4 sm:-mx-8 -mt-8 flex items-center justify-between shadow-sm">
      {/* Lado Esquerdo: Botão Hambúrguer Mobile + Tenant Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        <MobileSidebarDrawer />
        <TenantSwitcher />

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            {selectedTenantId === "ALL" ? (
              <span className="text-slate-300">Modo Hunting Consolidado (Multicliente)</span>
            ) : (
              <span>
                Contexto: <strong className="text-white font-bold">{selectedTenant?.name}</strong>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Lado Direito: Atalhos & Acesso Rápido */}
      <div className="flex items-center gap-3">
        {selectedTenant && (
          <Link
            href={`/carreiras/${selectedTenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-maitre-gold bg-maitre-gold/10 hover:bg-maitre-gold/20 border border-maitre-gold/30 transition-colors"
          >
            <ExternalLink size={13} />
            <span>Portal White-Label ({selectedTenant.slug})</span>
          </Link>
        )}

        <Link
          href="/clients"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <Building2 size={13} className="text-slate-400" />
          <span>Clientes ({selectedTenantId === "ALL" ? "Todos" : "1 Selecionado"})</span>
        </Link>
      </div>
    </header>
  );
}
