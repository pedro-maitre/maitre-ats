import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Globe,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Star,
  Edit,
  ExternalLink,
  User,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import AssignJobModal from "@/components/candidates/AssignJobModal";

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [candidate, activeJobs] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            job: true,
            stage: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
    prisma.job.findMany({
      where: { status: "OPEN" },
      select: { id: true, title: true, department: true },
    }),
  ]);

  if (!candidate) {
    redirect("/candidates");
  }

  // Parse tags if it's a JSON string
  let tags: string[] = [];
  if (candidate.tags) {
    try {
      tags = JSON.parse(candidate.tags);
    } catch {
      tags = candidate.tags.split(",").map((t) => t.trim());
    }
  }

  const initials = `${candidate.firstName[0] || ""}${candidate.lastName[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para o Banco de Talentos
        </Link>
      </div>

      {/* Profile Header Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-maitre-gold to-[#fff2d1] text-slate-950 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shrink-0">
            {initials || "C"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {candidate.source || "Banco de Talentos"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cadastrado em{" "}
              {new Date(candidate.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {candidate.resumeUrl && (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border border-slate-200 dark:border-slate-700"
            >
              <FileText size={16} className="text-maitre-gold" />
              <span>Ver Currículo (PDF)</span>
              <ExternalLink size={12} />
            </a>
          )}
          <Link
            href={`/candidates/${candidate.id}/edit`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-95"
          >
            <Edit size={16} />
            <span>Editar Perfil</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Contact & Basic Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-maitre-gold" />
              Informações de Contato
            </h2>

            <div className="space-y-4 text-sm">
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-maitre-gold transition-colors group"
              >
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-xl group-hover:border-maitre-gold/40">
                  <Mail size={16} className="text-maitre-gold" />
                </div>
                <span className="truncate font-medium">{candidate.email}</span>
              </a>

              {candidate.phone && (
                <a
                  href={`https://wa.me/${candidate.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-maitre-gold transition-colors group"
                >
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-xl group-hover:border-maitre-gold/40">
                    <Phone size={16} className="text-emerald-500" />
                  </div>
                  <span className="font-medium">{candidate.phone}</span>
                </a>
              )}

              {candidate.linkedinUrl && (
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-maitre-gold transition-colors group"
                >
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-xl group-hover:border-maitre-gold/40">
                    <Globe size={16} className="text-blue-500" />
                  </div>
                  <span className="truncate font-medium">Perfil no LinkedIn</span>
                </a>
              )}
            </div>

            {tags.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Competências & Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-maitre-gold/10 text-maitre-gold border border-maitre-gold/20 rounded-lg text-xs font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Applications & Summary */}
        <div className="md:col-span-2 space-y-6">
          {/* Professional Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-maitre-gold" />
              Resumo Profissional (IA)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {candidate.profileSummary || "Nenhum resumo cadastrado para este talento."}
            </p>
          </div>

          {/* Applications History */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-maitre-gold" />
                Processos Seletivos ({candidate.applications.length})
              </h2>

              <AssignJobModal candidateId={candidate.id} activeJobs={activeJobs} />
            </div>

            {candidate.applications.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm space-y-2">
                <Briefcase size={28} className="mx-auto text-slate-400" />
                <p className="font-semibold">Nenhuma candidatura associada a este candidato.</p>
                <p className="text-xs">Utilize o botão acima para vinculá-lo a uma vaga aberta.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidate.applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-maitre-gold/50 transition-all"
                  >
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base">
                        {app.job.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{app.job.department || "Geral"}</span>
                        <span>&bull;</span>
                        <span>
                          Inscrito em {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30 text-xs font-bold uppercase tracking-wider">
                        {app.stage.name}
                      </span>
                      <Link
                        href={`/jobs/${app.job.id}/board`}
                        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-maitre-gold flex items-center gap-1"
                      >
                        <span>Ver no Kanban</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
