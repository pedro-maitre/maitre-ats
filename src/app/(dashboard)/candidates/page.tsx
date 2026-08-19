import { prisma } from "@/lib/prisma";
import { Search, Filter, Mail, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q || "";

  const candidates = await prisma.candidate.findMany({
    where: query ? {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { email: { contains: query } },
        { profileSummary: { contains: query } }
      ]
    } : undefined,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Banco de Talentos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Explore e pesquise candidatos na base.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 p-4 flex gap-4">
        <form className="flex-1 relative" action={async (formData) => {
          "use server";
          const q = formData.get("q") as string;
          redirect(`/candidates?q=${encodeURIComponent(q)}`);
        }}>
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            name="q"
            defaultValue={query}
            placeholder="Pesquisar por nome, email ou competência..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-[#c89650] focus:ring-1 focus:ring-[#c89650] transition-all"
          />
        </form>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 transition-colors">
          <Filter size={20} />
          Filtros
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <th className="p-4 pl-6">Candidato</th>
              <th className="p-4">Origem</th>
              <th className="p-4">Data de Cadastro</th>
              <th className="p-4 text-right pr-6">Ações</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="p-4 pl-6">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-[#c89650] transition-colors">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Mail size={14}/> {c.email}</span>
                    {c.phone && <span className="flex items-center gap-1"><Phone size={14}/> {c.phone}</span>}
                  </div>
                </td>
                <td className="p-4">
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                    {c.source || "Banco"}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-sm">
                  {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="p-4 text-right pr-6">
                  <Link href={`/candidates/${c.id}`} className="text-[#c89650] hover:text-[#b08040] font-medium text-sm flex items-center gap-1 justify-end w-full transition-colors">
                    Ver Perfil <ExternalLink size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            
            {candidates.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search size={40} className="mb-3 opacity-20" />
                    <p>Nenhum talento encontrado.</p>
                    {query && (
                      <Link href="/candidates" className="text-blue-500 hover:underline mt-2 text-sm">
                        Limpar pesquisa
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
