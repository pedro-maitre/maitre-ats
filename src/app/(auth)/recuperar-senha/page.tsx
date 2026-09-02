/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2, KeyRound, ExternalLink } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/password-actions";

export default function RecuperarSenhaEquipePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successResult, setSuccessResult] = useState<{
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessResult(null);

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await requestPasswordReset(email, baseUrl);

      if (res.success) {
        setSuccessResult({
          message: res.message,
        });
      } else {
        setError(res.message || "Não foi possível processar a recuperação de senha.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao solicitar recuperação de senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans selection:bg-maitre-gold selection:text-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Maître<span className="text-maitre-gold">Conecta</span>
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-[11px] font-bold uppercase tracking-wider border border-maitre-gold/30">
            <KeyRound size={12} />
            Recuperação de Acesso
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Informe seu e-mail cadastrado para redefinir sua senha com segurança.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {successResult ? (
          <div className="space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                E-mail de Recuperação Enviado
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                {successResult.message}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Verifique sua caixa de entrada e pasta de spam. O link expira em 1 hora.
              </p>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#1d1e20] text-white hover:bg-maitre-gold hover:text-slate-950 p-3 rounded-xl font-bold text-xs transition-all shadow-sm"
              >
                <ArrowLeft size={14} />
                Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu.email@maitre.com.br"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 p-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer mt-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Gerando link seguro..." : "Enviar Link de Recuperação"}
            </button>

            <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={14} />
                Lembrou sua senha? Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
