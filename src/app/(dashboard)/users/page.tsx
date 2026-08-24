import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCog, Plus } from "lucide-react";
import UserList from "@/components/users/UserList";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Proteção da Rota: Apenas administradores
  const userRole = session?.user?.role;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/jobs");
  }

  // Buscar Usuários
  const users = await prisma.user.findMany({
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserCog className="text-maitre-gold" size={30} />
            Gestão de Membros & Usuários
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Criação, controle de acessos e exclusão de contas da equipe Maître.
          </p>
        </div>

        <Link
          href="/users/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-5 py-2.5 rounded-xl font-extrabold shadow-md hover:brightness-105 transition-all text-sm active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Criar Novo Usuário</span>
        </Link>
      </div>

      <UserList initialUsers={users} currentUserId={session?.user?.id} />
    </div>
  );
}
