/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { submitApplication } from "./actions";

export default function JobApplyPage({ params }: { params: Promise<{ companySlug: string, jobId: string }> }) {
  const { companySlug, jobId } = use(params);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    tags: "",
    salaryExpectation: "",
    profileSummary: ""
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await parseResume(selectedFile);
    }
  };

  const parseResume = async (file: File) => {
    setIsParsing(true);
    setError("");
    const data = new FormData();
    data.append("resume", file);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: data,
      });
      const parsed = await res.json();
      
      if (!res.ok) throw new Error(parsed.error || "Erro na leitura do PDF");

      const names = parsed.name ? parsed.name.split(" ") : [""];
      setFormData((prev) => ({
        ...prev,
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        linkedinUrl: parsed.linkedinUrl || "",
        tags: parsed.tags || "",
        profileSummary: parsed.rawText || ""
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = new FormData();
      data.append("firstName", formData.firstName);
      data.append("lastName", formData.lastName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("salaryExpectation", formData.salaryExpectation);
      data.append("profileSummary", formData.profileSummary);
      data.append("linkedinUrl", formData.linkedinUrl);
      data.append("tags", formData.tags);
      
      if (file) {
        data.append("resumeFile", file);
      }

      await submitApplication(jobId, companySlug, data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center animate-in zoom-in duration-500 py-12">
        <div className="text-center bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
          <CheckCircle size={80} className="mx-auto text-emerald-500 mb-6 drop-shadow-md" />
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Inscrição Confirmada!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Seu currículo foi enviado com sucesso. Em breve a equipe entrará em contato com os próximos passos.
          </p>
          <Link href={`/careers/${companySlug}`} className="inline-block border border-[#c89650] text-[#c89650] hover:bg-[#c89650] hover:text-white transition-colors px-6 py-2.5 rounded-lg font-semibold">
            Voltar para vagas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <Link href={`/careers/${companySlug}/${jobId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Voltar para os detalhes
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-200 dark:border-slate-800 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Envie sua Candidatura</h1>
          <p className="text-slate-500 dark:text-slate-400">Faça o upload do seu currículo para preenchimento automático.</p>
        </div>

        <div className="p-8">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-8 ${file ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-[#c89650] dark:hover:border-[#c89650] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            {isParsing ? (
              <div className="flex flex-col items-center text-[#c89650]">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-medium">Extraindo dados com IA...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center text-emerald-600">
                <CheckCircle size={40} className="mb-4" />
                <p className="font-medium text-emerald-700 dark:text-emerald-400">{file.name}</p>
                <p className="text-xs mt-1 text-emerald-600/70">Clique para alterar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <UploadCloud size={48} className="mb-4 opacity-50" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Clique para enviar seu currículo (PDF)</p>
                <p className="text-sm">Nossos sistemas vão preencher o formulário para você.</p>
              </div>
            )}
          </div>

          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sobrenome</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">E-mail</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telefone</label>
                <input
                  type="tel"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pretensão Salarial (R$)</label>
                <input
                  type="number"
                  required
                  placeholder="ex: 5000"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.salaryExpectation}
                  onChange={(e) => setFormData({...formData, salaryExpectation: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Principais Competências (Tags extraídas)</label>
                <input
                  type="text"
                  placeholder="Ex: Liderança, React, Gestão de Projetos"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Resumo Profissional (Extraído)</label>
                <textarea
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#c89650] transition-shadow resize-y"
                  value={formData.profileSummary}
                  onChange={(e) => setFormData({...formData, profileSummary: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.email}
              className="w-full bg-[#c89650] hover:bg-[#b08040] disabled:opacity-50 text-white p-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] shadow-md"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={20} />}
              {isSubmitting ? "Enviando..." : "Confirmar Inscrição"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
