/**
 * Utilitário de regras de negócio para Mobilidade Interna (Conecta Carreiras)
 * e validação de elegibilidade para recrutamento interno.
 */

export interface EmployeeEligibilityInput {
  id: string;
  fullName: string;
  admissionDate: Date | string;
  status: string; // ACTIVE, ON_LEAVE, TERMINATED, VACATION
  performanceEvaluations?: Array<{
    performanceScore?: number | null;
    overallScore?: number | null;
    createdAt?: Date | string;
  }>;
}

export interface EligibilityResult {
  isEligible: boolean;
  currentTenureMonths: number;
  currentTenureDays: number;
  checks: {
    tenurePass: boolean;
    statusPass: boolean;
    performancePass: boolean;
  };
  reasons: string[];
  averagePerformanceScore: number | null;
}

export interface EligibilityRulesConfig {
  minTenureMonths?: number; // Padrão: 6 meses
  minPerformanceScore?: number; // Padrão: 3.0
  allowedStatuses?: string[]; // Padrão: ["ACTIVE"]
}

/**
 * Valida os critérios formais de elegibilidade para candidatura a vagas internas.
 */
export function checkInternalJobEligibility(
  employee: EmployeeEligibilityInput,
  config: EligibilityRulesConfig = {},
  referenceDate: Date = new Date()
): EligibilityResult {
  const minMonths = config.minTenureMonths ?? 6;
  const minScore = config.minPerformanceScore ?? 3.0;
  const allowedStatuses = config.allowedStatuses ?? ["ACTIVE"];

  const admission = new Date(employee.admissionDate);
  const diffTime = referenceDate.getTime() - admission.getTime();
  const currentTenureDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const currentTenureMonths = parseFloat((currentTenureDays / 30.4375).toFixed(1));

  const reasons: string[] = [];

  // 1. Checagem de Tempo de Casa
  const tenurePass = currentTenureMonths >= minMonths;
  if (!tenurePass) {
    reasons.push(
      `Tempo de empresa insuficiente: possui ${currentTenureMonths} meses de casa (exigido no mínimo ${minMonths} meses para mobilidade interna).`
    );
  }

  // 2. Checagem de Status Funcional
  const statusPass = allowedStatuses.includes(employee.status);
  if (!statusPass) {
    reasons.push(
      `Status funcional inelegível: colaborador encontra-se em status "${employee.status}" (deve estar estritamente ATIVO).`
    );
  }

  // 3. Checagem de Avaliação de Desempenho
  let performancePass = true;
  let averagePerformanceScore: number | null = null;

  if (employee.performanceEvaluations && employee.performanceEvaluations.length > 0) {
    const validScores = employee.performanceEvaluations
      .map((e) => (typeof e.performanceScore === "number" ? e.performanceScore : e.overallScore))
      .filter((s): s is number => typeof s === "number" && s > 0);

    if (validScores.length > 0) {
      const sum = validScores.reduce((a, b) => a + b, 0);
      averagePerformanceScore = parseFloat((sum / validScores.length).toFixed(2));
      if (averagePerformanceScore < minScore) {
        performancePass = false;
        reasons.push(
          `Avaliação de desempenho abaixo da linha de corte: média de ${averagePerformanceScore} (mínimo exigido: ${minScore.toFixed(1)}).`
        );
      }
    }
  }

  const isEligible = tenurePass && statusPass && performancePass;

  if (isEligible) {
    reasons.push("Colaborador atende a todos os critérios de elegibilidade para mobilidade interna.");
  }

  return {
    isEligible,
    currentTenureMonths,
    currentTenureDays,
    checks: {
      tenurePass,
      statusPass,
      performancePass,
    },
    reasons,
    averagePerformanceScore,
  };
}

/**
 * Estrutura padrão para inicialização de Trilha de Carreira em Y.
 */
export interface CareerTrackLevel {
  id: string;
  name: string;
  branch: "COMMON" | "SPECIALIST" | "MANAGEMENT";
  order: number;
  salaryReferenceMin?: number;
  salaryReferenceMax?: number;
  requiredCompetencies: string[];
  keyDeliverables: string[];
}

export function getDefaultYCareerTrack(_title: string = "Tecnologia & Engenharia"): CareerTrackLevel[] {
  return [
    {
      id: "lvl-1",
      name: "Júnior",
      branch: "COMMON",
      order: 1,
      salaryReferenceMin: 4500,
      salaryReferenceMax: 6500,
      requiredCompetencies: ["Execução técnica orientada", "Aprendizagem contínua", "Boa comunicação em time"],
      keyDeliverables: ["Entregas de escopo delimitado", "Resolução de bugs e pequenos incrementos"],
    },
    {
      id: "lvl-2",
      name: "Pleno",
      branch: "COMMON",
      order: 2,
      salaryReferenceMin: 7000,
      salaryReferenceMax: 10500,
      requiredCompetencies: ["Autonomia técnica", "Resolução de problemas complexos", "Documentação estruturada"],
      keyDeliverables: ["Desenvolvimento ponta a ponta de funcionalidades", "Code review de pares"],
    },
    {
      id: "lvl-3",
      name: "Sênior",
      branch: "COMMON",
      order: 3,
      salaryReferenceMin: 11000,
      salaryReferenceMax: 16000,
      requiredCompetencies: ["Visão de arquitetura", "Mentoria de desenvolvedores júnior/pleno", "Resiliência"],
      keyDeliverables: ["Desenho de soluções de alto impacto", "Tomada de decisão arquitetural"],
    },
    // Ramo Especialista (Carreira em Y)
    {
      id: "lvl-4-spec",
      name: "Especialista / Tech Lead",
      branch: "SPECIALIST",
      order: 4,
      salaryReferenceMin: 17000,
      salaryReferenceMax: 24000,
      requiredCompetencies: ["Domínio técnico de vanguarda", "Estratégia de sistemas", "Inovação tecnológica"],
      keyDeliverables: ["Roadmap de modernização", "Padrões arquiteturais da organização", "Resolução de incidentes críticos"],
    },
    {
      id: "lvl-5-spec",
      name: "Principal Engineer / Fellow",
      branch: "SPECIALIST",
      order: 5,
      salaryReferenceMin: 25000,
      salaryReferenceMax: 35000,
      requiredCompetencies: ["Influência técnica multidepartamental", "Prospecção tecnológica e R&D"],
      keyDeliverables: ["Arquitetura corporativa", "Publicações e patentes técnicas", "Alinhamento C-Level"],
    },
    // Ramo Gestão (Carreira em Y)
    {
      id: "lvl-4-mgmt",
      name: "Coordenador / Engineering Manager",
      branch: "MANAGEMENT",
      order: 4,
      salaryReferenceMin: 16000,
      salaryReferenceMax: 23000,
      requiredCompetencies: ["Gestão de pessoas", "1-on-1s e PDIs", "Remoção de impedimentos e métricas ágeis"],
      keyDeliverables: ["Engajamento e retenção de talentos", "Capacidade e entrega de sprints"],
    },
    {
      id: "lvl-5-mgmt",
      name: "Head / Diretor de Engenharia",
      branch: "MANAGEMENT",
      order: 5,
      salaryReferenceMin: 24000,
      salaryReferenceMax: 38000,
      requiredCompetencies: ["Liderança de líderes", "Gestão orçamentária (Budget & Headcount)", "Visão executiva"],
      keyDeliverables: ["Estratégia anual de tecnologia", "Governança e compliance", "Parcerias estratégicas"],
    },
  ];
}
