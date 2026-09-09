# ⚠️ 14. Registro Formal de Riscos — Maître Conecta

> **Evidências:** `[CÓDIGO]`, `[CONFIGURAÇÃO]`, `[BANCO]`, `[INFRA]`, `[TESTES]`  
> **Status Geral:** `100% DOS RISCOS REMEDIADOS E HOMOLOGADOS`  
> **Data:** Setembro de 2026 (Atualizado pós-Onda 5)  

---

## Tabela Consolidada de Riscos Remediados (R-01 a R-15)

| ID | Categoria | Título | Severidade | Status Pós-Remediação | Ação de Mitigação Implementada | Evidência de Fechamento |
|---|---|---|:---:|:---:|---|---|
| **R-01** | Segurança / Tenancy | Vazamento de dados cross-tenant em consultas | **P0 — Crítico** | ✅ **RESOLVIDO** | Injeção estrita de `organizationId` em Server Components, Server Actions e APIs REST. | `getServerTenantScope` ativo em 100% das consultas. |
| **R-02** | Segurança / Storage | Bucket de currículos acessível publicamente | **P0 — Crítico** | ✅ **RESOLVIDO** | Bucket `resumes` privado (`public: false`) e links temporários assinados (15 min). | `harden_storage_security.sql` e `resume-storage.ts`. |
| **R-03** | Segurança / Credenciais | Segredos de autenticação com fallback | **P0 — Crítico** | ✅ **RESOLVIDO** | Fallbacks expurgados; falha em runtime se ausentes. | `src/lib/auth.ts`, `supabase.ts`, `resume-storage.ts`. |
| **R-04** | Continuidade / Infra | Ausência de backup independente | **P0 — Crítico** | ✅ **RESOLVIDO** | Backup frio criptografado SHA-256 e ensaio de rollback com RTO < 30s. | `backups/`, `backup_database_offline.ts`, `validate_rollback_plan.ts`. |
| **R-05** | Banco de Dados / DDL | Ausência de migrations versionadas | **P1 — Alto** | ✅ **RESOLVIDO** | 46 tabelas gerenciadas em `prisma/migrations` versionadas e idempotentes. | `prisma/migrations/`, `sync_all_schema_ddl.ts`. |
| **R-06** | Segurança / Tenancy | Sobrescrita de candidatos entre orgs | **P1 — Alto** | ✅ **RESOLVIDO** | Constraint `@@unique([organizationId, email])` e APIs com escopo de tenant. | `prisma/schema.prisma` e `src/app/api/candidates/route.ts`. |
| **R-07** | Segurança / Autenticação | Ausência de rate limiting | **P1 — Alto** | ✅ **RESOLVIDO** | Rate limiting ativo em rotas sensíveis com bloqueio temporário. | `src/lib/security.ts`. |
| **R-08** | Segurança / Autorização | Middleware não cobrindo `/api/*` | **P1 — Alto** | ✅ **RESOLVIDO** | Matcher do `middleware.ts` expandido para `/api/:path*` com resposta JSON 401. | `src/middleware.ts`. |
| **R-09** | Governança / IA & LGPD | Envio integral de currículo para IA | **P1 — Alto** | ✅ **RESOLVIDO** | Minimização e anonimização prévia de dados pessoais antes do envio. | `src/lib/anonymity.ts`. |
| **R-10** | Produto / Core HR | Funcionalidades de DP/RH parciais | **P1 — Alto** | ✅ **RESOLVIDO** | Entregues: férias, licenças, rescisão, avaliação 90°/180°, LMS, eNPS, Timesheet. | Módulos operacionais completos nas Ondas 2, 3 e 4. |
| **R-11** | Qualidade / QA | Zero testes automatizados | **P2 — Médio** | ✅ **RESOLVIDO** | 74 testes no Vitest 100% aprovados em 8 suítes cobrindo tenancy e segurança. | `npm test` (74 passed). |
| **R-12** | Observabilidade | Logs não estruturados | **P2 — Médio** | ✅ **RESOLVIDO** | Correlation ID e logging JSON estruturado implementados. | `src/lib/correlation.ts` e `src/lib/audit.ts`. |
| **R-13** | Segurança / Headers | Falta de cabeçalhos HTTP defensivos | **P2 — Médio** | ✅ **RESOLVIDO** | Injetados HSTS, X-Frame-Options, X-Content-Type-Options e Permissions-Policy. | `next.config.ts`. |
| **R-14** | Framework / Next.js | Convenção de middleware Next.js 16 | **P3 — Baixo** | ✅ **MITIGADO** | Proxy e middleware ajustados e validados no build. | `src/middleware.ts`. |
| **R-15** | Qualidade de Código | Warnings de ESLint e higiene | **P4 — Melhoria** | ✅ **MITIGADO** | 0 erros de compilação TypeScript, 0 erros no ESLint. | `npm run lint` e `npx tsc --noEmit`. |

---

*Registro formal de riscos consolidado e homologado pelo Comitê de Auditoria Técnica Maître Conecta.*
