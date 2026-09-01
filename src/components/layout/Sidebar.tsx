/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import {
  Briefcase,
  Users,
  Settings,
  LayoutDashboard,
  UserCog,
  ExternalLink,
  ShieldCheck,
  Award,
  UserCheck,
  TrendingUp,
  GraduationCap,
  HeartHandshake,
  Compass,
  FileCheck,
  BarChart3,
  Sparkles,
  Building2,
  MessageSquare,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Sidebar() {
  const session = await getServerSession(authOptions);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const role = session?.user?.role || "RECRUITER";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isHiringManager = role === "HIRING_MANAGER";

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

  const roleBadgeStyle =
    role === "SUPER_ADMIN"
      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
      : role === "ADMIN"
      ? "bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30"
      : role === "HIRING_MANAGER"
      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
      : "bg-blue-500/15 text-blue-400 border border-blue-500/30";

  return (
    <aside aria-label="Menu Principal" className="w-64 h-screen bg-[#1d1e20] text-slate-300 hidden lg:flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 shrink-0">
        <Link href={isHiringManager ? "/portal-gestor" : "/"} className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white tracking-tight">
            Maître<span className="text-maitre-gold">Conecta</span>
          </h1>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mt-0.5">
          {isHiringManager ? "Portal do Gestor" : "Suíte Integrada de RH"}
        </span>
      </div>

      {/* Navigation Scrollable */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* DASHBOARD GERAL / PORTAL DO GESTOR */}
        <div className="space-y-1">
          {isHiringManager ? (
            <Link
              href="/portal-gestor"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/90 text-white hover:bg-slate-700 transition-colors text-xs font-bold shadow-sm"
            >
              <LayoutDashboard size={16} className="text-maitre-gold shrink-0" />
              <div className="flex items-center justify-between flex-1">
                <span>Portal do Gestor</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                  Cliente
                </span>
              </div>
            </Link>
          ) : (
            <>
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/90 text-white hover:bg-slate-700 transition-colors text-xs font-bold shadow-sm"
              >
                <LayoutDashboard size={16} className="text-maitre-gold shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Painel Executivo</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-maitre-gold/20 text-maitre-gold rounded">
                    Geral
                  </span>
                </div>
              </Link>

              <Link
                href="/clients"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <Building2 size={16} className="text-cyan-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Empresas Clientes</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
                    B2B
                  </span>
                </div>
              </Link>

              <Link
                href="/portal-gestor"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <Award size={16} className="text-purple-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Visão do Gestor</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                    Preview
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* GRUPO 1: ATRAÇÃO & CORE */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {isHiringManager ? "Processos Seletivos" : "R&S & Gestão de Pessoas"}
          </span>

          <Link
            href="/jobs"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
          >
            <Briefcase size={16} className="text-maitre-gold shrink-0" />
            <div className="flex items-center justify-between flex-1">
              <span>{isHiringManager ? "Minhas Vagas" : "Conecta Talentos"}</span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-maitre-gold/20 text-maitre-gold rounded">
                ATS
              </span>
            </div>
          </Link>

          {!isHiringManager && (
            <>
              <Link
                href="/candidates"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold pl-7"
              >
                <Users size={14} className="text-slate-400 shrink-0" />
                <span>Banco de Talentos</span>
              </Link>

              <Link
                href="/feedbacks"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold pl-7"
              >
                <MessageSquare size={14} className="text-emerald-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Feedbacks WhatsApp</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                    23 Modelos
                  </span>
                </div>
              </Link>

              <Link
                href="/employees"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <UserCheck size={16} className="text-purple-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Pessoas</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                    Core HR
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>

        {!isHiringManager && (
          <>
            {/* GRUPO 2: OPERAÇÕES & ANALYTICS */}
            <div className="space-y-1 pt-2 border-t border-slate-800/50">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Operações & Insights
              </span>

              <Link
                href="/operations"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <FileCheck size={16} className="text-emerald-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Operações</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                    DP / Docs
                  </span>
                </div>
              </Link>

              <Link
                href="/insights"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <BarChart3 size={16} className="text-blue-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Insights</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                    Analytics
                  </span>
                </div>
              </Link>
            </div>

            {/* GRUPO 3: DHO, CARREIRA & CULTURA */}
            <div className="space-y-1 pt-2 border-t border-slate-800/50">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                DHO, Cultura & Carreira
              </span>

              <Link
                href="/development"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <TrendingUp size={16} className="text-indigo-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Desenvolvimento</span>
                </div>
              </Link>

              <Link
                href="/learning"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <GraduationCap size={16} className="text-cyan-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Aprendizagem</span>
                </div>
              </Link>

              <Link
                href="/culture"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <HeartHandshake size={16} className="text-rose-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Cultura</span>
                </div>
              </Link>

              <Link
                href="/careers-hub"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <Compass size={16} className="text-violet-400 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Carreiras</span>
                </div>
              </Link>

              <Link
                href="/consulting"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <Sparkles size={16} className="text-maitre-gold shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Conecta Consultoria</span>
                </div>
              </Link>
            </div>

            {/* GRUPO 4: ADMINISTRAÇÃO */}
            <div className="space-y-1 pt-2 border-t border-slate-800/50">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Administração
              </span>

              {isAdmin && (
                <Link
                  href="/users"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
                >
                  <UserCog size={16} className="text-purple-400 shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span>Usuários</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                      Admin
                    </span>
                  </div>
                </Link>
              )}

              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-semibold"
              >
                <Settings size={16} className="text-slate-400 shrink-0" />
                <span>Configurações</span>
              </Link>
            </div>
          </>
        )}

        {/* Link Externo Página de Carreiras */}
        <div className="pt-2">
          <Link
            href="/carreiras/maitre"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-maitre-gold hover:bg-maitre-gold/10 transition-colors border border-maitre-gold/20 text-xs font-bold"
          >
            <ExternalLink size={14} />
            <span>Portal de Carreiras</span>
          </Link>
        </div>
      </nav>

      {/* User Footer with Role Badge */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {session?.user?.name || "Usuário"}
            </div>
            <span
              className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded mt-0.5 ${roleBadgeStyle}`}
            >
              {roleLabel}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
