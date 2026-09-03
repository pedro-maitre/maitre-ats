# Maître Conecta — Plano Mestre de Conclusão, Integração e Migração

> Documento técnico-operacional para orientar o desenvolvimento do ecossistema **Maître Conecta**, desde a auditoria da aplicação existente até sua conclusão, homologação, migração geral e integração com o site institucional da Maître Consultoria.

---

## 1. Identificação do projeto

| Item | Definição |
|---|---|
| Produto | Maître Conecta |
| Organização | Maître Consultoria |
| Site institucional | `https://www.maitrework.com.br/` |
| Situação atual | Aplicação hospedada com código no GitHub, frontend/backend na Vercel e banco/serviços no Supabase |
| Arquitetura atual | Next.js modular, TypeScript, Prisma, PostgreSQL, NextAuth e armazenamento híbrido |
| Objetivo desta etapa | Concluir todos os módulos, estabilizar o produto, homologar, migrar a infraestrutura e integrá-lo ao domínio da Maître |
| Estratégia recomendada | Manter o sistema como monólito modular durante a conclusão e migrar somente após auditoria, testes e homologação |

---

## 2. Finalidade deste documento

Este arquivo deve funcionar como documento mestre para desenvolvedores, agentes de IA e IDEs assistidos por IA. Ele define:

- contexto do produto;
- objetivos e limites do projeto;
- ordem obrigatória de execução;
- entregáveis de cada fase;
- dependências entre atividades;
- critérios de aceite;
- regras de segurança e LGPD;
- estratégia de testes;
- preparação da infraestrutura;
- migração de dados e arquivos;
- integração com o site institucional;
- entrada gradual em produção;
- documentação e operação contínua.

Este documento **não autoriza alterações automáticas indiscriminadas**. Antes de executar qualquer fase, o agente ou desenvolvedor deverá inspecionar o repositório e confirmar o estado real do código.

---

## 3. Visão do produto

O Maître Conecta é um ecossistema multitenant de gestão de pessoas e serviços de RH. Deve atender simultaneamente:

- equipe interna da Maître Consultoria;
- consultores;
- empresas clientes;
- administradores e gestores das empresas clientes;
- colaboradores;
- candidatos;
- instrutores e avaliadores.

O produto possui nove módulos:

1. **Conecta Talentos:** ATS, vagas, candidatos e seleção;
2. **Conecta Pessoas:** cadastro funcional e Core HR;
3. **Conecta Operações:** admissão, documentos e rotinas de RH/DP;
4. **Conecta Insights:** indicadores e People Analytics;
5. **Conecta Desenvolvimento:** competências, desempenho, feedback e PDI;
6. **Conecta Aprendizagem:** treinamentos, trilhas, avaliações e certificados;
7. **Conecta Cultura:** clima, pulso, eNPS e planos de ação;
8. **Conecta Carreiras:** mobilidade, oportunidades internas e sucessão;
9. **Conecta Consultoria:** clientes, projetos, entregáveis e acompanhamento dos serviços.

---

## 4. Princípios obrigatórios de execução

1. **Auditar antes de alterar.** A documentação pode não refletir integralmente o repositório.
2. **Não migrar antes de estabilizar.** O ambiente atual deve permanecer operacional até a aprovação da nova infraestrutura.
3. **Não reescrever o sistema sem evidência técnica.** Aproveitar componentes e regras existentes quando estiverem corretos.
4. **Preservar dados e compatibilidade.** Toda alteração de schema deve possuir migração versionada e plano de reversão.
5. **Isolamento multitenant desde a base.** Nenhum cliente poderá acessar dados de outra organização.
6. **Privilégio mínimo.** Cada perfil terá somente as permissões necessárias.
7. **Privacidade por padrão.** Currículos, documentos funcionais, avaliações e dados de saúde não poderão ser públicos.
8. **Entregas incrementais.** Trabalhar em ondas e homologar antes de avançar.
9. **Testar jornadas completas.** Uma tela pronta não significa uma funcionalidade pronta.
10. **Não expor segredos.** Chaves, tokens, credenciais e URLs sensíveis não poderão entrar no Git.
11. **Não excluir dados sem backup.** Operações destrutivas exigem confirmação, backup e alvo precisamente identificado.
12. **Documentar decisões.** Decisões arquiteturais relevantes deverão ser registradas como ADRs.

---

## 5. Definição de pronto global

O projeto somente poderá ser considerado concluído quando:

- os nove módulos possuírem suas funções mínimas homologadas;
- não houver funções críticas dependentes de mocks;
- permissões e isolamento entre organizações estiverem testados;
- jornadas prioritárias funcionarem de ponta a ponta;
- backups e restauração tiverem sido testados;
- segurança e LGPD possuírem controles documentados;
- ambientes de desenvolvimento, homologação e produção estiverem separados;
- a nova infraestrutura estiver monitorada;
- dados e arquivos tiverem sido migrados e conciliados;
- os subdomínios estiverem configurados;
- o site institucional estiver conectado à plataforma;
- uma empresa piloto tiver utilizado o sistema;
- manuais e procedimentos operacionais estiverem disponíveis;
- existir plano de rollback da migração e plano de resposta a incidentes.

---

# PARTE I — DESCOBERTA E PLANEJAMENTO

## 6. Fase 0 — Preparação e proteção do trabalho

### Objetivo

Garantir que a auditoria e o desenvolvimento ocorram sem risco ao ambiente produtivo.

### Atividades

- identificar repositório oficial, branches e estratégia de versionamento;
- registrar versões de Node.js, Next.js, React, Prisma e dependências principais;
- confirmar responsáveis e acessos ao GitHub, Vercel, Supabase, DNS e domínio;
- identificar ambientes e bancos atualmente utilizados;
- confirmar onde currículos e documentos estão armazenados;
- criar ou validar política de branches e pull requests;
- proteger a branch principal;
- verificar se `.env*`, chaves ou credenciais foram versionados;
- rotacionar credenciais expostas, caso existam;
- gerar backup inicial do banco e inventário dos arquivos;
- documentar como executar o projeto localmente;
- impedir que testes utilizem dados reais sem autorização.

### Entregáveis

- inventário de acessos e serviços;
- mapa dos ambientes;
- backup inicial identificado por data;
- instruções locais atualizadas;
- política básica de Git e publicação.

### Critério de aceite

O projeto pode ser executado em desenvolvimento sem alterar produção e existe uma cópia recuperável dos dados atuais.

---

## 7. Fase 1 — Auditoria técnica do estado atual

### Objetivo

Comparar a documentação existente com o código, o banco e o comportamento real da aplicação.

### Auditoria do repositório

- mapear diretórios, rotas, componentes, APIs e Server Actions;
- localizar código morto, duplicado e experimental;
- identificar TODOs, FIXMEs, mocks e dados estáticos;
- revisar dependências e vulnerabilidades;
- conferir TypeScript strict, lint e build;
- verificar consistência de padrões de erro e validação;
- conferir compatibilidade entre versões declaradas e instaladas;
- verificar testes existentes e sua confiabilidade.

### Auditoria funcional

Classificar cada funcionalidade como:

- `PRONTA`;
- `PARCIAL`;
- `MOCK`;
- `COM_ERRO`;
- `AUSENTE`;
- `NÃO_CONFIRMADA`.

### Auditoria do banco

- comparar Prisma Schema com o PostgreSQL real;
- listar tabelas, relacionamentos, enums, índices e constraints;
- verificar migrações aplicadas e divergências;
- localizar dados órfãos, duplicados ou inconsistentes;
- verificar como `organizationId` é utilizado;
- analisar políticas de acesso e RLS, se aplicável;
- verificar volumes e crescimento esperado.

### Auditoria de arquivos

- mapear Supabase Storage, Vercel Blob e armazenamento local;
- identificar buckets públicos e privados;
- localizar URLs quebradas;
- analisar duplicações e arquivos órfãos;
- verificar limites, tipos, antivírus e validação de upload;
- remover a dependência de armazenamento local efêmero para produção.

### Auditoria de segurança

- autenticação e recuperação de senha;
- sessões e cookies;
- autorização em backend, e não apenas na interface;
- isolamento multitenant;
- exposição de IDs e arquivos;
- validação de entrada;
- rate limiting;
- logs com dados pessoais;
- CORS, CSRF, XSS, injeções e upload malicioso;
- gestão de segredos.

### Entregáveis

- `RELATORIO_AUDITORIA_TECNICA.md`;
- matriz módulo × funcionalidade × status;
- lista priorizada de riscos;
- lista de débitos técnicos;
- diagrama atualizado da arquitetura real;
- proposta de correção por criticidade.

### Critério de aceite

Nenhuma funcionalidade relevante permanece classificada apenas por suposição.

---

## 8. Fase 2 — Requisitos, jornadas e permissões

### Perfis mínimos

| Perfil | Escopo principal |
|---|---|
| `SUPER_ADMIN` | Administração global da plataforma |
| `MAITRE_MANAGER` | Gestão dos clientes, consultores e indicadores da Maître |
| `CONSULTANT` | Projetos e entregáveis atribuídos |
| `ORG_ADMIN` | Administração da própria empresa |
| `ORG_MANAGER` | Gestão das equipes sob sua responsabilidade |
| `RECRUITER` | Vagas e seleções autorizadas |
| `EMPLOYEE` | Autoatendimento, documentos, treinamento, pesquisas e PDI |
| `CANDIDATE` | Perfil, candidaturas e acompanhamento |
| `INSTRUCTOR` | Turmas, frequência e avaliações autorizadas |

Um usuário poderá ter múltiplos papéis, desde que o papel seja associado ao escopo correto de organização ou projeto.

### Decisões obrigatórias

- quem cria organizações;
- como empresas clientes são ativadas e desativadas;
- como colaboradores viram usuários;
- como candidato aprovado é convertido em colaborador;
- como consultores acessam clientes atribuídos;
- quais ações exigem aprovação;
- quais dados podem ser exportados;
- quais registros aceitam exclusão lógica;
- prazo de retenção por categoria;
- comportamento após encerramento de contrato com um cliente.

### Artefatos

- matriz RBAC detalhada;
- mapa de jornadas;
- casos de uso;
- regras de negócio numeradas;
- critérios de aceite por recurso.

---

## 9. Fase 3 — Escopo mínimo dos módulos

### 9.1. Conecta Talentos

- vagas e portal público multitenant;
- banco de talentos;
- candidatura e currículo;
- pipeline configurável;
- triagem e Fit 3D revisado;
- entrevistas e scorecards;
- atividades, comentários e histórico;
- proposta e resultado;
- templates de comunicação;
- conversão do aprovado para admissão;
- relatórios do processo.

### 9.2. Conecta Pessoas

- cadastro funcional;
- vínculos e matrículas;
- unidades, setores e cargos;
- jornada, horários de entrada, intervalo e saída;
- gestores e estrutura organizacional;
- histórico funcional;
- férias, afastamentos e ocorrências;
- documentos;
- status do colaborador;
- autoatendimento básico.

### 9.3. Conecta Operações

- admissão digital;
- checklist documental configurável;
- termos e aceites;
- fluxos de aprovação;
- vencimentos e alertas;
- movimentações funcionais;
- desligamento;
- trilha de auditoria;
- integridade de documentos;
- exportação controlada.

### 9.4. Conecta Insights

- funil de recrutamento;
- tempo de contratação;
- fontes de candidatos;
- headcount;
- admissões e desligamentos;
- turnover;
- absenteísmo;
- treinamento;
- clima e eNPS;
- desempenho;
- filtros por organização, unidade, setor e período;
- exportação conforme permissão.

### 9.5. Conecta Desenvolvimento

- catálogo de competências;
- ciclos de avaliação;
- avaliações 90°, 180° e 360° configuráveis;
- autoavaliação;
- matriz 9-Box;
- feedback contínuo;
- PDI, metas e ações;
- acompanhamento e histórico;
- vínculo com sucessão e aprendizagem.

### 9.6. Conecta Aprendizagem

- catálogo de cursos e treinamentos;
- trilhas de aprendizagem;
- turmas e agenda;
- inscrições;
- frequência;
- conteúdos e anexos;
- avaliações;
- certificados verificáveis;
- histórico do participante;
- indicadores.

### 9.7. Conecta Cultura

- pesquisas de clima;
- pesquisas de pulso;
- eNPS;
- questionários e anonimato configurável;
- convites e lembretes;
- segmentação com proteção de anonimato;
- resultados e comentários;
- planos de ação;
- acompanhamento de responsáveis e prazos.

### 9.8. Conecta Carreiras

- oportunidades internas;
- candidatura interna;
- mobilidade;
- planos de carreira;
- requisitos por cargo;
- mapa de sucessão;
- prontidão de sucessores;
- integração com competências, PDI e aprendizagem.

### 9.9. Conecta Consultoria

- cadastro de clientes e contratos;
- projetos e escopo;
- responsáveis e participantes;
- cronogramas e marcos;
- tarefas e horas;
- reuniões e registros;
- entregáveis e aprovações;
- riscos e pendências;
- portal do cliente;
- relatórios executivos.

### Controle de escopo

Cada item deverá receber uma prioridade:

- `MUST`: obrigatório para a primeira produção;
- `SHOULD`: importante, mas pode entrar após o piloto;
- `COULD`: evolução futura;
- `WONT_NOW`: explicitamente fora da versão atual.

---

# PARTE II — FUNDAÇÃO TÉCNICA

## 10. Fase 4 — Arquitetura-alvo

### Decisão inicial

Adotar **monólito modular** com fronteiras claras de domínio. Microsserviços somente deverão ser considerados se métricas reais demonstrarem necessidade de escalabilidade, isolamento operacional ou equipes independentes.

### Domínios sugeridos

- identity;
- tenancy;
- talent;
- people;
- operations;
- development;
- learning;
- culture;
- careers;
- consulting;
- insights;
- documents;
- notifications;
- audit;
- billing, somente se houver comercialização SaaS.

### Regras arquiteturais

- componentes de interface não acessam banco diretamente;
- regras críticas permanecem em serviços de domínio;
- toda mutação valida usuário, papel e organização;
- APIs devem possuir schemas de entrada e saída;
- integrações externas devem ser encapsuladas;
- tarefas demoradas devem utilizar processamento assíncrono;
- erros devem ter padrão único e IDs de correlação;
- datas devem ser armazenadas de modo consistente e exibidas conforme fuso;
- dinheiro deve usar tipo decimal adequado;
- arquivos devem ser privados por padrão;
- funcionalidades experimentais devem usar feature flags.

### ADRs mínimos

- autenticação;
- estratégia multitenant;
- banco e ORM;
- armazenamento de arquivos;
- serviço de e-mail;
- filas e tarefas agendadas;
- observabilidade;
- hospedagem definitiva;
- estratégia de backup;
- integração de IA;
- tratamento de documentos e assinaturas.

---

## 11. Fase 5 — Modelo de dados expandido

### Núcleo transversal

- `Organization`;
- `OrganizationUnit`;
- `Department`;
- `Position`;
- `User`;
- `Role`;
- `Permission`;
- `Membership`;
- `Employee`;
- `EmploymentContract`;
- `WorkSchedule`;
- `Document`;
- `DocumentVersion`;
- `Consent`;
- `Notification`;
- `AuditEvent`;
- `SystemSetting`;
- `OrganizationSetting`.

### Requisitos de modelagem

- separar pessoa, usuário, candidato e vínculo funcional quando necessário;
- não usar e-mail global como única chave de identidade de negócio;
- definir exclusão lógica e retenção;
- utilizar constraints e índices adequados;
- evitar JSON para dados que precisem de filtro, integridade ou relacionamento;
- registrar autor e horário das mudanças críticas;
- definir enums com estratégia de evolução;
- garantir escopo organizacional nas entidades multitenant;
- criar migrações pequenas, revisáveis e reversíveis quando possível.

### Segurança do banco

- conta da aplicação com privilégios mínimos;
- acesso administrativo separado;
- conexão criptografada;
- backups automáticos;
- logs de alterações sensíveis;
- testes contra vazamento entre tenants;
- RLS quando compatível com a arquitetura adotada, sem depender dela como única barreira.

---

## 12. Fase 6 — Design system e experiência

### Componentes obrigatórios

- tipografia e cores da marca;
- grid e espaçamento;
- botões, campos e seletores;
- tabelas, filtros e paginação;
- modais e drawers;
- badges e estados;
- navegação lateral e superior;
- breadcrumbs;
- cards e indicadores;
- gráficos;
- carregamento, vazio, sucesso e erro;
- confirmação de ações destrutivas;
- componentes acessíveis;
- responsividade mínima para tablet e celular.

### Resultado

Criar uma biblioteca reutilizável e impedir que cada módulo desenvolva padrões visuais independentes.

---

## 13. Fase 7 — Serviços compartilhados

Implementar ou consolidar antes da expansão dos módulos:

1. autenticação;
2. recuperação de senha;
3. organizações e memberships;
4. RBAC e autorização no servidor;
5. arquivos privados e URLs temporárias;
6. notificações internas;
7. e-mails e templates;
8. auditoria;
9. busca, filtros e paginação;
10. importação e exportação;
11. configurações por organização;
12. consentimentos;
13. jobs assíncronos;
14. logs e monitoramento;
15. feature flags;
16. geração de relatórios.

---

# PARTE III — IMPLEMENTAÇÃO

## 14. Estratégia de desenvolvimento em ondas

### Onda 1 — Base operacional

Ordem sugerida:

1. tenancy, usuários e permissões;
2. Conecta Pessoas;
3. Conecta Operações;
4. consolidação do Conecta Talentos;
5. conversão candidato → colaborador;
6. indicadores operacionais básicos.

### Onda 2 — Desenvolvimento humano

1. Conecta Desenvolvimento;
2. Conecta Aprendizagem;
3. Conecta Cultura;
4. integrações entre PDI, treinamentos e resultados.

### Onda 3 — Estratégia e consultoria

1. Conecta Insights;
2. Conecta Carreiras;
3. Conecta Consultoria;
4. portal e relatórios para clientes.

### Ciclo obrigatório de cada funcionalidade

1. confirmar regra de negócio;
2. escrever critérios de aceite;
3. desenhar fluxo e interface;
4. ajustar banco;
5. implementar serviço e autorização;
6. implementar interface;
7. criar testes;
8. revisar segurança e acessibilidade;
9. homologar;
10. documentar e liberar.

### Definition of Done por item

- critério de aceite atendido;
- lint, typecheck e build aprovados;
- testes relevantes aprovados;
- autorização no servidor validada;
- estados de erro e vazio tratados;
- auditoria incluída quando aplicável;
- documentação atualizada;
- homologação registrada;
- nenhuma credencial ou dado pessoal exposto.

---

## 15. Backlog mínimo de integração entre módulos

- candidato aprovado inicia checklist de admissão;
- admissão concluída cria ou ativa colaborador;
- cargo define competências esperadas;
- avaliação identifica lacunas;
- lacunas alimentam PDI e trilhas de aprendizagem;
- conclusão de treinamento atualiza histórico e PDI;
- clima gera planos de ação;
- planos de ação podem virar projetos de consultoria;
- desempenho e competências alimentam sucessão;
- movimentação interna atualiza vínculo, cargo e histórico;
- todos os eventos autorizados alimentam Insights.

---

# PARTE IV — SEGURANÇA, LGPD E QUALIDADE

## 16. Programa de segurança e LGPD

### Classificação sugerida

| Categoria | Exemplos | Proteção mínima |
|---|---|---|
| Pública | Vagas publicadas | Acesso público controlado |
| Interna | Projetos e rotinas | Usuários autorizados |
| Confidencial | Currículos, salários, avaliações | Escopo restrito, logs e criptografia |
| Sensível | Saúde e informações psicológicas | Acesso excepcional, finalidade explícita e controles reforçados |

### Controles obrigatórios

- inventário de dados pessoais;
- finalidade e base legal por tratamento;
- consentimento quando aplicável;
- minimização de dados;
- retenção e descarte;
- correção, exportação e atendimento ao titular;
- segregação entre clientes;
- URLs temporárias para documentos;
- MFA para perfis administrativos, se suportado;
- rate limiting;
- registro de acessos e alterações;
- proteção de logs;
- gestão de incidentes;
- termos de uso;
- política de privacidade;
- contratos e cláusulas com fornecedores;
- revisão humana de decisões apoiadas por IA.

### IA e Fit 3D

- não permitir decisão discriminatória exclusivamente automatizada;
- registrar critérios utilizados;
- permitir revisão humana;
- evitar inferência de atributos sensíveis;
- validar qualidade e vieses;
- informar o uso de automação quando necessário;
- versionar as regras de pontuação;
- permitir explicação do resultado aos usuários autorizados.

### Critério de aceite

Existe evidência de que usuários de uma organização não conseguem consultar, editar, enumerar ou baixar dados de outra organização.

---

## 17. Estratégia de testes

### Camadas

- testes unitários das regras;
- testes de integração com banco;
- testes de APIs e Server Actions;
- testes de autorização;
- testes multitenant negativos;
- testes ponta a ponta;
- testes de acessibilidade;
- testes de upload e arquivo malicioso;
- testes de carga nas rotas críticas;
- testes de backup e restauração;
- testes de migração;
- testes de compatibilidade de navegadores.

### Jornadas críticas

1. candidato cria perfil e se candidata;
2. recrutador avalia e movimenta a candidatura;
3. aprovado recebe proposta e inicia admissão;
4. RH conclui admissão e ativa colaborador;
5. colaborador acessa documentos e treinamento;
6. gestor conduz avaliação de desempenho;
7. resultado gera PDI;
8. RH conduz pesquisa de clima protegendo anonimato;
9. consultor executa projeto e publica entregável;
10. cliente acompanha indicadores permitidos;
11. administrador desativa acesso sem perder histórico;
12. restauração de backup recupera dados e arquivos.

### Gates de qualidade

Nenhuma versão segue para produção se houver:

- falha de isolamento multitenant;
- vulnerabilidade crítica conhecida sem mitigação;
- perda ou corrupção de dados;
- build quebrado;
- jornada crítica indisponível;
- migração não testada;
- backup sem restauração validada.

---

## 18. Ambientes e CI/CD

### Ambientes

| Ambiente | Dados | Finalidade |
|---|---|---|
| Desenvolvimento | Fictícios | Implementação local |
| Homologação | Fictícios ou anonimizados | Teste integrado e aceite |
| Produção | Reais | Operação dos clientes |

### Pipeline mínimo

1. instalação reproduzível;
2. lint;
3. typecheck;
4. testes unitários;
5. testes de integração;
6. build;
7. análise de dependências;
8. deploy de homologação;
9. testes E2E;
10. aprovação;
11. deploy de produção;
12. smoke test;
13. registro da versão.

Migrações de banco não devem ser executadas de modo irreversível sem backup e compatibilidade com a versão anterior durante a janela de mudança.

---

# PARTE V — INFRAESTRUTURA E MIGRAÇÃO

## 19. Fase de medição antes da escolha da plataforma

Registrar, durante período representativo:

- usuários ativos;
- organizações;
- requisições;
- uso de CPU e memória;
- conexões ao banco;
- tamanho e crescimento do banco;
- volume de arquivos;
- tráfego de saída;
- jobs e duração;
- e-mails enviados;
- uso de IA;
- tempo de resposta;
- disponibilidade;
- custo atual por serviço.

Sem essas métricas, qualquer escolha de hospedagem será apenas estimativa.

---

## 20. Critérios para escolher a nova plataforma

Avaliar cada opção com uma matriz ponderada:

- compatibilidade com Next.js e Node.js;
- PostgreSQL gerenciado;
- armazenamento de objetos privado;
- backups e restauração pontual;
- região e latência;
- disponibilidade;
- escalabilidade;
- observabilidade;
- filas e tarefas agendadas;
- e-mail transacional;
- certificados TLS;
- proteção de rede;
- custos fixos e variáveis;
- suporte;
- portabilidade;
- responsabilidade operacional;
- conformidade e contratos.

### Opções arquiteturais a comparar

1. plataforma totalmente gerenciada;
2. aplicação gerenciada com banco e storage separados;
3. VPS com contêineres e serviços gerenciados complementares;
4. nuvem pública com serviços próprios.

### Restrições

- não escolher apenas pelo menor preço;
- não mover banco e aplicação simultaneamente sem ensaio;
- não depender de disco local para documentos;
- não utilizar plano gratuito como única base de produção crítica;
- GitHub poderá continuar como repositório e origem do CI/CD.

### Entregável

`MATRIZ_DECISAO_INFRAESTRUTURA.md`, contendo custos mensais projetados, responsabilidades, riscos e recomendação.

---

## 21. Arquitetura operacional mínima da nova plataforma

- aplicação web;
- PostgreSQL;
- storage privado compatível com objetos;
- serviço de e-mail;
- processamento assíncrono;
- scheduler;
- DNS e TLS;
- gestão de segredos;
- logs centralizados;
- monitoramento e alertas;
- backups automáticos;
- política de retenção;
- ambiente de homologação;
- CI/CD;
- página de status, quando aplicável.

---

## 22. Plano de migração geral

### 22.1. Inventário

- bancos, schemas e extensões;
- usuários e permissões;
- arquivos e buckets;
- variáveis e segredos;
- domínios;
- webhooks;
- jobs agendados;
- integrações;
- templates de e-mail;
- funções serverless;
- políticas e configurações.

### 22.2. Preparação

- criar infraestrutura como código quando viável;
- configurar nova homologação;
- configurar observabilidade;
- criar banco destino;
- aplicar migrations;
- configurar storage destino;
- configurar segredos fora do Git;
- configurar e-mail, jobs e integrações;
- estabelecer plano de rollback.

### 22.3. Migração de ensaio

- exportar cópia do banco;
- importar no destino;
- migrar cópia dos arquivos;
- reescrever referências apenas por processo versionado;
- conferir contagens, hashes e relacionamentos;
- executar jornadas E2E;
- medir tempo total;
- registrar erros e corrigir o procedimento;
- repetir até o resultado ser reproduzível.

### 22.4. Validação de dados

Comparar origem e destino:

- total de registros por tabela;
- totais por organização;
- registros nulos e órfãos;
- IDs e relacionamentos;
- arquivos por bucket;
- tamanho total;
- checksums quando possível;
- amostra funcional de downloads;
- usuários e papéis;
- datas, valores monetários e caracteres especiais.

### 22.5. Cutover de produção

1. comunicar janela;
2. confirmar backup e rollback;
3. ativar modo de manutenção ou congelar escritas;
4. executar exportação final/incremental;
5. importar e conciliar;
6. validar aplicação e jobs;
7. executar smoke tests;
8. alterar DNS ou tráfego;
9. acompanhar logs e métricas;
10. liberar usuários gradualmente.

### 22.6. Rollback

O rollback deverá definir:

- condição de disparo;
- responsável pela decisão;
- prazo máximo para decidir;
- restauração do tráfego anterior;
- tratamento de escritas ocorridas no destino;
- comunicação aos usuários;
- registro do incidente.

### 22.7. Pós-migração

- monitorar intensivamente;
- conciliar dados novamente;
- verificar e-mails, arquivos e jobs;
- manter origem em modo seguro durante período definido;
- revogar credenciais antigas;
- encerrar serviços somente após aceite formal;
- preservar backups conforme política.

---

# PARTE VI — INTEGRAÇÃO COM O SITE INSTITUCIONAL

## 23. Estratégia de domínios

Estrutura recomendada:

| Endereço | Uso |
|---|---|
| `www.maitrework.com.br` | Site institucional e aquisição de clientes |
| `app.maitrework.com.br` | Aplicação autenticada Maître Conecta |
| `carreiras.maitrework.com.br` | Portal público de vagas |
| `status.maitrework.com.br` | Disponibilidade dos serviços, futuramente |

O site e a plataforma podem permanecer tecnicamente separados. A integração ocorrerá por domínio, identidade visual, navegação, conteúdo e jornadas.

### Alterações previstas no site

- botão “Acessar Maître Conecta”;
- entrada “Sou empresa”;
- entrada “Sou candidato”;
- acesso às vagas;
- página de apresentação do ecossistema;
- solicitação de demonstração;
- atualização de política de privacidade;
- termos aplicáveis;
- comunicação visual consistente.

### Requisitos técnicos

- configuração DNS;
- certificados HTTPS;
- URLs canônicas;
- CORS somente quando necessário;
- proteção contra open redirects;
- links de retorno seguros;
- analytics com consentimento;
- SEO no portal público;
- páginas privadas fora da indexação;
- manutenção da disponibilidade do site durante a mudança.

### Autenticação

Não implementar SSO apenas para aparentar integração. Avaliar autenticação unificada somente se existir benefício real e capacidade de mantê-la com segurança.

---

# PARTE VII — HOMOLOGAÇÃO E LANÇAMENTO

## 24. Plano de homologação

### Grupo 1 — Equipe interna

- testar fluxos administrativos;
- validar linguagem de RH;
- revisar relatórios e permissões;
- registrar problemas e sugestões.

### Grupo 2 — Empresa piloto

- selecionar cliente representativo;
- cadastrar estrutura e colaboradores;
- executar jornadas reais controladas;
- acompanhar suporte e dificuldades;
- medir adoção e estabilidade.

### Grupo 3 — Expansão controlada

- corrigir achados;
- ativar pequeno grupo de clientes;
- monitorar carga e custo;
- liberar os módulos progressivamente.

### Critérios para lançamento geral

- nenhum incidente crítico aberto;
- jornadas prioritárias aprovadas;
- segurança multitenant aprovada;
- suporte treinado;
- manuais disponíveis;
- monitoramento e backup ativos;
- infraestrutura dimensionada;
- aceite formal da Maître.

---

## 25. Observabilidade e operação

### Métricas

- disponibilidade;
- latência;
- taxa de erros;
- falhas de autenticação;
- erros de autorização;
- filas atrasadas;
- falhas de e-mail;
- conexões e consultas lentas;
- CPU, memória e storage;
- uso e custo de IA;
- crescimento do banco;
- downloads e uploads;
- ações administrativas sensíveis.

### Alertas

- aplicação indisponível;
- banco sem conexão;
- storage indisponível;
- backup falhou;
- erro acima do limiar;
- fila represada;
- certificado próximo do vencimento;
- consumo próximo do limite;
- aumento anormal de acessos negados.

### Runbooks mínimos

- indisponibilidade;
- falha de banco;
- restauração de backup;
- credencial comprometida;
- vazamento ou acesso indevido;
- falha de envio de e-mail;
- arquivos inacessíveis;
- migração defeituosa;
- rollback de aplicação.

---

## 26. Documentação obrigatória

- README de instalação;
- arquitetura atualizada;
- ADRs;
- modelo de dados;
- catálogo de APIs;
- matriz RBAC;
- manual do superadministrador;
- manual da equipe Maître;
- manual da empresa cliente;
- manual do gestor;
- manual do colaborador;
- manual do candidato;
- manual do consultor;
- política de backup;
- plano de incidentes;
- política de retenção;
- guia de deploy e rollback;
- histórico de versões;
- base de conhecimento e suporte.

---

## 27. Governança do backlog

### Severidade de defeitos

| Nível | Definição |
|---|---|
| P0 | Vazamento, perda de dados ou indisponibilidade geral |
| P1 | Jornada crítica indisponível, sem alternativa segura |
| P2 | Função importante prejudicada com alternativa parcial |
| P3 | Defeito menor, visual ou melhoria |

### Prioridade de desenvolvimento

1. segurança e integridade;
2. isolamento multitenant;
3. dados e migrações;
4. jornadas críticas;
5. estabilidade e observabilidade;
6. usabilidade;
7. otimização;
8. recursos futuros.

### Registro mínimo de uma tarefa

- título;
- módulo;
- problema ou necessidade;
- regra de negócio;
- usuários afetados;
- critérios de aceite;
- riscos;
- dependências;
- testes necessários;
- impacto em banco, segurança e documentação.

---

# PARTE VIII — ORDEM EXECUTIVA

## 28. Sequência integral recomendada

- [ ] 1. Confirmar acessos, repositório e responsáveis.
- [ ] 2. Criar backup inicial do banco e inventário dos arquivos.
- [ ] 3. Executar aplicação localmente.
- [ ] 4. Auditar código, banco, storage e infraestrutura.
- [ ] 5. Classificar funcionalidades dos nove módulos.
- [ ] 6. Identificar riscos críticos e corrigi-los.
- [ ] 7. Definir personas, jornadas e RBAC.
- [ ] 8. Fechar escopo `MUST/SHOULD/COULD/WONT_NOW`.
- [ ] 9. Aprovar arquitetura-alvo como monólito modular.
- [ ] 10. Revisar modelo de dados e estratégia multitenant.
- [ ] 11. Consolidar design system.
- [ ] 12. Consolidar serviços compartilhados.
- [ ] 13. Implementar e homologar a Onda 1.
- [ ] 14. Implementar e homologar a Onda 2.
- [ ] 15. Implementar e homologar a Onda 3.
- [ ] 16. Realizar revisão de LGPD e segurança.
- [ ] 17. Executar testes completos e corrigir falhas.
- [ ] 18. Medir consumo real e projetar crescimento.
- [ ] 19. Elaborar matriz de decisão de infraestrutura.
- [ ] 20. Selecionar e contratar a infraestrutura aprovada.
- [ ] 21. Construir ambientes de homologação e produção.
- [ ] 22. Configurar monitoramento, alertas e backups.
- [ ] 23. Realizar migrações de ensaio.
- [ ] 24. Conciliar banco e arquivos.
- [ ] 25. Executar piloto interno.
- [ ] 26. Executar piloto com uma empresa cliente.
- [ ] 27. Corrigir problemas do piloto.
- [ ] 28. Preparar domínio, site e comunicação.
- [ ] 29. Executar cutover com rollback disponível.
- [ ] 30. Monitorar e liberar clientes gradualmente.
- [ ] 31. Revogar credenciais e encerrar infraestrutura antiga apenas após aceite.
- [ ] 32. Formalizar operação contínua e roadmap pós-lançamento.

---

## 29. Gates obrigatórios entre fases

| Gate | Condição para avançar |
|---|---|
| G0 — Proteção | Backup recuperável e ambientes identificados |
| G1 — Diagnóstico | Auditoria aprovada e riscos conhecidos |
| G2 — Produto | Escopo, jornadas e RBAC aprovados |
| G3 — Fundação | Arquitetura, banco e serviços compartilhados estáveis |
| G4 — Funcional | Nove módulos mínimos homologados |
| G5 — Segurança | Testes de isolamento e controles críticos aprovados |
| G6 — Infraestrutura | Plataforma escolhida com custos e responsabilidades explícitos |
| G7 — Migração | Ensaio reproduzível, conciliação e rollback aprovados |
| G8 — Produção | Piloto aprovado, suporte e monitoramento ativos |

Nenhum gate deve ser ignorado apenas para cumprir uma data.

---

## 30. Instruções específicas para o IDE ou agente de IA

Ao receber este documento, o IDE deverá:

1. Ler este plano e o arquivo de arquitetura existente integralmente.
2. Inspecionar `README`, `package.json`, lockfile, Prisma Schema, migrations, configuração de autenticação, rotas, APIs, testes e variáveis exemplificadas.
3. Procurar instruções adicionais do repositório antes de editar.
4. Apresentar evidências do estado encontrado, sem presumir que a documentação esteja atualizada.
5. Criar primeiro o relatório de auditoria e o backlog; não iniciar uma reescrita geral.
6. Dividir mudanças em unidades pequenas e revisáveis.
7. Preservar alterações existentes que não pertençam à tarefa.
8. Não executar comandos destrutivos ou migrações em produção.
9. Não imprimir ou versionar credenciais.
10. Não alterar DNS, infraestrutura produtiva ou serviços externos sem autorização explícita.
11. Executar testes adequados após cada mudança.
12. Informar arquivos alterados, testes executados, riscos restantes e próximo gate.

### Formato esperado do primeiro relatório do IDE

```md
# Auditoria inicial do Maître Conecta

## Resumo executivo
## Estado do build e dos testes
## Stack realmente instalada
## Mapa de rotas e módulos
## Estado funcional por módulo
## Banco de dados e migrations
## Autenticação e RBAC
## Multitenancy
## Storage e documentos
## Segurança e LGPD
## Integrações externas
## Débitos técnicos
## Riscos P0/P1/P2/P3
## Backlog recomendado
## Dúvidas bloqueadoras
## Próxima ação proposta
```

---

## 31. Comandos de descoberta sugeridos

Os comandos devem ser adaptados ao ambiente e executados inicialmente apenas de maneira não destrutiva.

```bash
git status --short
git branch --show-current
git log -5 --oneline
rg --files
rg -n "TODO|FIXME|HACK|mock|placeholder" src prisma scripts
npm audit
npm run lint
npx tsc --noEmit
npm test
npm run build
npx prisma validate
npx prisma migrate status
```

Não executar `prisma db push`, migrations de produção, exclusões de storage ou comandos de reset durante a auditoria.

---

## 32. Riscos principais já identificáveis

- documentação possivelmente mais avançada que o código;
- módulos classificados como hubs, mas ainda sem funções completas;
- modelo de dados atual centrado no ATS;
- armazenamento local inadequado para produção serverless;
- fallback público ou permissões excessivas em currículos;
- autenticação e RBAC insuficientes para novos perfis;
- isolamento multitenant não comprovado;
- migração prematura aumentar complexidade;
- crescimento do escopo sem definição de versão mínima;
- dados sensíveis exigirem controles adicionais;
- decisões automatizadas de recrutamento gerarem riscos éticos e jurídicos;
- dependência de vários fornecedores sem observabilidade unificada;
- custo desconhecido sem métricas reais.

---

## 33. Resultado final esperado

Ao final deste plano, o Maître Conecta deverá ser uma plataforma:

- modular e integrada;
- segura e multitenant;
- utilizável pela Maître e por seus clientes;
- alinhada às jornadas reais de RH;
- preparada para tratamento responsável de dados pessoais;
- testada de ponta a ponta;
- monitorada e recuperável;
- independente de armazenamento local efêmero;
- integrada ao domínio e à identidade da Maître Consultoria;
- migrada sem perda de dados;
- documentada para operação e evolução contínuas.

---

## 34. Próxima ação obrigatória

A próxima ação é executar a **Fase 0 — Preparação e proteção do trabalho** e, em seguida, a **Fase 1 — Auditoria técnica do estado atual**.

Não selecionar a nova hospedagem, redesenhar integralmente o sistema ou iniciar a migração antes da conclusão e aprovação dessas fases.

