/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  User,
  FileText,
  Building2,
  ArrowRight,
  Loader2,
  ExternalLink,
  Edit3,
  Save,
  Sparkles,
  UploadCloud,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { use } from "react";

export default function CandidateDashboardPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Resume upload state
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState("");

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: "",
    linkedinUrl: "",
    profileSummary: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/candidate/applications");
      if (!res.ok) {
        throw new Error("Erro ao carregar seus dados.");
      }
      const data = await res.json();
      setCandidate(data.candidate);
      setApplications(data.applications || []);
      if (data.candidate) {
        setProfileForm({
          phone: data.candidate.phone || "",
          linkedinUrl: data.candidate.linkedinUrl || "",
          profileSummary: data.candidate.profileSummary || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar as candidaturas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/carreiras/${companySlug}/candidato/login`);
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, companySlug, router, fetchData]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setIsUploadingResume(true);
      setResumeUploadSuccess(false);
      setResumeUploadError("");

      try {
        // 1. Upload to Supabase and parse with AI
        const formData = new FormData();
        formData.append("resume", selectedFile);

        const parseRes = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!parseRes.ok) {
          const errData = await parseRes.json();
          throw new Error(errData.error || "Erro ao processar currículo.");
        }

        const parseData = await parseRes.json();
        const newResumeUrl = parseData.resumeUrl;

        // 2. Persist new resumeUrl in Candidate database profile
        const updateRes = await fetch("/api/candidate/applications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeUrl: newResumeUrl,
            phone: parseData.phone || undefined,
            profileSummary: parseData.profileSummary || parseData.rawText || undefined,
            tags: parseData.tags || undefined,
            linkedinUrl: parseData.linkedinUrl || undefined,
          }),
        });

        if (!updateRes.ok) {
          throw new Error("Erro ao salvar currículo no perfil.");
        }

        setResumeUploadSuccess(true);
        fetchData();
      } catch (err: any) {
        console.error("Resume upload error:", err);
        setResumeUploadError(err.message || "Não foi possível enviar o currículo.");
      } finally {
        setIsUploadingResume(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/candidate/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (!res.ok) throw new Error("Erro ao atualizar perfil.");

      setSaveSuccess(true);
      setIsEditingProfile(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-maitre-gold" size={40} />
        <p className="text-sm font-semibold text-slate-500">Carregando suas informações...</p>
      </div>
    );
  }

  const candidateName = session?.user?.name || candidate?.firstName || "Candidato";
  const hasResume = Boolean(candidate?.resumeUrl);

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-maitre-gold to-[#fff2d1] text-slate-950 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
            {candidateName[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Olá, {candidateName}!
              </h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Área do Candidato
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {session?.user?.email} • Acompanhe a evolução de todos os seus processos seletivos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/carreiras/${companySlug}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Briefcase size={16} />
            Ver Novas Vagas
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: `/carreiras/${companySlug}` })}
            className="inline-flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border border-red-200 dark:border-red-900/40"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* RESUME UPLOAD SECTION (Envio de Currículo) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={22} className="text-maitre-gold" />
              Meu Currículo em PDF
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Seu currículo é analisado por inteligência artificial para match automático com as vagas.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingResume}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
          >
            {isUploadingResume ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processando com IA...</span>
              </>
            ) : hasResume ? (
              <>
                <RefreshCw size={16} />
                <span>Substituir Currículo</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Enviar Currículo (PDF)</span>
              </>
            )}
          </button>

          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={handleResumeUpload}
          />
        </div>

        {resumeUploadSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-sm font-bold border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <span>Currículo em PDF enviado e atualizado com sucesso no seu perfil!</span>
          </div>
        )}

        {resumeUploadError && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-200 dark:border-red-900/50">
            {resumeUploadError}
          </div>
        )}

        {/* Current Resume Status Card */}
        {hasResume ? (
          <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Currículo Cadastrado
                  </p>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                    Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documento em formato PDF disponível para os recrutadores.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <ExternalLink size={14} className="text-maitre-gold" />
                Visualizar PDF
              </a>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-maitre-gold/50 bg-maitre-gold/5 hover:bg-maitre-gold/10 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-maitre-gold/20 text-maitre-gold flex items-center justify-center mx-auto">
              <UploadCloud size={28} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-base">
                Clique aqui para enviar seu currículo em PDF
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Nossa IA fará a leitura automática das suas competências e vinculará o documento ao seu perfil.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-maitre-gold/15 text-maitre-gold flex items-center justify-center shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {applications.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Inscrições
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {applications.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Processos em Andamento
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {hasResume ? "100%" : "50%"}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {hasResume ? "Perfil Completo" : "Envio de PDF Pendente"}
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase size={22} className="text-maitre-gold" />
            Minhas Candidaturas ({applications.length})
          </h2>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Você ainda não se candidatou a nenhuma vaga
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Explore as oportunidades em aberto e candidate-se em poucos cliques.
              </p>
            </div>
            <div>
              <Link
                href={`/carreiras/${companySlug}`}
                className="inline-flex items-center gap-2 bg-maitre-gold hover:bg-maitre-gold-hover text-slate-950 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                Explorar Vagas Abertas
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all hover:border-maitre-gold/50"
              >
                {/* Application Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-maitre-gold">
                      {app.companyName}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {app.jobTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} />
                        {app.jobDepartment || "Geral"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {app.jobLocation || "Remoto"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Inscrição em:{" "}
                        {new Date(app.appliedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      <Clock size={14} />
                      Etapa Atual: {app.currentStage.name}
                    </span>
                  </div>
                </div>

                {/* Visual Stage Stepper / Timeline */}
                <div className="p-6 sm:p-8 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Evolução do Processo Seletivo
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {app.allStages.map((st: any, idx: number) => {
                      const isCompleted = st.isCompleted;
                      const isCurrent = st.isCurrent;

                      return (
                        <div
                          key={st.id}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                            isCurrent
                              ? "bg-maitre-gold/10 border-maitre-gold shadow-md"
                              : isCompleted
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30"
                              : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                                isCurrent
                                  ? "bg-maitre-gold text-slate-950"
                                  : isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            {isCompleted && <CheckCircle2 size={16} className="text-emerald-500" />}
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-maitre-gold animate-ping" />
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {st.name}
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-slate-500">
                              {isCurrent ? "Em Andamento" : isCompleted ? "Concluído" : "Aguardando"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Application Footer Actions */}
                <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500">
                    Pretensão Salarial Informada:{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {app.salaryExpectation
                        ? `R$ ${app.salaryExpectation.toLocaleString("pt-BR")}`
                        : "Não informada"}
                    </span>
                  </div>

                  {candidate?.resumeUrl && (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-maitre-gold hover:underline font-bold"
                    >
                      <FileText size={14} />
                      Visualizar Currículo Anexado
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User size={20} className="text-maitre-gold" />
              Meus Dados Profissionais
            </h3>
            <p className="text-xs text-slate-500">
              Essas informações são compartilhadas com os recrutadores das vagas que você se candidatar.
            </p>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-maitre-gold text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
            {isEditingProfile ? "Cancelar Edição" : "Editar Dados"}
          </button>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-bold border border-emerald-200">
            Perfil atualizado com sucesso!
          </div>
        )}

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
                  value={profileForm.linkedinUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Resumo Profissional
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold resize-y"
                value={profileForm.profileSummary}
                onChange={(e) => setProfileForm({ ...profileForm, profileSummary: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 bg-maitre-gold hover:bg-maitre-gold-hover text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {isSavingProfile && <Loader2 className="animate-spin" size={16} />}
              <Save size={16} />
              Salvar Alterações
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Telefone / WhatsApp
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {candidate?.phone || "Não informado"}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                LinkedIn
              </span>
              {candidate?.linkedinUrl ? (
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-maitre-gold hover:underline font-semibold inline-flex items-center gap-1"
                >
                  {candidate.linkedinUrl}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <p className="font-semibold text-slate-800 dark:text-slate-200">Não informado</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Resumo Profissional
              </span>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {candidate?.profileSummary || "Nenhum resumo cadastrado."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
