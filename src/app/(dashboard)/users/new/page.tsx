import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Mail, Lock, Shield, User, Briefcase, Building2, Phone, FileText } from "lucide-react";
import { LinkedinIcon } from "@/components/ui/BrandIcons";
import { createUser } from "@/app/actions/user";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  const userRole = session?.user?.role;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/jobs");
  }

  async function handleCreateUser(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "CANDIDATE" | "HIRING_MANAGER";
    const jobTitle = formData.get("jobTitle") as string;
    const department = formData.get("department") as string;
    const phone = formData.get("phone") as string;
    const linkedinUrl = formData.get("linkedinUrl") as string;
    const bio = formData.get("bio") as string;

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

    if (res.success) {
      redirect("/users");
    } else {
      throw new Error(res.error || "Erro ao criar colaborador.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/users"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Cadastrar Novo Colaborador
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Cadastre recrutadores, analistas e administradores da equipe Maître.
          </p>
        </div>
      </div>

      <form
        action={handleCreateUser}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nome Completo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="name"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <User size={14} className="text-maitre-gold" />
                Nome Completo do Colaborador *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="ex: Erika Oliveira"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Cargo / Função */}
            <div className="space-y-1.5">
              <label
                htmlFor="jobTitle"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Briefcase size={14} className="text-maitre-gold" />
                Cargo / Função *
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                required
                placeholder="ex: Recrutadora Sênior"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <label
                htmlFor="department"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Building2 size={14} className="text-maitre-gold" />
                Departamento / Área
              </label>
              <select
                id="department"
                name="department"
                defaultValue="Recursos Humanos / R&S"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-semibold cursor-pointer"
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
              <label
                htmlFor="phone"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Phone size={14} className="text-maitre-gold" />
                WhatsApp / Telefone Profissional
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                placeholder="(11) 98765-4321"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label
                htmlFor="linkedinUrl"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <LinkedinIcon size={14} className="text-blue-500" />
                LinkedIn do Colaborador
              </label>
              <input
                type="url"
                id="linkedinUrl"
                name="linkedinUrl"
                placeholder="https://linkedin.com/in/usuario"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Mail size={14} className="text-maitre-gold" />
                E-mail Corporativo de Acesso *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="nome@maitrework.com.br"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Lock size={14} className="text-maitre-gold" />
                Senha Inicial de Acesso *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={6}
                placeholder="Mínimo 6 dígitos"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Nível de Acesso */}
            <div className="space-y-1.5">
              <label
                htmlFor="role"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Shield size={14} className="text-maitre-gold" />
                Nível de Permissão *
              </label>
              <select
                id="role"
                name="role"
                defaultValue="RECRUITER"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-semibold cursor-pointer"
              >
                <option value="RECRUITER">💼 Recrutador (Triagem, Kanban, Vagas e Candidatos)</option>
                <option value="ADMIN">🛡️ Administrador (Gestão da equipe e dados)</option>
                <option value="SUPER_ADMIN">👑 Admin Master (Acesso total)</option>
                <option value="HIRING_MANAGER">🎯 Gestor de Vaga</option>
              </select>
            </div>

            {/* Minibio */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="bio"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <FileText size={14} className="text-slate-400" />
                Minibio / Resumo do Colaborador
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="Breve resumo da atuação do colaborador..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href="/users"
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton
            label="Cadastrar Colaborador"
            loadingLabel="Cadastrando..."
            className="bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          />
        </div>
      </form>
    </div>
  );
}
