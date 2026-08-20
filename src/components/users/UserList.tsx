"use client";

import { useState } from "react";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import EditUserModal from "./EditUserModal";
import { deleteUser } from "@/app/actions/delete-actions";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization?: { name: string } | null;
  createdAt: Date;
};

export default function UserList({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o usuário ${userName || "selecionado"}?`);
    if (!confirm) return;

    setDeletingId(userId);
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(res.error || "Erro ao excluir usuário.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-4 pl-6">Nome</th>
                <th className="p-4">Email</th>
                <th className="p-4">Nível de Acesso</th>
                <th className="p-4">Organização</th>
                <th className="p-4">Data de Cadastro</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {user.name || "Sem Nome"}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                    {user.email}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                          : user.role === "RECRUITER"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {user.role === "SUPER_ADMIN"
                        ? "Admin Master"
                        : user.role === "RECRUITER"
                        ? "Recrutador"
                        : user.role === "CANDIDATE"
                        ? "Candidato"
                        : user.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                    {user.organization?.name || "Nenhuma"}
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Intl.DateTimeFormat("pt-BR").format(new Date(user.createdAt))}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar Nível"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Usuário"
                      >
                        {deletingId === user.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
}
