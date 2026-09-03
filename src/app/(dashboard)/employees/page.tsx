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
  title: "Core HR (Colaboradores) | Maître Conecta",
  description: "Gestão Integrada de Colaboradores, Matrículas e Admissão Digital",
};

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  let conversions: any[] = [];
  let formalEmployees: any[] = [];
  let organizations: any[] = [];

  try {
    const [convRes, formRes, orgsRes] = await Promise.all([
      prisma.hireConversion.findMany({
        include: {
          application: {
            include: {
              candidate: true,
              job: true,
              offers: {
                where: { status: "APPROVED" },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
              interviews: {
                include: {
                  scorecards: true,
                },
              },
            },
          },
        },
        orderBy: { convertedAt: "desc" },
      }),
      prisma.employee.findMany({
        include: {
          department: true,
          position: true,
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organization.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]);

    conversions = convRes || [];
    formalEmployees = formRes || [];
    organizations = orgsRes || [];
  } catch (err) {
    console.error("Erro ao carregar dados de colaboradores:", err);
  }

  // Métricas do Core HR com fallbacks seguros contra nulos
  const totalEmployees = conversions.length + formalEmployees.length;
  const activeCount =
    conversions.filter((c) => c.status === "ACTIVE" || c.status === "CONVERTED").length +
    formalEmployees.filter((e) => e.status === "ACTIVE").length;
  const pendingOnboarding =
    conversions.filter((c) => c.status === "PENDING_ONBOARDING").length +
    formalEmployees.filter((e) => e.status === "PENDING_ONBOARDING").length;

  const totalPayroll =
    conversions.reduce((acc, c) => {
      const app = c.application || {};
      const salary = app.offers?.[0]?.salaryOffered || app.salaryExpectation || app.job?.salaryMax || 0;
      return acc + (typeof salary === "number" ? salary : 0);
    }, 0) +
    formalEmployees.reduce((acc, e) => {
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
              <ShieldCheck size={13} /> Módulo Core HR
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fase P2 Conecta</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Gestão de Colaboradores & Admissão
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Ficha cadastral unificada, matrículas, histórico de R&S herdado e pré-admissão digital.
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
            ✓ Core HR & ATS Unificados
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ativos (Efetivados)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{activeCount}</p>
          <span className="text-xs font-medium text-slate-400">Em plena atividade</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Em Onboarding / DHO</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{pendingOnboarding}</p>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Documentação / Treinamento</span>
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
        conversions={JSON.parse(JSON.stringify(conversions))}
        formalEmployees={JSON.parse(JSON.stringify(formalEmployees))}
        organizations={JSON.parse(JSON.stringify(organizations))}
      />
    </div>
  );
}
