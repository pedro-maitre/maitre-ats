# 🛡️ 07. Auditoria de Segurança da Aplicação — Maître Conecta

> **Referências Técnicas:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), OWASP ASVS v4.0  
> **Evidências:** `[CÓDIGO]`, `[CONFIGURAÇÃO]`, `[TESTE]`  
> **Data:** Setembro de 2026  

---

## 1. Mapeamento contra OWASP Top 10 e OWASP API Top 10

### A01:2021 — Broken Access Control (Controle de Acesso Quebrado) / API1:2023 — BOLA
* **Severidade:** `P0 — CRÍTICA`
* **Achado:** Endpoints de leitura em Server Components (`page.tsx`, `insights/page.tsx`, `operations/page.tsx`, `careers-hub/page.tsx`, `consulting/page.tsx`) e API `/api/organizations` não validam a organização do usuário logado, permitindo acesso indevido a dados corporativos de outras empresas clientes.
* **Achado:** API `/api/candidates` permite upsert por e-mail sem validação de tenant, possibilitando que um recrutador modifique dados de candidatos de outras empresas.

### A02:2021 — Cryptographic Failures (Falhas Criptográficas)
* **Severidade:** `P1 — ALTA`
* **Achado:** `AUTH_SECRET` possui valor padrão hardcoded em `src/lib/auth.ts` (`"maitre-ats-production-secret-key-123"`) e em `src/middleware.ts`. Se a variável `NEXTAUTH_SECRET` for esquecida ou perdida no deploy, qualquer atacante pode forjar tokens JWT válidos com qualquer papel (incluindo `SUPER_ADMIN`).
* **Mitigação:** Lançar exceção fatal no startup se `process.env.NEXTAUTH_SECRET` não estiver definido.

### A03:2021 — Injection (Injeção)
* **Severidade:** `P3 — BAIXA`
* **Avaliação:** O uso do Prisma ORM como Query Builder abstrai e parametriza todas as consultas SQL na aplicação principal, prevenindo SQL Injection tradicional. Não foram encontradas chamadas a `$queryRawUnsafe`.

### A04:2021 — Insecure Design (Design Inseguro)
* **Severidade:** `P1 — ALTA`
* **Achado:** O middleware de autenticação (`src/middleware.ts`) monitora apenas caminhos de páginas UI (`/dashboard/:path*`, `/jobs/:path*`, etc.) e **não inclui `/api/:path*` no matcher**. Se uma rota de API esquecer de chamar `requireAuth` ou `getServerSession`, ela fica totalmente desprotegida por padrão.

### A05:2021 — Security Misconfiguration (Configuração Incorreta de Segurança)
* **Severidade:** `P0 — CRÍTICA`
* **Achado:** Supabase Storage configurado com policies públicas de `SELECT` e `UPDATE` para qualquer cliente HTTP anônimo no bucket de currículos (`resumes`).

### A07:2021 — Identification and Authentication Failures (Falhas de Autenticação)
* **Severidade:** `P1 — ALTA`
* **Achado:**
  1. **Ausência de Rate Limiting no Login:** A rota `/api/auth/[...nextauth]` não possui limitação de tentativas por IP ou e-mail, vulnerável a força bruta e enumeração de credenciais.
  2. **Ausência de MFA:** Contas com privilégios elevados (`SUPER_ADMIN`, `ADMIN`) não possuem duplo fator de autenticação (MFA/TOTP).
  3. **Tempo de Sessão Estático Excessivo:** Sessão configurada com `maxAge: 30 dias` sem rotação ou invalidação por inatividade.

---

## 2. Hardening e Cabeçalhos de Segurança (HTTP Headers)

* **Avaliação:** Em `next.config.ts`, não há definição explícita de cabeçalhos de segurança essenciais:
  * `Content-Security-Policy` (CSP)
  * `X-Frame-Options: DENY`
  * `X-Content-Type-Options: nosniff`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy`
* **Recomendação:** Implementar cabeçalhos de segurança em `next.config.ts`.
