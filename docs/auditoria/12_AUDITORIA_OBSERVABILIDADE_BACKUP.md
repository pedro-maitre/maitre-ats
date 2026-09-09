# 📈 12. Auditoria de Observabilidade, Logs e Backups — Maître Conecta

> **Evidências:** `[CÓDIGO]`, `[CONFIGURAÇÃO]`, `[INFRA]`  
> **Classificação:** `P0 — CRÍTICA` (Backups) / `P2 — MÉDIA` (Observabilidade)  
> **Data:** Setembro de 2026  

---

## 1. Trilha de Auditoria e Logs do Sistema

### Tabela `AuditEvent` (Prisma):
* **Campos:** `id`, `organizationId`, `actorUserId`, `action`, `resourceType`, `resourceId`, `beforeData`, `afterData`, `ipAddress`, `userAgent`, `reason`, `createdAt`.
* **Uso Real no Código:**
  * O helper `logAuditEvent` em `src/lib/audit.ts` é chamado em ações como:
    * Download/visualização de documento (`RESUME_VIEW`);
    * Atualização de status admissional (`CANDIDATE_UPDATE`);
    * Criação e alteração de vagas.
* **Pontos Fracos:**
  * Não há correlation ID (RequestId) unificando logs de frontend, backend e banco.
  * O campo `actorUserId` é opcional, permitindo logs anônimos sem atribuição de autoria clara em chamadas de sistema.
  * O console logging utiliza `console.log` e `console.error` simples em formato não estruturado (sem JSON, sem nível Winston/Pino), dificultando agregação em ferramentas como Datadog ou Grafana Loki.

---

## 2. Diagnóstico de Backups e Continuidade de Negócios

### Estado Auditado:
1. **Backups do Banco PostgreSQL:**
   * Depende integralmente dos backups automáticos gerenciados da plataforma Supabase.
   * Não há script no repositório para geração periódica de `pg_dump` com envio para bucket S3 externo independente.
   * **Risco Grave de Dependência:** Se a conta do Supabase for pausada por inatividade, suspensa por cobrança ou excluída acidentalmente, não há backup off-site sob custódia direta da Maître Consultoria.
2. **Backups dos Arquivos (Storage):**
   * Currículos e documentos admissionais residem exclusivamente no bucket do Supabase Storage. Não há replicação ou backup diário para storage secundário.
3. **Métricas de Continuidade de Negócios:**
   * **RPO (Recovery Point Objective):** Desconhecido formalmente (dependente do snapshot diário do plano Supabase).
   * **RTO (Recovery Time Objective):** Indeterminado (não há procedimento documentado nem testado de restauração).

### Regra de Ouro da Auditoria:
> *"Backup não testado não deve ser classificado como controle efetivo."*  
> O controle de backup e recuperação está atualmente **REPROVADO**.

---

## 3. Recomendações Mandatórias (Onda 0 e 1)

1. **Implementar Script de Dump Automatizado:** Configurar rotina diária via GitHub Actions ou cron seguro executando `pg_dump` criptografado e enviando para bucket AWS S3 / Cloudflare R2 independente da infraestrutura principal.
2. **Executar Ensaio de Restauração (Restore Test):** Restaurar o dump do banco em uma instância limpa de teste e validar a integridade de dados e integridade referencial.
3. **Adicionar Correlation ID:** Implementar middleware gerando `X-Request-Id` repassado para todas as queries do banco e chamadas de API.
