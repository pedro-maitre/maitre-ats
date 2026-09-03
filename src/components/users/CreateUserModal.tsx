"use client";

import { useState } from "react";
import {
  X,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
  User,
  Briefcase,
  Building2,
  Phone,
  FileText,
} from "lucide-react";
import { LinkedinIcon } from "@/components/ui/BrandIcons";
import { createUser } from "@/app/actions/user";

export type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  jobTitle?: string | null;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  joinedAt?: Date | string | null;
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
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "CANDIDATE" | "HIRING_MANAGER">("RECRUITER");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("Recursos Humanos / R&S");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
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
        jobTitle,
        department,
        phone,
        linkedinUrl,
        bio,
        status: "ACTIVE",
      });

      if (res.success && res.user) {
        setSuccess(true);
        onUserCreated(res.user as UserData);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Erro ao criar o colaborador.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 my-8">
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
              Cadastrar Colaborador Maître
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastre recrutadores, gestores e administradores com perfil profissional e acesso ao sistema.
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
            <span>Colaborador cadastrado com sucesso!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User size={13} className="text-maitre-gold" />
                Nome Completo do Colaborador *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Erika Oliveira"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>

            {/* Cargo / Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase size={13} className="text-maitre-gold" />
                Cargo / Função *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="ex: Recrutadora Sênior / Headhunter"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={13} className="text-maitre-gold" />
                Departamento / Área
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-maitre-gold transition-all cursor-pointer"
              >
                <option value="Recursos Humanos / R&S">Recursos Humanos / R&S</option>
                <option value="Executive Search">Executive Search</option>
                <option value="Tech Recruiting">Tech Recruiting</option>
                <option value="Diretoria & Sócios">Diretoria & Sócios</option>
                <option value="Operações & Consultoria">Operações & Consultoria</option>
                <option value="Tecnologia & Inovação">Tecnologia & Inovação</option>
              </select>
            </div>

            {/* WhatsApp / Telefone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone size={13} className="text-maitre-gold" />
                WhatsApp / Telefone Profissional
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkedinIcon size={13} className="text-blue-500" />
                LinkedIn do Colaborador
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/usuario"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>

            {/* Email de Acesso */}
            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail size={13} className="text-maitre-gold" />
                E-mail Corporativo de Acesso *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@maitrework.com.br"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock size={13} className="text-maitre-gold" />
                Senha de Acesso *
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
                Nível de Permissão no Sistema *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-maitre-gold transition-all cursor-pointer"
              >
                <option value="RECRUITER">💼 Recrutador (Triagem, Kanban, Vagas e Candidatos)</option>
                <option value="ADMIN">🛡️ Administrador (Gestão da equipe, dados e vagas)</option>
                <option value="SUPER_ADMIN">👑 Admin Master (Acesso total)</option>
                <option value="HIRING_MANAGER">🎯 Gestor de Vaga (Apenas suas vagas)</option>
              </select>
            </div>

            {/* Minibio */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                Minibio / Resumo Profissional
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Breve resumo da trajetória do colaborador na Maître..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
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
              disabled={loading || success}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 font-black text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? "Cadastrando..." : "Cadastrar Colaborador"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
