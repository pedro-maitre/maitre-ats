import Link from "next/link";
import { Briefcase, Users, Settings, LayoutDashboard, UserCog, ExternalLink, ShieldCheck, Award } from "lucide-react";
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
  const isRecruiter = role === "RECRUITER";

  const roleLabel =
    role === "SUPER_ADMIN"
      ? "Admin Master"
      : role === "ADMIN"
      ? "Administrador"
      : role === "RECRUITER"
      ? "Recrutador Maître"
      : "Candidato";

  const roleBadgeStyle =
    role === "SUPER_ADMIN"
      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
      : role === "ADMIN"
      ? "bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30"
      : "bg-blue-500/15 text-blue-400 border border-blue-500/30";

  return (
    <div className="w-64 h-screen bg-[#1d1e20] text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <Link href="/jobs" className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Maître<span className="text-maitre-gold">Conecta</span>
          </h1>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mt-0.5">
          Gestão de Recrutamento
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        <Link
          href="/jobs"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-sm font-semibold"
        >
          <Briefcase size={18} className="text-maitre-gold" />
          <span>Vagas</span>
        </Link>

        <Link
          href="/candidates"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-sm font-semibold"
        >
          <Users size={18} className="text-maitre-gold" />
          <span>Banco de Talentos</span>
        </Link>

        {isAdmin && (
          <Link
            href="/users"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-sm font-semibold"
          >
            <UserCog size={18} className="text-purple-400" />
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-sm font-semibold"
        >
          <Settings size={18} className="text-slate-400" />
          <span>Configurações</span>
        </Link>

        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <Link
            href="/carreiras/maitre"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-maitre-gold hover:bg-maitre-gold/10 transition-colors border border-maitre-gold/20 text-xs font-bold"
          >
            <ExternalLink size={16} />
            <span>Página de Carreiras</span>
          </Link>
        </div>
      </nav>

      {/* User Footer with Role Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {session?.user?.name || "Usuário"}
            </div>
            <span
              className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${roleBadgeStyle}`}
            >
              {roleLabel}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
