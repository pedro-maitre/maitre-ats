import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";

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

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Nome</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Email</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Nível de Acesso</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Organização</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-white">{user.name || "Sem Nome"}</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      user.role === "SUPER_ADMIN" 
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                        : user.role === "RECRUITER"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {user.organization?.name || "Nenhuma"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                    {new Intl.DateTimeFormat('pt-BR').format(new Date(user.createdAt))}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
