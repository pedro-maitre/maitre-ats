# 🚀 10. Auditoria de Vercel, Deploy e CI/CD — Maître Conecta

> **Evidências:** `[VERCEL]`, `[GITHUB]`, `[CONFIGURAÇÃO]`, `[TESTE]`  
> **Data:** Setembro de 2026  

---

## 1. Configuração do Projeto e Ambientes Vercel

* **Repositório Git:** `pedro-maitre/maitre-ats` (Branch principal: `main`).
* **Deploy Produção:** `https://maitreconecta.vercel.app`.
* **Projetos Relacionados Identificados:**
  * Documentação faz referência a `maitre-ats`, `talentosmaitre` e `maitreconecta`.
  * Essa dispersão de nomenclaturas reflete tentativas anteriores de deploy ou separação de ambientes de teste.
* **Build Script:** `"build": "prisma generate && next build"`.
  * Validado localmente em 28.6s (TypeScript) + 24.1s (Turbopack) sem erros impeditivos.

---

## 2. Diagnóstico das Falhas Históricas de Deploy

A análise técnica do histórico de commits e das configurações identificou **três causas raízes fundamentais** para falhas de deploy na Vercel:

1. **Dependência de Variáveis de Ambiente Ausentes na Vercel:**
   * O código continha fallbacks hardcoded em `src/lib/supabase.ts`, `src/lib/auth.ts` e `src/middleware.ts` precisamente porque o build falhava na Vercel quando variáveis como `NEXT_PUBLIC_SUPABASE_URL` ou `NEXTAUTH_SECRET` não estavam cadastradas no painel do projeto.
2. **Conexões Esgotadas com PostgreSQL (PgBouncer vs Porta Direta):**
   * O Prisma tentava abrir conexões diretas na porta 5432 durante requisições serverless concorrentes, esgotando o limite de conexões do Supabase (erro `sorry, too many clients already`).
   * *Mitigação aplicada:* Commit `82279b9` introduziu o driver `@prisma/adapter-pg` com pooler na porta 6543 e `DIRECT_URL` para operações administrativas.
3. **Deprecação da Convenção `middleware.ts` no Next.js 16:**
   * O build do Next.js 16 emite warning explícito:
     ```
     ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
     ```
   * Embora ainda compile em modo de compatibilidade, futuras versões canary ou atualizações menores do Next.js podem quebrar o deploy se não houver migração para o padrão `proxy.ts`.

---

## 3. Avaliação de Pipeline de CI/CD (GitHub Actions)

* **Status Atual:** Inexistência de pipeline automatizado de CI/CD no GitHub (`.github/workflows/` ausente).
* **Fluxo Atual:** O deploy ocorre via integração direta Vercel-GitHub (Push na branch `main` dispara build automático).
* **Riscos:**
  * Não há execução prévia de testes automatizados (`npm test`), typecheck (`tsc --noEmit`) ou linting antes que o código chegue na branch de produção.
  * Qualquer commit com falha lógica sobe diretamente para o ambiente online.
* **Recomendação:** Criar workflow GitHub Actions `.github/workflows/ci.yml` bloqueando merge caso os testes falhem.
