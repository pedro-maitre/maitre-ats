import Link from "next/link";
import { Briefcase, Users, Settings, LayoutDashboard, UserCog, ExternalLink } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Sidebar() {
  const session = await getServerSession(authOptions);
  
  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Maître<span className="text-maitre-gold">ATS</span></h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/jobs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <LayoutDashboard size={20} />
          <span>Painel</span>
        </Link>
        <Link href="/jobs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <Briefcase size={20} />
          <span>Vagas</span>
        </Link>
        <Link href="/candidates" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <Users size={20} />
          <span>Candidatos</span>
        </Link>
        
        {session?.user?.role === "SUPER_ADMIN" && (
          <Link href="/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <UserCog size={20} />
            <span>Usuários</span>
          </Link>
        )}

        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Configurações</span>
        </Link>

        <Link 
          href="/carreiras/maitre" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-maitre-gold hover:bg-maitre-gold/10 transition-colors mt-4 border border-slate-800/60"
        >
          <ExternalLink size={20} />
          <span>Página de Carreiras</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{session?.user?.name || "Usuário"}</div>
            <div className="text-xs text-slate-500 truncate">{session?.user?.email || ""}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
