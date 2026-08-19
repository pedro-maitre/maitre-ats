import { prisma } from "@/lib/prisma";
import { updateCandidate } from "./actions";
import { User, Mail, Phone, Globe, Tag, AlignLeft, ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const candidate = await prisma.candidate.findUnique({
    where: { id }
  });

  if (!candidate) {
    redirect("/candidates");
  }

  // Parse tags
  let tagsString = "";
  if (candidate.tags) {
    try {
      tagsString = JSON.parse(candidate.tags).join(", ");
    } catch {
      tagsString = candidate.tags; // fallback if plain string
    }
  }

  const updateCandidateWithId = updateCandidate.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/candidates/${id}`} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar Candidato</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Atualize as informações do talento.</p>
        </div>
      </div>

      <form action={updateCandidateWithId} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User size={16} className="text-blue-500" />
                Nome *
              </label>
              <input 
                type="text" 
                id="firstName" 
                name="firstName" 
                required
                defaultValue={candidate.firstName}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Sobrenome *
              </label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName" 
                required
                defaultValue={candidate.lastName}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail size={16} className="text-emerald-500" />
                E-mail *
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required
                defaultValue={candidate.email}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone size={16} className="text-maitre-gold" />
                Telefone
              </label>
              <input 
                type="text" 
                id="phone" 
                name="phone"
                defaultValue={candidate.phone || ""} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="linkedinUrl" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Globe size={16} className="text-blue-600" />
                LinkedIn URL
              </label>
              <input 
                type="url" 
                id="linkedinUrl" 
                name="linkedinUrl" 
                defaultValue={candidate.linkedinUrl || ""}
                placeholder="https://linkedin.com/in/..." 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target size={16} className="text-purple-500" />
                Origem (Source)
              </label>
              <input 
                type="text" 
                id="source" 
                name="source" 
                defaultValue={candidate.source || ""}
                placeholder="ex: LinkedIn, Indicação..." 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Tag size={16} className="text-red-500" />
              Tags / Competências (separadas por vírgula)
            </label>
            <input 
              type="text" 
              id="tags" 
              name="tags" 
              defaultValue={tagsString}
              placeholder="React, TypeScript, Figma..." 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profileSummary" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlignLeft size={16} className="text-slate-500" />
              Resumo Profissional
            </label>
            <textarea 
              id="profileSummary" 
              name="profileSummary" 
              defaultValue={candidate.profileSummary || ""}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition-all resize-y"
            ></textarea>
          </div>
          
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
          <Link href={`/candidates/${id}`} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            Cancelar
          </Link>
          <SubmitButton text="Salvar Alterações" loadingText="Salvando..." />
        </div>
      </form>
    </div>
  );
}
