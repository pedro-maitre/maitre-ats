/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";

export default function LoginPage() {
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
        // Fetch session to determine role
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        if (sessionData?.user?.role === "CANDIDATE") {
          // Redirect candidates to candidate portal
          router.push("/carreiras/maitre/candidato");
        } else {
          // Recruiters and Admins go directly to the Master Executive Dashboard
          router.push("/");
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao efetuar login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans selection:bg-maitre-gold selection:text-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Maître<span className="text-maitre-gold">Conecta</span>
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
            Acesso Restrito da Equipe
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Entre com suas credenciais de Administrador ou Recrutador Maître.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              E-mail Corporativo
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <Link
                href="/recuperar-senha"
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
            {loading ? "Autenticando..." : "Entrar no Painel"}
          </button>
        </form>

        {/* Candidate Portal Info Callout */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Você é um candidato acompanhando uma vaga?
          </p>
          <Link
            href="/carreiras/maitre/candidato/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-maitre-gold hover:underline"
          >
            <span>Acessar a Área do Candidato</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
