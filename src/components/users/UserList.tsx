"use client";

import { useState } from "react";
import {
  Edit2,
  Trash2,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  UserCheck,
  Phone,
  MessageCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import { LinkedinIcon } from "@/components/ui/BrandIcons";
import EditUserModal from "./EditUserModal";
import CreateUserModal, { UserData } from "./CreateUserModal";
import EmptyState from "@/components/ui/EmptyState";
import { deleteUser } from "@/app/actions/delete-actions";

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
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Departamentos existentes
  const uniqueDepartments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  ) as string[];

  // Filter users
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(query)) ||
      user.email.toLowerCase().includes(query) ||
      (user.jobTitle && user.jobTitle.toLowerCase().includes(query)) ||
      (user.department && user.department.toLowerCase().includes(query));

    const matchesRole = roleFilter === "ALL" ? true : user.role === roleFilter;
    const matchesDept =
      departmentFilter === "ALL" ? true : user.department === departmentFilter;

    return matchesSearch && matchesRole && matchesDept;
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
        alert(res.error || "Erro ao excluir colaborador.");
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, cargo ou setor..."
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
              <option value="ALL">👥 Todos os Perfis ({users.length})</option>
              <option value="SUPER_ADMIN">👑 Admin Master</option>
              <option value="ADMIN">🛡️ Administrador</option>
              <option value="RECRUITER">💼 Recrutador</option>
              <option value="HIRING_MANAGER">🎯 Gestor de Vagas</option>
            </select>
          </div>

          {/* Department Filter */}
          {uniqueDepartments.length > 0 && (
            <div className="w-full sm:w-auto">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-maitre-gold outline-none cursor-pointer"
              >
                <option value="ALL">🏢 Todos os Setores</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Create User Button */}
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-4 py-2.5 rounded-xl font-extrabold shadow-md hover:brightness-105 transition-all text-xs sm:text-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                <th className="p-4 pl-6">Colaborador / Cargo</th>
                <th className="p-4">Departamento</th>
                <th className="p-4">Contato Direto</th>
                <th className="p-4">Nível de Permissão</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const cleanPhone = user.phone ? user.phone.replace(/\D/g, "") : "";
                const isPhoneValidForWa = cleanPhone.length >= 10;
                const waUrl = isPhoneValidForWa
                  ? `https://wa.me/55${cleanPhone}`
                  : null;

                const isActive = user.status !== "INACTIVE" && user.status !== "SUSPENDED";

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Colaborador / Cargo */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-maitre-gold/20 to-amber-500/10 text-maitre-gold dark:text-[#f3d38c] font-black text-sm flex items-center justify-center border border-maitre-gold/20 shadow-sm shrink-0">
                          {user.name ? user.name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <span>{user.name || "Sem Nome"}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold px-1.5 py-0.5 rounded-md">
                                Você
                              </span>
                            )}
                            {user.linkedinUrl && (
                              <a
                                href={user.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:text-blue-600 transition-colors"
                                title="LinkedIn do Colaborador"
                              >
                                <LinkedinIcon size={13} />
                              </a>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-maitre-gold dark:text-[#e5c07b] flex items-center gap-1">
                            {user.jobTitle || (user.role === "ADMIN" ? "Administrador" : "Recrutador")}
                          </div>
                          <span className="text-[11px] text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Departamento */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        <Building2 size={12} className="text-slate-400" />
                        {user.department || "Recursos Humanos / R&S"}
                      </span>
                    </td>

                    {/* Contato Direto */}
                    <td className="p-4 text-xs font-medium">
                      {user.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 dark:text-slate-300">{user.phone}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                              title="Conversar no WhatsApp"
                            >
                              <MessageCircle size={11} /> WhatsApp
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Não informado</span>
                      )}
                    </td>

                    {/* Nível de Permissão */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                          user.role === "SUPER_ADMIN"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : user.role === "ADMIN"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : user.role === "RECRUITER"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : user.role === "HIRING_MANAGER"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {user.role === "SUPER_ADMIN" ? (
                          <>
                            <Shield size={12} className="text-purple-600 dark:text-purple-400" />
                            <span>Admin Master</span>
                          </>
                        ) : user.role === "ADMIN" ? (
                          <>
                            <Shield size={12} className="text-amber-600 dark:text-amber-400" />
                            <span>Administrador</span>
                          </>
                        ) : user.role === "RECRUITER" ? (
                          <>
                            <Briefcase size={12} className="text-blue-600 dark:text-blue-400" />
                            <span>Recrutador</span>
                          </>
                        ) : user.role === "HIRING_MANAGER" ? (
                          <>
                            <UserCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Gestor de Vaga</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} className="text-slate-500" />
                            <span>Candidato</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={12} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          <XCircle size={12} /> Inativo
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-slate-400 hover:text-maitre-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Editar Perfil do Colaborador"
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
                  <td colSpan={6} className="p-8 text-center">
                    <EmptyState
                      icon={Users}
                      title="Nenhum colaborador encontrado"
                      description="Não foram encontrados colaboradores com os filtros selecionados."
                    />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Excluir Colaborador
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja excluir o acesso de{" "}
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {userToDelete.name || userToDelete.email}
                </strong>
                ? Esta ação é irreversível.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {deletingId ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
