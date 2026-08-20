import KanbanBoard from "@/components/kanban/KanbanBoard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Users, ExternalLink, Briefcase } from "lucide-react";

export default async function JobBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      organization: true,
      stages: {
        orderBy: { order: "asc" },
        include: {
          applications: {
            include: {
              candidate: true,
            },
          },
        },
      },
    },
  });

  if (!job) return <div className="p-8 font-bold text-slate-500">Vaga não encontrada</div>;

  const totalCandidates = job.stages.reduce(
    (acc, stage) => acc + stage.applications.length,
    0
  );

  const stages = job.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    candidates: stage.applications.map((app) => ({
      id: app.id,
      candidateId: app.candidate.id,
      name: `${app.candidate.firstName} ${app.candidate.lastName}`,
      score: app.matchScore || 0,
      priority: app.priority,
      fitCategory: app.fitCategory,
      enteredStageAt: app.enteredStageAt,
      source: app.candidate.source,
      tags: app.candidate.tags,
    })),
  }));

  return (
    <div className="min-h-screen space-y-6 animate-in fade-in duration-500">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para lista de vagas
        </Link>

        {job.organization && (
          <Link
            href={`/carreiras/${job.organization.slug}/${job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-maitre-gold hover:underline text-xs font-bold bg-maitre-gold/10 hover:bg-maitre-gold/20 px-3.5 py-1.5 rounded-xl border border-maitre-gold/20 transition-all"
          >
            <ExternalLink size={14} />
            <span>Ver na Página de Carreiras Pública</span>
          </Link>
        )}
      </div>

      {/* Board Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {job.status === "OPEN" ? "Vaga Aberta" : job.status}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Criada em {new Date(job.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <Briefcase size={14} className="text-maitre-gold" />
              {job.department || "Geral"}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <MapPin size={14} className="text-maitre-gold" />
              {job.location || "Remoto"}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <Users size={14} className="text-maitre-gold" />
              {totalCandidates} {totalCandidates === 1 ? "candidato no pipeline" : "candidatos no pipeline"}
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Drag & Drop Board */}
      <KanbanBoard initialStages={stages} />
    </div>
  );
}
