# 🧪 11. Auditoria de Testes e Qualidade (QA) — Maître Conecta

> **Evidências:** `[TESTE]`, `[CÓDIGO]`  
> **Classificação:** `P1 — ALTA`  
> **Data:** Setembro de 2026  

---

## 1. Inventário de Testes Automatizados no Vitest

A execução do comando `npm test` (`vitest run`) revelou **apenas duas suítes de testes**, totalizando **17 testes unitários**:

1. `src/lib/feedback-templates.test.ts` (8 testes): Valida formatação de mensagens de WhatsApp e e-mail.
2. `src/lib/fit-evaluator.test.ts` (9 testes): Valida regras matemáticas de tolerância salarial (15%), knockouts e cálculo de aderência de competências.

*Tempo de execução:* 409ms. **100% de sucesso**.

---

## 2. Matriz de Cobertura das 16 Jornadas Críticas

| # | Jornada Crítica de Negócio | Teste Automatizado Existente? | Resultado do Teste | Lacuna Identificada | Prioridade |
|---|---|:---:|:---:|---|:---:|
| **1** | Candidato se cadastra | ❌ Não | `AUSENTE` | Falta teste de unicidade de e-mail e hash bcrypt. | P1 |
| **2** | Candidato se inscreve em vaga | ❌ Não | `AUSENTE` | Falta teste de submissão de formulário e upload de PDF. | P1 |
| **3** | Recrutador realiza triagem | ⚠️ Parcial | `PARCIAL` | Coberto apenas na lógica unitária de `fit-evaluator.ts`. | P2 |
| **4** | Candidatura muda de etapa no Kanban | ❌ Não | `AUSENTE` | Falta teste de persistência em `ApplicationStageTransition`. | P1 |
| **5** | Candidato aprovado inicia admissão | ❌ Não | `AUSENTE` | Falta teste de geração de token e dossiê em `HireConversion`. | P1 |
| **6** | Admissão gera colaborador no Core HR | ❌ Não | `AUSENTE` | Falta teste de conversão para `Employee` e emissão de matrícula. | P1 |
| **7** | Colaborador acessa documentos admissionais | ❌ Não | `AUSENTE` | Falta teste de autorização de leitura e signed URL. | P1 |
| **8** | Gestor realiza avaliação de desempenho | ❌ Não | `AUSENTE` | Falta teste de cálculo de quadrante 9-Box no banco. | P2 |
| **9** | Resultado de avaliação gera PDI | ❌ Não | `AUSENTE` | Falta teste de persistência em `DevelopmentPlan`. | P2 |
| **10** | Colaborador realiza treinamento e emite certificado | ❌ Não | `AUSENTE` | Falta teste de hash único de certificado em `CourseEnrollment`. | P2 |
| **11** | RH conduz pesquisa de clima e calcula eNPS | ❌ Não | `AUSENTE` | Falta teste de fórmula eNPS (+100 a -100) e anonimato. | P2 |
| **12** | Consultor acompanha projeto e entregáveis | ❌ Não | `AUSENTE` | Falta teste de recálculo de progresso em `ConsultingProject`. | P2 |
| **13** | Cliente corporativo acessa relatório | ❌ Não | `AUSENTE` | Inexistente (portal do cliente não implementado). | P2 |
| **14** | Administrador revoga acesso de usuário | ❌ Não | `AUSENTE` | Falta teste de invalidação de sessão ou desativação de conta. | P1 |
| **15** | **Organização A permanece estritamente isolada da B** | ❌ **NÃO** | **`CRÍTICO`** | **ZERO testes de isolamento multitenant no repositório!** | **P0** |
| **16** | Backup é restaurado com integridade | ❌ Não | `AUSENTE` | Zero testes de disaster recovery / restore. | P0 |

---

## 3. Avaliação de Scripts Avulsos de Teste em `scripts/`

O diretório `scripts/` contém dezenas de scripts com prefixo `test_` (ex: `run_full_system_test.js`, `test_rbac_delimitations.ts`, `test_all_online_modules.ts`).

### Alerta Grave de Engenharia:
* Quase todos esses scripts conectam-se ao banco **remoto de produção do Supabase** e executam `prisma.create` e `supabase.upload` diretamente com dados de teste (`candidato.teste@maitre.com.br`).
* **Não devem ser executados em produção** sob risco de poluição da base real e violação de integridade.
* Devem ser refatorados para testes de integração com banco em container local (`docker-compose.yml`) ou SQLite em memória.
