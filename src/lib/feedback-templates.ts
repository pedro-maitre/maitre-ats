export type FeedbackCategory =
  | "PROSPECCAO_CANDIDATURA"
  | "TRIAGEM_ANDAMENTO"
  | "ENTREVISTAS_AVALIACOES"
  | "ALTERACOES_PROCESSO"
  | "RESULTADOS_DECISOES"
  | "ENCERRAMENTO_BANCO_LGPD";

export interface FeedbackVariable {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
}

export interface FeedbackTemplate {
  id: string;
  number: number;
  title: string;
  category: FeedbackCategory;
  whenToUse: string;
  carefulNotes?: string;
  rawTemplate: string;
  defaultVariables: string[];
  suggestedAtStatus?: string;
}

export const FEEDBACK_CATEGORIES: { id: FeedbackCategory; label: string; icon: string; description: string }[] = [
  {
    id: "PROSPECCAO_CANDIDATURA",
    label: "Parte I — Prospecção & Candidatura",
    icon: "Target",
    description: "Abordagem ativa (Hunting), confirmação de recebimento e pendências de documentos.",
  },
  {
    id: "TRIAGEM_ANDAMENTO",
    label: "Parte II — Triagem & Andamento",
    icon: "Filter",
    description: "Candidatura em análise, currículo não selecionado, redirecionamento e prazos.",
  },
  {
    id: "ENTREVISTAS_AVALIACOES",
    label: "Parte III & IV — Entrevistas & Avaliações",
    icon: "Calendar",
    description: "Aprovações, convocações, lembretes de entrevista, testes e atividades.",
  },
  {
    id: "ALTERACOES_PROCESSO",
    label: "Parte V — Alterações no Processo",
    icon: "Clock",
    description: "Vagas temporariamente suspensas, cancelamentos e atualizações.",
  },
  {
    id: "RESULTADOS_DECISOES",
    label: "Parte VI — Resultados & Decisões",
    icon: "Award",
    description: "Aprovação final/oferta, lista de espera, não continuidade e finalistas.",
  },
  {
    id: "ENCERRAMENTO_BANCO_LGPD",
    label: "Parte VII & VIII — Encerramento, Banco de Talentos & LGPD",
    icon: "ShieldCheck",
    description: "Falta de resposta, desistência, autorização para Banco de Talentos (LGPD) e pesquisa NPS.",
  },
];

export const FEEDBACK_TEMPLATES: FeedbackTemplate[] = [
  // PARTE I — PROSPECÇÃO E CANDIDATURA
  {
    id: "abordagem-ativa",
    number: 1,
    title: "Abordagem ativa de candidato (Hunting)",
    category: "PROSPECCAO_CANDIDATURA",
    whenToUse: "Quando a Maître identifica um perfil no LinkedIn/Hunting e inicia o contato sem candidatura prévia.",
    carefulNotes: "Informe de onde veio o contato e não presuma interesse. Apresente as condições essenciais da vaga.",
    suggestedAtStatus: "Abordado",
    defaultVariables: ["NOME", "RECRUTADOR", "EMPRESA_CONTRATANTE", "VAGA", "ORIGEM_CONTATO", "RESUMO_ATIVIDADES", "LOCAL_MODALIDADE", "HORARIO", "REMUNERACAO"],
    rawTemplate: `Olá, [NOME]! Tudo bem?

Sou [RECRUTADOR], da Maître Consultoria. Estamos conduzindo o processo seletivo da [EMPRESA_CONTRATANTE] para a vaga de [VAGA].

Conhecemos seu perfil por meio de [ORIGEM_CONTATO] e identificamos possível compatibilidade com a oportunidade.

Principais informações:
• Atividades: [RESUMO_ATIVIDADES]
• Local: [LOCAL_MODALIDADE]
• Horário: [HORARIO]
• Remuneração: [REMUNERACAO]

Você teria interesse em conhecer melhor a vaga?

1 – Sim, tenho interesse
2 – Gostaria de receber mais informações
3 – Não tenho interesse no momento`,
  },
  {
    id: "confirmacao-recebimento",
    number: 2,
    title: "Confirmação de recebimento do currículo",
    category: "PROSPECCAO_CANDIDATURA",
    whenToUse: "Imediatamente após a submissão de candidatura no portal.",
    carefulNotes: "Confirma o recebimento, informa o prazo estimado e reduz a ansiedade do candidato.",
    suggestedAtStatus: "Candidatura recebida",
    defaultVariables: ["NOME", "RECRUTADOR", "EMPRESA_CONTRATANTE", "VAGA", "DATA_PRAZO", "LINK_PRIVACIDADE"],
    rawTemplate: `Olá, [NOME]! Tudo bem?

Sou [RECRUTADOR], da Maître Consultoria. Estamos conduzindo, para a [EMPRESA_CONTRATANTE], o processo seletivo da vaga de [VAGA].

Confirmamos o recebimento do seu currículo. A análise desta etapa será concluída até [DATA_PRAZO].

Entraremos em contato por este mesmo WhatsApp para informar o resultado, independentemente do avanço para a próxima etapa.

Seus dados serão utilizados exclusivamente para a condução deste processo seletivo. Você pode consultar nosso Aviso de Privacidade em: [LINK_PRIVACIDADE].

Agradecemos pelo interesse e desejamos boa sorte!

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "solicitacao-documentos-pendentes",
    number: 3,
    title: "Solicitação de informações ou documentos pendentes",
    category: "PROSPECCAO_CANDIDATURA",
    whenToUse: "Quando não for possível concluir a triagem por ausência de dados necessários.",
    carefulNotes: "Solicite apenas dados pertinentes à vaga e estabeleça um prazo razoável.",
    suggestedAtStatus: "Informação pendente",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "ITENS_PENDENTES", "DATA_HORARIO_LIMITE"],
    rawTemplate: `Olá, [NOME]!

Estamos analisando sua candidatura para a vaga de [VAGA], mas precisamos complementar algumas informações:

[ITENS_PENDENTES]

Você pode responder por este WhatsApp ou enviar os documentos até [DATA_HORARIO_LIMITE].

Caso não recebamos o retorno até esse prazo, não será possível concluir sua participação nesta etapa.

[RECRUTADOR]
Maître Consultoria`,
  },

  // PARTE II — TRIAGEM E ANDAMENTO
  {
    id: "candidatura-em-analise",
    number: 4,
    title: "Candidatura ainda em análise",
    category: "TRIAGEM_ANDAMENTO",
    whenToUse: "Quando o prazo original estiver próximo, mas a análise curricular ainda não tiver sido concluída.",
    carefulNotes: "Evita o silêncio e mantém o candidato seguro quanto ao andamento.",
    suggestedAtStatus: "Triagem em andamento",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "NOVA_DATA"],
    rawTemplate: `Olá, [NOME].

Passando para atualizar você sobre o processo seletivo da vaga de [VAGA].

Sua candidatura continua em análise. Ainda estamos concluindo as avaliações desta etapa e enviaremos o resultado até [NOVA_DATA].

Não é necessário realizar nenhuma ação neste momento. Agradecemos pela disponibilidade e compreensão.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "curriculo-nao-selecionado",
    number: 5,
    title: "Currículo não selecionado (Feedback de Triagem)",
    category: "TRIAGEM_ANDAMENTO",
    whenToUse: "Após a análise curricular, quando o perfil não avançará para entrevistas.",
    carefulNotes: "Utilize requisito verificável. Nunca use termos preconceituosos ou vagos como 'não tem perfil'.",
    suggestedAtStatus: "Currículo não selecionado",
    defaultVariables: ["NOME", "RECRUTADOR", "EMPRESA_CONTRATANTE", "VAGA", "CRITERIO_OBJETIVO"],
    rawTemplate: `Olá, [NOME].

Concluímos a análise dos currículos para a vaga de [VAGA], da [EMPRESA_CONTRATANTE].

Neste momento, seu perfil não seguirá para a próxima etapa. Para esta posição, [CRITERIO_OBJETIVO] é um requisito essencial, e não identificamos no currículo enviado informações suficientes que demonstrassem essa experiência/qualificação.

Agradecemos pelo interesse e pelo tempo dedicado à candidatura. Desejamos sucesso em seus próximos processos profissionais.

Atenciosamente,
[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "redirecionamento-outra-vaga",
    number: 6,
    title: "Direcionamento para outra vaga compatível",
    category: "TRIAGEM_ANDAMENTO",
    whenToUse: "Quando o perfil demonstra maior aderência a outra oportunidade aberta na consultoria.",
    carefulNotes: "Solicite autorização antes de transferir a candidatura.",
    suggestedAtStatus: "Redirecionado",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA_ORIGINAL", "NOVA_VAGA"],
    rawTemplate: `Olá, [NOME].

Durante a análise do seu perfil para a vaga de [VAGA_ORIGINAL], identificamos que sua experiência pode ter maior compatibilidade com outra oportunidade: [NOVA_VAGA].

Antes de realizar qualquer encaminhamento, gostaríamos de saber se você tem interesse em conhecer essa oportunidade.

1 – Sim, tenho interesse
2 – Gostaria de receber mais informações
3 – Prefiro permanecer somente no processo original

Sua resposta não altera a avaliação da candidatura atual.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "prorrogacao-prazo",
    number: 7,
    title: "Prorrogação do prazo de retorno",
    category: "TRIAGEM_ANDAMENTO",
    whenToUse: "Quando o prazo prometido não puder ser cumprido pela consultoria ou cliente.",
    carefulNotes: "O silêncio nunca deve substituir o feedback.",
    suggestedAtStatus: "Processo prorrogado",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "DATA_ANTERIOR", "NOVA_DATA"],
    rawTemplate: `Olá, [NOME].

Entramos em contato para atualizar você sobre o processo seletivo da vaga de [VAGA].

A conclusão desta etapa estava prevista para [DATA_ANTERIOR], mas precisaremos estender o prazo até [NOVA_DATA]. Sua candidatura continua ativa e não é necessário realizar nenhuma ação neste momento.

Pedimos desculpas pela alteração e agradecemos pela compreensão. Enviaremos uma nova atualização por este WhatsApp até a data informada.

[RECRUTADOR]
Maître Consultoria`,
  },

  // PARTE III — ENTREVISTAS E AVALIAÇÕES
  {
    id: "aprovacao-proxima-etapa",
    number: 8,
    title: "Aprovação para a próxima etapa (Convocação)",
    category: "ENTREVISTAS_AVALIACOES",
    whenToUse: "Após aprovação na triagem ou etapa intermediária para agendamento de entrevista/teste.",
    suggestedAtStatus: "Próxima etapa agendada",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "ETAPA_NOME", "DATA", "HORARIO", "FORMATO", "LOCAL_OU_LINK", "DURACAO_ESTIMADA", "PRAZO_RESPOSTA"],
    rawTemplate: `Olá, [NOME]! Temos uma boa notícia: você foi selecionado(a) para a próxima etapa do processo da vaga de [VAGA].

Confira os dados:
• Etapa: [ETAPA_NOME]
• Data: [DATA]
• Horário: [HORARIO]
• Formato: [FORMATO]
• Local ou link: [LOCAL_OU_LINK]
• Duração estimada: [DURACAO_ESTIMADA]

Por favor, responda até [PRAZO_RESPOSTA] com uma das opções:

1 – Confirmo minha participação
2 – Preciso verificar outro horário
3 – Não tenho mais interesse na vaga

Se tiver alguma dúvida sobre esta etapa, pode responder por aqui.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "lembrete-entrevista",
    number: 9,
    title: "Lembrete de entrevista / etapa agendada",
    category: "ENTREVISTAS_AVALIACOES",
    whenToUse: "No dia anterior ou algumas horas antes da entrevista.",
    suggestedAtStatus: "Entrevista confirmada",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "DATA", "HORARIO", "FORMATO", "LOCAL_OU_LINK"],
    rawTemplate: `Olá, [NOME]!

Este é um lembrete da sua participação na próxima etapa do processo para a vaga de [VAGA]:

• Data: [DATA]
• Horário: [HORARIO]
• Formato: [FORMATO]
• Local ou link: [LOCAL_OU_LINK]

Pedimos que esteja disponível com aproximadamente 5 minutos de antecedência.

Responda:
1 – Participação confirmada
2 – Preciso de ajuda com o acesso
3 – Não poderei participar

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "reagendamento-empresa",
    number: 10,
    title: "Reagendamento solicitado pela empresa/consultoria",
    category: "ENTREVISTAS_AVALIACOES",
    whenToUse: "Quando a empresa precisar alterar um compromisso já confirmado.",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "ETAPA_NOME", "DATA_HORARIO_ANTERIOR", "MOTIVO_BREVE", "OPCAO_1", "OPCAO_2", "OPCAO_3"],
    rawTemplate: `Olá, [NOME].

Precisaremos alterar o horário da sua [ETAPA_NOME] para a vaga de [VAGA].

O encontro anteriormente marcado para [DATA_HORARIO_ANTERIOR] precisará ser reagendado [MOTIVO_BREVE].

Podemos oferecer as seguintes opções:
1 – [OPCAO_1]
2 – [OPCAO_2]
3 – [OPCAO_3]

Pedimos desculpas pela alteração. Por favor, informe a opção mais adequada para você.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "ausencia-candidato",
    number: 11,
    title: "Ausência do candidato (No-show)",
    category: "ENTREVISTAS_AVALIACOES",
    whenToUse: "Após o não comparecimento a uma etapa agendada.",
    carefulNotes: "Não adote tom acusatório. Verifique se houve imprevisto e estabeleça prazo de resposta.",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "ETAPA_NOME", "HORARIO", "PRAZO_RESPOSTA"],
    rawTemplate: `Olá, [NOME].

Notamos que você não conseguiu participar da [ETAPA_NOME] agendada para hoje, às [HORARIO], referente à vaga de [VAGA].

Gostaríamos de verificar se ocorreu algum imprevisto e se você ainda tem interesse em continuar no processo.

Por favor, responda até [PRAZO_RESPOSTA]:
1 – Tenho interesse e gostaria de reagendar
2 – Não tenho mais interesse
3 – Preciso esclarecer uma situação

Se não recebermos retorno até o prazo informado, entenderemos que você optou por não continuar no processo.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "convocacao-teste-atividade",
    number: 12,
    title: "Convocação para teste ou atividade prática",
    category: "ENTREVISTAS_AVALIACOES",
    whenToUse: "Antes de teste técnico, estudo de caso ou redação.",
    carefulNotes: "Nunca solicite trabalho produtivo gratuito real para a empresa contratante.",
    suggestedAtStatus: "Avaliação enviada",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "TESTE_NOME", "OBJETIVO_BREVE", "FORMATO", "PRAZO_ENTREGA", "TEMPO_ESTIMADO", "INSTRUCOES_LINK", "CRITERIOS_AVALIACAO"],
    rawTemplate: `Olá, [NOME]!

Você avançou para a etapa de [TESTE_NOME] do processo seletivo da vaga de [VAGA].

Orientações:
• Objetivo: [OBJETIVO_BREVE]
• Formato: [FORMATO]
• Prazo de entrega: [PRAZO_ENTREGA]
• Tempo estimado: [TEMPO_ESTIMADO]
• Link ou instruções: [INSTRUCOES_LINK]

Essa atividade será avaliada considerando [CRITERIOS_AVALIACAO].

Por favor, confirme o recebimento desta mensagem. Se precisar de alguma condição de acessibilidade ou tiver dificuldade técnica, informe por aqui.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "confirmacao-recebimento-atividade",
    number: 13,
    title: "Confirmação de recebimento da atividade/case",
    category: "ENTREVISTAS_AVALIACOES",
    whenToUse: "Após o candidato enviar o case ou teste solicitado.",
    suggestedAtStatus: "Avaliação recebida",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "DATA_RESULTADO"],
    rawTemplate: `Olá, [NOME]!

Confirmamos o recebimento da sua atividade referente à vaga de [VAGA].

O material será avaliado conforme os critérios informados, e enviaremos o resultado até [DATA_RESULTADO].

Não é necessário realizar nenhuma ação adicional neste momento. Agradecemos pela participação e pelo cumprimento do prazo.

[RECRUTADOR]
Maître Consultoria`,
  },

  // PARTE IV — ALTERAÇÕES NO PROCESSO
  {
    id: "vaga-suspensa",
    number: 14,
    title: "Vaga temporariamente suspensa",
    category: "ALTERACOES_PROCESSO",
    whenToUse: "Quando a empresa cliente interrompe a seleção sem cancelá-la definitivamente.",
    suggestedAtStatus: "Vaga suspensa",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "DATA_ATUALIZACAO"],
    rawTemplate: `Olá, [NOME].

Entramos em contato para informar uma atualização sobre a vaga de [VAGA].

Por uma decisão interna da empresa contratante, o processo seletivo está temporariamente suspenso. Essa suspensão não está relacionada ao seu desempenho ou à avaliação do seu perfil.

Enviaremos uma nova atualização até [DATA_ATUALIZACAO], mesmo que o processo ainda não tenha sido retomado.

Agradecemos pela compreensão e pelo interesse na oportunidade.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "cancelamento-vaga",
    number: 15,
    title: "Cancelamento do processo seletivo",
    category: "ALTERACOES_PROCESSO",
    whenToUse: "Quando a vaga deixa de existir ou o projeto é cancelado.",
    carefulNotes: "Nunca envie mensagem de reprovação quando o motivo for o cancelamento da posição.",
    suggestedAtStatus: "Vaga cancelada",
    defaultVariables: ["NOME", "RECRUTADOR", "EMPRESA_CONTRATANTE", "VAGA", "MOTIVO_REESTRUTURACAO"],
    rawTemplate: `Olá, [NOME].

A [EMPRESA_CONTRATANTE] decidiu cancelar o processo seletivo da vaga de [VAGA] em razão de [MOTIVO_REESTRUTURACAO].

Por esse motivo, a seleção será encerrada sem contratação. Essa decisão não está relacionada ao seu desempenho ou à avaliação do seu perfil.

Lamentamos a mudança e agradecemos sinceramente pelo tempo e pela disponibilidade dedicados ao processo.

[RECRUTADOR]
Maître Consultoria`,
  },

  // PARTE V — RESULTADOS E DECISÕES
  {
    id: "lista-de-espera",
    number: 16,
    title: "Lista de espera / Banco em consideração",
    category: "RESULTADOS_DECISOES",
    whenToUse: "Quando o candidato segue considerado, aguardando validação ou resposta de proposta.",
    carefulNotes: "Não apresente lista de espera como aprovação definitiva e forneça prazo claro.",
    suggestedAtStatus: "Lista de espera",
    defaultVariables: ["NOME", "RECRUTADOR", "ETAPA_NOME", "VAGA", "DATA_RESPOSTA_DEFINITIVA"],
    rawTemplate: `Olá, [NOME].

Concluímos a etapa de [ETAPA_NOME] do processo para a vaga de [VAGA]. Seu perfil apresentou boa aderência e permanecerá em nossa lista de candidatos em consideração até [DATA_RESPOSTA_DEFINITIVA].

Neste momento, estamos concluindo algumas definições internas antes da decisão final. Sua candidatura continua ativa, mas essa condição ainda não representa uma confirmação de contratação.

Enviaremos uma resposta definitiva até a data informada.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "nao-continuidade-apos-entrevista",
    number: 17,
    title: "Não continuidade após entrevista (com critério objetivo)",
    category: "RESULTADOS_DECISOES",
    whenToUse: "Quando o candidato realizou entrevista mas não seguirá no processo.",
    carefulNotes: "Mencione um ponto positivo real. Use termos objetivos sobre a competência ou experiência priorizada.",
    suggestedAtStatus: "Não continuidade após entrevista",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "PONTO_POSITIVO_REAL", "CRITERIO_PRIORIZADO"],
    rawTemplate: `Olá, [NOME].

Agradecemos por sua participação na entrevista para a vaga de [VAGA]. Foi muito positivo conhecer melhor sua trajetória e perceber [PONTO_POSITIVO_REAL].

Após a avaliação desta etapa, decidimos seguir com outros perfis. Nesta seleção, o critério [CRITERIO_PRIORIZADO] teve um peso importante, e os candidatos que avançaram apresentaram maior aderência nesse aspecto.

Agradecemos pelo tempo, pela disponibilidade e pelo interesse na oportunidade. Desejamos sucesso em sua trajetória profissional.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "finalista-nao-contratado",
    number: 18,
    title: "Finalista não contratado (feedback individualizado)",
    category: "RESULTADOS_DECISOES",
    whenToUse: "Para candidatos que chegaram à etapa final da vaga.",
    carefulNotes: "Ofereça uma conversa breve pelo WhatsApp e confirme a decisão com respeito e clareza.",
    suggestedAtStatus: "Finalista não contratado",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA", "PONTOS_FORTES", "CRITERIO_DECISAO"],
    rawTemplate: `Olá, [NOME].

Finalizamos o processo seletivo para a vaga de [VAGA] e gostaríamos de agradecer especialmente por sua participação.

Você chegou à etapa final e apresentou pontos muito positivos, como [PONTOS_FORTES]. A decisão foi bastante criteriosa, mas optamos por outro perfil que, neste momento, apresentou maior aderência em [CRITERIO_DECISAO].

Seu desempenho foi muito positivo, e essa decisão está relacionada às necessidades específicas desta vaga — não a uma avaliação negativa da sua trajetória profissional.

Agradecemos pela confiança, disponibilidade e dedicação durante todo o processo. Desejamos muito sucesso em seus próximos passos.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "aprovacao-final-proposta",
    number: 19,
    title: "Aprovação final e proposta salarial",
    category: "RESULTADOS_DECISOES",
    whenToUse: "Após a decisão definitiva de contratação.",
    carefulNotes: "A mensagem deve ser seguida da proposta formal detalhada e do início do onboarding.",
    suggestedAtStatus: "Aprovado",
    defaultVariables: ["NOME", "RECRUTADOR", "EMPRESA_CONTRATANTE", "VAGA", "PONTO_FORTE", "COMPETENCIA", "CARGO", "REMUNERACAO", "BENEFICIOS", "JORNADA", "LOCAL", "PREVISAO_INICIO"],
    rawTemplate: `Olá, [NOME]! Temos uma excelente notícia.

Você foi selecionado(a) para a vaga de [VAGA] na [EMPRESA_CONTRATANTE].

Parabéns pelo desempenho durante o processo! Sua experiência em [PONTO_FORTE] e sua demonstração de [COMPETENCIA] foram aspectos importantes para a decisão.

Principais condições:
• Cargo: [CARGO]
• Remuneração: [REMUNERACAO]
• Benefícios: [BENEFICIOS]
• Jornada: [JORNADA]
• Local: [LOCAL]
• Previsão de início: [PREVISAO_INICIO]

Por favor, confirme o recebimento e informe se deseja prosseguir para a formalização da proposta.

[RECRUTADOR]
Maître Consultoria`,
  },

  // PARTE VI — ENCERRAMENTO, BANCO DE TALENTOS E LGPD
  {
    id: "falta-de-resposta",
    number: 20,
    title: "Encerramento por falta de resposta",
    category: "ENCERRAMENTO_BANCO_LGPD",
    whenToUse: "Após tentativas registradas de contato sem retorno do candidato.",
    suggestedAtStatus: "Encerrado por falta de resposta",
    defaultVariables: ["NOME", "RECRUTADOR", "DATAS_CONTATO", "VAGA", "PRAZO_FINAL"],
    rawTemplate: `Olá, [NOME].

Tentamos contato nos dias [DATAS_CONTATO] para dar continuidade ao processo da vaga de [VAGA], mas não recebemos retorno.

Por esse motivo, encerraremos sua participação neste processo neste momento.

Caso tenha ocorrido algum imprevisto e ainda tenha interesse, você poderá responder até [PRAZO_FINAL]. Após esse prazo, o encerramento será considerado definitivo.

Agradecemos pelo interesse na oportunidade.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "confirmacao-desistencia",
    number: 21,
    title: "Confirmação de desistência voluntária",
    category: "ENCERRAMENTO_BANCO_LGPD",
    whenToUse: "Quando o candidato comunica que aceitou outra proposta ou não deseja continuar.",
    suggestedAtStatus: "Desistência do candidato",
    defaultVariables: ["NOME", "RECRUTADOR", "VAGA"],
    rawTemplate: `Olá, [NOME].

Confirmamos o recebimento da sua solicitação de retirada do processo seletivo da vaga de [VAGA].

Agradecemos por nos avisar e pela participação até este momento. Respeitamos sua decisão e desejamos sucesso em seus próximos passos profissionais.

Se desejar, você pode informar brevemente o motivo da desistência. A resposta é opcional e será utilizada apenas para aprimorarmos nossos processos.

[RECRUTADOR]
Maître Consultoria`,
  },
  {
    id: "autorizacao-banco-talentos",
    number: 22,
    title: "Solicitação de autorização para Banco de Talentos (LGPD)",
    category: "ENCERRAMENTO_BANCO_LGPD",
    whenToUse: "Ao encerrar um processo seletivo quando há interesse em manter o currículo na base.",
    carefulNotes: "A manifestação deve ser livre, informada e inequívoca, com link do Aviso de Privacidade.",
    suggestedAtStatus: "Banco de talentos solicitado",
    defaultVariables: ["NOME", "ORGANIZACAO", "PRAZO_RETENCAO", "CONTATO_PRIVACIDADE", "LINK_PRIVACIDADE"],
    rawTemplate: `Olá, [NOME].

Identificamos que seu perfil poderá ser considerado em futuras oportunidades compatíveis.

Você autoriza a [ORGANIZACAO] a manter seu currículo no banco de talentos pelo período de [PRAZO_RETENCAO] e entrar em contato caso surja uma vaga aderente ao seu perfil?

Responda:
SIM – Autorizo
NÃO – Não autorizo

Sua resposta é opcional e não interfere no resultado do processo atual. Caso autorize, você poderá solicitar a retirada dos seus dados a qualquer momento pelo canal [CONTATO_PRIVACIDADE].

Aviso de Privacidade: [LINK_PRIVACIDADE]`,
  },
  {
    id: "pesquisa-experiencia-candidato",
    number: 23,
    title: "Pesquisa de experiência do candidato (NPS Recrutamento)",
    category: "ENCERRAMENTO_BANCO_LGPD",
    whenToUse: "Após a finalização do processo seletivo para medir qualidade e humanização do atendimento.",
    defaultVariables: ["NOME", "VAGA"],
    rawTemplate: `Olá, [NOME].

Gostaríamos de conhecer sua percepção sobre o processo seletivo da vaga de [VAGA]. Sua resposta não altera o resultado da seleção e será utilizada para melhorar nossa experiência de recrutamento.

Em uma escala de 1 a 5, como você avalia:
1. Clareza das informações: [1 a 5]
2. Cumprimento dos prazos: [1 a 5]
3. Atendimento da equipe: [1 a 5]

Se desejar, deixe também uma sugestão de melhoria.

Agradecemos pela contribuição!
Equipe Maître Consultoria`,
  },
];

/**
 * Sanitiza o número de telefone brasileiro e adiciona o DDI 55
 */
export function sanitizeBrazilianPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("55") && cleaned.length >= 12) {
    return cleaned;
  }
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return `55${cleaned}`;
  }
  return cleaned;
}

/**
 * Gera a URL do WhatsApp Web / App com o texto codificado
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = sanitizeBrazilianPhone(phone);
  const encodedText = encodeURIComponent(text.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Preenche as variáveis do template
 */
export function applyTemplateVariables(
  templateText: string,
  variables: Record<string, string>
): string {
  let result = templateText;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\[${key}\\]`, "g");
    result = result.replace(placeholder, value || `[${key}]`);
  }
  return result;
}

/**
 * Verifica se ainda existem variáveis não preenchidas no formato [VARIAVEL]
 */
export function getUnfilledVariables(text: string): string[] {
  const matches = text.match(/\[([A-Z0-9_ÁÉÍÓÚÂÊÔÃÕÇ\s/()-]+)\]/g);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

/**
 * Matriz de princípios éticos e não discriminação (Lei 9.029/95 e LGPD)
 */
export const ANTI_DISCRIMINATION_RULES = [
  "Nunca justifique reprovações por estado civil, filhos, gravidez, idade, sexo, raça ou religião.",
  "Não utilize localização de moradia ('mora longe' ou 'zona rural') como justificativa de rejeição.",
  "Utilize sempre critérios profissionais, objetivos e comprováveis vinculados à vaga.",
  "Substitua termos negativos como 'não tem perfil' por 'o critério X teve maior peso neste processo'.",
  "O WhatsApp deve ser um canal humanizado, ágil e com histórico registrado no ATS.",
];
