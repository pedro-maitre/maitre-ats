"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  UserCheck,
  FileCheck,
  Award,
  GraduationCap,
  HeartHandshake,
  Compass,
  Building2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useSession } from "next-auth/react";

interface MobileSidebarDrawerProps {
  userName?: string | null;
  userEmail?: string | null;
  role?: string;
}

export default function MobileSidebarDrawer({
  userName: propUserName,
  userEmail: propUserEmail,
  role: propRole,
}: MobileSidebarDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const role = propRole || session?.user?.role || "RECRUITER";
  const userName = propUserName || session?.user?.name || "Recrutador";
  const userEmail = propUserEmail || session?.user?.email || "";

  const isHiringManager = role === "HIRING_MANAGER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const roleLabel =
    role === "SUPER_ADMIN"
      ? "Admin Master"
      : role === "ADMIN"
      ? "Administrador"
      : role === "RECRUITER"
      ? "Recrutador Maître"
      : role === "HIRING_MANAGER"
      ? "Hiring Manager"
      : "Candidato";

  return (
    <>
      {/* Botão Hambúrguer Visível apenas no Mobile (< 1024px) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu de navegação"
        className="lg:hidden w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
      >
        <Menu size={18} />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-nav-title"
          className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#1d1e20] text-slate-300 border-r border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 id="mobile-nav-title" className="text-lg font-black text-white tracking-tight">
                  Maître<span className="text-maitre-gold">Conecta</span>
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  {isHiringManager ? "Portal do Gestor" : "Suíte Integrada de RH"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar menu"
                className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
              <div className="space-y-1">
                <Link
                  href={isHiringManager ? "/portal-gestor" : "/"}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/90 text-white text-xs font-bold"
                >
                  <LayoutDashboard size={15} className="text-maitre-gold" />
                  <span>{isHiringManager ? "Portal do Gestor" : "Painel Executivo"}</span>
                </Link>
                <Link
                  href="/clients"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <Building2 size={15} className="text-cyan-400" />
                  <span>Empresas Clientes</span>
                </Link>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  R&S & Gestão
                </span>
                <Link
                  href="/jobs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <Briefcase size={15} className="text-maitre-gold" />
                  <span>Conecta Talentos (ATS)</span>
                </Link>
                <Link
                  href="/candidates"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold pl-6"
                >
                  <Users size={14} className="text-slate-400" />
                  <span>Banco de Talentos</span>
                </Link>
                <Link
                  href="/feedbacks"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold pl-6"
                >
                  <MessageSquare size={14} className="text-emerald-400" />
                  <span>Feedbacks WhatsApp</span>
                </Link>
                <Link
                  href="/employees"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <UserCheck size={15} className="text-purple-400" />
                  <span>Conecta Pessoas (Core HR)</span>
                </Link>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Operações & DHO
                </span>
                <Link
                  href="/operations"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <FileCheck size={15} className="text-emerald-400" />
                  <span>Conecta Operações</span>
                </Link>
                <Link
                  href="/development"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <Award size={15} className="text-pink-400" />
                  <span>Conecta Desenvolvimento</span>
                </Link>
                <Link
                  href="/learning"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <GraduationCap size={15} className="text-cyan-400" />
                  <span>Conecta Aprendizagem</span>
                </Link>
                <Link
                  href="/culture"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                >
                  <HeartHandshake size={15} className="text-rose-400" />
                  <span>Conecta Cultura</span>
                </Link>
              </div>
            </nav>

            {/* Footer do Usuário */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-maitre-gold border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{userName || "Usuário"}</p>
                  <span className="text-[10px] text-slate-400 block truncate">{roleLabel}</span>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
