import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Briefcase, MapPin, Building2, ArrowLeft, DollarSign, CheckCircle2, Share2, Sparkles } from "lucide-react";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ companySlug: string; jobId: string }>;
}) {
  const { companySlug, jobId } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      organization: { slug: companySlug },
      status: "OPEN",
    },
    include: {
      organization: true,
      stages: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!job) notFound();

  const formatSalary = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-6">
      <Link
        href={`/carreiras/${companySlug}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para todas as vagas
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        {/* Job Header */}
        <div className="p-8 sm:p-12 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30">
              Vaga Aberta
            </span>
            <span className="text-xs font-medium text-slate-400">
              Publicada pela equipe de talentos
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl">
              <Building2 size={16} className="text-maitre-gold" />
              {job.organization.name}
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl">
              <Briefcase size={16} className="text-maitre-gold" />
              {job.department || "Geral"}
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl">
              <MapPin size={16} className="text-maitre-gold" />
              {job.location || "Remoto"}
            </span>
            {(job.salaryMin || job.salaryMax) && (
              <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl font-bold">
                <DollarSign size={16} />
                {job.salaryMin && job.salaryMax
                  ? `${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}`
                  : job.salaryMax
                  ? `Até ${formatSalary(job.salaryMax)}`
                  : `A partir de ${formatSalary(job.salaryMin!)}`}
              </span>
            )}
          </div>
        </div>

        {/* Job Description Content */}
        <div className="p-8 sm:p-12 space-y-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-maitre-gold" />
              Sobre a Oportunidade
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base">
              {job.description}
            </div>
          </div>

          {/* Process Stages Preview */}
          {job.stages && job.stages.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/60 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-maitre-gold" />
                Etapas do Processo Seletivo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {job.stages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-maitre-gold/20 text-maitre-gold text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {stage.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Apply Callout Footer */}
        <div className="p-8 sm:p-12 bg-gradient-to-r from-slate-900 to-[#1d1e20] text-white text-center border-t border-slate-800 space-y-4">
          <h3 className="text-2xl font-black text-white">
            Pronto para dar o próximo passo na sua carreira?
          </h3>
          <p className="text-slate-300 max-w-lg mx-auto text-sm sm:text-base">
            Envie seu currículo agora. Nossa inteligência artificial preenche seus dados e você acompanha todas as fases no seu painel.
          </p>
          <div className="pt-2">
            <Link
              href={`/carreiras/${companySlug}/${job.id}/apply`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95"
            >
              Candidatar-se para esta Vaga
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
