# 🤖 09. Auditoria de Inteligência Artificial e Fit 3D — Maître Conecta

> **Evidências:** `[CÓDIGO]`, `[TESTE]`  
> **Data:** Setembro de 2026  

---

## 1. Arquitetura do Motor Fit 3D

Contrariamente à suposição de que o Fit 3D seria uma "caixa-preta" orientada por redes neurais opacas, a auditoria de código revelou que **o motor de cálculo do Fit 3D é 100% determinístico e heurístico**, implementado em TypeScript no arquivo `src/lib/fit-evaluator.ts`.

### Três Dimensões Auditadas no Código:
1. **Dimensão 1 — Salary Fit (Aderência Orçamentária):**
   * Compara `salaryExpectation` com `jobSalaryMin` e `jobSalaryMax`.
   * Regra de tolerância: Se pretensão $\le$ teto $\rightarrow$ `WITHIN_BUDGET`.
   * Tolerância de 15%: Se pretensão $\le$ teto $\times 1.15 \rightarrow$ `SLIGHTLY_ABOVE` (não é knockout).
   * Acima de 15%: Marca como `OUT_OF_BUDGET` e sinaliza `isKnockout = true`.
2. **Dimensão 2 — Skills Match (Aderência de Competências):**
   * Extração de keywords de `jobTitle`, `requiredSkills` e `jobDescription` após remoção de stopwords em português (`STOP_WORDS`).
   * Comparação com `candidateTags` e `candidateSummary`.
   * Pontuação ponderada: Título da vaga possui peso 60% caso existam `requiredSkills`.
3. **Dimensão 3 — Seniority Fit (Aderência de Senioridade):**
   * Mapeamento de níveis (Estagiário, Júnior, Pleno, Sênior, Especialista, Liderança, Diretoria).

---

## 2. Utilização de Inteligência Artificial Externa (OpenAI)

A OpenAI (`gpt-4o-mini`) é acionada estritamente em **dois pontos específicos** do sistema:

1. **Extração de Dados de Currículos (`src/lib/resume-parser.ts`):**
   * Função: `parseResumeWithAi(rawText)`.
   * Envia até 4.000 caracteres do PDF para estruturar JSON (`firstName`, `lastName`, `email`, `phone`, `skills`, `profileSummary`).
   * **Mecanismo de Resiliência:** Possui timeout de 3.5 segundos (`Promise.race`). Se a OpenAI falhar (erro 429, cota esgotada ou timeout), o sistema faz **fallback instantâneo para a extração heurística offline** (`extractHeuristicResumeData`), sem travar o usuário.
2. **Geração de Feedback Humanizado (`src/app/api/candidate/generate-feedback/route.ts`):**
   * Gera mensagens empáticas de encerramento de processo seletivo para envio via WhatsApp ou e-mail.
   * Se a chave OpenAI falhar, utiliza templates heurísticos pré-estruturados.

---

## 3. Riscos Algorítmicos e Não Discriminação

| Risco Avaliado | Realidade no Código | Nível de Risco | Mitigação Existente / Recomendada |
|---|---|:---:|---|
| **Decisão Automatizada de Descarte** | O algoritmo sugere prioridade (`PRIORIZADO`, `NORMAL`, `DUVIDA`), mas a movimentação de etapa e contratação **exige ação humana explícita do recrutador** no Kanban. | Baixo | Mantida a supervisão humana (Human-in-the-loop). |
| **Vieses Demográficos no Fit 3D** | O cálculo em `fit-evaluator.ts` **não processa** gênero, idade, raça, estado civil, filhos ou endereço. Analisa apenas salário, tags de skills e senioridade. | Baixo | Risco mitigado por minimização na entrada. |
| **Penalização por Vocabulário (Stopwords)** | Candidatos com currículos formatados fora dos padrões de keywords podem receber notas baixas injustamente no Skills Match. | Médio (P2) | Piso de 75 pontos para perfis com mais de 3 tags já implementado. |
| **Explicabilidade do Score** | O sistema salva snapshot explicativo (`aiExplanation` e `aiSnapshot` em `Application`) detalhando percentuais salariais e skills faltantes. | Baixo | Excelente rastreabilidade para contestação. |
| **Override Manual** | O recrutador pode marcar `manualOverride = true` e registrar justificativa caso discorde do score algorítmico. | Baixo | Funcionalidade implementada no schema. |
