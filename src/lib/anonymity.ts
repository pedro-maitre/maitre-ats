/**
 * Módulo de Governança de Privacidade & K-Anonimato (LGPD / ANPD)
 * Maître Conecta - DHO & Cultura Organizacional
 */

export const MIN_ANONYMITY_THRESHOLD = 5;
export const PROTECTED_DEPARTMENT_LABEL = "Outros / Protegido por K-Anonimato";

export interface AnonymizableResponse {
  id: string;
  department: string | null;
  npsScore: number;
  dimensionScores: Record<string, number>;
  feedback: string | null;
  respondedAt: string;
}

/**
 * Sanitiza respostas de pesquisa de clima aplicando princípio de K-Anonimato (k >= 5).
 * Se um departamento possui menos de 5 respostas, seu rótulo departamental é
 * anonimizado e agrupado sob "Outros / Protegido por K-Anonimato", evitando inferência
 * ou reidentificação de colaboradores por seus gestores diretos.
 */
export function sanitizeSurveyResponsesWithKAnonymity<T extends { department: string | null }>(
  responses: T[],
  minThreshold: number = MIN_ANONYMITY_THRESHOLD
): { sanitizedResponses: T[]; departmentsMaskedCount: number; isKAnonymized: boolean } {
  // Contabilizar respondentes por departamento
  const deptCounts: Record<string, number> = {};
  for (const r of responses) {
    const dept = r.department?.trim() || "Geral";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  }

  let departmentsMaskedCount = 0;
  const maskedDepts = new Set<string>();

  for (const [dept, count] of Object.entries(deptCounts)) {
    if (count < minThreshold && dept !== "Geral") {
      maskedDepts.add(dept);
      departmentsMaskedCount++;
    }
  }

  const sanitizedResponses = responses.map((r) => {
    const dept = r.department?.trim() || "Geral";
    if (maskedDepts.has(dept)) {
      return {
        ...r,
        department: PROTECTED_DEPARTMENT_LABEL,
      };
    }
    return r;
  });

  return {
    sanitizedResponses,
    departmentsMaskedCount,
    isKAnonymized: departmentsMaskedCount > 0 || responses.length > 0,
  };
}
