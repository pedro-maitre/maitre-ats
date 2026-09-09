import { describe, it, expect } from "vitest";
import {
  sanitizeSurveyResponsesWithKAnonymity,
  MIN_ANONYMITY_THRESHOLD,
  PROTECTED_DEPARTMENT_LABEL,
} from "./anonymity";

/**
 * Funções de domínio para testes unitários de Aprendizagem e DHO
 */
export function evaluateCourseCertification(params: {
  quizScore: number;
  minPassingScore?: number;
  attendancePercent: number;
  minAttendancePercent?: number;
}) {
  const minScore = params.minPassingScore ?? 70.0;
  const minAttendance = params.minAttendancePercent ?? 75;

  const passedScore = params.quizScore >= minScore;
  const passedAttendance = params.attendancePercent >= minAttendance;
  const isApproved = passedScore && passedAttendance;

  return {
    isApproved,
    passedScore,
    passedAttendance,
    minScore,
    minAttendance,
  };
}

export function calculateDhoGapAnalysis(
  selfScore: number,
  managerScore: number
): {
  gap: number;
  diagnosis: "CONSENSO" | "SUBVALORIZADO" | "SOBREATRIBUIDO";
} {
  const gap = Number((managerScore - selfScore).toFixed(1));
  if (gap >= 1.0) {
    return { gap, diagnosis: "SUBVALORIZADO" }; // Gestor avaliou muito melhor que o próprio colaborador (potencial não reconhecido por si)
  }
  if (gap <= -1.0) {
    return { gap, diagnosis: "SOBREATRIBUIDO" }; // Colaborador se autoavaliou muito acima da percepção da liderança
  }
  return { gap, diagnosis: "CONSENSO" }; // Percepções alinhadas
}

export function calculatePdiWeightedProgress(
  goals: Array<{
    currentValue: number;
    targetValue: number;
    weightPercent: number;
  }>
): { overallProgress: number; isFullyCompleted: boolean } {
  if (goals.length === 0) return { overallProgress: 0, isFullyCompleted: false };

  let totalWeight = 0;
  let weightedProgressSum = 0;

  for (const g of goals) {
    const goalRatio = g.targetValue > 0 ? Math.min(1, g.currentValue / g.targetValue) : 0;
    const goalProgress = goalRatio * 100;
    weightedProgressSum += goalProgress * (g.weightPercent / 100);
    totalWeight += g.weightPercent;
  }

  const normalized = totalWeight > 0 ? (weightedProgressSum / (totalWeight / 100)) : 0;
  const overallProgress = Math.round(normalized);
  const isFullyCompleted = overallProgress >= 100;

  return { overallProgress, isFullyCompleted };
}

describe("Onda 3 - Governança de Cultura & K-Anonimato (LGPD / ANPD)", () => {
  it("deve mascarar departamentos com menos de 5 respondentes com o rótulo de K-Anonimato", () => {
    const mockResponses = [
      { id: "1", department: "Jurídico", npsScore: 8 },
      { id: "2", department: "Jurídico", npsScore: 9 },
      { id: "3", department: "Jurídico", npsScore: 10 },
      // Jurídico só tem 3 respostas (k < 5)
      { id: "4", department: "Engenharia", npsScore: 8 },
      { id: "5", department: "Engenharia", npsScore: 9 },
      { id: "6", department: "Engenharia", npsScore: 10 },
      { id: "7", department: "Engenharia", npsScore: 9 },
      { id: "8", department: "Engenharia", npsScore: 8 },
      // Engenharia tem 5 respostas (k >= 5)
    ];

    const result = sanitizeSurveyResponsesWithKAnonymity(mockResponses, MIN_ANONYMITY_THRESHOLD);

    expect(result.departmentsMaskedCount).toBe(1);
    expect(result.isKAnonymized).toBe(true);

    const juridicoResponses = result.sanitizedResponses.filter((r) => r.id === "1" || r.id === "2" || r.id === "3");
    juridicoResponses.forEach((r) => {
      expect(r.department).toBe(PROTECTED_DEPARTMENT_LABEL);
    });

    const engResponses = result.sanitizedResponses.filter((r) => r.id === "4");
    expect(engResponses[0].department).toBe("Engenharia");
  });

  it("não deve mascarar departamentos com 5 ou mais respondentes", () => {
    const mockResponses = Array.from({ length: 6 }, (_, i) => ({
      id: `dev-${i}`,
      department: "Tecnologia",
      npsScore: 9,
    }));

    const result = sanitizeSurveyResponsesWithKAnonymity(mockResponses, MIN_ANONYMITY_THRESHOLD);
    expect(result.departmentsMaskedCount).toBe(0);
    expect(result.sanitizedResponses.every((r) => r.department === "Tecnologia")).toBe(true);
  });

  it("deve preservar o departamento 'Geral' mesmo com menos de 5 respondentes", () => {
    const mockResponses = [
      { id: "1", department: "Geral", npsScore: 10 },
      { id: "2", department: "Geral", npsScore: 9 },
    ];

    const result = sanitizeSurveyResponsesWithKAnonymity(mockResponses, MIN_ANONYMITY_THRESHOLD);
    expect(result.departmentsMaskedCount).toBe(0);
    expect(result.sanitizedResponses[0].department).toBe("Geral");
  });
});

describe("Onda 3 - Aprendizagem Corporativa (LMS & Certificação Condicional)", () => {
  it("deve aprovar certificação quando nota >= 70% e presença >= 75%", () => {
    const evalResult = evaluateCourseCertification({
      quizScore: 80,
      attendancePercent: 85,
    });

    expect(evalResult.isApproved).toBe(true);
    expect(evalResult.passedScore).toBe(true);
    expect(evalResult.passedAttendance).toBe(true);
  });

  it("deve reprovar certificação quando a nota no Quiz for menor que a nota de corte (70%)", () => {
    const evalResult = evaluateCourseCertification({
      quizScore: 65,
      attendancePercent: 100,
    });

    expect(evalResult.isApproved).toBe(false);
    expect(evalResult.passedScore).toBe(false);
    expect(evalResult.passedAttendance).toBe(true);
  });

  it("deve reprovar certificação quando a presença for menor que o mínimo regulamentar (75%)", () => {
    const evalResult = evaluateCourseCertification({
      quizScore: 100,
      attendancePercent: 50,
    });

    expect(evalResult.isApproved).toBe(false);
    expect(evalResult.passedScore).toBe(true);
    expect(evalResult.passedAttendance).toBe(false);
  });
});

describe("Onda 3 - DHO & Desenvolvimento (Gap Analysis & Metas de PDI)", () => {
  it("deve classificar como CONSENSO quando a diferença entre autoavaliação e gestor for menor que 1.0", () => {
    const analysis = calculateDhoGapAnalysis(4.0, 4.3);
    expect(analysis.diagnosis).toBe("CONSENSO");
    expect(analysis.gap).toBe(0.3);
  });

  it("deve classificar como SOBREATRIBUIDO quando o colaborador se avaliar significativamente acima do gestor", () => {
    const analysis = calculateDhoGapAnalysis(4.8, 3.2);
    expect(analysis.diagnosis).toBe("SOBREATRIBUIDO");
    expect(analysis.gap).toBe(-1.6);
  });

  it("deve classificar como SUBVALORIZADO quando o gestor avaliar significativamente acima da autoavaliação", () => {
    const analysis = calculateDhoGapAnalysis(3.0, 4.5);
    expect(analysis.diagnosis).toBe("SUBVALORIZADO");
    expect(analysis.gap).toBe(1.5);
  });

  it("deve calcular corretamente o progresso ponderado das metas do PDI e marcar como concluído em 100%", () => {
    const goals = [
      { currentValue: 10, targetValue: 10, weightPercent: 50 }, // 100% atingido * 0.5 = 50%
      { currentValue: 5, targetValue: 10, weightPercent: 50 },  // 50% atingido * 0.5 = 25%
    ];

    const result = calculatePdiWeightedProgress(goals);
    expect(result.overallProgress).toBe(75);
    expect(result.isFullyCompleted).toBe(false);

    // Quando ambas atingem 100%
    const completedGoals = [
      { currentValue: 10, targetValue: 10, weightPercent: 50 },
      { currentValue: 10, targetValue: 10, weightPercent: 50 },
    ];

    const completedResult = calculatePdiWeightedProgress(completedGoals);
    expect(completedResult.overallProgress).toBe(100);
    expect(completedResult.isFullyCompleted).toBe(true);
  });
});
