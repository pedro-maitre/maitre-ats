"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  MapPin,
  AlignLeft,
  ArrowLeft,
  DollarSign,
  UserCheck,
  Tag,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Archive,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Layers,
  Award,
} from "lucide-react";
import { updateJobFull, toggleJobStatus } from "@/app/(dashboard)/jobs/[id]/edit/actions";
import { deleteJob } from "@/app/actions/delete-actions";

export type RecruiterOption = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export type StageData = {
  id: string;
  name: string;
  order: number;
  candidatesCount: number;
  isDeleted?: boolean;
};

export type JobEditData = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  seniority: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  description: string;
  recruiterId: string | null;
  requiredSkills: string | null;
  organizationSlug: string;
  stages: StageData[];
};

export default function JobEditForm({
  job,
  recruiters,
  userRole,
}: {
  job: JobEditData;
  recruiters: RecruiterOption[];
  userRole?: string;
}) {
  const router = useRouter();
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  // Form State
  const [title, setTitle] = useState(job.title);
  const [department, setDepartment] = useState(job.department || "");
  const [location, setLocation] = useState(job.location || "");
  const [employmentType, setEmploymentType] = useState(job.employmentType || "CLT");
  const [seniority, setSeniority] = useState(job.seniority || "PLENO");
  const [salaryMin, setSalaryMin] = useState<string>(job.salaryMin ? String(job.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState<string>(job.salaryMax ? String(job.salaryMax) : "");
  const [status, setStatus] = useState<string>(job.status || "OPEN");
  const [description, setDescription] = useState(job.description);
  const [recruiterId, setRecruiterId] = useState<string>(job.recruiterId || "none");

  // Killer Questions State
  const [killerQuestions, setKillerQuestions] = useState<{
    id: string;
    question: string;
    type: "BOOLEAN" | "TEXT";
    isMandatory: boolean;
    disqualifyIfNo: boolean;
  }[]>(() => {
    if (!job.requiredSkills) return [];
    try {
      const parsed = JSON.parse(job.requiredSkills);
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object") {
        return parsed.killerQuestions || [];
      }
    } catch {
      return [];
    }
    return [];
  });

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"BOOLEAN" | "TEXT">("BOOLEAN");
  const [newQuestionMandatory, setNewQuestionMandatory] = useState(true);
  const [newQuestionDisqualify, setNewQuestionDisqualify] = useState(false);

  // Skills Tags State
  const [skillsList, setSkillsList] = useState<string[]>(() => {
    if (!job.requiredSkills) return [];
    try {
      const parsed = JSON.parse(job.requiredSkills);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return parsed.tags || [];
      return job.requiredSkills.split(",").map((s) => s.trim());
    } catch {
      return job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean);
    }
  });
  const [newSkillInput, setNewSkillInput] = useState("");

  // Stages Management State
  const [stages, setStages] = useState<StageData[]>(job.stages);
  const [newStageName, setNewStageName] = useState("");

  // Action status state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Danger Zone states
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Skill Add / Remove
  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (("key" in e && (e.key === "Enter" || e.key === ",")) || e.type === "click") {
      e.preventDefault();
      const trimmed = newSkillInput.trim().replace(/,/g, "");
      if (trimmed && !skillsList.includes(trimmed)) {
        setSkillsList([...skillsList, trimmed]);
        setNewSkillInput("");
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  // Killer Questions Actions
  const handleAddKillerQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ = {
      id: `kq-${Date.now()}`,
      question: newQuestionText.trim(),
      type: newQuestionType,
      isMandatory: newQuestionMandatory,
      disqualifyIfNo: newQuestionDisqualify,
    };
    setKillerQuestions([...killerQuestions, newQ]);
    setNewQuestionText("");
    setNewQuestionDisqualify(false);
  };

  const handleRemoveKillerQuestion = (idToRemove: string) => {
    setKillerQuestions(killerQuestions.filter((q) => q.id !== idToRemove));
  };

  // Stages Actions
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage: StageData = {
      id: `temp-${Date.now()}`,
      name: newStageName.trim(),
      order: stages.length,
      candidatesCount: 0,
    };
    setStages([...stages, newStage]);
    setNewStageName("");
  };

  const handleRenameStage = (index: number, newName: string) => {
    const updated = [...stages];
    updated[index].name = newName;
    setStages(updated);
  };

  const handleMoveStage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalcular ordens
    updated.forEach((st, idx) => {
      st.order = idx;
    });

    setStages(updated);
  };

  const handleDeleteStage = (index: number) => {
    const stage = stages[index];
    if (stage.candidatesCount > 0) {
      alert(`Não é possível remover a etapa "${stage.name}" pois ela possui ${stage.candidatesCount} candidato(s). Mova os candidatos antes de excluir.`);
      return;
    }
    const updated = stages.filter((_, idx) => idx !== index);
    updated.forEach((st, idx) => {
      st.order = idx;
    });
    setStages(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSaveSuccess(false);

    try {
      const res = await updateJobFull(job.id, {
        title,
        department,
        location,
        employmentType,
        seniority,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        status,
        description,
        recruiterId: recruiterId === "none" ? null : recruiterId,
        requiredSkills: JSON.stringify({
          tags: skillsList,
          killerQuestions: killerQuestions,
        }),
        stages: stages.map((st) => ({
          id: st.id.startsWith("temp-") ? undefined : st.id,
          name: st.name,
          order: st.order,
        })),
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        router.push(`/jobs/${job.id}/board`);
      } else {
        setErrorMsg(res.error || "Erro ao atualizar a vaga.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Quick Status (Pause / Open / Close)
  const handleQuickStatusChange = async (newStatus: "OPEN" | "PAUSED" | "CLOSED") => {
    setIsTogglingStatus(true);
    try {
      const res = await toggleJobStatus(job.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.error || "Erro ao alterar status.");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Permanent Delete
  const handleDeleteJob = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);

    try {
      const res = await deleteJob(job.id);
      if (res.success) {
        router.push("/jobs");
      } else {
        alert(res.error || "Erro ao excluir vaga.");
        setIsDeleting(false);
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/jobs/${job.id}/board`}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Editar Vaga
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Gerencie os parâmetros, requisitos, etapas do funil e ciclo de vida da oportunidade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {job.organizationSlug && (
            <Link
              href={`/carreiras/${job.organizationSlug}/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-maitre-gold hover:underline text-xs font-bold bg-maitre-gold/10 hover:bg-maitre-gold/20 px-3.5 py-2 rounded-xl border border-maitre-gold/20 transition-all"
            >
              <ExternalLink size={14} />
              <span>Ver no Portal</span>
            </Link>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <span>Alterações salvas com sucesso!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SEÇÃO 1: STATUS & INFORMAÇÕES GERAIS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-maitre-gold" />
                1. Informações da Posição & Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina o título principal, status de publicação e o recrutador encarregado.
              </p>
            </div>

            {/* Status Selector Pill */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${
                  status === "OPEN"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : status === "PAUSED"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                }`}
              >
                <option value="OPEN">🟢 Vaga Aberta (Inscrições Ativas)</option>
                <option value="PAUSED">🟡 Vaga Pausada (Suspensa)</option>
                <option value="CLOSED">⚪ Vaga Encerrada (Concluída)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Título da Vaga *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Tech Lead Cloud & DevOps"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck size={14} className="text-maitre-gold" />
                Recrutador Responsável
              </label>
              <select
                value={recruiterId}
                onChange={(e) => setRecruiterId(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="none">-- Sem recrutador atribuído --</option>
                {recruiters.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    👤 {rec.name || rec.email} ({rec.role === "SUPER_ADMIN" ? "Admin Master" : rec.role === "ADMIN" ? "Admin" : "Recrutador"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: PARÂMETROS DE CONTRATAÇÃO & SENIORIDADE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-maitre-gold" />
              2. Parâmetros de Contratação & Enquadramento
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurações de modelo de trabalho, regime trabalhista e nível de senioridade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Regime de Contratação
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="CLT">CLT (Efetivo)</option>
                <option value="PJ">PJ (Prestador de Serviços)</option>
                <option value="ESTAGIO">Estágio</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="COOPERADO">Cooperado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nível de Senioridade
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="ESTAGIO">Estágio</option>
                <option value="JUNIOR">Júnior</option>
                <option value="PLENO">Pleno</option>
                <option value="SENIOR">Sênior</option>
                <option value="ESPECIALISTA">Especialista</option>
                <option value="LEAD">Lead / Coordenação</option>
                <option value="DIRETORIA">Diretoria / C-Level</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={14} className="text-maitre-gold" />
                Departamento
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ex: Engenharia & Tech"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin size={14} className="text-maitre-gold" />
                Localização / Modelo
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ex: Remoto ou São Paulo - SP"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: FAIXA SALARIAL (SALARY FIT) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" />
              3. Faixa Salarial & Motor de Salary Fit
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Os valores abaixo são utilizados pelo motor de inteligência para gerar alertas de tolerância (+15%) e descarte salarial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Piso Salarial Mínimo (R$)
              </label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="ex: 9000"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Teto Orçamentário Máximo (R$)
              </label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="ex: 14000"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: COMPETÊNCIAS MANDATÓRIAS & DESCRIÇÃO */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Tag size={18} className="text-maitre-gold" />
              4. Competências Mandatórias & Descrição da Vaga
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Palavras-chave e habilidades que o motor de Fit 3D priorizará durante a triagem automática.
            </p>
          </div>

          {/* Tags Builder */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Competências & Tecnologias Obrigatórias (Pressione Enter ou vírgula para adicionar)
            </label>

            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 min-h-[50px]">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-maitre-gold/15 text-maitre-gold border border-maitre-gold/30 text-xs font-bold"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-500 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}

              <div className="flex-1 min-w-[180px] flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Ex: React, Node.js, Kubernetes..."
                  className="w-full bg-transparent text-sm outline-none px-2 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-maitre-gold hover:text-slate-950 transition-all cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlignLeft size={14} className="text-maitre-gold" />
              Descrição Detalhada & Requisitos da Vaga *
            </label>
            <textarea
              required
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as responsabilidades, principais entregas, requisitos mandatórios e diferenciais..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-maitre-gold outline-none transition-all text-sm font-medium resize-y"
            />
          </div>
        </div>

        {/* SEÇÃO 5: PERGUNTAS DE TRIAGEM CUSTOMIZADAS (KILLER QUESTIONS) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />
                5. Perguntas de Triagem & Killer Questions (Eliminatórias)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perguntas respondidas pelo candidato durante a inscrição para pré-qualificação e desclassificação automática.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {killerQuestions.length} {killerQuestions.length === 1 ? "pergunta ativa" : "perguntas ativas"}
            </span>
          </div>

          {/* Lista de Perguntas Criadas */}
          <div className="space-y-3">
            {killerQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {q.question}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        Tipo: {q.type === "BOOLEAN" ? "Sim / Não" : "Texto Curto"}
                      </span>
                      {q.isMandatory && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          Obrigatória
                        </span>
                      )}
                      {q.disqualifyIfNo && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                          ⚠️ Eliminatória se responder &ldquo;Não&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveKillerQuestion(q.id)}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                  title="Remover pergunta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {killerQuestions.length === 0 && (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                Nenhuma pergunta de triagem adicionada. Adicione perguntas para qualificar candidatos automaticamente.
              </div>
            )}
          </div>

          {/* Adicionar Nova Pergunta */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Adicionar Nova Pergunta
            </h4>

            <div className="space-y-3">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Ex: Possui disponibilidade para início imediato? / Possui Inglês avançado?"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-maitre-gold"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={newQuestionType === "BOOLEAN"}
                      onChange={() => setNewQuestionType("BOOLEAN")}
                      className="text-maitre-gold focus:ring-maitre-gold"
                    />
                    <span>Sim / Não</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={newQuestionType === "TEXT"}
                      onChange={() => setNewQuestionType("TEXT")}
                      className="text-maitre-gold focus:ring-maitre-gold"
                    />
                    <span>Resposta de Texto</span>
                  </label>

                  {newQuestionType === "BOOLEAN" && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-rose-600 dark:text-rose-400 font-bold ml-2">
                      <input
                        type="checkbox"
                        checked={newQuestionDisqualify}
                        onChange={(e) => setNewQuestionDisqualify(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Eliminatória se responder &ldquo;Não&rdquo;</span>
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddKillerQuestion}
                  disabled={!newQuestionText.trim()}
                  className="px-4 py-2 rounded-xl bg-maitre-gold hover:bg-maitre-gold-hover text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Plus size={14} />
                  <span>Incluir Pergunta</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 6: PERSONALIZADOR DE ETAPAS DO FUNIL (STAGES BUILDER) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-maitre-gold" />
              6. Personalizador de Etapas do Processo Seletivo (Funil)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure, reordene ou adicione colunas customizadas ao quadro Kanban e à Triagem desta vaga.
            </p>
          </div>

          {/* Stages List */}
          <div className="space-y-3">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40"
              >
                <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => handleRenameStage(idx, e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-maitre-gold"
                />

                <span className="text-xs font-semibold text-slate-400 px-2 shrink-0">
                  {stage.candidatesCount} {stage.candidatesCount === 1 ? "candidato" : "candidatos"}
                </span>

                {/* Move Up/Down Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveStage(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveStage(idx, "down")}
                    disabled={idx === stages.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteStage(idx)}
                    disabled={stage.candidatesCount > 0 || stages.length <= 2}
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 cursor-pointer transition-colors"
                    title={
                      stage.candidatesCount > 0
                        ? "Possui candidatos. Não pode ser excluída."
                        : "Excluir etapa"
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Stage Box */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Nome da nova etapa (ex: Teste Técnico, Entrevista com Gestor...)"
              className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-maitre-gold"
            />
            <button
              type="button"
              onClick={handleAddStage}
              className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-maitre-gold hover:text-slate-950 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Adicionar Etapa</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/jobs/${job.id}/board`}
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 px-8 py-3 rounded-xl font-black text-sm shadow-lg transition-all active:scale-98 cursor-pointer flex items-center gap-2"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            <span>Salvar Todas as Alterações</span>
          </button>
        </div>
      </form>

      {/* SEÇÃO 6: GESTÃO DE CICLO DE VIDA & ZONA DE PERIGO */}
      <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-6 sm:p-8 border border-red-200 dark:border-red-900/40 space-y-6">
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-600" />
            6. Gestão de Ciclo de Vida & Ações Críticas
          </h2>
          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
            Pausar, encerrar ou excluir permanentemente o processo seletivo desta vaga.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Pausar / Reabrir */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {status === "PAUSED" ? "Reativar Inscrições" : "Pausar Inscrições"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {status === "PAUSED"
                  ? "A vaga voltará a aceitar candidaturas no portal público."
                  : "Suspende temporariamente novas inscrições pelo portal."}
              </p>
            </div>
            <button
              type="button"
              disabled={isTogglingStatus}
              onClick={() => handleQuickStatusChange(status === "PAUSED" ? "OPEN" : "PAUSED")}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                status === "PAUSED"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {isTogglingStatus ? (
                <Loader2 size={14} className="animate-spin" />
              ) : status === "PAUSED" ? (
                <PlayCircle size={15} />
              ) : (
                <PauseCircle size={15} />
              )}
              <span>{status === "PAUSED" ? "Reabrir Vaga" : "Pausar Vaga"}</span>
            </button>
          </div>

          {/* Encerrar / Arquivar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Encerrar Vaga
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Conclui o processo seletivo mantendo todo o histórico de candidatos intacto.
              </p>
            </div>
            <button
              type="button"
              disabled={isTogglingStatus || status === "CLOSED"}
              onClick={() => handleQuickStatusChange("CLOSED")}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Archive size={15} />
              <span>{status === "CLOSED" ? "Vaga Já Encerrada" : "Encerrar Vaga"}</span>
            </button>
          </div>

          {/* Excluir Definitivamente */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-red-200 dark:border-red-900/60 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                Excluir Vaga Definitivamente
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Remove a vaga, suas etapas e o vínculo com os candidatos permanentemente.
              </p>
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Excluir Vaga</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Apenas Admin Master pode excluir vagas.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Permanent Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Confirmar Exclusão Definitiva?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Você está prestes a excluir a vaga{" "}
                <strong className="text-slate-900 dark:text-white font-bold">
                  "{job.title}"
                </strong>
                . Esta ação não poderá ser desfeita e removerá todas as etapas e candidaturas vinculadas.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteJob}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                <span>Sim, Excluir Vaga</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
