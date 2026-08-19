import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Briefcase, MapPin, Users, ChevronRight } from "lucide-react";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      _count: {
        select: { applications: true }
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Vagas Abertas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Gerencie os processos seletivos ativos.</p>
        </div>
        <Link href="/jobs/new" className="bg-maitre-gold hover:bg-maitre-gold-hover text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm block text-center">
          Nova Vaga
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <Link href={`/jobs/${job.id}/board`} key={job.id} className="bg-white dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-sm rounded-xl p-6 hover:shadow-lg transition-all group block">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-lg">
                <Briefcase size={24} />
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {job.status === "OPEN" ? "ABERTA" : job.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-maitre-gold dark:group-hover:text-[#f2d291] transition-colors">
              {job.title}
            </h3>
            
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={16} className="mr-2" />
                {job.location || "Local não informado"}
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <Users size={16} className="mr-2" />
                {job._count.applications} candidatos
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t dark:border-slate-800 flex justify-between items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-maitre-gold">
              Ver Pipeline
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
