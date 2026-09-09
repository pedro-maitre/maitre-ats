# 🔐 04. Auditoria do Modelo Multitenant e RBAC — Maître Conecta

> **Evidências:** `[CÓDIGO]`, `[BANCO]`, `[TESTE]`  
> **Classificação de Risco:** `P0 — CRÍTICA`  
> **Data:** Setembro de 2026  

---

## 1. O Problema Estrutural do Modelo Multitenant

A arquitetura do Maître Conecta declara isolamento estrito entre a **Empresa Master (Maître Consultoria)** e as **Empresas Clientes Parceiras**.

No entanto, a auditoria de código comprovou que o isolamento é **predominantemente visual no cliente React (`tenant-context.tsx`)** e **não é aplicado uniformemente no servidor (Server Components, Server Actions e Route Handlers)**.

### Evidências Concretas de Falha de Isolamento Server-Side:

#### A. Vazamento Global em Server Components
Nos seguintes Server Components do App Router, as consultas ao Prisma **não incluem** a cláusula `where: { organizationId }` correspondente ao tenant do usuário autenticado:

1. `src/app/(dashboard)/page.tsx` (linhas 78-98):
   ```typescript
   prisma.job.findMany({ ... }) // Retorna vagas de TODAS as empresas
   prisma.candidate.findMany({ ... }) // Retorna candidatos de TODAS as empresas
   prisma.application.findMany({ ... }) // Retorna candidaturas de TODAS as empresas
   ```
2. `src/app/(dashboard)/insights/page.tsx` (linhas 18-44):
   ```typescript
   prisma.job.findMany({ ... })
   prisma.application.findMany({ ... })
   prisma.organization.findMany({ ... })
   ```
   *Impacto:* Todas as candidaturas, nomes de candidatos, pretensões salariais e métricas de contratação de todos os clientes corporativos são enviadas no payload HTML/JSON para o navegador do cliente!
3. `src/app/(dashboard)/operations/page.tsx` (linhas 28-55):
   ```typescript
   prisma.document.findMany({ ... })
   prisma.hireConversion.findMany({ ... })
   ```
   *Impacto:* Dossiês admissionais e documentos de colaboradores de todas as empresas clientes são lidos sem filtro.
4. `src/app/(dashboard)/careers-hub/page.tsx` (linhas 30-45):
   ```typescript
   prisma.successionPlan.findMany({ ... })
   ```
   *Impacto:* Planos de sucessão de executivos e cadeiras críticas de todos os clientes ficam expostos.
5. `src/app/(dashboard)/consulting/page.tsx` (linhas 30-51):
   ```typescript
   prisma.consultingProject.findMany({ ... })
   ```
   *Impacto:* Projetos de consultoria, orçamentos (`budget`) e entregáveis de todas as empresas são retornados.

#### B. Enumeração de Recursos (BOLA) em `/api/organizations`
No arquivo `src/app/api/organizations/route.ts` (linhas 13-28):
```typescript
const organizations = await prisma.organization.findMany({
  orderBy: { name: "asc" },
  select: {
    id: true,
    name: true,
    slug: true,
    _count: { select: { jobs: true, candidates: true, users: true } },
  },
});
```
*Qualquer usuário autenticado* (inclusive recrutador externo de uma empresa cliente ou candidato se tiver sessão válida) pode listar todos os clientes cadastrados na Maître e seus totais operacionais.

#### C. Sobrescrita de Candidatos Cross-Tenant em `/api/candidates`
No arquivo `src/app/api/candidates/route.ts` (linha 34):
```typescript
const candidate = await prisma.candidate.upsert({
  where: { email: cleanEmail },
  update: { firstName, lastName, phone, profileSummary, resumeUrl, ... }
  ...
});
```
Como o `email` é chave única global (`email String @unique` no `Candidate`), se um recrutador da Empresa A cadastrar um candidato cujo e-mail já existe na Empresa B, ele **sobrescreve** os dados do candidato sem validação de tenant!

---

## 2. Matriz de Perfis (RBAC): Declarado vs. Realidade do Código

| Perfil Declarado na Documentação | Existência no Enum/Types | Implementação Efetiva no Código | Escopo de Acesso Real |
|---|:---:|:---:|---|
| `SUPER_ADMIN` | ✅ Sim (`src/lib/security.ts`) | ✅ Implementado | Acesso irrestrito a todos os módulos e exclusões globais. |
| `ADMIN` | ✅ Sim | ✅ Implementado | Acesso irrestrito corporativo (administrador da Maître Consultoria). |
| `RECRUITER` | ✅ Sim | ✅ Implementado | Operações de R&S; bloqueado em `/users`, `/clients`, `/consulting`. |
| `HIRING_MANAGER` | ✅ Sim | ✅ Implementado | Acesso restrito a `/portal-gestor`, `/jobs` e `/settings/profile`. |
| `CANDIDATE` | ✅ Sim | ✅ Implementado | Acesso estrito às rotas `/carreiras/*`. |
| `MAITRE_MANAGER` | ❌ **Inexistente** | ❌ Não existe | Mapeado compulsoriamente como `ADMIN`. |
| `CONSULTANT` | ❌ **Inexistente** | ❌ Não existe | Não há distinção entre consultor de projetos e administrador. |
| `ORG_ADMIN` | ❌ **Inexistente** | ❌ Não existe | Não há perfil dedicado para o administrador da empresa cliente parceira! |
| `ORG_MANAGER` | ❌ **Inexistente** | ❌ Não existe | Inexistente. |
| `EMPLOYEE` | ❌ **Inexistente** | ❌ Não existe | Colaborador não possui login próprio para ver holerites/férias. |
| `INSTRUCTOR` | ❌ **Inexistente** | ❌ Não existe | Inexistente no módulo de Aprendizagem. |

---

## 3. Classificação de Risco do RBAC e Tenancy: `P0 — CRÍTICO`

* **Cenário de Exploração:** Um usuário com perfil de recrutador ou gestor da "Empresa Cliente Alfa" pode capturar a resposta HTTP das telas de Insights ou Operações e obter dados de candidatos, contratações e documentos da "Empresa Cliente Beta".
* **Recomendação Imediata:**
  1. Criar helper utilitário de servidor `getTenantFilter(session)` obrigatório em todas as queries do Prisma.
  2. Implementar verificação estrita de `requireTenantAccess` antes de qualquer mutação ou leitura.
  3. Desacoplar `Candidate.email` da unicidade global, tornando-o único por organização: `@@unique([organizationId, email])`.
