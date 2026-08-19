/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao criar conta");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Criar Conta</h1>
          <p className="text-sm font-semibold text-maitre-gold mb-2 uppercase tracking-widest">TalentFlow by Maître</p>
          <p className="text-slate-500 dark:text-slate-400">Junte-se à nossa plataforma.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João da Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Conta</label>
            <select
              className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="CANDIDATE">Candidato</option>
              <option value="RECRUITER">Recrutador</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1d1e20] hover:bg-[#37585d] text-white p-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            Cadastrar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Já possui uma conta?{" "}
          <Link href="/login" className="text-maitre-gold hover:underline font-semibold">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
