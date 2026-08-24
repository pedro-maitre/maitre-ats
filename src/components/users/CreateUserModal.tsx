"use client";

import { useState } from "react";
import { X, UserPlus, Shield, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Mail, Lock, User } from "lucide-react";
import { createUser } from "@/app/actions/user";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization?: { name: string } | null;
  createdAt: Date;
};

export default function CreateUserModal({
  onClose,
  onUserCreated,
}: {
  onClose: () => void;
  onUserCreated: (newUser: UserData) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "CANDIDATE">("RECRUITER");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await createUser({
        name,
        email,
        password,
        role,
      });

      if (res.success && res.user) {
        setSuccess(true);
        onUserCreated(res.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Erro ao criar o usuário.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30 flex items-center justify-center shrink-0">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Criar Novo Usuário
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastre um membro da equipe com credenciais de acesso ao Maître ATS.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>Usuário criado com sucesso!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User size={13} className="text-maitre-gold" />
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Carlos Alberto Silva"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail size={13} className="text-maitre-gold" />
              E-mail de Acesso *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos.silva@empresa.com"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock size={13} className="text-maitre-gold" />
              Senha Inicial de Acesso *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nível de Acesso (Role) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Shield size={13} className="text-maitre-gold" />
              Nível de Acesso (Perfil) *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-maitre-gold transition-all cursor-pointer"
            >
              <option value="RECRUITER">💼 Recrutador (Triagem, Kanban, Vagas e Candidatos)</option>
              <option value="SUPER_ADMIN">👑 Admin Master (Acesso irrestrito a configurações e exclusões)</option>
              <option value="CANDIDATE">👤 Candidato (Portal do Candidato)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 font-black text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? "Cadastrando..." : "Cadastrar Usuário"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
