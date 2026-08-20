import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, User, LogOut, Briefcase } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CarreirasLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const session = await getServerSession(authOptions);

  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
  });

  if (!org) {
    notFound();
  }

  const isCandidateLoggedIn = session?.user && (session.user.role === "CANDIDATE" || !session.user.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-maitre-gold selection:text-slate-900">
      {/* Header */}
      <header className="bg-[#1d1e20] text-white shadow-xl border-b-[3px] border-maitre-gold sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/carreiras/${org.slug}`}
            className="flex items-center gap-3 group transition-all"
          >
            <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-maitre-gold/20 transition-colors border border-white/10">
              <Building2 size={24} className="text-maitre-gold" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white group-hover:text-maitre-gold transition-colors">
                {org.name}
              </span>
              <span className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Portal de Carreiras
              </span>
            </div>
          </Link>

          {/* Navigation & Candidate Area */}
          <div className="flex items-center gap-3">
            <Link
              href={`/carreiras/${org.slug}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Briefcase size={16} />
              Vagas Abertas
            </Link>

            {isCandidateLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/carreiras/${org.slug}/candidato`}
                  className="inline-flex items-center gap-2 bg-maitre-gold/15 hover:bg-maitre-gold/25 text-maitre-gold border border-maitre-gold/30 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-maitre-gold text-slate-950 flex items-center justify-center text-xs font-black">
                    {session?.user?.name ? session.user.name[0].toUpperCase() : "C"}
                  </div>
                  <span className="hidden md:inline">Minhas Candidaturas</span>
                  <span className="md:hidden">Área do Candidato</span>
                </Link>
              </div>
            ) : (
              <Link
                href={`/carreiras/${org.slug}/candidato/login`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] hover:brightness-105 text-slate-950 px-4 py-2 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-95"
              >
                <User size={16} />
                <span>Área do Candidato</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 shrink-0">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium">
            © {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
          </p>
          <p className="flex items-center gap-1 text-xs">
            Tecnologia e Gestão por{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Maître<span className="text-maitre-gold font-black">ATS</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
