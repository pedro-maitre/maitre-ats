import { prisma } from "@/lib/prisma";
import { Search, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CandidateListTable from "@/components/candidates/CandidateListTable";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { q } = await searchParams;
  const query = q || "";

  const candidates = await prisma.candidate.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { profileSummary: { contains: query, mode: "insensitive" } },
            { tags: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  const formatted = candidates.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    source: c.source,
    createdAt: c.createdAt,
  }));

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Banco de Talentos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Pesquise e gerencie todos os candidatos cadastrados na base.
          </p>
        </div>

        <Link
          href="/candidates/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-5 py-2.5 rounded-xl font-extrabold shadow-md hover:brightness-105 transition-all text-sm active:scale-95"
        >
          <Plus size={18} />
          <span>Cadastrar Candidato</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex gap-4">
        <form
          className="flex-1 relative"
          action={async (formData) => {
            "use server";
            const q = formData.get("q") as string;
            redirect(`/candidates?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Pesquisar por nome, email, competência ou resumo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold transition-all text-sm"
          />
        </form>
      </div>

      <CandidateListTable
        initialCandidates={formatted}
        userRole={session?.user?.role}
        query={query}
      />
    </div>
  );
}
