"use client";

import React, { useState, useRef } from "react";
import { User, Mail, Phone, Globe, Tag, AlignLeft, Target, UploadCloud, CheckCircle, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createCandidate } from "./actions";

export function NewCandidateForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    source: "Importação / Currículo",
    tags: "",
    profileSummary: "",
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsParsing(true);
      setParseNotice(null);

      try {
        const uploadData = new FormData();
        uploadData.append("resume", selectedFile);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: uploadData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao processar currículo");
        }

        const parsed = await res.json();
        setResumeUrl(parsed.resumeUrl || "");

        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || prev.firstName || (parsed.name ? parsed.name.split(" ")[0] : ""),
          lastName: parsed.lastName || prev.lastName || (parsed.name ? parsed.name.split(" ").slice(1).join(" ") : ""),
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          linkedinUrl: parsed.linkedinUrl || prev.linkedinUrl,
          tags: parsed.tags || prev.tags,
          profileSummary: parsed.profileSummary || prev.profileSummary,
        }));

        setParseNotice("✨ Currículo processado com sucesso! Os campos foram preenchidos automaticamente.");
      } catch (err: any) {
        console.error("PDF upload error:", err);
        setParseNotice("Aviso: O texto não pôde ser extraído automaticamente, mas você pode preencher os campos abaixo.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  return (
    <form action={createCandidate} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <div className="p-8 sm:p-10 space-y-8">
        
        {/* PDF Quick Auto-Fill Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
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
            onChange={handlePdfUpload}
          />
          {isParsing ? (
            <div className="flex flex-col items-center text-maitre-gold space-y-2">
              <Loader2 size={36} className="animate-spin" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">Analisando e extraindo dados do currículo...</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center text-emerald-600 space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{file.name}</p>
              <p className="text-xs text-emerald-600 font-semibold">PDF importado. Clique para trocar de arquivo.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Arraste ou clique para anexar o Currículo em PDF
                </p>
                <p className="text-xs text-slate-500">
                  Preenchimento automático inteligente com IA de nome, contato, competências e resumo
                </p>
              </div>
            </div>
          )}
        </div>

        {parseNotice && (
          <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-3.5 rounded-xl text-xs font-semibold border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
            <Sparkles size={16} className="text-maitre-gold shrink-0" />
            <span>{parseNotice}</span>
          </div>
        )}

        <input type="hidden" name="resumeUrl" value={resumeUrl} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User size={15} className="text-maitre-gold" />
              Nome *
            </label>
            <input 
              type="text" 
              id="firstName" 
              name="firstName" 
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Sobrenome *
            </label>
            <input 
              type="text" 
              id="lastName" 
              name="lastName" 
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Mail size={15} className="text-emerald-500" />
              E-mail *
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Phone size={15} className="text-maitre-gold" />
              Telefone
            </label>
            <input 
              type="text" 
              id="phone" 
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="linkedinUrl" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Globe size={15} className="text-blue-500" />
              LinkedIn URL
            </label>
            <input 
              type="url" 
              id="linkedinUrl" 
              name="linkedinUrl" 
              placeholder="https://linkedin.com/in/..." 
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="source" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target size={15} className="text-purple-500" />
              Origem (Source)
            </label>
            <input 
              type="text" 
              id="source" 
              name="source" 
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="ex: Hunting, LinkedIn, Indicação..." 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Tag size={15} className="text-maitre-gold" />
            Tags / Competências (separadas por vírgula)
          </label>
          <input 
            type="text" 
            id="tags" 
            name="tags" 
            placeholder="React, TypeScript, Node.js..." 
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="profileSummary" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <AlignLeft size={15} className="text-slate-500" />
            Resumo Profissional
          </label>
          <textarea 
            id="profileSummary" 
            name="profileSummary" 
            rows={5}
            value={formData.profileSummary}
            onChange={(e) => setFormData({ ...formData, profileSummary: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition-all resize-y text-sm font-medium"
          ></textarea>
        </div>
        
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-950/60 p-6 sm:p-8 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
        <Link href={`/candidates`} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm">
          Cancelar
        </Link>
        <button
          type="submit"
          className="bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-8 py-3 rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Cadastrar Candidato
        </button>
      </div>
    </form>
  );
}
