import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Mail, Lock, Shield, User } from "lucide-react";
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
    const role = formData.get("role") as "SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "CANDIDATE";

    const res = await createUser({
      name,
      email,
      password,
      role,
    });

    if (res.success) {
      redirect("/users");
    } else {
      throw new Error(res.error || "Erro ao criar usuário.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/users"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Criar Novo Usuário
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Cadastre um novo membro da equipe com credenciais de acesso ao Maître Conecta.
          </p>
        </div>
      </div>

      <form
        action={handleCreateUser}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 sm:p-10 space-y-6">
          {/* Nome */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <User size={14} className="text-maitre-gold" />
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="ex: Carlos Alberto Silva"
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <Mail size={14} className="text-maitre-gold" />
              E-mail de Acesso *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="carlos.silva@empresa.com"
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
              Senha Inicial de Acesso (Mínimo 6 dígitos) *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Cargo / Perfil */}
          <div className="space-y-1.5">
            <label
              htmlFor="role"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <Shield size={14} className="text-maitre-gold" />
              Nível de Acesso (Perfil) *
            </label>
            <select
              id="role"
              name="role"
              defaultValue="RECRUITER"
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium cursor-pointer"
            >
              <option value="RECRUITER">💼 Recrutador (Triagem, Kanban, Vagas e Candidatos)</option>
              <option value="SUPER_ADMIN">👑 Admin Master (Acesso irrestrito)</option>
              <option value="CANDIDATE">👤 Candidato (Portal do Candidato)</option>
            </select>
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
            label="Cadastrar Usuário"
            loadingLabel="Cadastrando..."
            className="bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          />
        </div>
      </form>
    </div>
  );
}
