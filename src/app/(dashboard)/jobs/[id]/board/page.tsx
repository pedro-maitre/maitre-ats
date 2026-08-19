import KanbanBoard from "@/components/kanban/KanbanBoard";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Building2, MapPin, Users, Calendar, UserPlus, Edit } from "lucide-react";

export default async function JobBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
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

  if (!job) return <div className="p-8">Vaga não encontrada</div>;

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
    <div className="min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
            Fluxo de Recrutamento 
            <span className="text-slate-300 dark:text-slate-600">&bull;</span> 
            Aberta em {new Date(job.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      <KanbanBoard initialStages={stages} />
    </div>
  );
}
