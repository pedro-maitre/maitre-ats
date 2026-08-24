/**
 * Motor de Avaliação Heurística e Fit 3D - Maître ATS
 * Calcula Salary Fit, Skills Match e Fit Geral com base nos dados estruturados da vaga e candidato.
 */

export type SalaryFitStatus = "WITHIN_BUDGET" | "SLIGHTLY_ABOVE" | "OUT_OF_BUDGET" | "NOT_SPECIFIED";

export type SalaryFitResult = {
  status: SalaryFitStatus;
  label: string;
  diffAmount: number | null; // Diferença em R$ em relação ao teto ou base
  diffPercentage: number | null; // Diferença percentual
  isKnockout: boolean;
};

export type SkillsMatchResult = {
  score: number; // 0 a 100
  matchedSkills: string[];
  missingSkills: string[];
  totalExpectedSkills: number;
};

export type OverallFitCategory = "ALTO_FIT" | "MEDIO_FIT" | "BAIXO_FIT";

export type ApplicationEvaluation = {
  salaryFit: SalaryFitResult;
  skillsMatch: SkillsMatchResult;
  fitCategory: OverallFitCategory;
  prioritySuggestion: "PRIORIZADO" | "NORMAL" | "DUVIDA";
  summaryBadge: {
    color: string;
    bg: string;
    border: string;
    text: string;
    label: string;
  };
};

/**
 * 1. Calcula o Salary Fit comparando a pretensão com a faixa salarial da vaga.
 */
export function calculateSalaryFit(
  salaryExpectation: number | null | undefined,
  jobSalaryMin: number | null | undefined,
  jobSalaryMax: number | null | undefined
): SalaryFitResult {
  if (!salaryExpectation || salaryExpectation <= 0) {
    return {
      status: "NOT_SPECIFIED",
      label: "Não informada",
      diffAmount: null,
      diffPercentage: null,
      isKnockout: false,
    };
  }

  // Se a vaga não tem teto definido
  if (!jobSalaryMin && !jobSalaryMax) {
    return {
      status: "NOT_SPECIFIED",
      label: "Vaga sem faixa cadastrada",
      diffAmount: null,
      diffPercentage: null,
      isKnockout: false,
    };
  }

  const maxSalary = jobSalaryMax || jobSalaryMin || 0;
  const minSalary = jobSalaryMin || 0;

  // Dentro do orçamento (pretensão <= teto)
  if (salaryExpectation <= maxSalary) {
    const diff = maxSalary - salaryExpectation;
    return {
      status: "WITHIN_BUDGET",
      label: minSalary > 0 && salaryExpectation < minSalary ? "Abaixo do piso" : "Dentro do orçamento",
      diffAmount: -diff,
      diffPercentage: maxSalary > 0 ? -Math.round((diff / maxSalary) * 100) : 0,
      isKnockout: false,
    };
  }

  // Acima do teto: calcular tolerância de 15%
  const toleranceMax = maxSalary * 1.15;
  const diffAbove = salaryExpectation - maxSalary;
  const percentageAbove = Math.round((diffAbove / maxSalary) * 100);

  if (salaryExpectation <= toleranceMax) {
    return {
      status: "SLIGHTLY_ABOVE",
      label: `+${percentageAbove}% acima do teto`,
      diffAmount: diffAbove,
      diffPercentage: percentageAbove,
      isKnockout: false,
    };
  }

  // Mais de 15% acima do teto: Fora da Faixa (Alerta / Knockout potencial)
  return {
    status: "OUT_OF_BUDGET",
    label: `+${percentageAbove}% fora da faixa`,
    diffAmount: diffAbove,
    diffPercentage: percentageAbove,
    isKnockout: true,
  };
}

/**
 * Stopwords em português para filtragem de keywords
 */
const STOP_WORDS = new Set([
  "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "é", "com", "não", "uma", "os", "no",
  "se", "na", "por", "mais", "as", "dos", "como", "mas", "foi", "ao", "ele", "das", "tem", "à",
  "seu", "sua", "ou", "ser", "quando", "muito", "nos", "já", "eu", "também", "só", "pelo", "pela",
  "até", "isso", "ela", "entre", "era", "depois", "sem", "mesmo", "aos", "ter", "seus", "quem", "nas",
  "me", "esse", "eles", "estão", "você", "tinha", "foram", "essa", "num", "nem", "suas", "meu", "às",
  "minha", "têm", "numa", "pelos", "elas", "havia", "seja", "qual", "será", "nós", "tenho", "lhe",
  "deles", "essas", "esses", "pelas", "este", "fosse", "dele", "tu", "te", "vocês", "vos", "lhes",
  "meus", "minhas", "teu", "tua", "teus", "tuas", "nosso", "nossa", "nossos", "nossas", "dela",
  "delas", "esta", "estes", "estas", "aquele", "aquela", "aqueles", "aquelas", "isto", "aquilo",
  "estou", "está", "estamos", "estão", "estive", "esteve", "estivemos", "estiveram", "estava",
  "estávamos", "estavam", "experiência", "conhecimento", "habilidade", "atuação", "responsável",
  "trabalho", "empresa", "área", "vaga", "perfil", "requisitos", "diferenciais", "atividades",
]);

/**
 * Extrai palavras-chave essenciais de um texto (título, descrição, departamento).
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Normalizar texto
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  // Remover duplicatas
  return Array.from(new Set(words));
}

/**
 * 2. Calcula a aderência de Competências / Palavras-chave (Skills Match).
 */
export function calculateSkillsMatch(
  candidateTags: string[] | string | null | undefined,
  candidateSummary: string | null | undefined,
  jobTitle: string,
  jobDescription: string,
  jobDepartment?: string | null,
  requiredSkills?: string | null
): SkillsMatchResult {
  // 1. Processar tags do candidato
  let parsedCandidateTags: string[] = [];
  if (Array.isArray(candidateTags)) {
    parsedCandidateTags = candidateTags;
  } else if (typeof candidateTags === "string" && candidateTags.trim()) {
    try {
      const parsed = JSON.parse(candidateTags);
      parsedCandidateTags = Array.isArray(parsed) ? parsed : candidateTags.split(",");
    } catch {
      parsedCandidateTags = candidateTags.split(",");
    }
  }

  const candidateKeywords = new Set<string>();
  parsedCandidateTags.forEach((t) => {
    extractKeywords(t).forEach((kw) => candidateKeywords.add(kw));
  });

  if (candidateSummary) {
    extractKeywords(candidateSummary).forEach((kw) => candidateKeywords.add(kw));
  }

  // 2. Extrair requisitos mandatórios explícitos (requiredSkills)
  let explicitRequiredKeywords: string[] = [];
  if (requiredSkills) {
    try {
      const parsed = JSON.parse(requiredSkills);
      const list = Array.isArray(parsed) ? parsed : requiredSkills.split(",");
      explicitRequiredKeywords = list.flatMap((s: string) => extractKeywords(s));
    } catch {
      explicitRequiredKeywords = requiredSkills.split(",").flatMap((s) => extractKeywords(s));
    }
  }

  // 3. Extrair requisitos esperados da vaga (título tem peso maior)
  const titleKeywords = extractKeywords(jobTitle);
  const departmentKeywords = jobDepartment ? extractKeywords(jobDepartment) : [];
  const descriptionKeywords = extractKeywords(jobDescription).slice(0, 30); // Top 30 palavras-chave

  const expectedKeywords = Array.from(
    new Set([...explicitRequiredKeywords, ...titleKeywords, ...departmentKeywords, ...descriptionKeywords])
  );

  if (expectedKeywords.length === 0) {
    return {
      score: 80,
      matchedSkills: parsedCandidateTags,
      missingSkills: [],
      totalExpectedSkills: 0,
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  expectedKeywords.forEach((kw) => {
    if (candidateKeywords.has(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  // Cálculo de pontuação com piso baseado na existência de tags e perfil
  let rawScore = Math.round((matched.length / expectedKeywords.length) * 100);
  
  // Bônus se houver tags explícitas correspondentes ao título ou requiredSkills
  const explicitMatches = explicitRequiredKeywords.filter((rk) => candidateKeywords.has(rk)).length;
  if (explicitRequiredKeywords.length > 0) {
    const explicitCoverage = explicitMatches / explicitRequiredKeywords.length;
    rawScore = Math.round(rawScore * 0.4 + explicitCoverage * 100 * 0.6);
  } else {
    const titleMatches = titleKeywords.filter((tk) => candidateKeywords.has(tk)).length;
    if (titleMatches > 0) {
      rawScore = Math.min(100, rawScore + titleMatches * 15);
    }
  }

  // Se o candidato tem bom perfil mas poucas keywords exatas mapeadas, dar uma pontuação de base
  if (parsedCandidateTags.length >= 3 && rawScore < 50) {
    rawScore = Math.min(75, rawScore + 30);
  }

  const finalScore = Math.max(15, Math.min(100, rawScore));

  return {
    score: finalScore,
    matchedSkills: matched.slice(0, 8),
    missingSkills: missing.slice(0, 6),
    totalExpectedSkills: expectedKeywords.length,
  };
}

/**
 * 3. Avalia o Fit Global do Candidato (3-Dimensional Fit Engine).
 */
export function evaluateApplicationFit(
  job: {
    title: string;
    description: string;
    department?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    requiredSkills?: string | null;
  },
  candidate: {
    tags?: string | null;
    profileSummary?: string | null;
  },
  application: {
    salaryExpectation?: number | null;
  }
): ApplicationEvaluation {
  const salaryFit = calculateSalaryFit(
    application.salaryExpectation,
    job.salaryMin,
    job.salaryMax
  );

  const skillsMatch = calculateSkillsMatch(
    candidate.tags,
    candidate.profileSummary,
    job.title,
    job.description,
    job.department,
    job.requiredSkills
  );

  // Determinação da Categoria Global de Fit
  let fitCategory: OverallFitCategory = "MEDIO_FIT";
  let prioritySuggestion: "PRIORIZADO" | "NORMAL" | "DUVIDA" = "NORMAL";

  if (salaryFit.status === "OUT_OF_BUDGET") {
    fitCategory = "BAIXO_FIT";
    prioritySuggestion = "DUVIDA";
  } else if (salaryFit.status === "WITHIN_BUDGET" && skillsMatch.score >= 70) {
    fitCategory = "ALTO_FIT";
    prioritySuggestion = "PRIORIZADO";
  } else if (skillsMatch.score >= 80) {
    fitCategory = "ALTO_FIT";
    prioritySuggestion = "PRIORIZADO";
  } else if (skillsMatch.score < 40) {
    fitCategory = "BAIXO_FIT";
    prioritySuggestion = "DUVIDA";
  } else {
    fitCategory = "MEDIO_FIT";
    prioritySuggestion = "NORMAL";
  }

  // Estilização do Badge de Fit
  const summaryBadge = getFitBadgeStyle(fitCategory, salaryFit.status);

  return {
    salaryFit,
    skillsMatch,
    fitCategory,
    prioritySuggestion,
    summaryBadge,
  };
}

/**
 * Retorna as classes visuais para os badges de Fit.
 */
export function getFitBadgeStyle(
  fitCategory: OverallFitCategory,
  salaryStatus?: SalaryFitStatus
) {
  if (fitCategory === "ALTO_FIT") {
    return {
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
      label: "Alto Fit",
    };
  }

  if (fitCategory === "MEDIO_FIT") {
    return {
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-400",
      label: "Médio Fit",
    };
  }

  return {
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    label: salaryStatus === "OUT_OF_BUDGET" ? "Fora do Orçamento" : "Baixo Fit",
  };
}
