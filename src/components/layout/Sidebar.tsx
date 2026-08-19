import Link from "next/link";
import { Briefcase, Users, Settings, LayoutDashboard } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Maître<span className="text-[#c89650]">ATS</span></h1>
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
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Configurações</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
            MC
          </div>
          <div>
            <div className="text-sm font-semibold text-white">RH Maître</div>
            <div className="text-xs text-slate-500">rh@maitre.com.br</div>
          </div>
        </div>
      </div>
    </div>
  );
}
