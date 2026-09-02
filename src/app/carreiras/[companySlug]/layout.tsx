import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

  let org: any = null;
  try {
    org = await prisma.organization.findUnique({
      where: { slug: companySlug },
    });
  } catch (err: any) {
    console.error("Erro ao buscar organização no layout de carreiras:", err?.message || err);
  }

  // Fallback seguro se a organização padrão 'maitre' ainda não tiver sido semeada no banco
  if (!org && (companySlug === "maitre" || companySlug === "default")) {
    org = {
      id: "org-maitre-default",
      name: "Maître Conecta",
      slug: companySlug,
      primaryColor: "#D4AF37",
      logoUrl: null,
      websiteUrl: "https://maitre.com.br",
    };
  } else if (!org) {
    notFound();
  }

  const isCandidateLoggedIn = session?.user && (session.user.role === "CANDIDATE" || !session.user.role);
  const primaryColor = org.primaryColor || "#D4AF37";

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:text-slate-900"
      style={{
        // @ts-expect-error CSS custom property
        "--company-primary": primaryColor,
      }}
    >
      {/* Header */}
      <header
        className="bg-[#1d1e20] text-white shadow-xl sticky top-0 z-40 backdrop-blur-md bg-opacity-95 border-b-[3px]"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/carreiras/${org.slug}`}
            className="flex items-center gap-3 group transition-all"
          >
            {org.logoUrl ? (
              <div className="bg-white/10 p-1.5 rounded-xl border border-white/10 flex items-center justify-center max-w-[120px] max-h-[42px] overflow-hidden">
                <Image
                  src={org.logoUrl}
                  alt={org.name}
                  width={120}
                  height={32}
                  unoptimized
                  className="max-h-8 w-auto object-contain"
                />
              </div>
            ) : (
              <div
                className="p-2.5 rounded-xl transition-colors border border-white/10 text-white font-black"
                style={{ backgroundColor: `${primaryColor}25` }}
              >
                <Building2 size={24} style={{ color: primaryColor }} />
              </div>
            )}
            <div>
              <span className="text-xl font-black tracking-tight text-white group-hover:opacity-90 transition-opacity">
                {org.name}
              </span>
              <span className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Portal de Carreiras
              </span>
            </div>
          </Link>

          {/* Navigation & Candidate Area */}
          <div className="flex items-center gap-3">
            {org.websiteUrl && (
              <Link
                href={org.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <span>Site Institucional</span>
              </Link>
            )}

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
                  className="inline-flex items-center gap-2 border px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}50`,
                    color: primaryColor,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full text-slate-950 flex items-center justify-center text-xs font-black"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {session?.user?.name ? session.user.name[0].toUpperCase() : "C"}
                  </div>
                  <span className="hidden md:inline">Minhas Candidaturas</span>
                  <span className="md:hidden">Área do Candidato</span>
                </Link>
              </div>
            ) : (
              <Link
                href={`/carreiras/${org.slug}/candidato/login`}
                className="inline-flex items-center gap-2 hover:brightness-105 text-slate-950 px-4 py-2 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-95"
                style={{ backgroundColor: primaryColor }}
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
              Maître<span className="text-maitre-gold font-black">Conecta</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
