import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Briefcase, MapPin, Building2, ArrowLeft } from "lucide-react";

export default async function JobDetailsPage({ params }: { params: Promise<{ companySlug: string, jobId: string }> }) {
  const { companySlug, jobId } = await params;
  
  const job = await prisma.job.findFirst({
    where: { 
      id: jobId,
      organization: { slug: companySlug },
      status: "OPEN"
    },
    include: {
      organization: true
    }
  });

  if (!job) notFound();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <Link href={`/careers/${companySlug}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Voltar para vagas
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
            {job.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              {job.organization.name}
            </span>
            <span className="flex items-center gap-2">
              <Briefcase size={16} className="text-maitre-gold" />
              {job.department || "Geral"}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-emerald-500" />
              {job.location || "Remoto"}
            </span>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            Descrição da Vaga
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </div>
        
        <div className="p-8 md:p-10 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pronto para este desafio?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Deixe seu currículo com a gente e venha construir o futuro.</p>
          <Link 
            href={`/careers/${companySlug}/${job.id}/apply`}
            className="inline-block bg-maitre-gold hover:bg-maitre-gold-hover text-white px-10 py-3 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-md"
          >
            Candidatar-se agora
          </Link>
        </div>
      </div>
    </div>
  );
}
