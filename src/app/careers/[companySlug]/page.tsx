import { prisma } from "@/lib/prisma";
import { Briefcase, MapPin, Search } from "lucide-react";
import Link from "next/link";

export default async function CompanyCareersPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;
  
  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
    include: {
      jobs: {
        where: { status: "OPEN" },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!org) return null;

  const jobs = org.jobs;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Venha fazer parte do time</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Confira nossas vagas abertas e encontre a oportunidade perfeita para o seu próximo passo profissional.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-maitre-gold"/> 
            Vagas Disponíveis ({jobs.length})
          </h2>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma vaga aberta no momento.</p>
              <p className="mt-1">Fique de olho, em breve teremos novidades!</p>
            </div>
          ) : (
            jobs.map((job) => (
              <Link 
                href={`/careers/${org.slug}/${job.id}`} 
                key={job.id}
                className="group block p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-maitre-gold transition-colors mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-medium text-slate-700 dark:text-slate-300">
                        <Briefcase size={14} />
                        {job.department || "Geral"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {job.location || "Remoto"}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-block bg-[#1d1e20] text-white px-5 py-2 rounded-lg font-medium group-hover:bg-maitre-gold transition-colors text-sm">
                      Ver detalhes
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
