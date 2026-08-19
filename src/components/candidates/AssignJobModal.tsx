"use client";

import { useState } from "react";
import { X, Briefcase, Plus } from "lucide-react";
import { assignCandidateToJob } from "@/app/(dashboard)/candidates/[id]/actions";
import { useRouter } from "next/navigation";

interface JobOption {
  id: string;
  title: string;
  department: string | null;
}

export default function AssignJobModal({ candidateId, activeJobs }: { candidateId: string, activeJobs: JobOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAssign = async () => {
    if (!selectedJob) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      await assignCandidateToJob(candidateId, selectedJob);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao alocar candidato");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-[#c89650] hover:text-[#b08040] flex items-center gap-1.5 transition-colors"
      >
        <Plus size={16} />
        Adicionar a Vaga
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={20} className="text-[#c89650]" />
                Alocar em Vaga
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecione a Vaga Ativa
                </label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                >
                  <option value="" disabled>Escolha uma vaga...</option>
                  {activeJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} {job.department ? `(${job.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAssign}
                disabled={!selectedJob || isSubmitting}
                className="px-6 py-2 bg-[#c89650] hover:bg-[#b08040] disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition-all"
              >
                {isSubmitting ? "Alocando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
