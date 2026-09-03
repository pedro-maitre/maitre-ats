"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  Image as ImageIcon,
  Type,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  Eye,
} from "lucide-react";
import { updateClientBranding } from "@/app/(dashboard)/clients/actions";

interface ClientBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    bannerHeadline?: string | null;
    bannerSubheadline?: string | null;
    aboutUs?: string | null;
    websiteUrl?: string | null;
  } | null;
  onSuccess?: () => void;
}

const COLOR_PRESETS = [
  { name: "Dourado Maître", color: "#D4AF37" },
  { name: "Azul Royal Tech", color: "#2563EB" },
  { name: "Esmeralda FinTech", color: "#059669" },
  { name: "Roxo Inovação", color: "#7C3AED" },
  { name: "Laranja Coral", color: "#EA580C" },
  { name: "Vermelho Rubi", color: "#E11D48" },
  { name: "Ciano Moderno", color: "#0891B2" },
  { name: "Grafite Luxo", color: "#334155" },
];

export default function ClientBrandingModal({
  isOpen,
  onClose,
  client,
  onSuccess,
}: ClientBrandingModalProps) {
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerHeadline, setBannerHeadline] = useState("");
  const [bannerSubheadline, setBannerSubheadline] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (client) {
      setPrimaryColor(client.primaryColor || "#D4AF37");
      setLogoUrl(client.logoUrl || "");
      setBannerHeadline(client.bannerHeadline || `Construa sua história na ${client.name}`);
      setBannerSubheadline(
        client.bannerSubheadline ||
          "Buscamos pessoas talentosas e apaixonadas por inovação. Conheça nossas vagas disponíveis e acompanhe seu processo seletivo em tempo real."
      );
      setAboutUs(client.aboutUs || "");
      setWebsiteUrl(client.websiteUrl || "");
    }
    setError("");
    setSuccess("");
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("primaryColor", primaryColor);
    formData.append("logoUrl", logoUrl);
    formData.append("bannerHeadline", bannerHeadline);
    formData.append("bannerSubheadline", bannerSubheadline);
    formData.append("aboutUs", aboutUs);
    formData.append("websiteUrl", websiteUrl);

    try {
      const res = await updateClientBranding(client.id, formData);
      if (!res.success) throw new Error(res.error);

      setSuccess("Personalização White-Label salva com sucesso!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar branding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Branding White-Label • {client.name}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Personalize cores, logo e mensagens do portal /carreiras/{client.slug}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de personalização white-label"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. Cores da Marca */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette size={14} className="text-maitre-gold" />
              <span>Cor Primária da Identidade Visual</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setPrimaryColor(preset.color)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    primaryColor.toLowerCase() === preset.color.toLowerCase()
                      ? "border-white text-white shadow-md scale-105"
                      : "border-slate-700 text-slate-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor:
                      primaryColor.toLowerCase() === preset.color.toLowerCase()
                        ? preset.color
                        : "transparent",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/40"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 pl-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-700 bg-transparent"
                  title="Escolher cor personalizada"
                />
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                  {primaryColor}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Logotipo da Empresa */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-maitre-gold" />
              <span>URL do Logotipo da Empresa</span>
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com/logo.png (ou SVG transparente)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-maitre-gold font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Caso vazio, o sistema exibirá o ícone institucional com as iniciais da empresa.
            </p>
          </div>

          {/* 3. Textos do Hero Banner */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Type size={14} className="text-maitre-gold" />
                <span>Título Principal do Portal (Hero Headline)</span>
              </label>
              <input
                type="text"
                value={bannerHeadline}
                onChange={(e) => setBannerHeadline(e.target.value)}
                placeholder={`Construa sua história na ${client.name}`}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-maitre-gold font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Subtítulo / Mensagem de Atração de Talentos
              </label>
              <textarea
                rows={2}
                value={bannerSubheadline}
                onChange={(e) => setBannerSubheadline(e.target.value)}
                placeholder="Buscamos profissionais apaixonados por inovação..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-maitre-gold leading-relaxed"
              />
            </div>
          </div>

          {/* 4. Sobre a Empresa & Site Institucional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={14} className="text-maitre-gold" />
                <span>Sobre a Empresa / Cultura</span>
              </label>
              <textarea
                rows={3}
                value={aboutUs}
                onChange={(e) => setAboutUs(e.target.value)}
                placeholder="Conte sobre a missão, valores e diferenciais da organização..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-maitre-gold leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe size={14} className="text-maitre-gold" />
                <span>Site Institucional da Empresa</span>
              </label>
              <input
                type="url"
                placeholder="https://www.empresa.com.br"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-maitre-gold font-mono"
              />
            </div>
          </div>

          {/* 5. Prévia ao Vivo do Banner */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Eye size={14} />
              <span>Prévia do Hero Banner White-Label</span>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#1d1e20] via-slate-900 to-[#121316] text-white p-6 border border-slate-800 shadow-inner relative overflow-hidden text-center">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="relative z-10 space-y-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor,
                  }}
                >
                  <Sparkles size={11} />
                  Oportunidades em Aberto
                </div>

                <h3 className="text-lg font-black text-white leading-tight">
                  {bannerHeadline || `Construa sua história na ${client.name}`}
                </h3>

                <p className="text-xs text-slate-300 max-w-md mx-auto line-clamp-2 leading-relaxed">
                  {bannerSubheadline || "Buscamos pessoas talentosas e apaixonadas por inovação."}
                </p>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-xl text-xs font-black text-slate-950 shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Ver Vagas Abertas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Salvar Customização</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
