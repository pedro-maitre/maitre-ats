import { createJob } from "../actions";
import { Briefcase, Building2, MapPin, AlignLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/jobs" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Criar Nova Vaga</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Preencha os detalhes para publicar uma nova oportunidade.</p>
        </div>
      </div>

      <form action={createJob} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Briefcase size={16} className="text-[#c89650]" />
              Título da Vaga *
            </label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required
              placeholder="ex: Engenheiro de Software Pleno" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-[#c89650] focus:ring-1 focus:ring-[#c89650] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 size={16} className="text-blue-500" />
                Departamento
              </label>
              <input 
                type="text" 
                id="department" 
                name="department" 
                placeholder="ex: Tecnologia" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-500" />
                Localização
              </label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                placeholder="ex: Remoto, São Paulo" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="salaryMin" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                Salário Mínimo (R$)
              </label>
              <input 
                type="number" 
                id="salaryMin" 
                name="salaryMin" 
                placeholder="ex: 5000" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-[#c89650] focus:ring-1 focus:ring-[#c89650] outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="salaryMax" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                Salário Máximo (R$)
              </label>
              <input 
                type="number" 
                id="salaryMax" 
                name="salaryMax" 
                placeholder="ex: 8000" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-[#c89650] focus:ring-1 focus:ring-[#c89650] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlignLeft size={16} className="text-purple-500" />
              Descrição da Vaga *
            </label>
            <textarea 
              id="description" 
              name="description" 
              required
              rows={8}
              placeholder="Descreva as responsabilidades, requisitos e benefícios da vaga..." 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-y"
            ></textarea>
          </div>
          
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
          <Link href="/jobs" className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="bg-[#c89650] hover:bg-[#b08040] text-white px-8 py-2.5 rounded-lg font-semibold shadow-md transition-all active:scale-95">
            Publicar Vaga
          </button>
        </div>
      </form>
    </div>
  );
}
