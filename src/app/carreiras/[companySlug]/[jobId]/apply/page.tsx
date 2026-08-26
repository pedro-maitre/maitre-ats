/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  Megaphone,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Building2,
  Briefcase,
  Mail,
  User,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useSession } from "next-auth/react";
import { submitApplication } from "./actions";

export default function JobApplyPage({
  params,
}: {
  params: Promise<{ companySlug: string; jobId: string }>;
}) {
  const { companySlug, jobId } = use(params);
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // AS 3 PERGUNTAS SOLICITADAS
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [isReferral, setIsReferral] = useState<"NAO" | "SIM">("NAO");
  const [referralName, setReferralName] = useState("");
  const [sourceChannel, setSourceChannel] = useState("LinkedIn");
  const [sourceDetails, setSourceDetails] = useState("");

  // E-mail e Nome para caso não esteja logado
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const isLoggedIn = Boolean(session?.user?.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!salaryExpectation) {
        throw new Error("Por favor, informe a sua pretensão salarial.");
      }

      if (isReferral === "SIM" && !referralName.trim()) {
        throw new Error("Por favor, informe o nome de quem indicou você para a vaga.");
      }

      const effectiveEmail = email || session?.user?.email;
      if (!effectiveEmail) {
        throw new Error("Por favor, informe seu e-mail cadastrado na Área do Candidato.");
      }

      const data = new FormData();
      data.append("jobId", jobId);
      data.append("companySlug", companySlug);
      data.append("email", effectiveEmail);
      data.append("firstName", name ? name.split(" ")[0] : "Candidato");
      data.append("lastName", name ? name.split(" ").slice(1).join(" ") : "");
      data.append("salaryExpectation", salaryExpectation);
      data.append("isReferral", isReferral);
      data.append("referralName", referralName);
      data.append("sourceChannel", sourceChannel);
      data.append("sourceDetails", sourceDetails);

      await submitApplication(data);
      setSuccess(true);
    } catch (err: any) {
      console.error("Erro ao enviar candidatura:", err);
      setError(err.message || "Erro ao enviar candidatura. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center animate-in zoom-in duration-500 py-12">
        <div className="text-center bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle size={48} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              Candidatura Confirmada!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              Suas respostas foram registradas e seu perfil cadastrado foi vinculado a esta vaga. Acompanhe a evolução do processo pela sua Área do Candidato.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/carreiras/${companySlug}/candidato`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-6 py-3.5 rounded-xl font-bold shadow-md hover:brightness-105 transition-all text-sm cursor-pointer"
            >
              Acessar Minhas Candidaturas
            </Link>
            <Link
              href={`/carreiras/${companySlug}`}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm border border-slate-200 dark:border-slate-800"
            >
              Ver Outras Vagas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-500 space-y-6">
      <Link
        href={`/carreiras/${companySlug}/${jobId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para os detalhes da vaga
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        {/* Header Compacto */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
            <Sparkles size={14} /> Candidatura Direta
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Confirmar Candidatura
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Seus dados cadastrais e currículo serão utilizados da sua <strong>Área do Candidato</strong>. Basta responder às perguntas abaixo.
          </p>
        </div>

        <div className="p-8 sm:p-10 space-y-8">
          {/* Card de Identificação da Conta */}
          {isLoggedIn ? (
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                ✓
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Candidatando-se como:
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {name ? `${name} (${session?.user?.email})` : session?.user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <ShieldCheck size={16} className="text-maitre-gold" />
                <span>Identificação do Candidato</span>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Seu E-mail Cadastrado *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PERGUNTA 1: Pretensão Salarial */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-black text-xs">
                  1
                </div>
                <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-500" />
                  Qual a sua pretensão salarial mensal (R$)? *
                </label>
              </div>
              <div className="relative max-w-sm pt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  required
                  min={500}
                  placeholder="Ex: 8000"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  className="w-full p-3.5 pl-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-bold outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
                />
              </div>
            </div>

            {/* PERGUNTA 2: Indicação para a Vaga */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-black text-xs">
                  2
                </div>
                <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  Você é uma indicação para esta vaga? *
                </label>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReferral("NAO");
                      setReferralName("");
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                      isReferral === "NAO"
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReferral("SIM")}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                      isReferral === "SIM"
                        ? "bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 border-transparent shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Sim, fui indicado(a)
                  </button>
                </div>

                {isReferral === "SIM" && (
                  <div className="animate-in fade-in duration-300 pt-2 space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Quem indicou você? *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome do colaborador ou contato da equipe..."
                      value={referralName}
                      onChange={(e) => setReferralName(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* PERGUNTA 3: Como soube da Vaga */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-black text-xs">
                  3
                </div>
                <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone size={16} className="text-purple-500" />
                  Como você soube desta vaga? *
                </label>
              </div>

              <div className="pt-2 space-y-3">
                <select
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-maitre-gold transition-all cursor-pointer"
                >
                  <option value="LinkedIn">🌐 LinkedIn</option>
                  <option value="Portal de Carreiras Maître">🏢 Portal de Carreiras / Site Oficial</option>
                  <option value="Indicação de Amigo ou Colega">👥 Indicação de Amigo ou Colega</option>
                  <option value="Instagram / Redes Sociais">📱 Instagram / Redes Sociais</option>
                  <option value="Abordagem de Recrutador (Hunting)">🎯 Abordagem de Recrutador (Hunting)</option>
                  <option value="Outro">📝 Outro Canal</option>
                </select>

                {sourceChannel === "Outro" && (
                  <div className="animate-in fade-in duration-300 pt-1">
                    <input
                      type="text"
                      placeholder="Especifique como soube da oportunidade..."
                      value={sourceDetails}
                      onChange={(e) => setSourceDetails(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSubmitting || !salaryExpectation || (isReferral === "SIM" && !referralName.trim())}
              className="w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 p-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Enviando Candidatura...</span>
                </>
              ) : (
                <span>Confirmar e Enviar Candidatura</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
