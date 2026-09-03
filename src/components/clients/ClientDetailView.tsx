"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Briefcase,
  Users,
  ExternalLink,
  ChevronLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Palette,
  Edit2,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useTenant } from "@/lib/tenant-context";
import ClientModal from "@/components/clients/ClientModal";
import ClientBrandingModal from "@/components/clients/ClientBrandingModal";
import InviteHiringManagerModal from "@/components/clients/InviteHiringManagerModal";

export default function ClientDetailView({
  client,
  isAdmin,
}: {
  client: any;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { setSelectedTenantId } = useTenant();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "projects" | "team" | "info">("jobs");

  const totalApplications = client.jobs?.reduce(
    (acc: number, j: any) => acc + (j._count?.applications || 0),
    0
  );

  const handleGoToJobs = () => {
    setSelectedTenantId(client.id);
    router.push("/jobs");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Botão Voltar */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-maitre-gold transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Voltar para Empresas Clientes</span>
        </Link>
      </div>

      {/* Hero / Header da Empresa Cliente */}
      <div className="bg-gradient-to-br from-[#1c1d21] via-slate-900 to-[#121316] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20"
          style={{ backgroundColor: client.primaryColor || "#D4AF37" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {client.logoUrl ? (
              <img
                src={client.logoUrl}
                alt={client.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-700 bg-white/5 shadow-md shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl border flex items-center justify-center font-black text-2xl shadow-md shrink-0"
                style={{
                  borderColor: `${client.primaryColor || "#D4AF37"}40`,
                  backgroundColor: `${client.primaryColor || "#D4AF37"}15`,
                  color: client.primaryColor || "#D4AF37",
                }}
              >
                {client.name[0]?.toUpperCase() || "C"}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {client.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                  Cliente Parceiro Ativo
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap font-medium">
                <span className="font-mono text-maitre-gold">
                  /carreiras/{client.slug}
                </span>
                {client.industry && <span>• {client.industry}</span>}
                {client.addressCity && client.addressState && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-500" />
                    {client.addressCity}, {client.addressState}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/carreiras/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm transition-all"
            >
              <ExternalLink size={14} />
              <span>Ver Portal Carreiras</span>
            </Link>

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsBrandingModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-maitre-gold border border-slate-700 shadow-sm transition-all cursor-pointer"
                >
                  <Palette size={14} />
                  <span>Branding White-Label</span>
                </button>

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm transition-all cursor-pointer"
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>
              </>
            )}

            <button
              onClick={handleGoToJobs}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer"
            >
              <Briefcase size={14} />
              <span>Gerenciar Vagas no ATS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas do Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center font-bold">
            <Briefcase size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Vagas Abertas
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {client._count?.jobs || 0}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Candidaturas Recebidas
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalApplications}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Gestores (Hiring Managers)
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {(client.users?.length || 0) + (client.memberships?.length || 0)}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Status de Parceria
            </span>
            <span className="text-sm font-black text-emerald-500 block mt-1">
              Ativa & Regular
            </span>
          </div>
        </div>
      </div>

      {/* Tabs de Conteúdo */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "jobs"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Briefcase size={16} />
          <span>Vagas Atribuídas ({client.jobs?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "projects"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles size={16} />
          <span>Consultoria & Projetos ({client.consultingProjects?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "team"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users size={16} />
          <span>Equipe & Gestores ({client.users?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("info")}
          className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "info"
              ? "border-maitre-gold text-maitre-gold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 size={16} />
          <span>Dados Institucionais & White-Label</span>
        </button>
      </div>

      {/* Conteúdo da Aba: Vagas */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Processos Seletivos em Andamento
            </h3>
            <Link
              href="/jobs/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-slate-950 hover:brightness-105 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Abrir Nova Vaga para este Cliente</span>
            </Link>
          </div>

          {(!client.jobs || client.jobs.length === 0) ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Briefcase size={28} className="text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhuma vaga cadastrada para este cliente ainda
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cadastre a primeira oportunidade para começar a recrutar e receber candidaturas no portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.jobs.map((job: any) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-maitre-gold block">
                          {job.department || "Geral"}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {job.title}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {job.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-4">
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-purple-400" />
                        {job._count?.applications || 0} candidatos
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-500" />
                        Criada em {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <Link
                      href={`/carreiras/${client.slug}/${job.id}`}
                      target="_blank"
                      className="text-xs font-semibold text-slate-400 hover:text-maitre-gold flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span>Ver Vaga Pública</span>
                    </Link>

                    <Link
                      href={`/jobs/${job.id}/board`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-maitre-gold hover:text-slate-950 text-white border border-slate-700 hover:border-maitre-gold transition-all flex items-center gap-1.5"
                    >
                      <span>Acessar Kanban</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Projetos de Consultoria */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Projetos Consultivos Maître
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o cronograma de marcos, entregáveis e o avanço dos serviços contratados.
              </p>
            </div>
            <Link
              href="/consulting"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-maitre-gold text-slate-950 hover:brightness-105 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Gerenciar no Conecta Consultoria</span>
            </Link>
          </div>

          {(!client.consultingProjects || client.consultingProjects.length === 0) ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Sparkles size={28} className="text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhum projeto de consultoria ativo para este cliente
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Inicie um projeto de Hunting Executivo, Cargos & Salários ou DHO para este parceiro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.consultingProjects.map((proj: any) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-maitre-gold block">
                          {proj.category?.replace(/_/g, " ")}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {proj.title}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {proj.status === "COMPLETED" ? "Concluído" : "Em Andamento"}
                      </span>
                    </div>

                    {proj.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {proj.description}
                      </p>
                    )}

                    <div className="my-3 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Progresso</span>
                        <span className="text-maitre-gold">{proj.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-maitre-gold"
                          style={{ width: `${proj.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Consultor: <strong className="text-slate-900 dark:text-white">{proj.consultantName || "Equipe Maître"}</strong></span>
                    <Link
                      href="/consulting"
                      className="text-maitre-gold hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Ver Entregáveis</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Equipe e Gestores */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Gestores & Recrutadores Vinculados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Profissionais autorizados a visualizar vagas, triagens e candidatos deste cliente.
              </p>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm cursor-pointer"
            >
              <Users size={14} />
              <span>Convidar Gestor (Hiring Manager)</span>
            </button>
          </div>

          {(!client.users || client.users.length === 0) ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Users size={28} className="text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhum gestor vinculado diretamente a este cliente
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Convide o Hiring Manager da empresa cliente para que ele possa acompanhar o pipeline de seleção.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.users.map((u: any) => (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 text-maitre-gold flex items-center justify-center font-bold text-sm shrink-0">
                    {u.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {u.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                      {u.email}
                    </span>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {u.role === "HIRING_MANAGER" ? "Hiring Manager" : u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Informações & White-Label */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Identidade White-Label do Portal
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Cor Primária</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: client.primaryColor || "#D4AF37" }}
                  />
                  <span className="font-mono text-slate-900 dark:text-white">
                    {client.primaryColor || "#D4AF37"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">URL do Portal</span>
                <span className="font-mono text-maitre-gold">
                  /carreiras/{client.slug}
                </span>
              </div>

              <div className="py-1">
                <span className="text-slate-400 block mb-1">Headline do Banner</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {client.bannerHeadline || "Faça parte da nossa equipe e impulsione sua carreira."}
                </p>
              </div>

              <div className="py-1">
                <span className="text-slate-400 block mb-1">Sobre a Empresa</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {client.aboutUs || "Informações institucionais da empresa cliente."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Dados Cadastrais & Contato
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Razão Social</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {client.legalName || client.name}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">CNPJ</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {client.cnpj || "Não informado"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">E-mail de Contato</span>
                <span className="text-slate-900 dark:text-white">
                  {client.email || "Não informado"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Telefone / WhatsApp</span>
                <span className="text-slate-900 dark:text-white">
                  {client.phone || "Não informado"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Website Oficial</span>
                {client.websiteUrl ? (
                  <a
                    href={client.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-maitre-gold hover:underline flex items-center gap-1"
                  >
                    <span>{client.websiteUrl}</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-slate-500">Não informado</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Suporte */}
      {isEditModalOpen && (
        <ClientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
          clientToEdit={client}
        />
      )}

      {isBrandingModalOpen && (
        <ClientBrandingModal
          isOpen={isBrandingModalOpen}
          onClose={() => setIsBrandingModalOpen(false)}
          onSuccess={() => {
            setIsBrandingModalOpen(false);
            router.refresh();
          }}
          client={client}
        />
      )}

      {isInviteModalOpen && (
        <InviteHiringManagerModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => {
            setIsInviteModalOpen(false);
            router.refresh();
          }}
          organizations={[{ id: client.id, name: client.name }]}
          defaultOrganizationId={client.id}
        />
      )}
    </div>
  );
}
