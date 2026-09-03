"use client";

import { useState, useEffect } from "react";
import { updateUser } from "@/app/actions/user";
import { X, Loader2, Save, User, Shield } from "lucide-react";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization?: { name: string } | null;
  createdAt: Date;
};

interface EditUserModalProps {
  user: UserData;
  onClose: () => void;
  onUserUpdated?: (updatedUser: UserData) => void;
}

export default function EditUserModal({ user, onClose, onUserUpdated }: EditUserModalProps) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateUser(user.id, { name, role });

      if (result.success && result.user) {
        if (onUserUpdated) {
          onUserUpdated(result.user);
        } else {
          onClose();
        }
      } else {
        setError(result.error || "Ocorreu um erro inesperado.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative space-y-6 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Editar Usuário
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Altere o nome e nível de acesso do membro da equipe.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/60">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              E-mail (Identificador Único)
            </label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-maitre-gold" />
              Nome Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João da Silva"
              required
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Shield size={13} className="text-maitre-gold" />
              Nível de Acesso (Cargo) *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-semibold cursor-pointer"
            >
              <option value="ADMIN">🛡️ Administrador (ADMIN)</option>
              <option value="RECRUITER">💼 Recrutador (RECRUITER)</option>
              <option value="SUPER_ADMIN">👑 Admin Master (SUPER_ADMIN)</option>
              <option value="CANDIDATE">👤 Candidato (CANDIDATE)</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex justify-end gap-3">
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
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 font-black text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>{loading ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
