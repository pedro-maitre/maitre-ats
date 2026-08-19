import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";
import UserList from "@/components/users/UserList";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Proteção da Rota
  if (session?.user?.role !== "SUPER_ADMIN") {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="text-[#c89650]" />
            Gestão de Usuários
          </h1>
          <p className="text-slate-500 mt-1">
            Visualização de todos os usuários do sistema. Acesso restrito a Administradores.
          </p>
        </div>
      </div>

      <UserList initialUsers={users} />
    </div>
  );
}
