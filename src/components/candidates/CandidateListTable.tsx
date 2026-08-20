"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, ExternalLink, Trash2, Loader2, Search } from "lucide-react";
import { deleteCandidate } from "@/app/actions/delete-actions";

type CandidateData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  source: string | null;
  createdAt: Date;
};

export default function CandidateListTable({
  initialCandidates,
  userRole,
  query,
}: {
  initialCandidates: CandidateData[];
  userRole?: string;
  query?: string;
}) {
  const [candidates, setCandidates] = useState<CandidateData[]>(initialCandidates);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    setDeletingId(id);

    try {
      const res = await deleteCandidate(id);
      if (res.success) {
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        setConfirmDeleteId(null);
      } else {
        alert(res.error || "Erro ao excluir candidato.");
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="p-4 pl-6">Candidato</th>
            <th className="p-4">Origem</th>
            <th className="p-4">Data de Cadastro</th>
            <th className="p-4 text-right pr-6">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {candidates.map((c) => {
            const isDeleting = deletingId === c.id;
            const isConfirming = confirmDeleteId === c.id;

            return (
              <tr
                key={c.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <td className="p-4 pl-6">
                  <div className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-maitre-gold transition-colors">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail size={13} /> {c.email}
                    </span>
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} /> {c.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                    {c.source || "Banco"}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-sm">
                  {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="p-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="text-maitre-gold hover:text-maitre-gold-hover font-bold text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Ver Perfil</span>
                      <ExternalLink size={14} />
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => setConfirmDeleteId(isConfirming ? null : c.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Excluir Candidato (Admin Master)"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {isConfirming && (
                    <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-left text-xs space-y-1.5">
                      <p className="font-bold text-red-700 dark:text-red-400">
                        Excluir candidato e todo o histórico?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
                        >
                          {isDeleting && <Loader2 size={12} className="animate-spin" />}
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {candidates.length === 0 && (
            <tr>
              <td colSpan={4} className="p-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <Search size={40} className="mb-3 opacity-20" />
                  <p className="font-medium">Nenhum talento encontrado.</p>
                  {query && (
                    <Link href="/candidates" className="text-maitre-gold hover:underline mt-2 text-sm font-semibold">
                      Limpar pesquisa
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
