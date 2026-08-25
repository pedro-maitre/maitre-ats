# 🌐 Maître Conecta — Documentação Técnica & Arquitetura de Software

> **Guia para Desenvolvedores Fullstack**  
> Documento técnico detalhando a arquitetura, stack tecnológica, modelagem de dados, regras de negócio e fluxos do **Maître Conecta**.

---

## 📌 1. Visão Geral do Sistema

### A Suíte de 9 Módulos do Maître Conecta:

| Módulo | Responsabilidade | Rota Principal | Status |
| :--- | :--- | :--- | :---: |
| **Conecta Talentos** | ATS, vagas, pipeline, triagem 3D, entrevistas, scorecards e ofertas | `/jobs`, `/candidates` | **✅ Ativo** |
| **Conecta Pessoas** | Core HR, cadastro, vínculos, matrículas e ficha funcional | `/employees` | **✅ Ativo** |
| **Conecta Operações** | Admissão digital, documentos seguros com SHA-256 e termos | `/operations` | **✅ Ativo** |
| **Conecta Insights** | People Analytics, indicadores estratégicos de funil e projeção salarial | `/insights` | **✅ Ativo** |
| **Conecta Desenvolvimento** | Competências, desempenho 9-Box, feedback contínuo e PDI | `/development` | **🟡 Hub Integrado** |
| **Conecta Aprendizagem** | Treinamentos corporativos, LMS, trilhas e certificados | `/learning` | **🟡 Hub Integrado** |
| **Conecta Cultura** | Clima organizacional, pesquisas de pulso, eNPS e rituais de cultura | `/culture` | **🟡 Hub Integrado** |
| **Conecta Carreiras** | Mobilidade interna, recrutamento interno e mapas de sucessão | `/careers-hub` | **🟡 Hub Integrado** |
| **Conecta Consultoria** | Projetos estratégicos, entregáveis e acompanhamento dos consultores Maître | `/consulting` | **🟡 Hub Integrado** |

---

## 🛠️ 2. Stack Tecnológica

| Camada | Tecnologia | Versão / Detalhes |
| :--- | :--- | :--- |
| **Frontend Core** | Next.js (App Router, Server & Client Components, Turbopack) | `16.3.1` (React `19.2.8`) |
| **Linguagem** | TypeScript | `^5.0.0` (Strict Mode) |
| **Estilização** | Tailwind CSS v4, CSS Variables, Design System Luxo | `@tailwindcss/postcss ^4` |
| **Ícones & UI** | Lucide React, `@hello-pangea/dnd` (Kanban drag-and-drop) | `lucide-react`, `@hello-pangea/dnd` |
| **Backend & APIs** | Next.js Route Handlers + Server Actions | Arquitetura Modular em Camadas |
| **Autenticação** | NextAuth.js (Credentials Provider + JWT Session Strategy) | `^4.24.15` + `bcryptjs` |
| **Banco de Dados** | PostgreSQL gerenciado via Supabase / AWS Pooler | PostgreSQL com conexão via pool |
| **ORM** | Prisma ORM com `@prisma/adapter-pg` | `@prisma/client 7.9.1` |
| **Armazenamento de Arquivos** | Supabase Storage + Vercel Blob (`@vercel/blob`) + Servidor Local | Multi-Storage com Fallback Automático |
| **Processamento de IA** | OpenAI API (`gpt-4o-mini`) + `pdf-parse` + Heurística Nativa | JSON Schema estruturado com fallback 0ms |

---

## 🏗️ 3. Arquitetura em Camadas

A aplicação segue o padrão de **Clean Architecture adaptada ao ecossistema moderno do Next.js**:

```
maitre-ats/
├── src/
│   ├── app/                      # Camada de Apresentação & Rotas (Next.js App Router)
│   │   ├── (auth)/               # Login da Equipe e Recuperação de Senha
│   │   ├── (dashboard)/          # Painel Interno do Recrutador (Vagas, Candidatos, Usuários, Configurações)
│   │   ├── api/                  # Route Handlers REST (Auth, Parse Resume, Candidatos, Aplicações)
│   │   └── carreiras/            # Portal Público Multitenant por Empresa (/carreiras/[companySlug])
│   │
│   ├── components/               # Camada de Componentes Reutilizáveis
│   │   ├── candidates/           # Tabelas e cartões de visualização de candidatos
│   │   ├── jobs/                 # Pipeline container, Dashboard de vagas e formulários
│   │   ├── kanban/               # Quadro Kanban interativo com colunas e cards drag-and-drop
│   │   ├── layout/               # Sidebar corporativa e Topbar
│   │   ├── triagem/              # Tabela de Triagem Inteligente com abas de Fit e Ações em Lote
│   │   └── ui/                   # Componentes base (Botões, Modais, Badges, Loaders)
│   │
│   ├── lib/                      # Camada de Domínio & Serviços Utilitários
│   │   ├── auth.ts               # Configuração NextAuth, callbacks JWT e controle RBAC
│   │   ├── fit-evaluator.ts      # Algoritmo de Fit 3D, tolerâncias salariais e matching de tags
│   │   ├── prisma.ts             # Instância singleton do Prisma Client com adapter PostgreSQL
│   │   ├── resume-parser.ts      # Extrator heurístico inteligente e enriquecimento com IA
│   │   ├── resume-storage.ts     # Gerenciador de armazenamento com fallback triplo
│   │   └── supabase.ts           # Cliente Supabase Storage
│   │
│   └── proxy.ts                  # Middleware de proteção de borda (Next.js 16 Proxy)
```

---

## 🗄️ 4. Modelo de Dados (Prisma Schema)

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : possui
    ORGANIZATION ||--o{ JOB : publica
    ORGANIZATION ||--o{ CANDIDATE : armazena
    
    USER ||--o{ JOB : "gerencia / recruta"
    USER ||--o{ EVALUATION : avalia
    USER ||--o| CANDIDATE : "perfil vinculado"
    
    JOB ||--o{ STAGE : possui
    JOB ||--o{ APPLICATION : recebe
    
    STAGE ||--o{ APPLICATION : "etapa atual"
    
    CANDIDATE ||--o{ APPLICATION : aplica
    
    APPLICATION ||--o{ EVALUATION : contem
    APPLICATION ||--o{ ACTIVITY : registra
```

### Entidades Principais:

1. **`Organization`**: Empresa contratante ou consultoria (Multitenant com suporte a `slug` único).
2. **`User`**: Usuários internos com acesso ao sistema.
   * `role`: `SUPER_ADMIN` | `ADMIN` | `RECRUITER` | `CANDIDATE`.
3. **`Job`**: Vaga de emprego.
   * Atributos: `title`, `description`, `department`, `location`, `employmentType` (CLT, PJ), `seniority`, `salaryMin`, `salaryMax`, `status` (`OPEN`, `PAUSED`, `CLOSED`), `requiredSkills` (JSON tags).
   * Relações: Recrutador responsável (`recruiterId`), Hiring Manager (`hiringManagerId`), Etapas (`stages`).
4. **`Stage`**: Etapas do funil seletivo da vaga (ex: *Triagem, Entrevista RH, Entrevista Técnica, Proposta*).
   * Atributos: `name`, `order`, `jobId`.
5. **`Candidate`**: Perfil do candidato no Banco de Talentos.
   * Atributos: `firstName`, `lastName`, `email` (unique), `phone`, `linkedinUrl`, `resumeUrl` (link do PDF), `tags` (JSON string), `profileSummary`, `source` (Origem/Indicação).
6. **`Application`**: Inscrição de um candidato em uma vaga específica.
   * Atributos: `matchScore` (0-100), `fitCategory` (`ALTO_FIT`, `MEDIO_FIT`, `BAIXO_FIT`), `priority` (`PRIORIZADO`, `NORMAL`, `DUVIDA`), `salaryExpectation`, `stageId`, `enteredStageAt`.
7. **`Activity`**: Log de auditoria e linha do tempo de eventos do candidato (mudança de etapa, anotações, envio de candidatura com canal/indicação).
8. **`PasswordResetToken`**: Tokens criptográficos com tempo de expiração para redefinição segura de senha com descarte único.

---

## ⚙️ 5. Lógica de Negócio & Algoritmos

### 5.1. Motor de Avaliação Fit 3D ([fit-evaluator.ts](file:///c:/Users/a-a-p/Desktop/dev/maitre-ats/src/lib/fit-evaluator.ts))

O algoritmo cruza os dados estruturados da vaga com as informações do candidato em 3 etapas determinísticas:

#### 1. Salary Fit & Regras de Tolerância:
* **`WITHIN_BUDGET`**: Pretensão salarial está dentro de `[salaryMin, salaryMax]`.
* **`SLIGHTLY_ABOVE`**: Pretensão salarial está até **15% acima do teto orçamentário**. Não desclassifica; marca com badge de negociação.
* **`OUT_OF_BUDGET` (Knockout Alert)**: Pretensão salarial excede em mais de 15% o teto da vaga.
  * **Consequência:** Força `fitCategory = BAIXO_FIT` e `priority = DUVIDA`.

#### 2. Skills Match Heurístico:
* Compara as tags do candidato e o resumo profissional com o título, departamento e competências exigidas na vaga.
* Dicionário com mais de 150 competências mapeadas com matching semântico por expressão regular protegida (*Word Boundaries*).

#### 3. Categorização Final em Abas:
* 🟢 **`ALTO_FIT`**: Salário dentro do orçamento ou dentro da tolerância + Match de competências $\ge 70\%$. Sugere prioridade `PRIORIZADO`.
* 🟡 **`MEDIO_FIT`**: Salário dentro do orçamento com match moderado ($40\% - 69\%$).
* 🔴 **`BAIXO_FIT`**: Desvio orçamentário severo ou match de competências $< 40\%$.

---

### 5.2. Motor de Upload & Parsing de Currículos ([resume-storage.ts](file:///c:/Users/a-a-p/Desktop/dev/maitre-ats/src/lib/resume-storage.ts), [resume-parser.ts](file:///c:/Users/a-a-p/Desktop/dev/maitre-ats/src/lib/resume-parser.ts))

```
┌─────────────────────────────────────────────────────────────┐
│                 Upload de Currículo em PDF                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Triple-Layer Storage│        │  Dual-Layer Parsing  │
    │  1. Supabase Storage │        │  1. Heurístico       │
    │  2. Vercel Blob      │        │     (Offline, 0ms)   │
    │  3. Servidor Local   │        │  2. OpenAI           │
    │     (Zero Erro 500)  │        │     (Fallback 429)   │
    └──────────────────────┘        └──────────────────────┘
```

* **Storage Fallback Triplo:**
  1. Tenta envio ao Supabase Storage (bucket público `resumes`).
  2. Caso indisponível, tenta envio ao Vercel Blob via `@vercel/blob`.
  3. Caso ambos falhem, persiste no diretório `/public/uploads/resumes/` do servidor.
* **Parsing Híbrido Resiliente:**
  1. Extrai o texto binário do PDF via `pdf-parse`.
  2. Executa o **Extrator Heurístico Nativo** que isola o Nome Real (filtrando cabeçalhos de modelo de currículo), telefones com DDD brasileiro, links de LinkedIn, 150+ tags de skills e pretensão salarial.
  3. Tenta enriquecer via OpenAI `gpt-4o-mini` com timeout de 3.5s. Caso ocorra erro de cota (`HTTP 429 You have no credits remaining`), timeout ou falha de rede, **o motor heurístico assume instantaneamente**, garantindo que a aplicação nunca trave.

---

### 5.3. Fluxo de Candidatura com 3 Perguntas Objetivas

Na página de candidatura pública ([apply/page.tsx](file:///c:/Users/a-a-p/Desktop/dev/maitre-ats/src/app/carreiras/%5BcompanySlug%5D/%5BjobId%5D/apply/page.tsx)):

1. O sistema verifica a sessão do candidato logado e recupera automaticamente seu perfil salvo na **Área do Candidato**.
2. O formulário exibe **apenas as 3 perguntas exclusivas**:
   * 💰 **1. Pretensão Salarial Mensal (R$)**
   * 🤝 **2. Pergunta de Indicação:** `[ Não ]` ou `[ Sim, fui indicado(a) ]` *(abrindo o campo para o nome de quem indicou)*.
   * 📢 **3. Canal de Origem:** *LinkedIn, Portal de Carreiras, Indicação de Amigo, Redes Sociais, Hunting ou Outro*.
3. Ao submeter, cria a inscrição na etapa `Triagem`, calcula o Fit 3D, registra a atividade no histórico e permite ao candidato acompanhar as etapas em tempo real no portal.

---

## 🔒 6. Matriz de Permissões (RBAC)

O controle de acesso é aplicado no middleware de borda ([proxy.ts](file:///c:/Users/a-a-p/Desktop/dev/maitre-ats/src/proxy.ts)) e validado nas Server Actions:

| Recurso / Ação | SUPER_ADMIN | ADMIN | RECRUITER | CANDIDATE |
| :--- | :---: | :---: | :---: | :---: |
| **Acessar Painel ATS (`/jobs`, `/candidates`)** | ✅ | ✅ | ✅ | ❌ (Redirecionado) |
| **Gerenciar Usuários da Equipe (`/users`)** | ✅ | ✅ | ❌ | ❌ |
| **Criar / Editar Vagas** | ✅ | ✅ | ✅ (Atribuídas) | ❌ |
| **Excluir Candidatos ou Vagas** | ✅ | ✅ | ❌ | ❌ |
| **Mover Candidatos no Kanban / Triagem** | ✅ | ✅ | ✅ | ❌ |
| **Acessar Área do Candidato (`/candidato`)** | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 7. Bateria de Testes Automatizados

O repositório conta com suítes de testes automatizados em TypeScript/Node.js na pasta `scripts/`:

```bash
# Teste Mestre de Arquitetura & Segurança da Evolução (Conecta Talentos)
npx tsx scripts/test_evolution_master.ts

# Teste completo de integração do sistema (Banco, Storage, RBAC, Bcrypt, Stepper)
node scripts/run_full_system_test.js

# Teste do Motor de Fit 3D, Regras Salariais e Ações em Lote
npx tsx scripts/test_smart_triagem_and_fit.ts

# Teste de Resiliência de Upload & Parsing de Currículos (PDF)
npx tsx scripts/test_resume_upload_and_parsing.ts

# Teste do Fluxo Simplificado de Candidatura (3 Perguntas)
npx tsx scripts/test_streamlined_application.ts

# Teste de Atribuição e Redistribuição de Vagas para Recrutadores
node scripts/test_job_recruiter_assignment.js

# Teste de Recuperação e Redefinição de Senhas com Token Único
node scripts/test_password_reset.js
```

---

## 🚀 8. Instruções para Desenvolvimento Local

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/pedro-maitre/maitre-ats.git
cd maitre-ats
npm install
```

### 2. Configurar Variáveis de Ambiente (`.env`)
```env
DATABASE_URL="postgresql://user:password@host:5432/postgres"
NEXTAUTH_SECRET="sua-chave-secreta-de-producao"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-proj-..."
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"
```

### 3. Sincronizar Prisma & Iniciar Servidor
```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar o servidor de desenvolvimento com Turbopack
npm run dev
```

### 4. Build de Produção
```bash
npm run build
npm start
```
