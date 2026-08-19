/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, Loader2 } from "lucide-react";

export default function ApplyPage() {
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
      setFormData({
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        profileSummary: parsed.rawText || ""
      });
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
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "Banco de Talentos" }),
      });
      if (!res.ok) throw new Error("Erro ao salvar cadastro.");
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-lg border dark:border-slate-800">
          <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Cadastro Realizado!</h2>
          <p className="text-slate-500">Seu perfil já faz parte do nosso banco de talentos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 overflow-hidden">
        <div className="bg-[#1d1e20] p-8 text-center border-b-[4px] border-maitre-gold">
          <h1 className="text-3xl font-bold text-white mb-2">Banco de Talentos</h1>
          <p className="text-slate-300">Envie seu currículo e a Maître preencherá seus dados.</p>
        </div>

        <div className="p-8">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-maitre-gold dark:hover:border-maitre-gold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all mb-8"
          >
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            {isParsing ? (
              <div className="flex flex-col items-center text-maitre-gold">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-medium">Lendo currículo usando IA...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center text-emerald-600">
                <CheckCircle size={40} className="mb-4" />
                <p className="font-medium">{file.name} carregado com sucesso!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <UploadCloud size={40} className="mb-4" />
                <p className="font-medium mb-1">Clique para enviar seu currículo (PDF)</p>
                <p className="text-xs">Nossos sistemas vão ler os dados para você.</p>
              </div>
            )}
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

          {/* Auto-filled Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sobrenome</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                <input
                  type="tel"
                  className="w-full p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-maitre-gold"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.email}
              className="w-full bg-[#1d1e20] hover:bg-[#37585d] disabled:opacity-50 text-white p-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={20} />}
              Confirmar Inscrição
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
