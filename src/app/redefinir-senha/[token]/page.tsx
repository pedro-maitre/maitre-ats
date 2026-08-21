/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { validateResetToken, resetPassword } from "@/app/actions/password-actions";

export default function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    email?: string;
    role?: string;
  } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectRole, setRedirectRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function checkToken() {
      setValidating(true);
      try {
        const res = await validateResetToken(token);
        if (res.valid) {
          setUserInfo({
            name: res.name,
            email: res.email,
            role: res.role,
          });
        } else {
          setTokenError(res.error || "Este link de recuperação é inválido ou já expirou.");
        }
      } catch (err: any) {
        setTokenError("Erro ao validar link de recuperação.");
      } finally {
        setValidating(false);
      }
    }

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (newPassword.length < 6) {
      setFormError("A nova senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("As senhas digitadas não coincidem. Verifique e tente novamente.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, newPassword);
      if (res.success) {
        setSuccessMessage(res.message);
        setRedirectRole(res.role || userInfo?.role);
      } else {
        setFormError(res.message || "Não foi possível redefinir sua senha.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Erro inesperado ao salvar nova senha.");
    } finally {
      setLoading(false);
    }
  };

  const loginUrl =
    redirectRole === "CANDIDATE" || userInfo?.role === "CANDIDATE"
      ? "/carreiras/maitre/candidato/login"
      : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans selection:bg-maitre-gold selection:text-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Maître<span className="text-maitre-gold">ATS</span>
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-[11px] font-bold uppercase tracking-wider border border-maitre-gold/30">
            <ShieldCheck size={13} />
            Redefinição de Senha
          </div>
        </div>

        {validating ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="animate-spin text-maitre-gold mx-auto" size={32} />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Validando autenticidade do link de recuperação...
            </p>
          </div>
        ) : tokenError ? (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                Link Não Disponível
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {tokenError}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/recuperar-senha"
                className="w-full bg-[#1d1e20] text-white hover:bg-maitre-gold hover:text-slate-950 p-3.5 rounded-xl font-bold text-xs transition-all text-center shadow-sm"
              >
                Solicitar Novo Link de Recuperação
              </Link>
              <Link
                href="/login"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-3.5 rounded-xl font-bold text-xs transition-all text-center"
              >
                Ir para a Página de Login
              </Link>
            </div>
          </div>
        ) : successMessage ? (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Senha Atualizada com Sucesso!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                {successMessage}
              </p>
            </div>

            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 p-3.5 rounded-xl font-black text-sm transition-all shadow-md active:scale-98"
            >
              <span>Acessar Minha Conta</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center pb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Criando nova senha para:
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {userInfo?.name} ({userInfo?.email})
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium pl-10 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite novamente a nova senha"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Salvando nova senha..." : "Salvar Nova Senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
