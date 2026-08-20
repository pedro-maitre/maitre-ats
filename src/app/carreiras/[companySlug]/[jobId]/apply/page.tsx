/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, Loader2, ArrowLeft, Lock, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { submitApplication } from "./actions";

export default function JobApplyPage({
  params,
}: {
  params: Promise<{ companySlug: string; jobId: string }>;
}) {
  const { companySlug, jobId } = use(params);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [uploadedResumeUrl, setUploadedResumeUrl] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    linkedinUrl: "",
    tags: "",
    salaryExpectation: "",
    profileSummary: "",
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError("");

      setIsParsing(true);
      try {
        const data = new FormData();
        data.append("resume", selectedFile);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: data,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao processar currículo");
        }

        const parsed = await res.json();

        setUploadedResumeUrl(parsed.resumeUrl || "");

        // Auto-fill extracted data
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || (parsed.name ? parsed.name.split(" ")[0] : ""),
          lastName: prev.lastName || (parsed.name ? parsed.name.split(" ").slice(1).join(" ") : ""),
          email: prev.email || (parsed.email || ""),
          phone: prev.phone || (parsed.phone || ""),
        }));
      } catch (err: any) {
        console.error("Parse error:", err);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let finalResumeUrl = uploadedResumeUrl;

      // Fallback: If file was selected but not uploaded yet, upload now
      if (file && !finalResumeUrl) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("resume", file);
          const uploadRes = await fetch("/api/parse-resume", {
            method: "POST",
            body: uploadFormData,
          });
          if (uploadRes.ok) {
            const parsed = await uploadRes.json();
            finalResumeUrl = parsed.resumeUrl || "";
            setUploadedResumeUrl(finalResumeUrl);
          }
        } catch (uploadErr) {
          console.warn("Upload fallback error:", uploadErr);
        }
      }

      const data = new FormData();
      data.append("jobId", jobId);
      data.append("companySlug", companySlug);
      data.append("firstName", formData.firstName);
      data.append("lastName", formData.lastName);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("phone", formData.phone);
      data.append("salaryExpectation", formData.salaryExpectation);
      data.append("profileSummary", formData.profileSummary);
      data.append("linkedinUrl", formData.linkedinUrl);
      data.append("tags", formData.tags);
      data.append("resumeUrl", finalResumeUrl);

      await submitApplication(data);
      setSuccess(true);
    } catch (err: any) {
      console.error("Submit error:", err);
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
              Inscrição Confirmada!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              Seu currículo foi recebido pela equipe de recrutamento. Agora você pode acompanhar o status do seu processo seletivo em tempo real.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/carreiras/${companySlug}/candidato`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-105 transition-all text-sm"
            >
              Acessar Minhas Candidaturas
            </Link>
            <Link
              href={`/carreiras/${companySlug}`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm border border-slate-200 dark:border-slate-800"
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
        <ArrowLeft size={16} /> Voltar para os detalhes da vaga
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maitre-gold/15 text-maitre-gold text-xs font-bold uppercase tracking-wider border border-maitre-gold/30">
            <Sparkles size={14} /> Preenchimento com Inteligência Artificial
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Envie sua Candidatura
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Faça o upload do seu currículo em PDF. Nossa IA lê os dados e você poderá acompanhar o processo pelo portal.
          </p>
        </div>

        <div className="p-8 sm:p-10 space-y-8">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              file
                ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-slate-300 dark:border-slate-700 hover:border-maitre-gold dark:hover:border-maitre-gold hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {isParsing ? (
              <div className="flex flex-col items-center text-maitre-gold space-y-3">
                <Loader2 size={44} className="animate-spin text-maitre-gold" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Extraindo dados com IA...</p>
                  <p className="text-xs text-slate-500">Lendo informações de contato e competências</p>
                </div>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center text-emerald-600 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-emerald-600 font-semibold">Currículo anexado com sucesso! Clique para alterar.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-maitre-gold">
                  <UploadCloud size={30} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-base mb-0.5">
                    Clique para enviar seu currículo (PDF)
                  </p>
                  <p className="text-xs text-slate-500">Preencheremos os campos automaticamente para você</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Sobrenome
                </label>
                <input
                  type="text"
                  placeholder="Seu sobrenome"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Candidate Portal Password */}
            <div className="p-5 rounded-2xl bg-maitre-gold/5 border border-maitre-gold/20 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <ShieldCheck size={18} className="text-maitre-gold" />
                <span>Acesso à Área do Candidato</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Defina uma senha para poder acompanhar o status do processo seletivo e futuras entrevistas em tempo real.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha de Acesso (Mínimo 6 dígitos)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Pretensão Salarial (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 8000"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                  value={formData.salaryExpectation}
                  onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Principais Competências (Separe por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: React, Node.js, Liderança, Metodologias Ágeis"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all text-sm font-medium"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Resumo Profissional / Apresentação
              </label>
              <textarea
                rows={4}
                placeholder="Conte um pouco sobre sua trajetória, conquistas e objetivos profissionais..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold transition-all resize-y text-sm font-medium"
                value={formData.profileSummary}
                onChange={(e) => setFormData({ ...formData, profileSummary: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.firstName}
              className="w-full bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 p-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Enviando Candidatura...</span>
                </>
              ) : (
                <span>Confirmar Inscrição</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
