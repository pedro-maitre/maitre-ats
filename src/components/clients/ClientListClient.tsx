"use client";

import React, { useState } from "react";
import {
  Building2,
  Briefcase,
  Users,
  Search,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Palette,
  Crown,
} from "lucide-react";
import Link from "next/link";
import ClientModal from "./ClientModal";
import InviteHiringManagerModal from "./InviteHiringManagerModal";
import ClientBrandingModal from "./ClientBrandingModal";
import { deleteClient } from "@/app/(dashboard)/clients/actions";
import { useTenant } from "@/lib/tenant-context";
import { useRouter } from "next/navigation";

interface ClientData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  bannerHeadline?: string | null;
  bannerSubheadline?: string | null;
  aboutUs?: string | null;
  websiteUrl?: string | null;
  createdAt: Date | string;
  _count: {
    jobs: number;
    candidates: number;
    users: number;
  };
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    department: string | null;
  }>;
}

export default function ClientListClient({
  initialClients,
  masterOrganization,
  isAdmin,
}: {
  initialClients: ClientData[];
  masterOrganization?: any | null;
  isAdmin: boolean;
}) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [selectedOrgForInvite, setSelectedOrgForInvite] = useState<string>("");
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null);
  const [clientToBrand, setClientToBrand] = useState<ClientData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { setSelectedTenantId, refreshOrganizations } = useTenant();
  const router = useRouter();

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalJobs = clients.reduce((acc, c) => acc + (c._count?.jobs || 0), 0);
  const totalCandidates = clients.reduce((acc, c) => acc + (c._count?.candidates || 0), 0);

  const handleSelectAndNavigate = (clientId: string) => {
    setSelectedTenantId(clientId);
    router.push("/jobs");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${name}"?`)) return;

    setDeletingId(id);
    setFeedback(null);

    try {
      const res = await deleteClient(id);
      if (!res.success) throw new Error(res.error);

      setClients(clients.filter((c) => c.id !== id));
      setFeedback({ type: "success", text: "Empresa cliente removida com sucesso." });
      await refreshOrganizations();
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Erro ao remover empresa." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-maitre-gold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} />
            <span>Gestão Multitenant B2B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Empresas Clientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie as contas corporativas atendidas pela Maître Consultoria e seus portais de carreiras white-label.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedOrgForInvite("");
              setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Users size={15} className="text-purple-400" />
            <span>Convidar Gestor (Hiring Manager)</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setClientToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Nova Empresa Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Card da Empresa Master (Mantenedora do Sistema) */}
      {masterOrganization && (
        <div className="bg-gradient-to-br from-[#1c1d21] via-slate-900 to-[#121316] border border-maitre-gold/30 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-maitre-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-maitre-gold/30 to-amber-400/15 border border-maitre-gold/40 flex items-center justify-center text-maitre-gold shadow-md shrink-0">
                <Crown size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-white">
                    {masterOrganization.name}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider bg-maitre-gold text-slate-950 shadow-sm uppercase">
                    👑 Empresa Master
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    (Operadora & Mantenedora da Plataforma)
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Conectada ao macro do software. A Maître gerencia todas as vagas, candidatos e os processos seletivos de todas as empresas clientes parceiras abaixo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/settings/organization"
                className="px-4 py-2.5 rounded-xl border border-maitre-gold/30 hover:border-maitre-gold bg-maitre-gold/10 hover:bg-maitre-gold/20 text-maitre-gold text-xs font-bold transition-all flex items-center gap-2"
              >
                <span>Configurações da Master</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Empresas Atendidas
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {clients.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Vagas em Hunting
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalJobs}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Talentos Registrados
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalCandidates}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da empresa ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-maitre-gold transition-colors font-medium shadow-sm"
          />
        </div>
      </div>

      {/* Grid de Cards de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nenhuma empresa cliente encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchTerm ? "Tente outro termo de busca." : "Comece cadastrando sua primeira empresa cliente."}
            </p>
          </div>
        ) : (
          filtered.map((client) => {
            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top do Card */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 text-maitre-gold flex items-center justify-center font-black text-base shadow-sm">
                        {client.name[0]?.toUpperCase() || "E"}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-maitre-gold transition-colors leading-tight">
                          {client.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-400 block mt-0.5">
                          /carreiras/{client.slug}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setClientToBrand(client);
                            setIsBrandingModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-maitre-gold hover:bg-slate-800 transition-colors"
                          title="Customizar Branding White-Label"
                        >
                          <Palette size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setClientToEdit(client);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar Empresa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id, client.name)}
                          disabled={deletingId === client.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Excluir Empresa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resumo de Indicadores */}
                  <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Vagas Ativas
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <Briefcase size={13} className="text-maitre-gold" />
                        {client._count.jobs}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Talentos no Banco
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <Users size={13} className="text-purple-400" />
                        {client._count.candidates}
                      </span>
                    </div>
                  </div>

                  {/* Últimas Vagas Publicadas */}
                  {client.jobs && client.jobs.length > 0 && (
                    <div className="mb-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Posições Recentes
                      </span>
                      <div className="space-y-1">
                        {client.jobs.slice(0, 2).map((j) => (
                          <div
                            key={j.id}
                            className="text-xs text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="truncate">{j.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer do Card com Ações */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/carreiras/${client.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-maitre-gold transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ExternalLink size={12} />
                      <span>Portal White-Label</span>
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setClientToBrand(client);
                          setIsBrandingModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-maitre-gold hover:bg-slate-800 transition-colors"
                        title="Personalizar Cores e Logo"
                      >
                        <Palette size={13} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectAndNavigate(client.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-maitre-gold hover:text-slate-950 text-white py-1.5 px-3 rounded-xl border border-slate-700 hover:border-maitre-gold transition-all cursor-pointer shadow-sm"
                  >
                    <span>Ver Vagas</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição de Empresa */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal de Customização White-Label */}
      <ClientBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => {
          setIsBrandingModalOpen(false);
          setClientToBrand(null);
        }}
        client={clientToBrand}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal de Convite de Gestor do Cliente */}
      <InviteHiringManagerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizations={clients.map((c) => ({ id: c.id, name: c.name }))}
        defaultOrganizationId={selectedOrgForInvite}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
