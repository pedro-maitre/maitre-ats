# 🌐 Maître Conecta

> **Plataforma Inteligente de Recrutamento, Seleção e Conexão de Talentos da Maître Consultoria.**

Construído com **Next.js 16 (React 19)**, **TypeScript**, **Tailwind CSS v4**, **PostgreSQL**, **Prisma ORM**, **Supabase Storage** e **OpenAI**.

---

## 📖 Documentação Completa de Arquitetura

Para obter todos os detalhes de arquitetura em camadas, modelagem de banco de dados, motor de Fit 3D, parsing de currículos em PDF e fluxos de segurança, consulte o documento técnico:

👉 **[Consulte o Guia Técnico de Arquitetura (ARQUITETURA.md)](./ARQUITETURA.md)**

---

## 🚀 Principais Módulos

* **📋 Pipeline Kanban Interativo:** Funil dinâmico de etapas de contratação com *drag-and-drop* (@hello-pangea/dnd).
* **🎯 Triagem Inteligente & Motor Fit 3D:** Classificação automática em *Alto Fit*, *Médio Fit* e *Baixo Fit* com tolerância salarial de 15% e Knockouts.
* **📄 Motor Resiliente de Currículos:** Armazenamento com Fallback Triplo (Supabase, Vercel Blob, Local) e extração de dados híbrida (Heurística offline + IA com tolerância a erro de cota 429).
* **🌐 Portal de Carreiras Multitenant & Área do Candidato:** Páginas por empresa (`/carreiras/[companySlug]`), candidatura simplificada com 3 perguntas e acompanhamento via *Stepper*.
* **🔐 Segurança & RBAC:** Controle de acesso com 4 perfis (`SUPER_ADMIN`, `ADMIN`, `RECRUITER`, `CANDIDATE`) e recuperação de senha segura com tokens de uso único.

---

## 🛠️ Como Executar o Projeto

```bash
# 1. Instalar dependências
npm install

# 2. Gerar cliente do Prisma
npx prisma generate

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Executar bateria de testes automatizados
node scripts/run_full_system_test.js

# 5. Build de produção
npm run build
```
