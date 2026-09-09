-- ==============================================================================
-- Script de Hardening de Segurança: Supabase Storage (Bucket resumes)
-- Maître Conecta — Onda 0 (Contenção Imediata)
-- ==============================================================================
-- Finalidade:
-- 1. Fechar acesso anônimo público ao bucket de currículos e documentos sensíveis
-- 2. Revogar políticas permissivas de SELECT e UPDATE público
-- 3. Restringir acesso a downloads exclusivamente via backend autenticado (URLs assinadas)
-- ==============================================================================

-- 1. Dropar todas as policies públicas perigosas anteriores
DROP POLICY IF EXISTS "Public Uploads to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Select from resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update on resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert on resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on resumes" ON storage.objects;

-- 2. Garantir que o bucket resumes seja estritamente PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';

-- 3. Permitir operações apenas para o papel de serviço (service_role) e usuários autenticados específicos
-- Operações de backend executadas via Prisma / SUPABASE_SERVICE_ROLE_KEY ignoram RLS por padrão.
-- Para clientes anon e authenticated diretos via PostgREST, bloquear acesso por padrão:

CREATE POLICY "Disallow public access to resumes"
ON storage.objects FOR ALL
TO anon
USING (false);

-- 4. Permitir que apenas o service_role tenha controle total no bucket
CREATE POLICY "Service role full access to resumes"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- ==============================================================================
-- Verificação das políticas ativas
-- ==============================================================================
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
