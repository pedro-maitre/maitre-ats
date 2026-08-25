# 🏛️ Diretrizes & Recomendações Estratégicas: Operação Multicliente (Consultoria Maître)

> **Documento de Arquitetura & Governança B2B2B**  
> Diretrizes para transformar o **Maître Conecta** na plataforma definitiva de gestão multicliente para a **Maître Consultoria**.

---

## 📌 1. Contexto & Visão Estratégica

A **Maître Consultoria** é uma consultoria especializada em **Executive Search (Hunting)**, **Diagnóstico Organizacional**, **Cargos & Salários** e **Gestão Estratégica de Pessoas (DHO)**.

Como a consultoria atende múltiplos clientes corporativos simultaneamente, o sistema **Maître Conecta** deve operar sob a arquitetura de **Plataforma Multicliente de Alto Nível (Multi-Tenant B2B2B)**, equilibrando dois grandes objetivos:
1. **Poder Operacional da Consultoria:** A equipe da Maître tem uma visão consolidada de todas as operações, banco global de talentos e métricas de SLA de todos os clientes.
2. **Segurança e Privacidade Absoluta dos Clientes:** Cada cliente corporativo contratante acessa apenas seus próprios dados, com total isolamento contra vazamento de informações (Anti-Leak / LGPD).

---

## 🏢 2. Pilares de Implementação Recomendados

### 1. Seletor Global de Cliente (*Tenant Switcher* na Topbar)
* **Conceito:** Dropdown global no topo da interface para consultores e recrutadores da Maître alternarem instantaneamente o contexto da empresa que estão gerenciando.
* **Opções de Visão:**
  * 🏢 `[Empresa Cliente Alfa]` ➔ Filtra vagas, pipeline, colaboradores e relatórios apenas para a Empresa Alfa.
  * 🏢 `[Empresa Cliente Beta]` ➔ Filtra contexto para a Empresa Beta.
  * 🌐 `[Visão Global Maître]` ➔ Apresenta o consolidado de todas as contas da consultoria.

---

### 2. Portal do Gestor do Cliente (*Acesso Hiring Manager*)
* **Conceito:** Acesso restrito para a diretoria ou RH do cliente final.
* **Papéis:** `CLIENT_ADMIN` e `HIRING_MANAGER`.
* **Capacidades do Cliente:**
  * Acessar exclusivamente as vagas e os candidatos finalistas apresentados pela Maître para sua organização.
  * Preencher **Scorecards de Avaliação** após entrevistas com os candidatos.
  * Aprovar ou ajustar **Propostas Salariais (Job Offers)**.
  * Autorizar a contratação e acompanhar a entrada do colaborador no **Core HR**.
* **Bloqueio Estrito:** O cliente não possui visibilidade sobre outras empresas atendidas pela Maître nem sobre vagas de terceiros.

---

### 3. Banco de Talentos Proprietário da Maître vs. Processos Exclusivos
* **Pool Global da Maître:** O banco de talentos (`/candidates`) é um patrimônio estratégico da consultoria. O time de recrutadores pode buscar candidatos no banco global para alocação cruzada de hunting entre múltiplos clientes.
* **Isolamento Transacional:** Informações sensíveis como anotações confidenciais, pretensões salariais negociadas, scorecards e propostas permanecem vinculadas estritamente ao `organizationId` da vaga específica.

---

### 4. Portais de Carreiras White-Label Personalizados
* **Conceito:** Cada cliente possui sua própria página pública de vagas acessível via `/carreiras/[companySlug]`.
* **Customização Visual:** Suporte a logo institucional, banner da empresa contratante, cores corporativas e descrição de cultura para fortalecer a marca empregadora (*Employer Branding*) do cliente da Maître.

---

### 5. Relatórios Executivos de SLA & Apresentação para o Board
* **Métricas de Performance da Consultoria:**
  * **Time-to-Hire:** Tempo médio que a Maître leva para fechar posições por cliente.
  * **Taxa de Assertividade:** Quantos candidatos a Maître apresentou vs. aprovados pelo cliente.
  * **Honorários / Success Fee:** Propostas aceitas e relatórios financeiros de fechamento de contratos de hunting.
* **Dossiês Executivos:** Geração de relatórios com pareceres dos consultores e comparativo de finalistas para apresentação à diretoria do cliente.

---

### 6. Central de Entregáveis ("Conecta Consultoria")
* Expansão para além do R&S, centralizando todos os serviços prestados pela Maître:
  * **Tabelas de Cargos & Salários** calibradas com faixas de mercado.
  * **Pesquisas de Clima Organizacional & eNPS (Conecta Cultura).**
  * **Diagnósticos Organizacionais & Matrizes 9-Box (Conecta Desenvolvimento).**
  * **Hunting Executivo (C-Level & Board Members).**

---

## 🗺️ 3. Matriz de Fases de Evolução Multicliente

| Fase | Foco | Entregáveis |
| :---: | :--- | :--- |
| **Fase 1** | **Gestão de Empresas & Seletor Global** | CRUD de Clientes/Organizações (`/clients`), Dropdown de Tenant na Topbar |
| **Fase 2** | **Portal do Hiring Manager** | Convites por e-mail para gestores dos clientes com permissão restrita |
| **Fase 3** | **White-Label & Branding de Carreiras** | Upload de logo, cores e personalização por página `/carreiras/[slug]` |
| **Fase 4** | **Dossiês & Relatórios de SLA** | Relatório de assertividade de hunting e apresentações executivas |

---

*Documento gerado e aprovado para o planejamento estratégico da Maître Consultoria.*
