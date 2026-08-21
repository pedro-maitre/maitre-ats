/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2, KeyRound, ExternalLink, Sparkles } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/password-actions";

export default function CandidateRecuperarSenhaPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = use(params);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successResult, setSuccessResult] = useState<{
    message: string;
    resetLink?: string;
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
          resetLink: res.resetLink,
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
    <div className="max-w-md mx-auto animate-in fade-in duration-500 space-y-6 py-6 font-sans selection:bg-maitre-gold selection:text-slate-900">
      <Link
        href={`/carreiras/${companySlug}/candidato/login`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para o login do candidato
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
            <Sparkles size={14} /> Recuperação de Acesso
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Esqueceu sua Senha?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Informe o e-mail cadastrado em seu perfil de candidato para redefinir sua senha.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50 mb-6">
            {error}
          </div>
        )}

        {successResult ? (
          <div className="space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Instruções Geradas com Sucesso
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                {successResult.message}
              </p>

              {successResult.resetLink && (
                <div className="pt-2">
                  <Link
                    href={successResult.resetLink}
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#1d1e20] text-white hover:bg-maitre-gold hover:text-slate-950 p-3 rounded-xl font-bold text-xs transition-all shadow-sm"
                  >
                    <span>Redefinir Minha Senha Agora</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <Link
                href={`/carreiras/${companySlug}/candidato/login`}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-maitre-gold transition-colors"
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
                E-mail do Candidato
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
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
              {loading ? "Processando..." : "Gerar Link de Recuperação"}
            </button>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800">
              Lembrou sua senha?{" "}
              <Link
                href={`/carreiras/${companySlug}/candidato/login`}
                className="text-maitre-gold hover:underline font-bold"
              >
                Faça login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
