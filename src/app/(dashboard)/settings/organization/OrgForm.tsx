"use client";

import React, { useState } from "react";
import { updateOrganization } from "../actions";
import { Loader2, Save, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function OrgForm({ 
  initialData 
}: { 
  initialData: { name: string; slug: string; role: string; id: string } 
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
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle size={16} /> Dados da empresa atualizados com sucesso!
          </div>
        )}

        {!isAdmin && (
          <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm mb-6">
            Você não possui permissões de Administrador para editar estas informações.
          </div>
        )}

        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nome da Empresa</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Identificador (Slug)</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.slug}
              onChange={(e) => {
                // Remove non-alphanumeric chars and replace spaces with hyphens
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-');
                setFormData({ ...formData, slug: val });
              }}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-2">
              Sua página pública de carreiras será: 
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                maitre-ats.com/carreiras/{formData.slug || "..."}
              </span>
              <Link href={`/carreiras/${formData.slug}`} target="_blank" className="text-maitre-gold hover:underline flex items-center gap-1 font-semibold">
                 <ExternalLink size={12}/> Acessar
              </Link>
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || (formData.name === initialData.name && formData.slug === initialData.slug)}
              className="flex items-center gap-2 bg-maitre-gold hover:bg-maitre-gold-hover disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
