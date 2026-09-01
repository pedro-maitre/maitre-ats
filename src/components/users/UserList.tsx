"use client";

import { useState } from "react";
import {
  Edit2,
  Trash2,
  Loader2,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  UserCheck,
  AlertTriangle,
  Users,
} from "lucide-react";
import EditUserModal from "./EditUserModal";
import CreateUserModal from "./CreateUserModal";
import { deleteUser } from "@/app/actions/delete-actions";

export type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization?: { name: string } | null;
  createdAt: Date;
};

export default function UserList({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserData[];
  currentUserId?: string;
}) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "ALL" ? true : user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleUserCreated = (newUser: UserData) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUserUpdated = (updatedUser: UserData) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);

    try {
      const res = await deleteUser(userToDelete.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
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
    <div className="space-y-6">
      {/* Top Filter & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all font-medium"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-maitre-gold outline-none cursor-pointer"
            >
              <option value="ALL">👥 Todos os Cargos ({users.length})</option>
              <option value="SUPER_ADMIN">👑 Admin Master</option>
              <option value="RECRUITER">💼 Recrutadores</option>
              <option value="CANDIDATE">👤 Candidatos</option>
            </select>
          </div>
        </div>

        {/* Create User Button */}
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-5 py-2.5 rounded-xl font-extrabold shadow-md hover:brightness-105 transition-all text-xs sm:text-sm cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus size={16} />
          <span>Criar Novo Usuário</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-4 pl-6">Nome / Usuário</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Nível de Acesso</th>
                <th className="p-4">Organização</th>
                <th className="p-4">Data de Cadastro</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => {
                const isSelf = currentUserId === user.id;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-maitre-gold/15 text-maitre-gold font-black text-xs flex items-center justify-center border border-maitre-gold/30 shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <span>{user.name || "Sem Nome"}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold px-1.5 py-0.5 rounded-md">
                                Você
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">ID: {user.id.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                          user.role === "SUPER_ADMIN"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : user.role === "RECRUITER"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {user.role === "SUPER_ADMIN" ? (
                          <>
                            <Shield size={12} className="text-purple-600 dark:text-purple-400" />
                            <span>Admin Master</span>
                          </>
                        ) : user.role === "RECRUITER" ? (
                          <>
                            <Briefcase size={12} className="text-blue-600 dark:text-blue-400" />
                            <span>Recrutador</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} className="text-slate-500" />
                            <span>Candidato</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
                      {user.organization?.name || "Maître Consultoria"}
                    </td>
                    <td className="p-4 text-slate-500 text-xs sm:text-sm">
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(user.createdAt))}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Editar Usuário"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          disabled={isSelf}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                          title={isSelf ? "Você não pode excluir sua própria conta" : "Excluir Usuário"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 space-y-2">
                    <Users size={32} className="mx-auto text-slate-400" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Nenhum usuário encontrado com os filtros atuais.
                    </p>
                    <p className="text-xs text-slate-400">
                      Tente buscar por outro termo ou limpar os filtros.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <CreateUserModal
          onClose={() => setIsCreateOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Confirmar Exclusão de Usuário?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Você está prestes a excluir o usuário{" "}
                <strong className="text-slate-900 dark:text-white font-bold">
                  "{userToDelete.name || userToDelete.email}"
                </strong>
                . Ele perderá imediatamente o acesso ao sistema.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={Boolean(deletingId)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {deletingId && <Loader2 size={14} className="animate-spin" />}
                <span>Sim, Excluir Usuário</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
