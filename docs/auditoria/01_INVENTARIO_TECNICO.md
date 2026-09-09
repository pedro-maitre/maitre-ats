# 🛠️ 01. Inventário Técnico — Maître Conecta

> **Evidências:** `[CONFIGURAÇÃO]`, `[CÓDIGO]`, `[TESTE]`  
> **Data:** Setembro de 2026  

---

## 1. Stack Efetivamente Instalada (Verificada via package.json e lockfile)

| Componente | Versão Declarada / Instalada | Licença | Finalidade no Sistema | Status / Observação |
|---|---|---|---|---|
| **Node.js** | `>= 20.x` | MIT | Runtime do servidor | Suportado pela Vercel |
| **Next.js** | `16.3.1` (App Router, Turbopack) | MIT | Framework Full Stack | Alerta de convenção: middleware deprecado para `proxy` |
| **React / React-DOM** | `19.2.8` | MIT | Biblioteca UI | Versão mais recente |
| **TypeScript** | `^5.x` | Apache-2.0 | Tipagem estática | Modo estrito validado (`tsc --noEmit` aprovado) |
| **Prisma ORM** | `7.9.1` | Apache-2.0 | ORM e Query Builder | Versão 8-rc disponível. Ausência de pasta migrations. |
| **@prisma/adapter-pg** | `^7.9.1` | Apache-2.0 | Driver pooler PostgreSQL | Conexão otimizada para Serverless / Supabase PgBouncer |
| **pg** | `^8.23.0` | MIT | Cliente PostgreSQL nativo | Conexão pool direta |
| **@supabase/supabase-js** | `^2.112.3` | MIT | SDK do Supabase Storage / Auth | Hardcoded keys encontradas no código-fonte |
| **@vercel/blob** | `^2.8.0` | Apache-2.0 | Storage de objetos alternativo | Instalado, uso esporádico |
| **@vercel/speed-insights** | `^2.0.0` | Apache-2.0 | Telemetria Vercel | Instalado |
| **next-auth** | `^4.24.15` | ISC | Autenticação e Sessão JWT | Credentials Provider; ausência de MFA |
| **bcryptjs** | `^3.0.3` | MIT | Hashing de senhas | 10 rounds de salt |
| **openai** | `^7.5.0` | Apache-2.0 | Integração com LLMs OpenAI | Usado com gpt-4o-mini para CV parsing e feedback |
| **pdf-parse** | `^1.1.1` | MIT | Extração de texto de PDFs | Leitura heurística de currículos em memória |
| **@hello-pangea/dnd** | `^18.0.1` | Apache-2.0 | Drag and drop para React 19 | Usado no Pipeline Kanban de Vagas |
| **lucide-react** | `^1.32.0` | ISC | Ícones SVG | Utilizado na interface |
| **tailwindcss** | `^4.x` com `@tailwindcss/postcss` | MIT | Framework CSS utilitário | Nova versão Tailwind v4 |
| **zustand** | `^5.0.15` | MIT | Gerenciamento de estado global | Contextos locais |
| **@tanstack/react-query** | `^5.101.4` | MIT | Cache e revalidação de dados | Gerenciamento de dados assíncronos no cliente |
| **vitest** | `^4.1.11` | MIT | Runner de testes unitários | 17 testes configurados e executando |

---

## 2. Scripts Disponíveis e Avaliação de Risco de Execução

| Script no package.json | Comando | Classificação de Risco | Requer Autorização? |
|---|---|---|---|
| `dev` | `next dev` | Seguro (Local) | Não |
| `build` | `prisma generate && next build` | Seguro (Local, somente leitura do banco de dados para SSG) | Não |
| `start` | `next start` | Seguro (Local) | Não |
| `lint` | `eslint` | Seguro (Somente Leitura) | Não |
| `test` | `vitest run` | Seguro (Testes unitários puros em memória) | Não |
| `postinstall` | `prisma generate` | Seguro (Geração de tipos locais) | Não |
| `db:push` | `prisma db push` | **DESTRUTIVO / ALTO RISCO** (Modifica schema diretamente no banco remoto) | **SIM (PROIBIDO EM PRODUÇÃO)** |
| `db:seed` | `npx tsx prisma/seed.ts` | **DESTRUTIVO / MÉDIO RISCO** (Insere/altera dados no banco remoto) | **SIM** |

---

## 3. Arquivos de Configuração Encontrados

* `next.config.ts`: Configura `serverActions.bodySizeLimit: '10mb'`.
* `prisma.config.ts`: Aponta para `prisma/schema.prisma` e define `DIRECT_URL || DATABASE_URL`.
* `tsconfig.json`: Configura target `ES2017`, `strict: true`, paths `@/*`.
* `eslint.config.mjs`: Configuração do ESLint 9 com regras do Next.js.
* `docker-compose.yml`: Configuração legada de container local para desenvolvimento.
* `.env`: Variáveis locais ativas conectando ao banco remoto do Supabase.
