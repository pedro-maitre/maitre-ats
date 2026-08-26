"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTenant } from "@/lib/tenant-context";
import { useSession } from "next-auth/react";
import {
  Building2,
  ChevronDown,
  Globe2,
  Plus,
  Check,
  Briefcase,
  Search,
  ExternalLink,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TenantSwitcher() {
  const { data: session } = useSession();
  const { selectedTenantId, selectedTenant, organizations, setSelectedTenantId } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isHiringManager = session?.user?.role === "HIRING_MANAGER";
  const userOrgName = session?.user?.organizationName;

  // Se for Hiring Manager, força a seleção da sua própria organização
  useEffect(() => {
    if (isHiringManager && session?.user?.organizationId && selectedTenantId !== session.user.organizationId) {
      setSelectedTenantId(session.user.organizationId);
    }
  }, [isHiringManager, session, selectedTenantId, setSelectedTenantId]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string) => {
    if (isHiringManager) return;
    setSelectedTenantId(id);
    setIsOpen(false);
    // Atualizar a visualização atual
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Seletor Principal */}
      <button
        onClick={() => {
          if (!isHiringManager) setIsOpen(!isOpen);
        }}
        disabled={isHiringManager}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-200 border border-slate-700/60 shadow-sm transition-all text-xs font-semibold ${
          isHiringManager
            ? "bg-slate-950/80 cursor-default"
            : "bg-slate-900/80 hover:bg-slate-800 cursor-pointer group"
        }`}
      >
        <div className="w-6 h-6 rounded-lg bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
          {selectedTenantId === "ALL" ? (
            <Globe2 size={13} />
          ) : (
            <Building2 size={13} />
          )}
        </div>

        <div className="text-left flex flex-col min-w-0 max-w-[160px] sm:max-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none flex items-center gap-1">
            <span>{isHiringManager ? "Sua Organização" : "Empresa Ativa"}</span>
            {isHiringManager && <Lock size={9} className="text-emerald-400" />}
          </span>
          <span className="text-xs font-black text-white truncate leading-tight mt-0.5">
            {isHiringManager
              ? userOrgName || selectedTenant?.name || "Sua Empresa"
              : selectedTenantId === "ALL"
              ? "Visão Global Maître"
              : selectedTenant?.name || "Selecionar Cliente"}
          </span>
        </div>

        {!isHiringManager && (
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-maitre-gold" : ""
            }`}
          />
        )}
      </button>

      {/* Menu Dropdown */}
      {!isHiringManager && isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header do Dropdown */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Alternar Contexto de Cliente
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-maitre-gold/20 text-maitre-gold">
                {organizations.length} Empresas
              </span>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar empresa cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 text-xs text-white placeholder-slate-500 rounded-lg border border-slate-700 focus:outline-none focus:border-maitre-gold"
              />
            </div>
          </div>

          {/* Opção 1: Visão Global */}
          <div className="p-1 border-b border-slate-800/60">
            <button
              onClick={() => handleSelect("ALL")}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                selectedTenantId === "ALL"
                  ? "bg-maitre-gold/15 text-maitre-gold font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <Globe2 size={14} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white leading-tight">Visão Global Maître</div>
                  <div className="text-[10px] text-slate-400">Todas as operações consolidadas</div>
                </div>
              </div>
              {selectedTenantId === "ALL" && <Check size={14} className="text-maitre-gold shrink-0" />}
            </button>
          </div>

          {/* Lista de Empresas Clientes */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {filteredOrgs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Nenhuma empresa encontrada.
              </div>
            ) : (
              filteredOrgs.map((org) => {
                const isSelected = selectedTenantId === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelect(org.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-maitre-gold/15 text-maitre-gold font-bold"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {org.name[0]?.toUpperCase() || "E"}
                      </div>
                      <div className="text-left truncate">
                        <div className="font-bold text-white truncate leading-tight">
                          {org.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>/carreiras/{org.slug}</span>
                          {org._count?.jobs !== undefined && (
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <Briefcase size={9} /> {org._count.jobs} vagas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-maitre-gold shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: Gerenciar Clientes & Novo Cliente */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
            <Link
              href="/clients"
              onClick={() => setIsOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
            >
              <ExternalLink size={12} />
              <span>Gerenciar Clientes</span>
            </Link>

            <Link
              href="/clients?action=new"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-maitre-gold text-slate-950 hover:brightness-105 transition-all shadow-sm"
            >
              <Plus size={13} />
              <span>Novo</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
