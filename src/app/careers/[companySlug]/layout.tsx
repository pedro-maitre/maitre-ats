import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default async function CareersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
  });

  if (!org) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="bg-[#1d1e20] text-white py-6 shadow-md border-b-[4px] border-maitre-gold shrink-0">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Building2 size={24} className="text-maitre-gold" />
          </div>
          <Link href={`/careers/${org.slug}`} className="text-2xl font-bold tracking-tight hover:text-[#f2d291] transition-colors">
            {org.name} <span className="text-slate-400 font-normal">| Carreiras</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {children}
      </main>

      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-slate-800 shrink-0">
        <p>Vagas publicadas via <span className="font-semibold text-slate-700 dark:text-slate-300">Maître ATS</span></p>
      </footer>
    </div>
  );
}
