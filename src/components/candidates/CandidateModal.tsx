/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { getCandidateDetails, saveEvaluation } from "@/app/(dashboard)/jobs/[id]/board/candidate-actions";
import { User, FileText, CheckCircle, Mail, Phone, ExternalLink } from "lucide-react";

export default function CandidateModal({
  isOpen,
  onClose,
  candidate
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
}) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("resume");

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (isOpen && candidate?.id) {
        setLoading(true);
        const data = await getCandidateDetails(candidate.id);
        if (active) {
          setDetails(data);
          setLoading(false);
        }
      } else {
        setDetails(null);
        setFeedback("");
      }
    }
    loadData();
    return () => { active = false; };
  }, [isOpen, candidate]);

  const handleSave = async () => {
    if (!feedback.trim()) return;
    setSaving(true);
    await saveEvaluation(candidate.id, feedback, 5); // default rating 5 for now
    setFeedback("");
    // refresh details
    const data = await getCandidateDetails(candidate.id);
    setDetails(data);
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">
        
        {/* Left Side: Scorecard & Actions */}
        <div className="w-full md:w-[380px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{candidate?.name}</h2>
              {details && (
                <div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1"><Mail size={14}/> {details.candidate.email}</div>
                  {details.candidate.phone && <div className="flex items-center gap-1"><Phone size={14}/> {details.candidate.phone}</div>}
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30 mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-1">Aderência à Vaga</div>
                <div className="text-3xl font-black">{candidate?.score || 0}%</div>
              </div>
              <CheckCircle size={32} className="opacity-50" />
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Nova Avaliação
              </h3>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 min-h-[120px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all resize-none shadow-sm" 
                placeholder="Adicionar notas sobre a entrevista ou perfil..."
              />
              <button 
                onClick={handleSave}
                disabled={saving || !feedback.trim()}
                className="mt-3 w-full bg-[#c89650] hover:bg-[#b08040] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                {saving ? "Salvando..." : "Salvar Anotação"}
              </button>
            </div>

            {details?.evaluations?.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-sm">Histórico de Avaliações</h3>
                <div className="space-y-3">
                  {details.evaluations.map((ev: any) => (
                    <div key={ev.id} className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ev.evaluator?.name || "Recrutador"}</span>
                        <span className="text-xs text-slate-400">{new Date(ev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{ev.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side: Resume Viewer */}
        <div className="w-full md:flex-1 bg-slate-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-4 gap-6">
            <button 
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "resume" ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
              onClick={() => setActiveTab("resume")}
            >
              Currículo
            </button>
            <button 
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
              onClick={() => setActiveTab("profile")}
            >
              Resumo do Perfil
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#c89650] rounded-full animate-spin"></div>
              </div>
            ) : activeTab === "resume" ? (
              <div className="h-full border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-950 shadow-sm">
                <FileText size={48} className="mb-4 opacity-50" />
                <p className="font-medium text-slate-500">Visualizador de PDF não configurado</p>
                <p className="text-sm mt-1">O currículo original aparecerá aqui.</p>
                {details?.candidate?.linkedinUrl && (
                  <a href={details.candidate.linkedinUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-blue-600 hover:underline">
                    <ExternalLink size={16} /> Ver LinkedIn
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                  <User size={20} className="text-[#c89650]" />
                  Resumo Profissional
                </h3>
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                  {details?.candidate?.profileSummary ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{details.candidate.profileSummary}</p>
                  ) : (
                    <p className="italic opacity-70">Nenhum resumo fornecido pelo candidato.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
