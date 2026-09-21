/**
 * Motor de Avaliação Heurística e Fit 3D - Maître Conecta
 * Calcula Salary Fit, Skills Match e Fit Geral com base nos dados estruturados da vaga e candidato.
 */
import { getTypeSafeClient, score, choice, noul } from "./typesafe";

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

export type SemanticFitDetails = {
  model: string;
  experienceScoreRaw: number; // 0 a 3
  experienceScoreNormalized: number; // 0 a 100
  experienceConfidence: number;
  experienceProbabilities: Record<string, number>;
  seniorityDecision: "below" | "aligned" | "above" | "unclear";
  seniorityConfidence: number;
  knockoutProbability: number;
  isSemanticEvaluated: boolean;
};

export type ApplicationEvaluation = {
  overallScore: number;
  overallCategory: OverallFitCategory;
  explanation: string;
  salaryFit: SalaryFitResult;
  skillsMatch: SkillsMatchResult;
  techFit: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
  seniorityFit: {
    score: number;
    label: string;
  };
  fitCategory: OverallFitCategory;
  prioritySuggestion: "PRIORIZADO" | "NORMAL" | "DUVIDA";
  summaryBadge: {
    color: string;
    bg: string;
    border: string;
    text: string;
    label: string;
  };
  semanticDetails?: SemanticFitDetails;
};

export type SemanticFitEvaluation = ApplicationEvaluation;

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

  // Overall Score ponderado (0 - 100%)
  const salaryWeight =
    salaryFit.status === "WITHIN_BUDGET" ? 100 : salaryFit.status === "SLIGHTLY_ABOVE" ? 70 : 30;
  const overallScore = Math.round(skillsMatch.score * 0.65 + salaryWeight * 0.35);

  // Explicação Heurística em Linguagem Natural
  let explanation = "";
  if (fitCategory === "ALTO_FIT") {
    explanation = `Forte aderência de competências técnicas (${skillsMatch.score}%) e pretensão salarial compatível com o teto da vaga.`;
  } else if (fitCategory === "MEDIO_FIT") {
    explanation = `Aderência moderada (${skillsMatch.score}%). Recomenda-se entrevista técnica para aprofundar competências complementares.`;
  } else {
    explanation =
      salaryFit.status === "OUT_OF_BUDGET"
        ? `Pretensão salarial acima do orçamento previsto para esta vaga.`
        : `Baixa aderência às competências obrigatórias e requisitos essenciais da posição.`;
  }

  return {
    overallScore,
    overallCategory: fitCategory,
    explanation,
    salaryFit,
    skillsMatch,
    techFit: {
      score: skillsMatch.score,
      matchedSkills: skillsMatch.matchedSkills,
      missingSkills: skillsMatch.missingSkills,
    },
    seniorityFit: {
      score: skillsMatch.score >= 60 ? 90 : 65,
      label: skillsMatch.score >= 60 ? "Compatível" : "Em Desenvolvimento",
    },
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

/**
 * 4. Avalia o Fit Semântico com IA via TypeSafe AI (System One / Jev)
 * Utiliza primitivas tipadas:
 * - Score: Grau de aderência da experiência profissional aos requisitos (escala de 4 níveis descritivos)
 * - Choice: Compatibilidade de senioridade
 * - Noul: Probabilidade de impedimento crítico / knockout
 * Combina os julgamentos semânticos ao Salary Fit determinístico.
 * Em caso de indisponibilidade da API ou ausência de chave, recorre com segurança ao evaluateApplicationFit heurístico.
 */
export async function evaluateApplicationFitSemantic(
  job: {
    title: string;
    description: string;
    department?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    requiredSkills?: string | null;
  },
  candidate: {
    name?: string | null;
    tags?: string | null;
    profileSummary?: string | null;
    rawText?: string | null;
  },
  application: {
    salaryExpectation?: number | null;
  }
): Promise<SemanticFitEvaluation> {
  // 1. Executa avaliação heurística base como baseline garantido
  const baseEvaluation = evaluateApplicationFit(job, candidate, application);

  const client = getTypeSafeClient();
  if (!client) {
    return {
      ...baseEvaluation,
      semanticDetails: undefined,
    };
  }

  try {
    const salaryFit = baseEvaluation.salaryFit;

    const state = {
      job: {
        title: job.title,
        department: job.department || "Geral",
        description: (job.description || "").substring(0, 1500),
        requiredSkills: job.requiredSkills || "",
      },
      candidate: {
        name: candidate.name || "Candidato",
        profileSummary: (candidate.profileSummary || "").substring(0, 1000),
        skills: candidate.tags || "",
        resumeExcerpt: (candidate.rawText || "").substring(0, 2000),
      },
    };

    const response = await client.systemOne({
      state,
      questions: {
        experienceFit: score(
          "Qual o nível de aderência e profundidade da experiência profissional do candidato aos requisitos e responsabilidades descritos na vaga?",
          [
            "Experiência não aderente ou sem relação com os requisitos da vaga",
            "Área correlata ou conhecimentos superficiais dos requisitos exigidos",
            "Experiência prática direta em parte substancial dos requisitos",
            "Experiência profunda, direta e alinhada aos requisitos essenciais da vaga",
          ]
        ),
        seniorityMatch: choice(
          "A senioridade evidenciada pelo candidato atende ao nível demandado pela posição?",
          {
            below: "Abaixo da senioridade exigida",
            aligned: "Alinhado à senioridade exigida",
            above: "Acima da senioridade exigida (overqualified)",
            unclear: "Não há informação suficiente no perfil para determinar",
          }
        ),
        knockoutRisk: noul(
          "O perfil do candidato apresenta algum impedimento explícito ou incompatibilidade crítica com os pré-requisitos essenciais da vaga?"
        ),
      },
    });

    const expScoreRaw = response.answers.experienceFit.score; // de 0 a 3
    const expConfidence = response.answers.experienceFit.confidence;
    const expNormalized = Math.round((expScoreRaw / 3) * 100);

    const seniorityChoice = response.answers.seniorityMatch.choice as "below" | "aligned" | "above" | "unclear";
    const seniorityConfidence = response.answers.seniorityMatch.confidence;
    const knockoutProb = response.answers.knockoutRisk.noul;

    // Seniority score & label ajustado por IA
    let seniorityScore = 70;
    let seniorityLabel = "Compatível";
    if (seniorityChoice === "aligned") {
      seniorityScore = 95;
      seniorityLabel = "Alinhado à Posição";
    } else if (seniorityChoice === "above") {
      seniorityScore = 85;
      seniorityLabel = "Sênior / Qualificado";
    } else if (seniorityChoice === "below") {
      seniorityScore = 45;
      seniorityLabel = "Abaixo do Esperado";
    } else {
      seniorityScore = 65;
      seniorityLabel = "A Avaliar em Entrevista";
    }

    // Determinação combinada de Fit
    let fitCategory: OverallFitCategory = "MEDIO_FIT";
    let prioritySuggestion: "PRIORIZADO" | "NORMAL" | "DUVIDA" = "NORMAL";

    if (salaryFit.status === "OUT_OF_BUDGET" || knockoutProb >= 0.70) {
      fitCategory = "BAIXO_FIT";
      prioritySuggestion = "DUVIDA";
    } else if (salaryFit.status === "WITHIN_BUDGET" && expNormalized >= 65 && seniorityChoice !== "below") {
      fitCategory = "ALTO_FIT";
      prioritySuggestion = "PRIORIZADO";
    } else if (expNormalized >= 80) {
      fitCategory = "ALTO_FIT";
      prioritySuggestion = "PRIORIZADO";
    } else if (expNormalized < 35 || (seniorityChoice === "below" && expNormalized < 50)) {
      fitCategory = "BAIXO_FIT";
      prioritySuggestion = "DUVIDA";
    } else {
      fitCategory = "MEDIO_FIT";
      prioritySuggestion = "NORMAL";
    }

    // Score ponderado final (60% experiência semântica, 25% salário, 15% senioridade)
    const salaryWeight =
      salaryFit.status === "WITHIN_BUDGET" ? 100 : salaryFit.status === "SLIGHTLY_ABOVE" ? 70 : 25;
    const overallScore = Math.round(
      expNormalized * 0.60 + salaryWeight * 0.25 + seniorityScore * 0.15
    );

    // Explicação rica baseada nos julgamentos tipados
    const seniorityTexts: Record<string, string> = {
      aligned: "senioridade alinhada ao cargo",
      above: "perfil com senioridade avançada",
      below: "senioridade abaixo do patamar da vaga",
      unclear: "senioridade a confirmar",
    };

    let explanation = `Julgamento TypeSafe AI: aderência técnica e de experiência avaliada em ${expNormalized}% (nível: ${expScoreRaw.toFixed(1)}/3, confiança: ${Math.round(expConfidence * 100)}%), com ${seniorityTexts[seniorityChoice]}.`;
    if (knockoutProb >= 0.5) {
      explanation += ` Atenção: detectado risco semântico (${Math.round(knockoutProb * 100)}%) de incompatibilidade com requisitos essenciais.`;
    }
    if (salaryFit.status === "SLIGHTLY_ABOVE") {
      explanation += ` Pretensão salarial está na margem de tolerância (+${salaryFit.diffPercentage}%).`;
    } else if (salaryFit.status === "OUT_OF_BUDGET") {
      explanation += ` Pretensão salarial excede o teto orçamentário (+${salaryFit.diffPercentage}%).`;
    }

    const summaryBadge = getFitBadgeStyle(fitCategory, salaryFit.status);

    return {
      overallScore,
      overallCategory: fitCategory,
      explanation,
      salaryFit,
      skillsMatch: {
        ...baseEvaluation.skillsMatch,
        score: Math.round((baseEvaluation.skillsMatch.score + expNormalized) / 2),
      },
      techFit: {
        score: expNormalized,
        matchedSkills: baseEvaluation.techFit.matchedSkills,
        missingSkills: baseEvaluation.techFit.missingSkills,
      },
      seniorityFit: {
        score: seniorityScore,
        label: seniorityLabel,
      },
      fitCategory,
      prioritySuggestion,
      summaryBadge,
      semanticDetails: {
        model: response.model,
        experienceScoreRaw: expScoreRaw,
        experienceScoreNormalized: expNormalized,
        experienceConfidence: expConfidence,
        experienceProbabilities: response.answers.experienceFit.probabilities as any,
        seniorityDecision: seniorityChoice,
        seniorityConfidence: seniorityConfidence,
        knockoutProbability: knockoutProb,
        isSemanticEvaluated: true,
      },
    };
  } catch (err: any) {
    console.warn("TypeSafe semantic fit fallback acionado:", err.message);
    return {
      ...baseEvaluation,
      semanticDetails: undefined,
    };
  }
}
