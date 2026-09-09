import { describe, it, expect } from "vitest";

/**
 * Funções de domínio para conformidade CLT e regras de negócio Core HR
 */
export function validateCltVacationRequest(params: {
  daysCount: number;
  soldDays: number;
  installments?: number[];
}) {
  const { daysCount, soldDays, installments = [] } = params;

  if (daysCount <= 0) {
    return { valid: false, error: "Quantidade de dias de férias deve ser maior que zero." };
  }

  if (soldDays < 0 || soldDays > 10) {
    return {
      valid: false,
      error: "O abono pecuniário (venda de férias) é limitado a no máximo 1/3 (10 dias) pela CLT (Art. 143).",
    };
  }

  if (daysCount + soldDays > 30) {
    return {
      valid: false,
      error: "A soma dos dias de gozo e do abono pecuniário não pode ultrapassar 30 dias.",
    };
  }

  // Se houver fracionamento em múltiplos períodos (Reforma Trabalhista - Art. 134, § 1º)
  if (installments.length > 1) {
    if (installments.length > 3) {
      return { valid: false, error: "As férias só podem ser divididas em até 3 períodos." };
    }
    const hasAtLeast14 = installments.some((d) => d >= 14);
    if (!hasAtLeast14) {
      return { valid: false, error: "Pelo menos um dos períodos de férias deve ser de no mínimo 14 dias corridos." };
    }
    const anyLessThan5 = installments.some((d) => d < 5);
    if (anyLessThan5) {
      return { valid: false, error: "Nenhum período de férias fracionado pode ser inferior a 5 dias corridos." };
    }
  }

  return { valid: true };
}

export function calculateSalaryProgression(
  previousSalary: number,
  newSalary: number
): { difference: number; percentIncrease: number } {
  const difference = Number((newSalary - previousSalary).toFixed(2));
  const percentIncrease =
    previousSalary > 0
      ? Number((((newSalary - previousSalary) / previousSalary) * 100).toFixed(2))
      : 0;

  return { difference, percentIncrease };
}

export function calculateOffboardingChecklistProgress(
  checklist: Array<{ key: string; label: string; required: boolean; completed: boolean }>
): {
  total: number;
  completed: number;
  progressPercent: number;
  pendingRequired: string[];
  canFinalize: boolean;
} {
  const total = checklist.length;
  const completed = checklist.filter((item) => item.completed).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingRequired = checklist
    .filter((item) => item.required && !item.completed)
    .map((item) => item.label);

  const canFinalize = pendingRequired.length === 0;

  return {
    total,
    completed,
    progressPercent,
    pendingRequired,
    canFinalize,
  };
}

export function calculateCltSeveranceDeadline(lastWorkingDay: Date): Date {
  const deadline = new Date(lastWorkingDay);
  deadline.setDate(deadline.getDate() + 10);
  return deadline;
}

// ============================================================================
// SUÍTE DE TESTES UNITÁRIOS - VITEST
// ============================================================================
describe("Core HR & Offboarding Domain Rules", () => {
  describe("CLT Vacation Validation", () => {
    it("should accept valid 30-day single vacation", () => {
      const res = validateCltVacationRequest({ daysCount: 30, soldDays: 0 });
      expect(res.valid).toBe(true);
    });

    it("should accept 20 days gozo + 10 days sold (abono pecuniário)", () => {
      const res = validateCltVacationRequest({ daysCount: 20, soldDays: 10 });
      expect(res.valid).toBe(true);
    });

    it("should reject selling more than 10 days", () => {
      const res = validateCltVacationRequest({ daysCount: 15, soldDays: 15 });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Art. 143");
    });

    it("should reject vacation exceeding 30 days total", () => {
      const res = validateCltVacationRequest({ daysCount: 25, soldDays: 10 });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("30 dias");
    });

    it("should enforce CLT fractional period rules (one >= 14 days, none < 5 days)", () => {
      // Períodos: 15, 10, 5 -> Válido
      const validFraction = validateCltVacationRequest({
        daysCount: 30,
        soldDays: 0,
        installments: [15, 10, 5],
      });
      expect(validFraction.valid).toBe(true);

      // Períodos: 10, 10, 10 -> Inválido (nenhum tem >= 14)
      const invalidNo14 = validateCltVacationRequest({
        daysCount: 30,
        soldDays: 0,
        installments: [10, 10, 10],
      });
      expect(invalidNo14.valid).toBe(false);
      expect(invalidNo14.error).toContain("14 dias");

      // Períodos: 20, 6, 4 -> Inválido (tem um < 5)
      const invalidLessThan5 = validateCltVacationRequest({
        daysCount: 30,
        soldDays: 0,
        installments: [20, 6, 4],
      });
      expect(invalidLessThan5.valid).toBe(false);
      expect(invalidLessThan5.error).toContain("5 dias");
    });
  });

  describe("Salary Progression Calculation", () => {
    it("should accurately calculate promotion salary raise and percentage", () => {
      const { difference, percentIncrease } = calculateSalaryProgression(5000, 6500);
      expect(difference).toBe(1500);
      expect(percentIncrease).toBe(30);
    });

    it("should handle first admission salary (from 0)", () => {
      const { difference, percentIncrease } = calculateSalaryProgression(0, 8000);
      expect(difference).toBe(8000);
      expect(percentIncrease).toBe(0);
    });
  });

  describe("Offboarding Checklist Progress & CLT Compliance", () => {
    const mockChecklist = [
      { key: "EXAME_DEMISSIONAL_ASO", label: "ASO Demissional", required: true, completed: true },
      { key: "DEVOLUCAO_EQUIPAMENTOS", label: "Devolução de Equipamentos", required: true, completed: true },
      { key: "REVOGACAO_ACESSOS_TI", label: "Revogação Acessos TI", required: true, completed: false },
      { key: "HOMOLOGACAO_TRCT", label: "Assinatura TRCT", required: true, completed: false },
      { key: "PAGAMENTO_VERBAS", label: "Pagamento Verbas", required: true, completed: false },
      { key: "ENTREVISTA_DESLIGAMENTO", label: "Entrevista DHO", required: false, completed: false },
    ];

    it("should correctly compute percentage and pending items", () => {
      const result = calculateOffboardingChecklistProgress(mockChecklist);
      expect(result.total).toBe(6);
      expect(result.completed).toBe(2);
      expect(result.progressPercent).toBe(33);
      expect(result.canFinalize).toBe(false);
      expect(result.pendingRequired).toEqual([
        "Revogação Acessos TI",
        "Assinatura TRCT",
        "Pagamento Verbas",
      ]);
    });

    it("should allow finalization when all required items are completed even if optional is pending", () => {
      const almostComplete = mockChecklist.map((item) => ({
        ...item,
        completed: item.required ? true : false,
      }));

      const result = calculateOffboardingChecklistProgress(almostComplete);
      expect(result.completed).toBe(5);
      expect(result.canFinalize).toBe(true);
      expect(result.pendingRequired.length).toBe(0);
    });

    it("should calculate exact 10 days legal deadline for CLT Art. 477", () => {
      const lastDay = new Date("2026-10-15T00:00:00.000Z");
      const deadline = calculateCltSeveranceDeadline(lastDay);
      expect(deadline.toISOString().split("T")[0]).toBe("2026-10-25");
    });
  });
});
