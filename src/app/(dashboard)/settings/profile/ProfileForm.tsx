"use client";

import React, { useState } from "react";
import { updateProfile } from "../actions";
import { Loader2, Save, CheckCircle, User, Mail, Shield } from "lucide-react";

export default function ProfileForm({
  initialData,
}: {
  initialData: { name: string; email: string; role: string; id: string };
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar o perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleBadge =
    initialData.role === "SUPER_ADMIN"
      ? "Admin Master"
      : initialData.role === "RECRUITER"
      ? "Recrutador Maître"
      : "Candidato";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-5 p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-maitre-gold to-[#fff2d1] text-slate-950 flex items-center justify-center text-xl font-black shadow-md shrink-0">
          {getInitials(formData.name || initialData.email)}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {formData.name || "Seu Perfil"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Gerencie suas informações de acesso e identificação.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 bg-maitre-gold/15 text-maitre-gold text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-maitre-gold/30">
            <Shield size={12} /> {roleBadge}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle size={16} /> Perfil atualizado com sucesso!
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User size={14} className="text-maitre-gold" />
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Mail size={14} className="text-maitre-gold" />
              Endereço de E-mail
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={
              isLoading ||
              (formData.name === initialData.name && formData.email === initialData.email)
            }
            className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
