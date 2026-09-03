"use client";

import React, { useState } from "react";
import { updateOrganization } from "../actions";
import {
  Loader2,
  Save,
  CheckCircle,
  ExternalLink,
  Building,
  Globe,
  FileText,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Users,
  Calendar,
  Layers,
  HeartHandshake,
  Search,
} from "lucide-react";
import { LinkedinIcon, InstagramIcon } from "@/components/ui/BrandIcons";
import Link from "next/link";

export type OrgFormData = {
  id: string;
  name: string;
  slug: string;
  role: string;
  legalName?: string;
  cnpj?: string;
  industry?: string;
  companySize?: string;
  foundedYear?: string;
  email?: string;
  phone?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  addressZipCode?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  aboutUs?: string;
  cultureValues?: string;
  logoUrl?: string;
  primaryColor?: string;
};

export default function OrgForm({ initialData }: { initialData: OrgFormData }) {
  const [formData, setFormData] = useState<OrgFormData>({
    ...initialData,
    primaryColor: initialData.primaryColor || "#D4AF37",
  });

  const [activeTab, setActiveTab] = useState<"general" | "contact" | "address" | "branding">("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = initialData.role === "SUPER_ADMIN" || initialData.role === "ADMIN";

  // Busca rápida de CEP via ViaCEP
  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        setIsSearchingCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            addressStreet: data.logradouro || prev.addressStreet,
            addressNeighborhood: data.bairro || prev.addressNeighborhood,
            addressCity: data.localidade || prev.addressCity,
            addressState: data.uf || prev.addressState,
          }));
        }
      } catch (e) {
        console.error("Erro ao buscar CEP:", e);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateOrganization({
        name: formData.name,
        slug: formData.slug,
        legalName: formData.legalName,
        cnpj: formData.cnpj,
        industry: formData.industry,
        companySize: formData.companySize,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
        email: formData.email,
        phone: formData.phone,
        websiteUrl: formData.websiteUrl,
        linkedinUrl: formData.linkedinUrl,
        instagramUrl: formData.instagramUrl,
        addressZipCode: formData.addressZipCode,
        addressStreet: formData.addressStreet,
        addressNumber: formData.addressNumber,
        addressComplement: formData.addressComplement,
        addressNeighborhood: formData.addressNeighborhood,
        addressCity: formData.addressCity,
        addressState: formData.addressState,
        aboutUs: formData.aboutUs,
        cultureValues: formData.cultureValues,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar o perfil da empresa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Mensagens de Sucesso ou Erro */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-2xl text-sm font-medium animate-in fade-in">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} /> Perfil da empresa atualizado com sucesso!
        </div>
      )}

      {!isAdmin && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs font-semibold">
          Você não possui permissão de Administrador para editar estas informações.
        </div>
      )}

      {/* Tabs de Navegação */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-maitre-gold text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building size={16} />
          <span>Institucional & Dados Fiscais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "contact"
              ? "bg-maitre-gold text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Mail size={16} />
          <span>Contato & Redes Sociais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("address")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "address"
              ? "bg-maitre-gold text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <MapPin size={16} />
          <span>Endereço Corporativo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "branding"
              ? "bg-maitre-gold text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles size={16} />
          <span>Marca & Apresentação</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ABA 1: GERAL & FISCAL */}
        {activeTab === "general" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building size={18} className="text-maitre-gold" />
              Identificação Institucional & Jurídica
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nome Fantasia */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nome Fantasia / Exibição *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Maître Consultoria"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Razão Social */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Razão Social (Pessoa Jurídica)
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.legalName || ""}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="ex: Maître Consultoria e Talentos Ltda."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  CNPJ
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.cnpj || ""}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Ramo / Setor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ramo / Setor de Atuação
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="ex: Consultoria de Recursos Humanos & Executive Search"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Porte da Empresa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Porte da Empresa
                </label>
                <select
                  disabled={!isAdmin}
                  value={formData.companySize || ""}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o porte...</option>
                  <option value="1-10">1 - 10 colaboradores (Pequeno porte / Boutique)</option>
                  <option value="11-50">11 - 50 colaboradores</option>
                  <option value="51-200">51 - 200 colaboradores</option>
                  <option value="201-500">201 - 500 colaboradores</option>
                  <option value="500+">Mais de 500 colaboradores (Grande porte)</option>
                </select>
              </div>

              {/* Ano de Fundação */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ano de Fundação
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.foundedYear || ""}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                  placeholder="ex: 2020"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>
            </div>

            {/* Slug URL */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Globe size={14} className="text-maitre-gold" />
                Identificador da Página Pública de Carreiras (Slug) *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.slug}
                onChange={(e) => {
                  const val = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/\s+/g, "-");
                  setFormData({ ...formData, slug: val });
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
              />
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 mt-2 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Página de Carreiras:{" "}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    /carreiras/{formData.slug || "..."}
                  </strong>
                </span>
                <Link
                  href={`/carreiras/${formData.slug}`}
                  target="_blank"
                  className="text-maitre-gold hover:underline flex items-center gap-1 font-bold"
                >
                  <ExternalLink size={13} /> Visualizar Página Pública
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: CONTATO & REDES */}
        {activeTab === "contact" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Mail size={18} className="text-maitre-gold" />
              Canais Oficiais de Contato & Presença Digital
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* E-mail Institucional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" />
                  E-mail Corporativo de Contato
                </label>
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ex: contato@maitrework.com.br"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  Telefone / WhatsApp Comercial
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="ex: (11) 98765-4321"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe size={14} className="text-slate-400" />
                  Website Institucional
                </label>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={formData.websiteUrl || ""}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="ex: https://maitrework.com.br"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkedinIcon size={14} className="text-blue-500" />
                  LinkedIn Institucional
                </label>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={formData.linkedinUrl || ""}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="ex: https://linkedin.com/company/maitre-consultoria"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <InstagramIcon size={14} className="text-pink-500" />
                  Instagram da Empresa
                </label>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={formData.instagramUrl || ""}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="ex: https://instagram.com/maitreconsultoria"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: ENDEREÇO */}
        {activeTab === "address" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MapPin size={18} className="text-maitre-gold" />
              Sede & Endereço Corporativo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* CEP */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>CEP</span>
                  {isSearchingCep && <Loader2 size={12} className="animate-spin text-maitre-gold" />}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    maxLength={9}
                    value={formData.addressZipCode || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, addressZipCode: val });
                      if (val.replace(/\D/g, "").length === 8) {
                        handleCepLookup(val);
                      }
                    }}
                    placeholder="00000-000"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                  />
                  <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Logradouro / Rua */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Logradouro / Avenida / Rua
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.addressStreet || ""}
                  onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                  placeholder="ex: Avenida Paulista"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Número */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Número
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.addressNumber || ""}
                  onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                  placeholder="ex: 1000"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Complemento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Complemento / Sala / Andar
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.addressComplement || ""}
                  onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                  placeholder="ex: Cj. 1204 - Bloco B"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Bairro */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Bairro
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.addressNeighborhood || ""}
                  onChange={(e) => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                  placeholder="ex: Bela Vista"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Cidade */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Cidade
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.addressCity || ""}
                  onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                  placeholder="ex: São Paulo"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Estado (UF) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  maxLength={2}
                  value={formData.addressState || ""}
                  onChange={(e) => setFormData({ ...formData, addressState: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium uppercase disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: BRANDING, SOBRE & CULTURA */}
        {activeTab === "branding" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles size={18} className="text-maitre-gold" />
              Identidade Visual & Apresentação Institucional
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  URL do Logotipo Oficial
                </label>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={formData.logoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60"
                />
              </div>

              {/* Cor Primária */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Cor Primária da Marca
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!isAdmin}
                    value={formData.primaryColor || "#D4AF37"}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-11 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.primaryColor || "#D4AF37"}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Sobre a Empresa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sobre Nós / Apresentação da Maître Consultoria
              </label>
              <textarea
                rows={4}
                disabled={!isAdmin}
                value={formData.aboutUs || ""}
                onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                placeholder="A Maître Consultoria é referência em atração de talentos de alta performance, executive search e consultoria estratégica de gestão de pessoas..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60 leading-relaxed"
              />
            </div>

            {/* Missão, Visão e Valores */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Cultura, Propósito & Valores Institucionais
              </label>
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={formData.cultureValues || ""}
                onChange={(e) => setFormData({ ...formData, cultureValues: e.target.value })}
                placeholder="Conectar os melhores talentos às maiores oportunidades com excelência, ética, empatia e inovação contínua."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium disabled:opacity-60 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Botão de Salvar Flutuante ou no Rodapé */}
        {isAdmin && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 px-7 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isLoading ? "Salvando Perfil..." : "Salvar Alterações da Empresa"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
