import { describe, it, expect } from "vitest";
import {
  FEEDBACK_TEMPLATES,
  FEEDBACK_CATEGORIES,
  applyTemplateVariables,
  generateWhatsAppLink,
  getUnfilledVariables,
  sanitizeBrazilianPhone,
} from "./feedback-templates";

describe("Feedback Templates Library", () => {
  it("contains all 23 official feedback models", () => {
    expect(FEEDBACK_TEMPLATES.length).toBe(23);
  });

  it("covers all 6 category domains", () => {
    expect(FEEDBACK_CATEGORIES.length).toBe(6);
    const categoryIds = FEEDBACK_CATEGORIES.map((c) => c.id);

    FEEDBACK_TEMPLATES.forEach((tmpl) => {
      expect(categoryIds).toContain(tmpl.category);
    });
  });

  describe("sanitizeBrazilianPhone", () => {
    it("handles empty or null phones", () => {
      expect(sanitizeBrazilianPhone(null)).toBe("");
      expect(sanitizeBrazilianPhone("")).toBe("");
    });

    it("adds 55 country code to 10 or 11 digit numbers", () => {
      expect(sanitizeBrazilianPhone("11987654321")).toBe("5511987654321");
      expect(sanitizeBrazilianPhone("(11) 98765-4321")).toBe("5511987654321");
      expect(sanitizeBrazilianPhone("(11) 3456-7890")).toBe("551134567890");
    });

    it("preserves numbers already having 55 DDI", () => {
      expect(sanitizeBrazilianPhone("5511987654321")).toBe("5511987654321");
      expect(sanitizeBrazilianPhone("+55 (11) 98765-4321")).toBe("5511987654321");
    });
  });

  describe("applyTemplateVariables and getUnfilledVariables", () => {
    it("substitutes placeholders correctly", () => {
      const template = "Olá, [NOME]! Sua vaga é [VAGA].";
      const result = applyTemplateVariables(template, {
        NOME: "Carolina Silva",
        VAGA: "Tech Lead",
      });

      expect(result).toBe("Olá, Carolina Silva! Sua vaga é Tech Lead.");
      expect(getUnfilledVariables(result)).toEqual([]);
    });

    it("identifies remaining unreplaced variables", () => {
      const template = "Olá, [NOME]! Seu salário será [REMUNERACAO] na [EMPRESA].";
      const result = applyTemplateVariables(template, {
        NOME: "Carolina",
      });

      expect(getUnfilledVariables(result)).toEqual(["[REMUNERACAO]", "[EMPRESA]"]);
    });
  });

  describe("generateWhatsAppLink", () => {
    it("encodes message and generates wa.me link", () => {
      const link = generateWhatsAppLink("11999998888", "Olá Mundo & Sucesso");
      expect(link).toBe("https://wa.me/5511999998888?text=Ol%C3%A1%20Mundo%20%26%20Sucesso");
    });
  });
});
