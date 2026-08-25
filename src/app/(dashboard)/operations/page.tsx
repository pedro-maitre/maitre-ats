/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileCheck,
  ShieldCheck,
  Users,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  FolderLock,
  ExternalLink,
  Plus,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Operações (Admissão Digital & DP) | Maître Conecta",
  description: "Gestão de documentos, armazenamento seguro, termos de admissão e processos de DP",
};

export default async function OperationsPage() {
  const [documents, conversions] = await Promise.all([
    prisma.document.findMany({
      include: { candidate: true, organization: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hireConversion.findMany({
      include: {
        application: {
          include: { candidate: true, job: true, offers: true },
        },
      },
      orderBy: { convertedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <FileCheck size={13} /> Conecta Operações
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Admissão Digital & Documentos</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Operações de RH & Admissão Digital
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Guarda canônica de documentos com SHA-256, termos contratuais e checklist de admissão de novos contratados.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Documentos Canônicos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FolderLock size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{documents.length}</p>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck size={12} /> Criptografados com SHA-256
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Dossiês de Admissão</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{conversions.length}</p>
          <span className="text-xs font-medium text-slate-400">Contratações com ficha gerada</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Proteção & Conformidade</span>
            <div className="w-8 h-8 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">100% LGPD</p>
          <span className="text-xs font-medium text-slate-400">Trilha de auditoria append-only</span>
        </div>
      </div>

      {/* Tabela de Documentos Seguros */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Repositório de Documentos Auditados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Currículos e comprovantes protegidos com URLs assinadas temporárias (15 min).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider bg-slate-50/50 dark:bg-slate-950/40">
                <th className="p-4 pl-6">Nome do Arquivo</th>
                <th className="p-4">Titular / Candidato</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Tamanho</th>
                <th className="p-4">Checksum SHA-256</th>
                <th className="p-4">Data de Upload</th>
                <th className="p-4 text-right pr-6">Acesso Seguro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{doc.originalName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                    {doc.candidate ? `${doc.candidate.firstName} ${doc.candidate.lastName}` : "Geral"}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {doc.classification}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    {Math.round(doc.sizeBytes / 1024)} KB
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[10px]">
                    {doc.checksum ? `${doc.checksum.substring(0, 12)}...` : "N/A"}
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors border border-emerald-500/30"
                    >
                      <Download size={13} />
                      <span>URL Assinada</span>
                    </a>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderLock size={36} className="text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        Nenhum documento registrado no storage canônico
                      </p>
                      <p className="text-xs text-slate-400">
                        Quando currículos e comprovantes forem enviados, eles serão indexados com SHA-256 aqui.
                      </p>
                    </div>
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
