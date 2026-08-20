import { prisma } from "@/lib/prisma";
import { updateJob } from "./actions";
import { Briefcase, Building2, MapPin, AlignLeft, ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    redirect("/jobs");
  }

  const updateJobWithId = updateJob.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/jobs/${id}/board`}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Editar Vaga
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Atualize os detalhes, requisitos e faixa orçamentária da vaga.
          </p>
        </div>
      </div>

      <form
        action={updateJobWithId}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 sm:p-10 space-y-6">
          <div className="space-y-1.5">
            <label
              htmlFor="title"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <Briefcase size={14} className="text-maitre-gold" />
              Título da Vaga *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={job.title}
              placeholder="ex: Engenheiro de Software Sênior"
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label
                htmlFor="department"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Building2 size={14} className="text-maitre-gold" />
                Departamento
              </label>
              <input
                type="text"
                id="department"
                name="department"
                defaultValue={job.department || ""}
                placeholder="ex: Engenharia & Tecnologia"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="location"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <MapPin size={14} className="text-maitre-gold" />
                Localização
              </label>
              <input
                type="text"
                id="location"
                name="location"
                defaultValue={job.location || ""}
                placeholder="ex: Remoto, São Paulo - SP"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label
                htmlFor="salaryMin"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <DollarSign size={14} className="text-emerald-500" />
                Salário Mínimo (R$)
              </label>
              <input
                type="number"
                id="salaryMin"
                name="salaryMin"
                defaultValue={job.salaryMin || ""}
                placeholder="ex: 8000"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="salaryMax"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <DollarSign size={14} className="text-emerald-500" />
                Salário Máximo / Teto (R$)
              </label>
              <input
                type="number"
                id="salaryMax"
                name="salaryMax"
                defaultValue={job.salaryMax || ""}
                placeholder="ex: 12000"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <AlignLeft size={14} className="text-maitre-gold" />
              Descrição e Requisitos da Vaga *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              defaultValue={job.description}
              placeholder="Descreva as responsabilidades, principais requisitos e diferenciais da posição..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium resize-y"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href={`/jobs/${id}/board`}
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton
            label="Salvar Alterações"
            loadingLabel="Salvando..."
            className="bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          />
        </div>
      </form>
    </div>
  );
}
