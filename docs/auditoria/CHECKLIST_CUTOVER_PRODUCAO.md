# 📋 Checklist Oficial de Cutover para Produção — Maître Conecta

> **Responsáveis:** Comitê Multidisciplinar de Auditoria Técnica e Equipe de Engenharia  
> **Status:** `APROVADO PARA EXECUÇÃO (GATES G8 E G9 HOMOLOGADOS)`  
> **Data:** Setembro de 2026  

---

## 1. Relação de Verificações Obrigatórias Pré-Cutover (T-21)

| Etapa | Verificação / Ação | Responsável | Status | Evidência Técnica |
|:---:|---|---|:---:|---|
| **1** | **Backup Frio Concluído & Hash Validado** | DevOps | ✅ **APROVADO** | Snapshot JSON em `backups/` com checksum SHA-256 verificado por script. |
| **2** | **Isolamento Multitenant Backend Verificado** | Segurança / QA | ✅ **APROVADO** | `reconcileTenantRecords` executado com 0 anomalias cross-tenant e 0 órfãos. |
| **3** | **Storage de Currículos com Acesso Privado** | Segurança | ✅ **APROVADO** | Bucket `resumes` estritamente privado (`public: false`), URLs assinadas com TTL 15 min. |
| **4** | **Segredos e Credenciais Auditados** | Segurança | ✅ **APROVADO** | Ausência de fallbacks hardcoded; validação estrita em runtime das variáveis de ambiente. |
| **5** | **Migrations Versionadas e Idempotentes** | DBA / Backend | ✅ **APROVADO** | 46 tabelas e constraints sincronizadas no PostgreSQL via `prisma/migrations`. |
| **6** | **Headers HTTP Defensivos Configurados** | Segurança / Frontend | ✅ **APROVADO** | Injeção de `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` no `next.config.ts`. |
| **7** | **Módulos Funcionais Completos (Ondas 2, 3 e 4)** | Produto / Engenharia | ✅ **APROVADO** | Core HR, DP, DHO (90°/180°), LMS/Certificados, eNPS com anonimato, Analytics e Consultoria operacionais. |
| **8** | **Suíte de Testes Automatizados 100% Aprovada** | QA | ✅ **APROVADO** | 74 testes no Vitest aprovados em 8 suítes (0 falhas). |
| **9** | **Tipagem Estrita e Compilação Limpa** | Engenharia | ✅ **APROVADO** | `tsc --noEmit` com 0 erros; `next build` Turbopack com código de saída 0. |
| **10**| **Ensaio de Rollback Homologado (RTO < 30min)** | Operações | ✅ **APROVADO** | `validate_rollback_plan.ts` testado com RTO medido < 30s. |

---

## 2. Cronograma de Janela de Mudança (Cutover Window)

```text
[T-00:30] Congelamento de atualizações e comunicação aos usuários
[T-00:20] Execução do backup frio de segurança com SHA-256
[T-00:10] Aplicação de migrations pendentes no banco PostgreSQL
[T-00:05] Deploy do bundle Next.js de produção
[T+00:00] Início das validações automatizadas de fumaça (Smoke Tests)
[T+00:05] Liberação oficial do tráfego para os tenants clientes
[T+00:30] Janela de monitoramento pós-cutover e confirmação dos Gates
```

---

## 3. Critério de Aceite Formal

O Cutover é considerado concluído com sucesso e aceito formalmente pela Diretoria da Maître Consultoria quando:
1. Todas as 10 etapas do checklist acima estiverem marcadas como **APROVADO**;
2. As taxas de erro HTTP 5xx forem inferiores a 0.05% nas primeiras 24 horas;
3. O log de auditoria registrar com precisão todos os acessos por organização (`organizationId`), sem qualquer evento de vazamento ou acesso não autorizado.
