# 📦 06. Auditoria do Supabase e Storage — Maître Conecta

> **Evidências:** `[SUPABASE]`, `[CÓDIGO]`, `[CONFIGURAÇÃO]`  
> **Classificação de Risco:** `P0 — CRÍTICA`  
> **Data:** Setembro de 2026  

---

## 1. Configuração do Supabase Storage

O armazenamento de currículos e documentos admissionais é gerenciado através do SDK `@supabase/supabase-js` em `src/lib/resume-storage.ts` e `src/lib/supabase.ts`.

### Achados Críticos Confirmados:

#### A. Exposição de Credenciais no Código-Fonte
Em `src/lib/supabase.ts` (linhas 4-5) e `src/lib/resume-storage.ts` (linhas 6-16):
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqnlcwglyxqsemqhjkmp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Gaj8GoRPDXpDZ0mGaVJU9Q_fXOEir_3";
```
*Vulnerabilidade:* O URL do projeto Supabase e a chave pública anon estão fixados no código-fonte como fallback.

#### B. Políticas de Storage Permissivas (Acesso Público a Documentos)
No script `scripts/apply_storage_policies.js` (linhas 27-42):
```sql
CREATE POLICY "Allow public insert on resumes"
ON storage.objects FOR INSERT
TO public, anon, authenticated
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow public select on resumes"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'resumes');

CREATE POLICY "Allow public update on resumes"
ON storage.objects FOR UPDATE
TO public, anon, authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');
```
*Vulnerabilidade Crítica:* A política `Allow public select on resumes` permite que **qualquer usuário anônimo na internet** faça download ou visualize qualquer currículo ou documento armazenado no bucket `resumes` caso conheça ou adivinhe o nome do arquivo!
Além disso, a política `Allow public update on resumes` permite sobrescrever arquivos no bucket!

#### C. Geração de URLs Públicas para Currículos
No arquivo `src/lib/resume-storage.ts` (linha 85):
```typescript
const publicUrl = storageClient.storage.from("resumes").getPublicUrl(storageKey).data.publicUrl;
```
A função `uploadSecureDocument` gera uma URL pública (`getPublicUrl`) e a persiste no registro do candidato (`Candidate.resumeUrl`), tornando o documento acessível publicamente via CDN do Supabase sem necessidade de autenticação.

---

## 2. Row Level Security (RLS) no PostgreSQL do Supabase

* **Script de Hardening:** O arquivo `scripts/apply_database_rls_hardening.js` foi executado anteriormente para ativar RLS nas tabelas do schema `public` e revogar acesso do role `anon`.
* **Risco de Regressão com Novas Tabelas:**
  Como o sistema utiliza `prisma db push`, quando novas tabelas foram criadas no banco (ex: `Employee`, `Department`, `Position`, `ConsultingProject`, `ProjectDeliverable`, `SuccessionPlan`, `SuccessionCandidate`), **o PostgreSQL as criou com RLS DESATIVADO (`rowsecurity = false`)**.
  Se o script `apply_database_rls_hardening.js` não for reexecutado a cada alteração de schema, todas as novas tabelas ficam expostas para acesso direto via API PostgREST do Supabase utilizando a anon key pública!

---

## 3. Recomendações Mandatórias (Onda 0)

1. **Alterar o Bucket para Estritamente Privado:**
   * Garantir `public: false` no bucket `resumes`.
   * Dropar as policies de `public select` e `public update`.
   * Permitir leitura e escrita apenas através do backend via `SUPABASE_SERVICE_ROLE_KEY`.
2. **Remover Fallback de URL Pública:**
   * Nunca chamar `getPublicUrl` para documentos sensíveis (currículos, RG, CPF, ASO, dados bancários).
   * Acesso exclusivo através da rota `/api/documents/[id]` com verificação estrita de tenant e geração de signed URL de 15 minutos.
3. **Trigger Automático de RLS:**
   * Criar um event trigger no PostgreSQL para que qualquer `CREATE TABLE` no schema `public` ative automaticamente o RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
