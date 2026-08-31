import JobPipelineContainer from "@/components/jobs/JobPipelineContainer";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  ExternalLink,
  Briefcase,
  UserCheck,
  Edit,
  DollarSign,
} from "lucide-react";
import { evaluateApplicationFit } from "@/lib/fit-evaluator";

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
      recruiter: {
        select: { id: true, name: true, email: true },
      },
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

  // Formatar estágios para o KanbanBoard com dados completos para Split View e WhatsApp
  const initialStages = job.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    candidates: stage.applications.map((app) => ({
      id: app.id,
      candidateId: app.candidate.id,
      name: `${app.candidate.firstName} ${app.candidate.lastName}`,
      email: app.candidate.email,
      phone: app.candidate.phone,
      resumeUrl: app.candidate.resumeUrl,
      linkedinUrl: app.candidate.linkedinUrl,
      salaryExpectation: app.salaryExpectation,
      score: app.matchScore || 0,
      priority: app.priority,
      fitCategory: app.fitCategory,
      enteredStageAt: app.enteredStageAt,
      source: app.candidate.source,
      tags: app.candidate.tags,
    })),
  }));

  // Lista simples de estágios para dropdowns e filtros
  const stagesList = job.stages.map((st) => ({
    id: st.id,
    name: st.name,
    order: st.order,
  }));

  // Lista plana de candidatos para a tabela de Triagem Inteligente com avaliação Fit 3D
  const triagemCandidates = job.stages.flatMap((stage) =>
    stage.applications.map((app) => {
      const evaluation = evaluateApplicationFit(
        {
          title: job.title,
          description: job.description,
          department: job.department,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        },
        {
          tags: app.candidate.tags,
          profileSummary: app.candidate.profileSummary,
        },
        {
          salaryExpectation: app.salaryExpectation,
        }
      );

      return {
        id: app.id,
        candidateId: app.candidate.id,
        name: `${app.candidate.firstName} ${app.candidate.lastName}`,
        email: app.candidate.email,
        phone: app.candidate.phone,
        resumeUrl: app.candidate.resumeUrl,
        linkedinUrl: app.candidate.linkedinUrl,
        source: app.candidate.source,
        tags: app.candidate.tags,
        salaryExpectation: app.salaryExpectation,
        priority: app.priority,
        stageId: stage.id,
        stageName: stage.name,
        enteredStageAt: app.enteredStageAt,
        evaluation,
      };
    })
  );

  const formatSalary = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

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

        <div className="flex items-center gap-2.5">
          <Link
            href={`/jobs/${job.id}/edit`}
            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Edit size={14} />
            <span>Editar Vaga</span>
          </Link>

          {job.organization && (
            <Link
              href={`/carreiras/${job.organization.slug}/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-maitre-gold hover:underline text-xs font-bold bg-maitre-gold/10 hover:bg-maitre-gold/20 px-3.5 py-1.5 rounded-xl border border-maitre-gold/20 transition-all"
            >
              <ExternalLink size={14} />
              <span>Ver no Portal Público</span>
            </Link>
          )}
        </div>
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

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <Briefcase size={14} className="text-maitre-gold" />
              {job.department || "Geral"}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <MapPin size={14} className="text-maitre-gold" />
              {job.location || "Remoto"}
            </span>
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg font-bold">
                <DollarSign size={14} />
                {job.salaryMin && job.salaryMax
                  ? `${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}`
                  : job.salaryMax
                  ? `Até ${formatSalary(job.salaryMax)}`
                  : `A partir de ${formatSalary(job.salaryMin!)}`}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <Users size={14} className="text-maitre-gold" />
              {totalCandidates} {totalCandidates === 1 ? "candidato" : "candidatos"}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-700/60">
              <UserCheck size={14} className="text-maitre-gold" />
              Responsável: {job.recruiter?.name || "Sem recrutador atribuído"}
            </span>
          </div>
        </div>
      </div>

      {/* Unified Pipeline Container: Kanban View + Smart Triagem Table */}
      <JobPipelineContainer
        initialStages={initialStages}
        triagemCandidates={triagemCandidates}
        stagesList={stagesList}
        job={{
          id: job.id,
          title: job.title,
          department: job.department,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        }}
      />
    </div>
  );
}
