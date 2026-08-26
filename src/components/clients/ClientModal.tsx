"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, Globe, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient, updateClient } from "@/app/(dashboard)/clients/actions";
import { useTenant } from "@/lib/tenant-context";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  onSuccess?: () => void;
}

export default function ClientModal({
  isOpen,
  onClose,
  clientToEdit,
  onSuccess,
}: ClientModalProps) {
  const { refreshOrganizations } = useTenant();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setSlug(clientToEdit.slug);
      setAutoSlug(false);
    } else {
      setName("");
      setSlug("");
      setAutoSlug(true);
    }
    setError("");
    setSuccess("");
  }, [clientToEdit, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (autoSlug && !clientToEdit) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);

    try {
      if (clientToEdit) {
        const res = await updateClient(clientToEdit.id, formData);
        if (!res.success) throw new Error(res.error);
        setSuccess("Empresa cliente atualizada com sucesso!");
      } else {
        const res = await createClient(formData);
        if (!res.success) throw new Error(res.error);
        setSuccess("Nova empresa cliente cadastrada com sucesso!");
      }

      await refreshOrganizations();
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar empresa cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {clientToEdit ? "Editar Empresa Cliente" : "Nova Empresa Cliente"}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gestão Multitenant B2B para Hunting & R&S
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nome da Empresa / Razão Social *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Grupo Hospitalar Alfa, FinTech Beta"
              value={name}
              onChange={handleNameChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-maitre-gold transition-colors font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Slug do Portal de Carreiras *
              </label>
              {!clientToEdit && (
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[11px] text-maitre-gold font-bold hover:underline"
                >
                  {autoSlug ? "Personalizar slug" : "Gerar automático"}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                /carreiras/
              </span>
              <input
                type="text"
                required
                disabled={autoSlug && !clientToEdit}
                placeholder="nome-empresa"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full pl-24 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-maitre-gold transition-colors font-mono disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              URL exclusiva onde os candidatos visualizarão e se candidatarão às vagas desta empresa.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <Globe size={18} className="text-maitre-gold shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ao cadastrar uma nova empresa, ela será automaticamente disponibilizada no <strong>Seletor Multicliente</strong> da Topbar e terá seu portal público de vagas ativo.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{clientToEdit ? "Salvar Alterações" : "Cadastrar Empresa"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
