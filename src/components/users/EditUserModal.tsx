"use client";

import { useState, useEffect } from "react";
import { updateUser } from "@/app/actions/user";
import {
  X,
  Loader2,
  Save,
  User,
  Shield,
  Briefcase,
  Building2,
  Phone,
  FileText,
  Activity,
} from "lucide-react";
import { LinkedinIcon } from "@/components/ui/BrandIcons";
import { UserData } from "./CreateUserModal";

interface EditUserModalProps {
  user: UserData;
  onClose: () => void;
  onUserUpdated?: (updatedUser: UserData) => void;
}

export default function EditUserModal({ user, onClose, onUserUpdated }: EditUserModalProps) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role);
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [department, setDepartment] = useState(user.department || "Recursos Humanos / R&S");
  const [phone, setPhone] = useState(user.phone || "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || "");
  const [bio, setBio] = useState(user.bio || "");
  const [status, setStatus] = useState(user.status || "ACTIVE");

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
      const result = await updateUser(user.id, {
        name,
        role,
        jobTitle,
        department,
        phone,
        linkedinUrl,
        bio,
        status,
      });

      if (result.success && result.user) {
        if (onUserUpdated) {
          onUserUpdated(result.user as UserData);
        } else {
          onClose();
        }
      } else {
        setError(result.error || "Ocorreu um erro ao atualizar colaborador.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative space-y-6 p-6 sm:p-8 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Editar Perfil do Colaborador
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Altere dados cadastrais, cargo, departamento e acessos na Maître.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* E-mail (Somente Leitura) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                E-mail de Acesso (Identificador Único)
              </label>
              <input
                type="text"
                value={user.email}
                disabled
                className="w-full p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed outline-none"
              />
            </div>

            {/* Nome Completo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User size={13} className="text-maitre-gold" />
                Nome Completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Adriana"
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>

            {/* Cargo / Título */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase size={13} className="text-maitre-gold" />
                Cargo / Função *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Diretora de Operações"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={13} className="text-maitre-gold" />
                Departamento / Setor
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-semibold cursor-pointer"
              >
                <option value="Recursos Humanos / R&S">Recursos Humanos / R&S</option>
                <option value="Executive Search">Executive Search</option>
                <option value="Tech Recruiting">Tech Recruiting</option>
                <option value="Diretoria & Sócios">Diretoria & Sócios</option>
                <option value="Operações & Consultoria">Operações & Consultoria</option>
                <option value="Tecnologia & Inovação">Tecnologia & Inovação</option>
              </select>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone size={13} className="text-maitre-gold" />
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>

            {/* Status do Colaborador */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity size={13} className="text-emerald-500" />
                Situação da Conta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-semibold cursor-pointer"
              >
                <option value="ACTIVE">🟢 Ativo na Equipe</option>
                <option value="INACTIVE">🔴 Inativo / Desligado</option>
                <option value="SUSPENDED">🟡 Acesso Temporariamente Suspenso</option>
              </select>
            </div>

            {/* Nível de Acesso (Cargo/Permissão) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield size={13} className="text-maitre-gold" />
                Nível de Permissão no Sistema *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-semibold cursor-pointer"
              >
                <option value="RECRUITER">💼 Recrutador (Triagem, Kanban, Vagas e Candidatos)</option>
                <option value="ADMIN">🛡️ Administrador (Gestão da equipe e dados)</option>
                <option value="SUPER_ADMIN">👑 Admin Master (Acesso total)</option>
                <option value="HIRING_MANAGER">🎯 Gestor de Vaga</option>
                <option value="CANDIDATE">👤 Candidato</option>
              </select>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkedinIcon size={13} className="text-blue-500" />
                LinkedIn Profissional
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/usuario"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>

            {/* Minibio */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                Minibio / Resumo Profissional
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Breve resumo das atividades e perfil..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
