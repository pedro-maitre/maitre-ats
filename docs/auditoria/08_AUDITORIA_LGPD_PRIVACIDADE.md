# ⚖️ 08. Auditoria de LGPD e Privacidade — Maître Conecta

> **Evidências:** `[LGPD]`, `[CÓDIGO]`, `[BANCO]`  
> **Classificação:** Avaliação Técnica e Documental (Para validação do DPO e Assessoria Jurídica)  
> **Data:** Setembro de 2026  

---

## 1. Inventário de Dados Pessoais e Sensíveis Tratados

| Categoria de Dados | Campos Específicos no Banco | Sensibilidade | Finalidade Declarada | Base Legal Sugerida a Validar | Risco Técnico Identificado |
|---|---|:---:|---|---|---|
| **Cadastrais de Candidatos** | Nome, e-mail, telefone, LinkedIn, cidade | Dados Pessoais | Recrutamento e Seleção | Consentimento / Diligências pré-contratuais (Art. 7º, V) | Upsert sem isolamento de tenant em `/api/candidates`. |
| **Currículos (PDF)** | Histórico profissional, formação, endereço, foto eventual | Dados Pessoais | Triagem e Fit 3D | Consentimento / Execução de contrato | **Risco P0:** Bucket de storage com permissão pública de SELECT e UPDATE. |
| **Pretensão Salarial** | `salaryExpectation`, `salaryMin`, `salaryMax` | Dados Pessoais | Análise de fit orçamentário | Legítimo Interesse / Pré-contratual | Dados salariais expostos sem tenant filter em `/insights`. |
| **Dados Admissionais (DP)** | CPF, RG, CTPS, PIS, Título de Eleitor, Certidões | Dados Pessoais | Admissão formal e cumprimento legal | Cumprimento de obrigação legal (Art. 7º, II - CLT / eSocial) | Dossiês retornados sem filtro de organização em `/operations`. |
| **Saúde Ocupacional (ASO)** | Atestado de Saúde Ocupacional (`classification = 'ASO'`) | **Dado Sensível (Art. 5º, II)** | Admissão e PCMSO/NR-7 | Cumprimento de obrigação legal | Atestados médicos armazenados no mesmo bucket sem criptografia em repouso adicional. |
| **Avaliações & Matriz 9-Box** | Performance score, potential score, melhorias, feedback | Dados Pessoais | Gestão de Desempenho e PDI | Legítimo Interesse / Execução de contrato | Exposição cross-tenant no dashboard geral. |
| **Clima e eNPS** | Notas de 0 a 10, comentários, notas Likert por dimensão | Dados Pessoais (se correlacionáveis) | Pesquisa de Clima Organizacional | Legítimo Interesse | Risco de identificação em amostras pequenas por departamento sem k-anonimato. |

---

## 2. Análise dos Princípios da LGPD (Art. 6º da Lei 13.709/2018)

1. **Finalidade e Adequação:** Atendidas nas rotinas de recrutamento básico. Porém, o envio de texto de currículos para a OpenAI (`gpt-4o-mini`) extrapola o escopo esperado sem aviso prévio de processamento de IA generativa e transferência internacional de dados.
2. **Necessidade (Minimização):** Em `src/lib/resume-parser.ts`, até 4.000 caracteres do texto integral do PDF (incluindo telefones, endereços e histórico pessoal) são enviados à API da OpenAI. Poderia haver anonimização prévia de dados de contato antes do envio para a LLM.
3. **Segurança e Prevenção:** **Reprovado.** As políticas do Supabase Storage permitindo `SELECT` e `UPDATE` públicos violam diretamente a obrigação de medidas técnicas de segurança aptas a proteger os dados de acessos não autorizados (Art. 46).
4. **Livre Acesso e Transparência:** Existe tabela `DataSubjectRequest` e endpoint `/api/lgpd/dsr`, mas não há interface de autosserviço para o titular consultar e exportar seus dados em formato estruturado.

---

## 3. Gestão de Consentimento e Direitos do Titular

* **Modelo `CandidateConsent`:** Mapeia `purpose` (`R&S`, `BANCO_TALENTOS`, `CONTATO_FUTURO`), data e IP.
  * *Lacuna:* Não há consentimento registrado para:
    * Compartilhamento de dados com IA externa (OpenAI);
    * Compartilhamento de dados entre empresas do grupo ou consultoria multicliente.
* **Retenção e Descarte (`RetentionPolicy` e `/api/cron/retention`):**
  * O endpoint `/api/cron/retention` existe, mas não está conectado a um cron seguro autenticado por chave de webhook (`CRON_SECRET`), permitindo que qualquer um dispare a rotina ou que ela nunca seja executada por falta de agendador.

---

## 4. Recomendações Jurídico-Técnicas

1. **Firmar Data Processing Agreement (DPA):** Com OpenAI, Supabase e Vercel, regulando o papel de suboperadores de dados.
2. **Atualizar Política de Privacidade e Termos de Uso:** Incluir cláusula explícita sobre extração assistida por IA e armazenamento em nuvem.
3. **Blindar Atestados de Saúde (ASO):** Segregar documentos médicos em bucket dedicado com retenção restrita conforme normas do CFM e Ministério do Trabalho.
