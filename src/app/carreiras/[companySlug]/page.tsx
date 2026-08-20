import { prisma } from "@/lib/prisma";
import { Briefcase, MapPin, Search, Sparkles, Building2, ChevronRight, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function CompanyCarreirasPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
    include: {
      jobs: {
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!org) return null;

  const jobs = org.jobs;
  const departments = Array.from(new Set(jobs.map((j) => j.department || "Geral")));

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1d1e20] via-slate-900 to-[#121316] text-white p-8 sm:p-12 shadow-2xl border border-slate-800 overflow-hidden text-center">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-maitre-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maitre-gold/15 border border-maitre-gold/30 text-maitre-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            Oportunidades em Aberto
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Construa sua história na{" "}
            <span className="bg-gradient-to-r from-maitre-gold via-[#fff2d1] to-maitre-gold bg-clip-text text-transparent">
              {org.name}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Buscamos pessoas talentosas e apaixonadas por inovação. Conheça nossas vagas disponíveis e acompanhe seu processo seletivo em tempo real.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs sm:text-sm font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
              <Briefcase size={15} className="text-maitre-gold" />
              {jobs.length} {jobs.length === 1 ? "vaga aberta" : "vagas abertas"}
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
              <Building2 size={15} className="text-maitre-gold" />
              {departments.length} {departments.length === 1 ? "área de atuação" : "áreas de atuação"}
            </span>
          </div>
        </div>
      </div>

      {/* Jobs List Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Briefcase size={22} className="text-maitre-gold" />
              Vagas Disponíveis ({jobs.length})
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Escolha a oportunidade que mais combina com seu perfil
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                <Search size={32} />
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Nenhuma vaga aberta no momento.
              </p>
              <p className="text-sm mt-1 max-w-md">
                No momento todas as nossas posições foram preenchidas. Fique atento para novas oportunidades em breve!
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const formatSalary = (val: number) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);

              return (
                <Link
                  href={`/carreiras/${org.slug}/${job.id}`}
                  key={job.id}
                  className="group block p-6 sm:p-8 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-maitre-gold transition-colors">
                          {job.title}
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Inscrições Abertas
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                          <Briefcase size={14} className="text-maitre-gold" />
                          {job.department || "Geral"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                          <MapPin size={14} className="text-maitre-gold" />
                          {job.location || "Remoto"}
                        </span>
                        {(job.salaryMin || job.salaryMax) && (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                            <DollarSign size={14} className="text-emerald-500" />
                            {job.salaryMin && job.salaryMax
                              ? `${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}`
                              : job.salaryMax
                              ? `Até ${formatSalary(job.salaryMax)}`
                              : `A partir de ${formatSalary(job.salaryMin!)}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right flex items-center sm:self-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-[#1d1e20] text-white px-5 py-2.5 rounded-xl font-bold group-hover:bg-maitre-gold group-hover:text-slate-950 transition-all text-sm shadow-md">
                        Ver Detalhes & Candidatar-se
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
