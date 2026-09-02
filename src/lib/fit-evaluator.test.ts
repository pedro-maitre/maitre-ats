import { describe, it, expect } from "vitest";
import {
  calculateSalaryFit,
  calculateSkillsMatch,
  evaluateApplicationFit,
  getFitBadgeStyle,
} from "./fit-evaluator";

describe("Fit Evaluator (Fit 3D Engine)", () => {
  describe("calculateSalaryFit", () => {
    it("returns NOT_SPECIFIED when salary expectation is null or 0", () => {
      const result = calculateSalaryFit(null, 5000, 8000);
      expect(result.status).toBe("NOT_SPECIFIED");
      expect(result.isKnockout).toBe(false);
    });

    it("returns WITHIN_BUDGET when within range", () => {
      const result = calculateSalaryFit(6000, 5000, 8000);
      expect(result.status).toBe("WITHIN_BUDGET");
      expect(result.isKnockout).toBe(false);
    });

    it("returns SLIGHTLY_ABOVE when within 15% tolerance of max salary", () => {
      // 8000 * 1.10 = 8800 (less than 15% above 8000)
      const result = calculateSalaryFit(8800, 5000, 8000);
      expect(result.status).toBe("SLIGHTLY_ABOVE");
      expect(result.isKnockout).toBe(false);
    });

    it("returns OUT_OF_BUDGET (knockout) when exceeding 15% tolerance", () => {
      // 8000 * 1.25 = 10000 (> 15% above 8000)
      const result = calculateSalaryFit(10000, 5000, 8000);
      expect(result.status).toBe("OUT_OF_BUDGET");
      expect(result.isKnockout).toBe(true);
    });
  });

  describe("calculateSkillsMatch", () => {
    it("returns baseline score if no required skills are defined", () => {
      const result = calculateSkillsMatch(
        ["React", "Node.js"],
        "Desenvolvedor Fullstack experiente em React",
        "Desenvolvedor Frontend",
        "Vaga para frontend React",
        "Tecnologia"
      );
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it("calculates matching percentage with explicit required skills", () => {
      const result = calculateSkillsMatch(
        ["React", "TypeScript"],
        "Experiência com React e TypeScript",
        "Engenheiro de Software",
        "Descrição detalhada",
        "Engenharia",
        "React, TypeScript, PostgreSQL, Docker"
      );
      expect(result.matchedSkills).toContain("react");
      expect(result.matchedSkills).toContain("typescript");
      expect(result.missingSkills).toContain("postgresql");
      expect(result.score).toBeGreaterThanOrEqual(35);
    });
  });

  describe("evaluateApplicationFit", () => {
    it("classifies high fit candidate appropriately", () => {
      const evaluation = evaluateApplicationFit(
        {
          title: "Desenvolvedor React Senior",
          description: "Desenvolvimento de interfaces modernas em React e TypeScript",
          department: "Tecnologia",
          salaryMin: 6000,
          salaryMax: 10000,
          requiredSkills: "React, TypeScript, Next.js",
        },
        {
          tags: JSON.stringify(["React", "TypeScript", "Next.js", "Tailwind"]),
          profileSummary: "Especialista em React e Next.js com 5 anos de experiência.",
        },
        {
          salaryExpectation: 8000,
        }
      );

      expect(evaluation.overallCategory).toBe("ALTO_FIT");
      expect(evaluation.prioritySuggestion).toBe("PRIORIZADO");
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(70);
    });

    it("classifies out of budget candidate as BAIXO_FIT with DUVIDA priority", () => {
      const evaluation = evaluateApplicationFit(
        {
          title: "Analista Junior",
          description: "Atividades básicas",
          salaryMin: 3000,
          salaryMax: 4000,
          requiredSkills: "Excel",
        },
        {
          tags: "Excel",
          profileSummary: "Conhecimento em Excel",
        },
        {
          salaryExpectation: 12000, // Muito acima da faixa
        }
      );

      expect(evaluation.overallCategory).toBe("BAIXO_FIT");
      expect(evaluation.prioritySuggestion).toBe("DUVIDA");
    });
  });

  describe("getFitBadgeStyle", () => {
    it("returns correct styling tokens for each fit category with WCAG compliant colors", () => {
      const alto = getFitBadgeStyle("ALTO_FIT");
      expect(alto.text).toContain("emerald-700");

      const medio = getFitBadgeStyle("MEDIO_FIT");
      expect(medio.text).toContain("amber-700");

      const baixo = getFitBadgeStyle("BAIXO_FIT");
      expect(baixo.text).toContain("red-700");
    });
  });
});
