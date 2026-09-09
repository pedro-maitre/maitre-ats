# 📊 03. Matriz Funcional dos 9 Módulos do Ecossistema

> **Evidências:** `[CÓDIGO]`, `[BANCO]`, `[TESTE]`  
> **Data:** Setembro de 2026  

---

## 1. Classificação do Estado Real por Módulo

Classificações adotadas conforme especificação da auditoria:
`PRONTA` | `PARCIAL` | `MOCK` | `DEMONSTRATIVA` | `COM_ERRO` | `AUSENTE` | `NÃO_CONFIRMADA` | `BLOQUEADA_POR_DEPENDÊNCIA`

| # | Módulo Declarado | Estado Real Auditado | Rotas e Telas Reais | Modelos de Banco Existentes | Lacunas e Débitos Críticos Identificados | Prioridade de Remediação |
|---|---|:---:|---|---|---|:---:|
| **1** | **Conecta Talentos** (ATS & Recrutamento) | `PRONTA` | `/jobs`, `/jobs/[id]/board`, `/candidates`, `/carreiras/[slug]` | `Job`, `Candidate`, `Application`, `Stage`, `Interview`, `Scorecard`, `Offer` | Risco de sobrescrita de candidatos cross-tenant em `api/candidates` via e-mail global; falta webhook de ATS externo. | P1 |
| **2** | **Conecta Pessoas** (Core HR & Colaboradores) | `PARCIAL` | `/employees`, `EmployeeTableClient.tsx` | `Employee`, `Department`, `Position`, `HireConversion` | **Ausentes:** controle de ponto/jornadas reais, histórico funcional de promoções/salários, gestão de férias, atestados médicos/afastamentos e ocorrências disciplinares. | P1 |
| **3** | **Conecta Operações** (Admissão Digital & DP) | `PARCIAL` | `/operations`, `/carreiras/[slug]/admissao/[token]` | `HireConversion`, `Document` | **Ausentes:** fluxo de rescisão/desligamento formal (offboarding), checklist rescisório, termos com assinatura digital válida (ICP-Brasil/Gov.br). | P1 |
| **4** | **Conecta Insights** (People Analytics) | `PARCIAL` | `/insights`, `InsightsDashboardClient.tsx` | Agregações de `Job`, `Application`, `Offer` | **Lacuna:** Restrito a dados de R&S; métricas de turnover, absenteísmo e folha são estimadas ou inexistentes por falta de histórico de frequência. Consulta vaza dados cross-tenant. | P0 (Tenancy) / P2 |
| **5** | **Conecta Desenvolvimento** (9-Box & PDI) | `PARCIAL` | `/development`, `DevelopmentDashboardClient.tsx` | `PerformanceEvaluation`, `DevelopmentPlan` | **Ausentes:** avaliações 90°, 180° e 360° estruturadas com múltiplos avaliadores; metas e OKRs desdobrados corporativamente. | P2 |
| **6** | **Conecta Aprendizagem** (LMS Corporativo) | `PARCIAL` | `/learning`, `LearningDashboardClient.tsx` | `Course`, `CourseEnrollment` | **Ausentes:** gestão de turmas presenciais/híbridas, controle de frequência presencial, avaliações formais de retenção pós-treinamento com banco de questões. | P2 |
| **7** | **Conecta Cultura** (Clima, eNPS & Kudos) | `PARCIAL` | `/culture`, `CultureDashboardClient.tsx` | `ClimateSurvey`, `SurveyResponse`, `CultureRecognition` | **Ausentes:** planos de ação pós-pesquisa (action planning) para líderes, segmentação demográfica avançada garantindo anonimato estrito (<5 respondentes). | P2 |
| **8** | **Conecta Carreiras** (Mobilidade & Sucessão) | `PARCIAL` | `/careers-hub`, `CareersHubDashboardClient.tsx` | `SuccessionPlan`, `SuccessionCandidate` | **Ausentes:** portal interno de candidatura do colaborador com elegibilidade/tempo de cargo, trilhas de carreira em Y, matriz de gap de competências. | P2 |
| **9** | **Conecta Consultoria** (BPO & Projetos) | `PARCIAL` | `/consulting`, `ConsultingDashboardClient.tsx` | `ConsultingProject`, `ProjectDeliverable` | **Ausentes:** timesheet / apontamento de horas por consultor, gestão financeira de contratos e faturamento, portal externo para o cliente aprovar entregáveis com aceite formal. | P2 |

---

## 2. Análise Detalhada dos Módulos Críticos

### 2.1. Conecta Talentos (ATS)
* **Persistência Real:** Sim. Registra `Job`, `Candidate`, `Application`, transições de etapa (`ApplicationStageTransition`), entrevistas com scorecards e ofertas salariais.
* **Fit 3D:** Motor heurístico funcional em `fit-evaluator.ts` com tolerância configurável (padrão 15%).
* **Falhas Identificadas:** Na criação de candidatos via API (`POST /api/candidates`), o email é chave única global (`@unique`), permitindo que um recrutador da Empresa A modifique os dados de um candidato registrado na Empresa B.

### 2.2. Conecta Pessoas (Core HR)
* **Persistência Real:** Sim. Cadastro direto via `createDirectEmployee` e importação CSV (`importEmployeesBatch`) populam as tabelas `Employee`, `Department` e `Position`.
* **Falhas Identificadas:** A interface mescla candidaturas convertidas (`HireConversion`) com `Employee`. Dados de jornada são apenas uma string livre. Não há controle de férias, afastamentos, histórico salarial ou dissídios.

### 2.3. Conecta Operações (Admissão Digital & DP)
* **Persistência Real:** Sim. O candidato acessa o link via token seguro, faz upload dos documentos para a tabela `Document` e o time de DP aprova/rejeita com justificativa.
* **Falhas Identificadas:** Não existe módulo de desligamento. Quando um colaborador é desligado, o status é alterado manualmente para `TERMINATED`, sem cálculo rescisório, termo de devolução de ativos ou checklist formal.
