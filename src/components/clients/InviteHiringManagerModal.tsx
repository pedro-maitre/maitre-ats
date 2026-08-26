"use client";

import React, { useState } from "react";
import { X, UserCheck, Mail, Lock, Building2, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { inviteHiringManager } from "@/app/(dashboard)/portal-gestor/actions";

interface InviteHiringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Array<{ id: string; name: string }>;
  defaultOrganizationId?: string;
  onSuccess?: () => void;
}

export default function InviteHiringManagerModal({
  isOpen,
  onClose,
  organizations,
  defaultOrganizationId,
  onSuccess,
}: InviteHiringManagerModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId || (organizations[0]?.id || ""));
  const [password, setPassword] = useState("Maitre@2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("organizationId", organizationId);
    formData.append("password", password);

    try {
      const res = await inviteHiringManager(formData);
      if (!res.success) throw new Error(res.error);

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao convidar gestor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Acesso ao Portal do Gestor - Maître Conecta\n\nLink: https://maitreconecta.vercel.app/login\nE-mail: ${email}\nSenha Provisória: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Convidar Gestor do Cliente
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Acesso Restrito Hiring Manager (B2B)
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

        {/* Content */}
        {success ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">
                Gestor Cadastrado com Sucesso!
              </h3>
              <p className="text-xs text-slate-400">
                O gestor foi associado à empresa cliente e já pode acessar o **Portal do Gestor** com as credenciais abaixo:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">E-mail:</span>
                <span className="text-white font-bold">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Senha:</span>
                <span className="text-maitre-gold font-bold">{password}</span>
              </div>
            </div>

            <button
              onClick={handleCopyCredentials}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Copy size={14} />
              <span>{copied ? "Credenciais Copiadas!" : "Copiar Dados de Acesso"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Empresa Cliente *
              </label>
              <select
                required
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-maitre-gold"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nome do Gestor / Diretor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Mendes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-maitre-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                required
                placeholder="gestor@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-maitre-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Senha Provisória
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-maitre-gold"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>Criar Acesso do Gestor</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
