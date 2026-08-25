import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewCandidateForm } from "./NewCandidateForm";

export default function NewCandidatePage() {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/candidates`}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Cadastrar Candidato
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Importe o currículo em PDF para preenchimento automático ou preencha manualmente.
          </p>
        </div>
      </div>

      <NewCandidateForm />
    </div>
  );
}
