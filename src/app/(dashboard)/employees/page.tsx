/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Calendar,
  Briefcase,
  ExternalLink,
  Plus,
  ShieldCheck,
  Clock,
  Sparkles,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import EmployeeTableClient from "./EmployeeTableClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Pessoas (Colaboradores) | Maître Conecta",
  description: "Gestão Integrada de Colaboradores, Matrículas e Admissão Digital",
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const { getServerTenantScope } = await import("@/lib/security");
  const scope = await getServerTenantScope(session, resolvedParams.orgId);

  const empWhere = scope.organizationId ? { organizationId: scope.organizationId } : {};
  const orgWhere = scope.isGlobalAccess ? {} : { id: scope.organizationId };

  let formalEmployees: any[] = [];
  let organizations: any[] = [];
  let departments: any[] = [];
  let positions: any[] = [];

  try {
    const [formRes, orgsRes, deptsRes, posRes] = await Promise.all([
      prisma.employee.findMany({
        where: empWhere,
        include: {
          department: true,
          position: true,
          organization: true,
          candidate: {
            select: {
              id: true,
              applications: {
                select: { id: true, jobId: true, job: { select: { title: true } } },
                take: 1,
              },
            },
          },
          positionHistories: { orderBy: { effectiveDate: "desc" } },
          vacations: { orderBy: { vacationStart: "desc" } },
          leaves: { orderBy: { startDate: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organization.findMany({
        where: orgWhere,
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      prisma.department.findMany({
        where: empWhere.organizationId ? { organizationId: empWhere.organizationId } : {},
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.position.findMany({
        where: empWhere.organizationId ? { organizationId: empWhere.organizationId } : {},
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
    ]);

    formalEmployees = formRes || [];
    organizations = orgsRes || [];
    departments = deptsRes || [];
    positions = posRes || [];
  } catch (err) {
    console.error("Erro ao carregar dados de colaboradores:", err);
  }

  // Métricas do Core HR Desacoplado
  const totalEmployees = formalEmployees.length;
  const activeCount = formalEmployees.filter((e) => e.status === "ACTIVE").length;
  const onVacationCount = formalEmployees.filter((e) => e.status === "VACATION").length;
  const onLeaveCount = formalEmployees.filter((e) => e.status === "ON_LEAVE").length;

  const totalPayroll = formalEmployees.reduce((acc, e) => {
    return acc + (typeof e.salary === "number" ? e.salary : 0);
  }, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
              <ShieldCheck size={13} /> Módulo de Gestão de Pessoas
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fase P2 Conecta</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Gestão de Colaboradores & Pessoal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Ficha cadastral unificada, histórico de cargos/salários, férias CLT e controle de afastamentos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Colaboradores</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalEmployees}</p>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            ✓ Base de Colaboradores Estruturada
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ativos em Operação</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{activeCount}</p>
          <span className="text-xs font-medium text-slate-400">Em plena atividade</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Férias & Afastamentos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{onVacationCount + onLeaveCount}</p>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {onVacationCount} férias &bull; {onLeaveCount} afastamentos
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Folha Acordada (R$)</span>
            <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalPayroll)}</p>
          <span className="text-xs font-medium text-slate-400">Salários brutos mensais</span>
        </div>
      </div>

      {/* Tabela Interativa de Colaboradores */}
      <EmployeeTableClient
        conversions={[]}
        formalEmployees={JSON.parse(JSON.stringify(formalEmployees))}
        organizations={JSON.parse(JSON.stringify(organizations))}
        departments={JSON.parse(JSON.stringify(departments))}
        positions={JSON.parse(JSON.stringify(positions))}
      />
    </div>
  );
}
