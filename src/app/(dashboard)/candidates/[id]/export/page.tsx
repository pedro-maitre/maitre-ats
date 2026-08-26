import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  CheckCircle2,
  Building2,
  DollarSign,
  Award,
  Sparkles,
} from "lucide-react";
import PrintButton from "@/components/candidates/PrintButton";

export default async function CandidateExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          job: {
            include: {
              organization: true,
            },
          },
          stage: true,
          interviews: {
            include: {
              scorecards: {
                include: {
                  evaluator: {
                    select: { name: true, email: true, role: true },
                  },
                },
              },
            },
            orderBy: { scheduledAt: "desc" },
          },
          offers: {
            orderBy: { createdAt: "desc" },
          },
          hireConversion: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!candidate) notFound();

  let tagsList: string[] = [];
  if (candidate.tags) {
    try {
      const parsed = JSON.parse(candidate.tags);
      tagsList = Array.isArray(parsed) ? parsed : candidate.tags.split(",").map((t) => t.trim());
    } catch {
      tagsList = candidate.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }

  const primaryApplication = candidate.applications[0];
  const allScorecards = primaryApplication?.interviews?.flatMap((i) => i.scorecards) || [];

  const avgTechScore = allScorecards.length > 0
    ? (allScorecards.reduce((acc, s) => acc + s.technicalScore, 0) / allScorecards.length).toFixed(1)
    : null;

  const avgCultureScore = allScorecards.length > 0
    ? (allScorecards.reduce((acc, s) => acc + s.cultureScore, 0) / allScorecards.length).toFixed(1)
    : null;

  const avgCommScore = allScorecards.length > 0
    ? (allScorecards.reduce((acc, s) => acc + (s.communicationScore || s.cultureScore), 0) / allScorecards.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 font-sans print:p-0 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      {/* Barra Superior de Ações (Oculta na Impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/candidates/${candidate.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Perfil
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Folha do Dossiê Executivo (Formato A4 Executivo) */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 print:bg-white rounded-3xl shadow-xl print:shadow-none border border-slate-200 dark:border-slate-800 print:border-none p-8 sm:p-12 space-y-8">
        {/* Cabeçalho Oficial do Dossiê */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-200 dark:border-slate-800 print:border-slate-300 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase text-maitre-gold mb-1">
              <Sparkles size={14} />
              <span>Dossiê Executivo de Apresentação</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <p className="text-xs text-slate-500 print:text-slate-600 mt-0.5">
              Candidato ID: <span className="font-mono font-semibold">{candidate.id.substring(0, 10)}</span> • Gerado em {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="text-right">
            <span className="text-lg font-black text-slate-900 dark:text-white print:text-black">
              Maître<span className="text-maitre-gold font-extrabold">Conecta</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">
              Executive Search & Consulting
            </span>
          </div>
        </div>

        {/* 1. Dados de Contato e Localização */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-100 border border-slate-100 dark:border-slate-800 print:border-slate-300 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 print:text-slate-800">
            <Mail size={14} className="text-maitre-gold shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 print:text-slate-800">
            <Phone size={14} className="text-maitre-gold shrink-0" />
            <span>{candidate.phone || "Telefone não informado"}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 print:text-slate-800">
            <MapPin size={14} className="text-maitre-gold shrink-0" />
            <span>{primaryApplication?.job?.location || "Localização Flexível / Brasil"}</span>
          </div>
        </div>

        {/* 2. Processo Seletivo Vinculado & Fit Geral */}
        {primaryApplication && (
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white print:text-black flex items-center gap-2">
              <Briefcase size={16} className="text-maitre-gold" />
              <span>Oportunidade & Empresa Contratante</span>
            </h2>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1d1e20] text-white print:bg-slate-900 print:text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-maitre-gold flex items-center gap-1">
                  <Building2 size={12} />
                  {primaryApplication.job.organization?.name || "Empresa Cliente"}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {primaryApplication.job.title}
                </h3>
                <span className="text-xs text-slate-400 mt-1 block">
                  Etapa Atual: <strong className="text-emerald-400 font-bold">{primaryApplication.stage?.name}</strong>
                </span>
              </div>

              {primaryApplication.fitCategory && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Avaliação Fit 3D
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mt-1">
                    {primaryApplication.fitCategory.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Avaliação Consolidada dos Scorecards (Se houver) */}
        {allScorecards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white print:text-black flex items-center gap-2">
              <Star size={16} className="text-maitre-gold" />
              <span>Métricas de Avaliação dos Entrevistadores</span>
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-100 border border-slate-100 dark:border-slate-800 print:border-slate-300 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 print:text-slate-600 block">
                  Domínio Técnico
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white print:text-black mt-1 block">
                  {avgTechScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-100 border border-slate-100 dark:border-slate-800 print:border-slate-300 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 print:text-slate-600 block">
                  Fit Cultural
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white print:text-black mt-1 block">
                  {avgCultureScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-100 border border-slate-100 dark:border-slate-800 print:border-slate-300 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 print:text-slate-600 block">
                  Comunicação
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white print:text-black mt-1 block">
                  {avgCommScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </span>
              </div>
            </div>

            {/* Pareceres dos Entrevistadores */}
            <div className="space-y-3 pt-2">
              {allScorecards.map((sc, idx) => (
                <div
                  key={sc.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 print:bg-slate-100 border border-slate-100 dark:border-slate-800 print:border-slate-300 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-900 dark:text-white print:text-black">
                      Avaliador: {sc.evaluator?.name || sc.evaluator?.email || "Consultor Maître"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30">
                      {sc.overallRecommendation}
                    </span>
                  </div>
                  {sc.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-800 italic leading-relaxed">
                      &quot;{sc.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Resumo Profissional & Competências */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white print:text-black flex items-center gap-2">
            <Award size={16} className="text-maitre-gold" />
            <span>Resumo Executivo & Hard Skills</span>
          </h2>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-100 border border-slate-100 dark:border-slate-800 print:border-slate-300 space-y-3">
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 print:text-slate-900 whitespace-pre-line">
              {candidate.profileSummary || "Resumo de perfil gerado pela triagem da consultoria."}
            </p>

            {tagsList.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {tagsList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 print:bg-white text-slate-800 dark:text-slate-200 print:text-black border border-slate-200 dark:border-slate-800 print:border-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Rodapé de Homologação da Consultoria */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 flex justify-between items-end text-xs text-slate-400 print:text-slate-500">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 print:text-slate-800 block">
              Maître Consultoria em Recursos Humanos
            </span>
            <span>Relatório confidencial para uso exclusivo da empresa cliente.</span>
          </div>

          <div className="text-right">
            <span className="font-mono text-[10px]">Autenticação Digital: MT-ATS-SEC-{candidate.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
