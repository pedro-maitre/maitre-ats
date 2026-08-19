import { prisma } from "@/lib/prisma";
import { Briefcase, Users, UserPlus, ArrowRight, BarChart3, Clock } from "lucide-react";
import Link from "next/link";

export default async function DashboardHomePage() {
  const [totalJobs, totalCandidates, recentJobs, recentApplications, stagesData] = await Promise.all([
    prisma.job.count(),
    prisma.candidate.count(),
    prisma.job.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } }
      }
    }),
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: true,
        job: true,
        stage: true
      }
    }),
    prisma.stage.findMany({
      select: {
        name: true,
        _count: { select: { applications: true } }
      }
    })
  ]);

  const funnelMap = stagesData.reduce((acc, stage) => {
    acc[stage.name] = (acc[stage.name] || 0) + stage._count.applications;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by name roughly to approximate funnel or just count
  const funnelArray = Object.entries(funnelMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bom dia, Recrutador</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Aqui está o resumo da sua operação de talentos hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-blue-600 dark:text-blue-400">
            <Briefcase size={28} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalJobs}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Vagas Ativas</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Users size={28} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalCandidates}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Candidatos no Banco</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl text-amber-600 dark:text-amber-400">
            <UserPlus size={28} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{recentApplications.length}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Novas Inscrições Hoje</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 size={20} className="text-maitre-gold" />
              Vagas em Destaque
            </h2>
            <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 group">
              Ver todas <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-4 flex-1">
            {recentJobs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Briefcase size={40} className="mb-2 opacity-50" />
                <p>Nenhuma vaga cadastrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map(job => (
                  <Link href={`/jobs/${job.id}/board`} key={job.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-maitre-gold transition-colors">{job.title}</div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        {job.department || "Geral"} &bull; {job.location || "Remoto"}
                        <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                        Aberta em {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium px-3 py-1 rounded-full text-sm">
                        {job._count.applications} candidatos
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              Atividade Recente
            </h2>
          </div>
          <div className="p-6 flex-1">
            {recentApplications.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                 <Clock size={40} className="mb-2 opacity-50" />
                 <p>Nenhuma atividade recente</p>
               </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {recentApplications.map((app, _) => (
                  <div key={app.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <UserPlus size={16} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{app.candidate.firstName} se inscreveu</div>
                        <div className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div className="text-sm text-slate-500">
                        Para a vaga <span className="font-medium text-slate-700 dark:text-slate-300">{app.job.title}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funil de Recrutamento Global */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col p-6 mt-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-emerald-500" />
          Funil Global de Recrutamento
        </h2>
        
        {funnelArray.length === 0 ? (
          <div className="flex justify-center items-center py-8 text-slate-400">
            Nenhum dado no funil ainda.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {funnelArray.map(([stageName, count]) => (
              <div key={stageName} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col items-center text-center justify-center">
                <span className="text-3xl font-black text-maitre-gold mb-1">{count}</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{stageName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
