# 🗄️ 05. Auditoria do Banco de Dados e Prisma ORM — Maître Conecta

> **Evidências:** `[BANCO]`, `[PRISMA]`, `[CÓDIGO]`  
> **Classificação de Risco:** `P1 — ALTA`  
> **Data:** Setembro de 2026  

---

## 1. Inventário do Prisma Schema (`prisma/schema.prisma`)

O arquivo `prisma/schema.prisma` contém **34 modelos de dados**, configurados com `provider = "postgresql"` e cliente `prisma-client-js`.

### Modelos Identificados:
1. `Organization` (Organizações e Empresas Clientes)
2. `User` (Usuários do sistema)
3. `OrganizationMembership` (Vínculo de usuários e papéis com organizações)
4. `Job` (Vagas)
5. `Candidate` (Candidatos no banco de talentos)
6. `Stage` (Etapas do processo seletivo)
7. `Application` (Candidaturas)
8. `ApplicationStageTransition` (Histórico de transição de etapas)
9. `Document` (Documentos e metadados de arquivos)
10. `AuditEvent` (Logs de auditoria de ações críticas)
11. `Interview` (Entrevistas agendadas)
12. `Scorecard` (Fichas de avaliação de entrevista)
13. `Offer` (Propostas de emprego)
14. `HireConversion` (Conversão de candidato aprovado para colaborador/DP)
15. `IntegrationOutbox` (Outbox pattern para eventos assíncronos)
16. `Evaluation` (Avaliações genéricas)
17. `Activity` (Linha do tempo de atividades da vaga)
18. `CandidateConsent` (Termos de consentimento LGPD)
19. `RetentionPolicy` (Políticas de retenção de dados)
20. `DataSubjectRequest` (Pedidos de direitos de titulares LGPD)
21. `PasswordResetToken` (Tokens de recuperação de senha)
22. `PerformanceEvaluation` (Avaliações de desempenho 9-Box)
23. `DevelopmentPlan` (Planos de Desenvolvimento Individual - PDI)
24. `ClimateSurvey` (Pesquisas de clima organizacional)
25. `SurveyResponse` (Respostas às pesquisas de clima)
26. `CultureRecognition` (Mural de reconhecimentos e valores)
27. `Course` (Cursos corporativos do LMS)
28. `CourseEnrollment` (Matrículas em cursos e progresso)
29. `Department` (Departamentos e áreas)
30. `Position` (Cargos e CBOs)
31. `Employee` (Colaboradores formais do Core HR)
32. `ConsultingProject` (Projetos de consultoria e BPO)
33. `ProjectDeliverable` (Entregáveis e marcos de projetos)
34. `SuccessionPlan` e `SuccessionCandidate` (Planos de sucessão de liderança)

---

## 2. Diagnóstico Crítico: Ausência de Histórico de Migrations

### Constatação:
* O diretório `prisma/migrations` **NÃO EXISTE** no repositório.
* O `package.json` define:
  ```json
  "db:push": "prisma db push"
  ```
* O histórico do Git revela scripts avulsos como:
  * `scripts/migrate_development_tables.ts`
  * `scripts/migrate_operations_columns.ts`
  * `scripts/migrate_whitelabel_columns.ts`
  * `scripts/clean_and_emit_real_database.ts`

### Impacto Técnico e Riscos:
1. **Falta de Rastreabilidade:** Não há registro determinístico de quais alterações DDL foram aplicadas no banco de produção e em que ordem.
2. **Risco em Produção:** O comando `prisma db push` tenta sincronizar o schema diretamente com o banco remoto, podendo dropar colunas ou constraints silenciosamente se houver divergência.
3. **Bloqueador de CI/CD:** Ambientes de staging e novas instâncias não podem ser reconstruídos com segurança a partir do zero sem migrations versionadas (`prisma migrate deploy`).

---

## 3. Análise de Constraints, Integridade e Modelagem

1. **Unicidade de E-mail de Candidato:**
   * `Candidate`: `email String @unique`
   * *Problema:* O e-mail é único no banco inteiro, não por organização. Em uma plataforma multitenant multicliente, o mesmo candidato deve poder se candidatar a vagas da Empresa A e da Empresa B sem que o perfil seja mesclado ou sobrescrito.
   * *Solução:* Alterar para `@@unique([organizationId, email])`.
2. **Abuso de Campos JSON String (`String?` com payload JSON):**
   * Exemplos: `requiredSkills`, `tags`, `aiSnapshot`, `additionalData`, `structuredData`, `competencies`, `actionItems`, `questions`, `dimensionScores`, `modules`, `bankDetails`.
   * *Problema:* Campos gravados como texto (`String`) em vez de tipos nativos `Json` do PostgreSQL impedem consultas indexadas (`@>`), validação de integridade e constraints no banco.
3. **Ausência de Enums Nativos do PostgreSQL:**
   * Estados como `Job.status`, `Application.priority`, `Document.classification`, `Employee.status` utilizam strings livres (`String @default(...)`).
   * *Risco:* Inconsistências de digitação (ex: "Active", "ACTIVE", "ativo") quebram filtros do sistema.
4. **Pool de Conexões e PgBouncer:**
   * O sistema implementou o `@prisma/adapter-pg` com porta de pooler (6543) e conexão direta (5432) configurada em `prisma.config.ts`, o que é adequado para o ambiente serverless da Vercel.
