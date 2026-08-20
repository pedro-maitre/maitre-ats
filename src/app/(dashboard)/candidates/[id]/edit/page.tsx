import { prisma } from "@/lib/prisma";
import { updateCandidate } from "./actions";
import { User, Mail, Phone, Globe, Tag, AlignLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
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
      tagsString = candidate.tags;
    }
  }

  const updateCandidateWithId = updateCandidate.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/candidates/${id}`}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Editar Candidato
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Atualize as informações cadastrais e competências do talento.
          </p>
        </div>
      </div>

      <form
        action={updateCandidateWithId}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label
                htmlFor="firstName"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <User size={14} className="text-maitre-gold" />
                Nome *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                defaultValue={candidate.firstName}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="lastName"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Sobrenome *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                defaultValue={candidate.lastName}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Mail size={14} className="text-maitre-gold" />
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                defaultValue={candidate.email}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Phone size={14} className="text-emerald-500" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                defaultValue={candidate.phone || ""}
                placeholder="(11) 99999-9999"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label
                htmlFor="linkedinUrl"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Globe size={14} className="text-blue-500" />
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedinUrl"
                name="linkedinUrl"
                defaultValue={candidate.linkedinUrl || ""}
                placeholder="https://linkedin.com/in/..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tags"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Tag size={14} className="text-maitre-gold" />
                Tags e Competências
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                defaultValue={tagsString}
                placeholder="React, Node.js, Vendas, etc."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profileSummary"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <AlignLeft size={14} className="text-maitre-gold" />
              Resumo Profissional
            </label>
            <textarea
              id="profileSummary"
              name="profileSummary"
              rows={4}
              defaultValue={candidate.profileSummary || ""}
              placeholder="Resumo das principais realizações e trajetória..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium resize-y"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href={`/candidates/${id}`}
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
