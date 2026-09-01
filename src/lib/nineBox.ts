export type NineBoxPosition =
  | "TOP_TALENT"
  | "FUTURE_LEADER"
  | "ENIGMA"
  | "HIGH_PERFORMER"
  | "KEY_PROFESSIONAL"
  | "DILEMMA"
  | "TECHNICAL_EXPERT"
  | "EFFECTIVE"
  | "RISK";

/**
 * Calcula a posição do 9-Box com base nas notas de Desempenho e Potencial (1.0 a 5.0)
 */
export function calculateNineBoxPosition(
  performance: number,
  potential: number
): NineBoxPosition {
  // Eixo Desempenho (X): Baixo (< 2.6), Médio (2.6 - 3.8), Alto (> 3.8)
  // Eixo Potencial (Y): Baixo (< 2.6), Médio (2.6 - 3.8), Alto (> 3.8)
  const isHighPerf = performance > 3.8;
  const isMedPerf = performance >= 2.6 && performance <= 3.8;
  const isLowPerf = performance < 2.6;

  const isHighPot = potential > 3.8;
  const isMedPot = potential >= 2.6 && potential <= 3.8;
  const isLowPot = potential < 2.6;

  if (isHighPot) {
    if (isHighPerf) return "TOP_TALENT";
    if (isMedPerf) return "FUTURE_LEADER";
    return "ENIGMA";
  }

  if (isMedPot) {
    if (isHighPerf) return "HIGH_PERFORMER";
    if (isMedPerf) return "KEY_PROFESSIONAL";
    return "DILEMMA";
  }

  // isLowPot
  if (isHighPerf) return "TECHNICAL_EXPERT";
  if (isMedPerf) return "EFFECTIVE";
  return "RISK";
}
