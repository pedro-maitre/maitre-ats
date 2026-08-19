import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, FileText, Globe, 
  Briefcase, MapPin, Calendar, Clock, Star, Edit
} from "lucide-react";
import Link from "next/link";
import AssignJobModal from "@/components/candidates/AssignJobModal";

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [candidate, activeJobs] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            job: true,
            stage: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    }),
    prisma.job.findMany({
      where: { status: "OPEN" },
      select: { id: true, title: true, department: true }
    })
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
      tags = candidate.tags.split(",").map(t => t.trim());
    }
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
      
      {/* Header and Back button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/candidates" 
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {candidate.firstName} {candidate.lastName}
            <span className="text-sm px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium border border-blue-100 dark:border-blue-800/50">
              {candidate.source || "Banco de Talentos"}
            </span>
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Cadastrado em {new Date(candidate.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      
      <div className="flex justify-end -mt-16 relative z-10">
        <Link href={`/candidates/${candidate.id}/edit`} className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium shadow-sm border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2">
          <Edit size={16} />
          Editar Perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Left Column: Contact & Basic Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contato</h2>
            <div className="space-y-4">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-[#c89650] dark:hover:text-[#c89650] transition-colors group">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-[#c89650]/10">
                  <Mail size={18} className="group-hover:text-[#c89650]" />
                </div>
                <span className="truncate">{candidate.email}</span>
              </a>
              
              {candidate.phone && (
                <a href={`https://wa.me/${candidate.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-[#c89650] dark:hover:text-[#c89650] transition-colors group">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-[#c89650]/10">
                    <Phone size={18} className="group-hover:text-[#c89650]" />
                  </div>
                  <span>{candidate.phone}</span>
                </a>
              )}

              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-[#c89650] dark:hover:text-[#c89650] transition-colors group">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-[#c89650]/10">
                    <Globe size={18} className="group-hover:text-[#c89650]" />
                  </div>
                  <span className="truncate">Perfil no LinkedIn</span>
                </a>
              )}

              {candidate.resumeUrl && (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-[#c89650] dark:hover:text-[#c89650] transition-colors group">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-[#c89650]/10">
                    <FileText size={18} className="group-hover:text-[#c89650]" />
                  </div>
                  <span>Ver Currículo</span>
                </a>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Competências</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Summary & Applications */}
        <div className="md:col-span-2 space-y-6">
          
          {candidate.profileSummary && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumo Profissional</h2>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {candidate.profileSummary}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={20} className="text-[#c89650]" />
                  Processos Seletivos
                </h2>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                  {candidate.applications.length}
                </span>
              </div>
              <AssignJobModal candidateId={candidate.id} activeJobs={activeJobs} />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {candidate.applications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Este candidato não está em nenhum processo seletivo no momento.
                </div>
              ) : (
                candidate.applications.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {app.job.title}
                      </h3>
                      <span className="px-3 py-1 bg-[#c89650]/10 text-[#c89650] rounded-lg text-sm font-semibold border border-[#c89650]/20">
                        {app.stage.name}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} />
                        {app.job.location || "Remoto"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={16} />
                        Inscrito em {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      {app.matchScore && (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500 font-medium">
                          <Star size={16} />
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
