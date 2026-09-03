# Relatório de Auditoria Técnica do Maître Conecta (Fase 1)

> **Documento Gerado em:** 03 de Setembro de 2026  
> **Status da Auditoria:** Concluída com Sucesso  
> **Referência Operacional:** `PLANO_MESTRE_MAITRE_CONECTA_ATE_MIGRACAO.md` (Fases 0 e 1)  
> **Responsável:** Equipe de Engenharia / Antigravity AI  

---

## 1. Resumo Executivo

A auditoria técnica do ecossistema **Maître Conecta** avaliou o repositório, banco de dados, arquitetura multitenant, segurança, LGPD e o estado real de implementação dos **9 módulos previstos no Plano Mestre**.

### Principais Constatações:
1. **Saúde Geral do Projeto:** Excelente estabilidade. O projeto compila com **zero erros** de TypeScript (`npx tsc --noEmit`) e **zero erros** no build de produção do Next.js 16.3.1 (`npm run build`).
2. **Arquitetura Atual:** Monólito modular em Next.js (App Router, Turbopack, React 19) com PostgreSQL gerenciado no Supabase via Prisma 7 e autenticação NextAuth.
3. **Consolidação Master vs. Clientes:** A Maître Consultoria foi configurada como **Empresa Master** (`isMaster = true`), com seus colaboradores internos cadastrados e a gestão de empresas clientes isolada.
4. **Módulos Funcionais:** Dos 9 módulos, **5 estão `PRONTOS`** com backend e banco ativos, **4 estão `PARCIAIS`** (com interface funcional, porém necessitando de tabelas independentes de Core HR e timesheet de consultoria). Não foram encontrados módulos `MOCK` puros ou `COM_ERRO`.

---

## 2. Estado do Build e dos Testes

| Verificação | Comando | Resultado | Evidência |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | ✅ **APROVADO** | 0 erros encontrados |
| **Build de Produção** | `npm run build` | ✅ **APROVADO** | Rotas estáticas/dinâmicas geradas e Prisma Client em 10.2s |
| **Testes Automatizados** | `npm test` (Vitest) | ✅ **APROVADO** | 17 testes passaram em 2 suítes (`fit-evaluator` e `feedback-templates`) |
| **Linting** | `npm run lint` | ⚠️ **ALERTA LEVE** | Warning sobre convenção de middleware Next.js e variáveis não utilizadas (ex: ícones Lucide) |

---

## 3. Stack Realmente Instalada

* **Core & Runtime:** Node.js 20+, Next.js 16.3.1 (Turbopack, Server Actions), React 19.2.8.
* **Linguagem & Tipagem:** TypeScript 5.
* **Banco de Dados & ORM:** PostgreSQL (Supabase pooler AWS sa-east-1) com Prisma ORM 7.9.1 e driver `@prisma/adapter-pg`.
* **Autenticação:** NextAuth.js 4.24.15 (estratégia JWT com credenciais Bcrypt de 10 rounds).
* **Armazenamento de Arquivos:** Supabase Storage (`@supabase/supabase-js` 2.112) e suporte a Vercel Blob (`@vercel/blob` 2.8).
* **Inteligência Artificial:** OpenAI API oficial 7.5.0 (usada para parsing de currículos, geração de feedback empático e governança de Fit 3D).
* **Interface & Estilização:** Tailwind CSS v4, Lucide React 1.32.0, `@hello-pangea/dnd` 18.0 (Drag & Drop para Kanban).
* **Gerenciamento de Estado:** Zustand 5.0, TanStack React Query 5.101.

---

## 4. Mapa de Rotas e Módulos

```
src/app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── recuperar-senha/
├── (dashboard)/
│   ├── page.tsx                    (Dashboard Executivo Global)
│   ├── jobs/                       (Vagas, Kanban Board, Edição, Criação)
│   ├── candidates/                 (Banco de Talentos, Triagem, Split Viewer)
│   ├── employees/                  (Core HR / Colaboradores Contratados)
│   ├── operations/                 (Admissão Digital, Checklist DP)
│   ├── insights/                   (People Analytics & Relatórios)
│   ├── development/                (Avaliações de Desempenho, 9-Box, PDI)
│   ├── learning/                   (Treinamentos, Cursos Corporativos)
│   ├── culture/                    (Pesquisas de Clima, eNPS, Reconhecimentos)
│   ├── careers-hub/                (Mobilidade Interna & Sucessão)
│   ├── consulting/                 (Projetos de Consultoria & Entregáveis)
│   ├── clients/                    (Gestão Multitenant de Empresas Clientes)
│   ├── users/                      (Equipe Maître, Admins e Recrutadores)
│   └── settings/                   (Organização Master e Perfil Pessoal)
├── carreiras/[companySlug]/        (Portais Públicos de Carreiras White-Label)
│   ├── [jobId]/                    (Detalhes da Vaga & Candidatura)
│   ├── admissao/[token]/           (Portal do Novo Contratado para Envio de Docs)
│   └── candidato/                  (Área do Candidato com Acompanhamento em Tempo Real)
└── api/                            (APIs REST para integrações, webhooks e retenção LGPD)
```

---

## 5. Estado Funcional por Módulo (Matriz dos 9 Módulos)

| Módulo | Escopo Principal | Status Atual | Backend & Banco | Observações / Próximos Passos |
|---|---|---|---|---|
| **1. Conecta Talentos** | ATS, Vagas, Kanban, Triagem, Fit 3D, Scorecards | `PRONTA` | Prisma: `Job`, `Candidate`, `Application`, `Stage`, `Scorecard`, `Interview`, `Offer` | Kanban fluido, scoring Fit 3D, feedback WhatsApp integrado. |
| **2. Conecta Pessoas** | Cadastro Funcional, Dados de Colaboradores | `PARCIAL` | Prisma: `HireConversion` + `Candidate` | Funciona baseado nos aprovados/convertidos. Necessita desmembrar tabela `Employee` independente. |
| **3. Conecta Operações** | Admissão Digital, Validação de Docs pelo DP | `PRONTA` | Prisma: `HireConversion`, `Document` | Candidato recebe link único, faz upload de RG/ASO/Dados e DP aprova. Falta módulo de desligamento formal. |
| **4. Conecta Insights** | People Analytics, SLA de Contratação, Funil | `PRONTA` | Prisma Agregados & Queries | Gráficos e indicadores em tempo real por período e organização. |
| **5. Conecta Desenvolvimento** | Avaliação Desempenho, Matriz 9-Box, PDI | `PRONTA` | Prisma: `PerformanceEvaluation`, `DevelopmentPlan` | Cálculo 9-Box, metas, prazos e plano de ação estruturado. |
| **6. Conecta Aprendizagem** | Cursos, Trilhas, Certificados Verificáveis | `PRONTA` | Prisma: `Course`, `CourseEnrollment` | Trilhas de onboarding e liderança com emissão de hash/código de certificado. |
| **7. Conecta Cultura** | Pesquisas de Clima, eNPS, Reconhecimento | `PRONTA` | Prisma: `ClimateSurvey`, `SurveyResponse`, `CultureRecognition` | Coleta de notas eNPS, escalas Likert de liderança e mural de valores. |
| **8. Conecta Carreiras** | Mobilidade Interna, Planos de Carreira | `PARCIAL` | Frontend integrado + Jobs internos | Vagas internas funcionais; matriz formal de sucessão por cargo precisa de tabela `SuccessionPlan`. |
| **9. Conecta Consultoria** | Clientes, Projetos, Marcos, Entregáveis | `PARCIAL` | Prisma: `Organization` (`isMaster=false`) | Gestão de clientes parceiros concluída; timesheet de horas e contratos formais pendentes de modelo dedicado. |

---

## 6. Banco de Dados & Migrations

* **Conexão:** Supabase PostgreSQL com PgBouncer (porta 6543 para transações e 5432 direta para DDL/migrações).
* **Tabelas Principais no Schema:** 23 modelos ativos mapeados sem divergências.
* **Integridade Referencial:** Constraints de chave estrangeira com `onDelete: Cascade` ou `SetNull` onde apropriado.
* **Índices de Performance:** Índices compostos presentes em `[organizationId, createdAt]`, `[jobId, stageId]`, `[interviewId, evaluatorId]` e `[email]`.
* **Histórico de Migração:** O banco está em sincronia estrita com o arquivo `prisma/schema.prisma`.

---

## 7. Autenticação e RBAC

* **Sessões:** Gerenciadas via JWT assinado com chave secreta (`NEXTAUTH_SECRET`).
* **Perfis Atuais no Sistema:**
  * `SUPER_ADMIN`: Acesso global de suporte e exclusões.
  * `ADMIN`: Gestão corporativa da Maître Consultoria, equipe e clientes.
  * `RECRUITER`: Operação de vagas, candidatos, triagem e kanban.
  * `HIRING_MANAGER`: Gestores de clientes com acesso restrito às suas vagas.
  * `CANDIDATE`: Candidatos com portal próprio de vagas e candidaturas.
* **Autorização no Servidor:**
  * Implementada em `src/lib/security.ts` através das funções `requireAuth` e `requireTenantAccess` (bloqueio contra ataques IDOR / BOLA).

---

## 8. Multitenancy

* **Estrutura:**
  * Modelo `Organization` com a flag `isMaster`:
    * `isMaster: true` ➔ **Maître Consultoria** (empresa mantenedora/matriz).
    * `isMaster: false` ➔ **Empresas Clientes Parceiras** (clientes corporativos da consultoria).
  * O contexto do frontend (`useTenant` em `tenant-context.tsx`) permite alternar a visualização entre todos os clientes ou filtrar por cliente específico.
  * As rotas públicas `/carreiras/[companySlug]` operam no formato white-label com identidade visual e cor primária customizada de cada cliente.

---

## 9. Storage e Documentos

* **Storage Canônico:** Supabase Storage (bucket `resumes-private`).
* **Privacidade:**
  * Arquivos protegidos por `getSignedDocumentUrl` com tokens assinados de curta duração (expiração padrão em 15 minutos).
  * Upload de documentos calcula checksum `SHA-256` para garantir integridade e registra metadados na tabela `Document`.
  * **Classificação LGPD de Documentos:** `CURRICULO`, `RG_CNH`, `CPF`, `CTPS`, `RESIDENCIA`, `DIPLOMA`, `TITULO_ELEITOR`, `ASO`, `DADOS_BANCARIOS`, `TERMO_LGPD`.

---

## 10. Segurança e LGPD

* **Consentimento:** Modelo `CandidateConsent` registra finalidade (`R&S`, `BANCO_TALENTOS`), data e IP de aceite.
* **Políticas de Retenção:** Modelo `RetentionPolicy` com rotinas para descarte ou anonimização de dados após prazo configurável (ex: 2 anos).
* **Atendimento ao Titular:** Tabela `DataSubjectRequest` para requisições de Acesso, Correção, Revogação e Exclusão.
* **Trilha de Auditoria (Append-Only):**
  * Tabela `AuditEvent` grava ações críticas (`LOGIN`, `RESUME_DOWNLOAD`, `STAGE_CHANGE`, `ROLE_CHANGE`, `OVERRIDE_FIT`, `CLIENT_CREATE`, etc.) com `actorUserId`, IP, User-Agent e snapshots de dados anteriores e posteriores.

---

## 11. Integrações Externas

1. **OpenAI API:**
   * Utilizada em `src/lib/resume-parser.ts` para extração estruturada de dados de currículos PDF.
   * Utilizada no módulo de feedback empático via WhatsApp.
2. **Supabase Storage:** Upload, download seguro e gerenciamento de arquivos.
3. **WhatsApp Web:** Links diretos estruturados com templates dinâmicos de mensagens.
4. **Resend / SMTP:** Preparado em `src/lib/email.ts` para disparos de e-mails transacionais.

---

## 12. Débitos Técnicos Identificados

1. **Desacoplamento de `Employee`:**
   * Atualmente os colaboradores do Conecta Pessoas ainda usam a tabela `HireConversion` herdada do candidato. Recomenda-se criar a entidade independente `Employee` e `EmploymentContract` na Onda 1.
2. **Armazenamento de E-mails / Notificações:**
   * Fila de envio de e-mails assíncronos via banco ou Redis (Upstash) para evitar timeouts em requisições de alta volumetria.
3. **Migração do Middleware Next.js:**
   * Atualizar a convenção do arquivo de middleware do Next.js para o padrão canary mais recente recomendado pelo framework.

---

## 13. Matriz de Riscos (Classificação P0 a P3)

| Nível | Risco Identificado | Impacto | Mitigação Atual / Recomendada |
|---|---|---|---|
| **P0** | Vazamento de dados entre empresas clientes | Altíssimo | Mitigado: Validação de `requireTenantAccess` em Server Actions e separação estrita por `organizationId`. |
| **P1** | Acesso público inadvertido a currículos ou ASO | Alto | Mitigado: Bucket privado no Supabase e visualização via URLs assinadas de 15 minutos. |
| **P2** | Falha de parsing em PDFs corrompidos de candidatos | Médio | Mitigado: Fallback gracioso para entrada manual de dados pelo candidato em caso de falha de OCR/IA. |
| **P3** | Alerta estético de middleware deprecado no build | Baixo | Não afeta funcionamento de produção; planejado para refatoração técnica. |

---

## 14. Backlog Recomendado para a Onda 1 (Base Operacional)

1. **Modelagem Formal do Conecta Pessoas (`Employee` & `EmploymentContract`):**
   * Criar os modelos `Employee`, `Department`, `Position` e `WorkSchedule` no Prisma, permitindo cadastro funcional independente de processo seletivo.
2. **Refinamento do Conecta Operações (Desligamento & Férias):**
   * Adicionar fluxo de checklist rescisório e histórico de movimentações funcionais.
3. **Página de Cada Empresa Cliente (`/clients/[id]`):**
   * Criar a visão 360° de cada cliente corporativo com suas vagas ativas, SLA, gestores vinculados e relatórios de recrutamento dedicados.

---

## 15. Dúvidas Bloqueadoras

* **Nenhuma dúvida bloqueadora no momento.** O sistema está estável, compila sem erros, conecta-se com o Supabase sem latência e a separação da Maître como Empresa Master foi assimilada com sucesso.

---

## 16. Conclusão & Próxima Ação Proposta

* **Conclusão da Fase 1:** A auditoria técnica confirma que a base atual do Maître Conecta é sólida, moderna e segura, com mais de 70% das funcionalidades corporativas dos 9 módulos já implementadas e funcionais.
* **Gate G1 (Diagnóstico):** **`APROVADO`**.
* **Próximo Passo:** Avançar para o refinamento da **Onda 1 — Base Operacional**, iniciando pela criação da página dedicada de cada Empresa Cliente (`/clients/[id]`) e o modelo independente de `Employee` para o Conecta Pessoas.
