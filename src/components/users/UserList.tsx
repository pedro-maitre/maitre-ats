"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import EditUserModal from "./EditUserModal";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization?: { name: string } | null;
  createdAt: Date;
};

export default function UserList({ initialUsers }: { initialUsers: UserData[] }) {
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  return (
    <>
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
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.map((user) => (
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
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {initialUsers.length === 0 && (
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
