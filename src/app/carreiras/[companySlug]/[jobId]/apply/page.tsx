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
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useSession } from "next-auth/react";
import { submitApplication, getJobKillerQuestions } from "./actions";

export default function JobApplyPage({
  params,
}: {
  params: Promise<{ companySlug: string; jobId: string }>;
}) {
  const { companySlug, jobId } = use(params);
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Job Info & Killer Questions
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [killerQuestions, setKillerQuestions] = useState<
    Array<{
      id: string;
      question: string;
      type: "BOOLEAN" | "TEXT";
      isMandatory: boolean;
      disqualifyIfNo: boolean;
    }>
  >([]);
  const [killerAnswers, setKillerAnswers] = useState<Record<string, string>>({});

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

  useEffect(() => {
    async function loadQuestions() {
      setIsLoadingQuestions(true);
      try {
        const res = await getJobKillerQuestions(jobId);
        if (res.success) {
          setJobTitle(res.jobTitle || "");
          setCompanyName(res.companyName || "");
          setKillerQuestions(res.questions || []);

          // Inicializa respostas padrão para booleanos
          const initialAnswers: Record<string, string> = {};
          (res.questions || []).forEach((q: any) => {
            if (q.type === "BOOLEAN") {
              initialAnswers[q.id] = "SIM";
            } else {
              initialAnswers[q.id] = "";
            }
          });
          setKillerAnswers(initialAnswers);
        }
      } catch (err) {
        console.error("Erro ao buscar perguntas da vaga:", err);
      } finally {
        setIsLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [jobId]);

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

      // Valida perguntas obrigatórias
      for (const q of killerQuestions) {
        if (q.isMandatory && !killerAnswers[q.id]) {
          throw new Error(`Por favor, responda à pergunta: "${q.question}"`);
        }
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
      data.append("killerAnswers", JSON.stringify(killerAnswers));

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
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Obrigado pelo seu interesse. Suas respostas e currículo foram enviados diretamente para a equipe de Atração & Seleção.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            Você pode acompanhar o status desta e de outras candidaturas acessando o seu portal.
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/carreiras/${companySlug}/candidato`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-maitre-gold hover:bg-maitre-gold-hover text-slate-950 font-bold text-xs shadow-lg transition-all text-center"
            >
              Acessar Meu Painel de Candidato
            </Link>
            <Link
              href={`/carreiras/${companySlug}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all text-center"
            >
              Ver Outras Vagas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-6">
      <Link
        href={`/carreiras/${companySlug}/${jobId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para a descrição da vaga
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
            <Sparkles size={13} /> Inscrição de Candidatura
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Confirmar Candidatura
          </h1>
          {jobTitle && (
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Vaga: {jobTitle} • {companyName}
            </p>
          )}
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto">
            Preencha as informações abaixo para concluir sua candidatura.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome e Sobrenome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Seu E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                  />
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

            {/* PERGUNTAS DE TRIAGEM CUSTOMIZADAS (KILLER QUESTIONS DA VAGA) */}
            {killerQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldAlert size={16} className="text-amber-500" />
                  <span>Perguntas Específicas da Vaga</span>
                </div>

                {killerQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="space-y-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {idx + 2}
                      </div>
                      <label className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {q.question} {q.isMandatory && "*"}
                      </label>
                    </div>

                    {q.type === "BOOLEAN" ? (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setKillerAnswers((prev) => ({ ...prev, [q.id]: "SIM" }))
                          }
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            killerAnswers[q.id] === "SIM"
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setKillerAnswers((prev) => ({ ...prev, [q.id]: "NAO" }))
                          }
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            killerAnswers[q.id] === "NAO"
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required={q.isMandatory}
                        placeholder="Sua resposta..."
                        value={killerAnswers[q.id] || ""}
                        onChange={(e) =>
                          setKillerAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PERGUNTA: Indicação para a Vaga */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-black text-xs">
                  {killerQuestions.length + 2}
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
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isReferral === "SIM"
                        ? "bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 border-transparent shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Sim, fui indicado(a)
                  </button>
                </div>

                {isReferral === "SIM" && (
                  <div className="animate-in fade-in duration-300 pt-1">
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                      Nome de quem indicou você *
                    </label>
                    <input
                      type="text"
                      required={isReferral === "SIM"}
                      placeholder="Ex: Maria Silva (Engenharia)"
                      value={referralName}
                      onChange={(e) => setReferralName(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* PERGUNTA: Canal de Origem */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-maitre-gold/20 text-maitre-gold flex items-center justify-center font-black text-xs">
                  {killerQuestions.length + 3}
                </div>
                <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone size={16} className="text-purple-500" />
                  Por onde você soube desta oportunidade? *
                </label>
              </div>

              <div className="pt-2 space-y-3">
                <select
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold cursor-pointer"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Portal Maître">Portal de Carreiras Maître</option>
                  <option value="Instagram / Redes Sociais">Instagram / Redes Sociais</option>
                  <option value="Indicação">Indicação de Colega</option>
                  <option value="Gupy / Vagas.com">Outras Plataformas</option>
                  <option value="Outro">Outro Canal</option>
                </select>

                {sourceChannel === "Outro" && (
                  <input
                    type="text"
                    placeholder="Especifique por onde soube..."
                    value={sourceDetails}
                    onChange={(e) => setSourceDetails(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-maitre-gold"
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-maitre-gold to-[#c59e2b] hover:from-[#e5c07b] hover:to-maitre-gold text-slate-950 font-black text-base shadow-xl shadow-maitre-gold/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processando candidatura...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Envio da Candidatura</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
