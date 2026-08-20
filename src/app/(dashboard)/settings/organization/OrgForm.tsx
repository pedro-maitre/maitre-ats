"use client";

import React, { useState } from "react";
import { updateOrganization } from "../actions";
import { Loader2, Save, CheckCircle, ExternalLink, Building, Globe } from "lucide-react";
import Link from "next/link";

export default function OrgForm({
  initialData,
}: {
  initialData: { name: string; slug: string; role: string; id: string };
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    slug: initialData.slug || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = initialData.role === "SUPER_ADMIN" || initialData.role === "ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateOrganization(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar a empresa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle size={16} /> Dados da empresa atualizados com sucesso!
          </div>
        )}

        {!isAdmin && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs font-semibold">
            Você não possui permissões de Administrador para editar estas informações.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Building size={14} className="text-maitre-gold" />
              Nome da Organização
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Globe size={14} className="text-maitre-gold" />
              Identificador da Página de Carreiras (Slug)
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.slug}
              onChange={(e) => {
                const val = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "")
                  .replace(/\s+/g, "-");
                setFormData({ ...formData, slug: val });
              }}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 mt-2 flex flex-wrap items-center justify-between gap-2">
              <span>
                Link oficial:{" "}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  /carreiras/{formData.slug || "..."}
                </strong>
              </span>
              <Link
                href={`/carreiras/${formData.slug}`}
                target="_blank"
                className="text-maitre-gold hover:underline flex items-center gap-1 font-bold"
              >
                <ExternalLink size={13} /> Visualizar Página Pública
              </Link>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={
                isLoading ||
                (formData.name === initialData.name && formData.slug === initialData.slug)
              }
              className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
