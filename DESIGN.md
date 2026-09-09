---
name: Maître Conecta
description: Suíte Integrada de Gestão de RH, ATS, Core HR & Consultoria Estratégica
colors:
  primary: "#c89650"
  primary-hover: "#b08040"
  primary-light: "#9a6d2b"
  surface-sidebar: "#1d1e20"
  canvas-dark: "#0a0a0a"
  surface-card: "#0f172a"
  surface-elevated: "#1e293b"
  border-subtle: "#334155"
  text-primary: "#ffffff"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  accent-emerald: "#10b981"
  accent-cyan: "#06b6d4"
  accent-violet: "#8b5cf6"
  accent-rose: "#f43f5e"
  accent-amber: "#f59e0b"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#451a03"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  card-surface:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Maître Conecta

## Overview

**Creative North Star: "O Atelier Executivo"**

O **Maître Conecta** combina a sobriedade de uma consultoria de alta gestão estratégica com a agilidade de um ecossistema digital moderno de Recursos Humanos e Operações. O design expressa sofisticação contida: superfícies escuras texturizadas em ardósia nobre (`#1d1e20`, `#0f172a`), elementos iluminados com o Dourado Maître (`#c89650` / `#9a6d2b`) e toques de cores funcionais cuidadosamente calibradas para tomada de decisão rápida e sem sobrecarga cognitiva.

A densidade de informação é balanceada no modo **Operate**: interfaces voltadas à produtividade diária (Kanban de vagas, Meu Trabalho, atas executivas, controle de prazos e alocação de equipe), onde a clareza e a legibilidade se sobrepõem a efeitos decorativos gratuitos. O tom geral rejeita layouts genéricos purpúreos ou gradientes artificiais de templates prontos.

**Key Characteristics:**
- Foco em alta legibilidade executiva com tipografia geométrica humanista (**Outfit**);
- Paleta noturna acolhedora com fundo grafite/ardósia escuro e acentos em dourado nobre;
- Hierarquia estrita de estados com badges translúcidos com borda definida;
- Acessibilidade visual com suporte nativo a `prefers-reduced-motion` e anéis dourados em `:focus-visible`;
- Isolamento intencional entre fluxos internos da consultoria e portais de empresas clientes.

## Colors

A paleta de cores articula autoridade executiva e sinalização funcional cirúrgica.

### Primary
- **Dourado Maître** (`#c89650` / `#9a6d2b`): O tom identitário da Maître Consultoria. Utilizado no logotipo, botões primários de ação decisiva, destaques de KPIs centrais e contornos de foco ativo.

### Neutral
- **Grafite Atelier** (`#1d1e20`): Utilizado na navegação lateral (Sidebar), gaveta mobile e barras estruturais de comando.
- **Canvas Escuro Profundo** (`#0a0a0a` / `#020617`): Fundo principal da aplicação, garantindo imersão e contraste.
- **Superfície de Cartão** (`#0f172a` / `slate-900`): Painéis de dados, modais e containers operacionais com borda fina.
- **Superfície Elevada** (`#1e293b` / `slate-800`): Blocos interativos, campos de entrada, barras de pesquisa e cards em hover.
- **Texto Principal** (`#ffffff` / `#ededed`): Títulos e valores críticos com contraste máximo.
- **Texto Secundário** (`#94a3b8` / `slate-400`): Descrições, metadados e legendas informativas.
- **Borda Estrutural** (`#334155` / `slate-700/60`): Delimitação fina e elegante de seções e tabelas.

### Functional Accents
- **Esmeralda Sucesso** (`#10b981`): Status concluído, entregas aprovadas, contratações e módulo Core HR.
- **Ciano Aprendizagem** (`#06b6d4`): Conecta Aprendizagem, empresas clientes e treinamentos.
- **Violeta Liderança** (`#8b5cf6`): Conecta Carreiras, desenvolvimento de lideranças e DHO.
- **Rosa Cultura** (`#f43f5e`): Conecta Cultura, avaliações de clima e alertas de impedimento/bloqueio.
- **Âmbar Atenção** (`#f59e0b`): Tarefas em andamento, prazos próximos e prioridades elevadas.

### Named Rules
**The Dignified Accent Rule.** O Dourado Maître é reservado para intenções de alto valor (chamadas à ação primárias, indicadores-chave e identidade de marca). Em formulários ou botões sobrepostos em dourado, utilize exclusivamente tipografia em tom escuro de alto contraste (`text-amber-950 font-bold`), nunca cinza opaco.

## Typography

**Display Font:** Outfit, system-ui, -apple-system, sans-serif
**Body Font:** Outfit, Inter, system-ui, sans-serif
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, monospace

**Character:** A tipografia geométrica do Outfit confere elegância contemporânea sem perder a clareza técnica indispensável para tabelas de timesheet, listas de candidatos e cartões de tarefas.

### Hierarchy
- **Display** (Bold/Black 900, `clamp(1.75rem, 4vw, 2.25rem)`, line-height 1.1): Títulos de impacto executivo, cabeçalho de boas-vindas e números principais de KPI.
- **Headline** (Bold 700, `1.25rem`, line-height 1.25): Títulos de visões, nomes de projetos e cabeçalhos de modais.
- **Title** (Bold/Semibold 700/600, `0.875rem` / 14px, line-height 1.3): Nomes de tarefas, cartões de pipeline e subtítulos de seções.
- **Body** (Regular/Medium 400/500, `0.75rem` / 12px, line-height 1.5): Textos corridos, comentários, descrições de demandas e histórico.
- **Label** (ExtraBold 800, `0.625rem` / 10px, uppercase, letter-spacing 0.08em): Badges de status, categorias, prazos relativos e tags de filtros.

### Named Rules
**The Scanning Rhythm Rule.** Todo cartão ou linha de tabela deve ser escaneável em menos de 2 segundos: etiqueta de status visível no topo direito, título em peso forte e metadados secundários (responsável e prazo) alinhados na base.

## Layout

O layout do Maître Conecta adota um modelo de **painel persistente e responsivo**:
- **Menu Lateral (Desktop ≥ 1024px):** Largura fixa de `16rem` (`w-64`), fixado à esquerda (`h-screen fixed`), com cabeçalho de marca e navegação segmentada em 4 grupos (Gestão Geral, R&S/ATS, DHO/Operações e Administração).
- **Gaveta Mobile (< 1024px):** Botão hambúrguer com área de toque acessível (mínimo 44x44px), gaveta retrátil com transição fluida e overlay escuro com backdrop blur.
- **Área de Conteúdo:** Espaçamento dinâmico `ml-64` em desktop, com preenchimento interno equilibrado (`p-4 sm:p-6 lg:p-8`) e largura máxima contida para evitar dispersão visual em telas ultrawide.
- **Grid de Cartões:** Grids responsivos de 1 a 4 colunas (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4`) para manter simetria e ritmo vertical.

## Elevation & Depth

O sistema prioriza **tonal layering** (camadas de profundidade tonal) e contornos de precisão em vez de sombras pesadas ou difusas:
- **Base (Layer 0):** `#0a0a0a` — O canvas plano de fundo;
- **Containers (Layer 1):** `bg-slate-900/90` com borda sutil `border-slate-800` e sombra leve `shadow-lg`;
- **Elevações Interativas (Layer 2):** `bg-slate-800` para botões secundários e campos de input;
- **Flutuantes & Modais (Layer 3):** Fundo escuro reforçado com `shadow-2xl`, borda `border-slate-700/80` e backdrop escuro com desfoque `bg-slate-950/80 backdrop-blur-sm`.

### Shadow Vocabulary
- **Card Ambient** (`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3)`): Elevação sutil de cartões e tabelas sobre o canvas;
- **Modal Overlay** (`box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7)`): Destaca modais de criação e visualização profunda de demandas;
- **Active Lift** (`transform: scale(0.98)`): Micro-afundamento tátil em cliques de botões principais.

## Shapes

- **Arredondamento:** Padrão consistente de cantos suaves `rounded-xl` (12px) para cartões, caixas de diálogo e botões principais; `rounded-2xl` (16px) para grandes containers e painéis de visão geral;
- **Badges e Pílulas:** `rounded-full` para sinalizadores de papel (`Admin Master`, `Cliente`), status (`A Fazer`, `Em Andamento`, `Concluído`) e avatares;
- **Bordas:** Espessura uniforme de 1px (`border`), utilizando opacidades de ardósia para criar limites nítidos sem poluição visual.

## Components

### Buttons
- **Primary Button (Ação Decisiva):**
  - Fundo: Dourado Maître (`bg-maitre-gold`, `#c89650`);
  - Texto: `text-amber-950 font-bold`;
  - Hover: `hover:bg-amber-300 transition-colors`;
  - Arredondamento: `rounded-xl`;
  - Padding: `px-4 py-2` (text-xs) ou `px-5 py-2.5` (text-sm);
- **Secondary / Ghost Button:**
  - Fundo: `bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white`;
  - Borda: `border border-slate-700/60`;
- **Destructive Button:**
  - Fundo: `bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30`.

### Cards & Panels
- Fundo: `bg-slate-900/90`;
- Borda: `border border-slate-800`;
- Padding: `p-4 sm:p-5`;
- Arredondamento: `rounded-2xl`;
- Sombra: `shadow-xl`.

### Inputs & Selects
- Fundo: `bg-slate-800`;
- Borda: `border border-slate-700`;
- Texto: `text-white text-xs`;
- Foco: `focus:outline-none focus:border-maitre-gold focus:ring-1 focus:ring-maitre-gold`;
- Placeholder: `placeholder:text-slate-500`.

### Status Badges
- Pílula arredondada `rounded-full` com 15% a 20% de opacidade de fundo, texto brilhante da cor funcional e borda de 30% de opacidade correspondente:
  - *A Fazer:* `bg-slate-800 text-slate-300 border-slate-700`
  - *Em Andamento:* `bg-amber-500/15 text-amber-300 border-amber-500/30`
  - *Em Revisão:* `bg-purple-500/15 text-purple-300 border-purple-500/30`
  - *Concluída:* `bg-emerald-500/15 text-emerald-300 border-emerald-500/30`
  - *Bloqueada:* `bg-rose-500/15 text-rose-400 border-rose-500/30`

## Do's and Don'ts

### Do:
- **Do** utilizar tipografia em tom escuro contrastante (`text-amber-950 font-bold`) sobre botões e badges em fundo dourado Maître.
- **Do** manter a borda sutil `border-slate-800` em todos os cartões sobre o canvas escuro para assegurar definição visual em monitores com calibrações variadas.
- **Do** agrupar metadados de demandas (responsável, prazo e prioridade) com ícones compactos de 13–14px para facilitar leitura rápida.
- **Do** respeitar o fuso horário local (`America/Fortaleza`) na formatação de datas e na agenda semanal.
- **Do** fornecer feedback imediato (loading spinner ou mensagem de confirmação) para ações do servidor.

### Don't:
- **Don't** utilizar cinza médio desbotado (`text-slate-950` ou `text-slate-500`) sobre botões coloridos de destaque.
- **Don't** aplicar sombras pretas borradas e difusas que causem sensação de interface pesada ou suja.
- **Don't** inventar gradientes púrpuras ou azuis genéricos que descaracterizem a identidade visual da Maître Consultoria.
- **Don't** expor scores ou notas punitivas de produtividade em painéis operacionais da equipe.
- **Don't** mesclar a visualização interna de impedimentos operacionais da equipe com os portais de clientes externos.
