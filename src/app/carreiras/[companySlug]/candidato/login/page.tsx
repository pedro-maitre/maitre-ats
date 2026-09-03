/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Lock, Mail, Sparkles } from "lucide-react";
import { use } from "react";

export default function CandidateLoginPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = use(params);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "E-mail ou senha incorretos.");
        setLoading(false);
      } else {
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (sessionData?.user?.role && sessionData.user.role !== "CANDIDATE") {
            window.location.href = "/";
            return;
          }
        } catch {
          // fallback
        }
        window.location.href = `/carreiras/${companySlug}/candidato`;
      }
    } catch (err: any) {
      setError(err.message || "Erro ao efetuar login.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in duration-500 space-y-6 py-6">
      <Link
        href={`/carreiras/${companySlug}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para o portal de vagas
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
            <Sparkles size={14} /> Área do Candidato
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Acompanhe suas Vagas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Entre com seu e-mail e senha para ver a evolução das suas candidaturas.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              E-mail
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <Link
                href={`/carreiras/${companySlug}/candidato/recuperar-senha`}
                className="text-xs font-semibold text-maitre-gold hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 p-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer mt-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Entrando..." : "Acessar Área do Candidato"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800">
          Ainda não tem conta?{" "}
          <Link
            href={`/carreiras/${companySlug}/candidato/cadastro`}
            className="text-maitre-gold hover:underline font-bold"
          >
            Cadastre-se gratuitamente
          </Link>
        </div>
      </div>
    </div>
  );
}
