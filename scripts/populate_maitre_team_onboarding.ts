import { prisma } from "../src/lib/prisma";

async function populateMaitreTeam() {
  console.log("🚀 Iniciando cadastro completo da equipe Maître Consultoria em todos os módulos...");

  // 1. Localizar ou assegurar a Organização Master da Maître
  let maitre = await prisma.organization.findFirst({
    where: { slug: "maitre" },
  });

  if (!maitre) {
    maitre = await prisma.organization.create({
      data: {
        name: "Maître Consultoria",
        slug: "maitre",
        isMaster: true,
        legalName: "Maître Consultoria e Gestão de Pessoas Ltda.",
        cnpj: "48.123.456/0001-89",
        industry: "Recrutamento Estratégico, Hunting & People Intelligence",
        companySize: "11-50",
        primaryColor: "#D4AF37",
        bannerHeadline: "Maître Consultoria — Excelência em Conexão de Talentos",
        bannerSubheadline: "Ecossistema integrado de hunting, consultoria e inteligência de pessoas.",
      },
    });
    console.log("✓ Organização Maître Consultoria criada.");
  } else {
    console.log(`✓ Organização Maître Consultoria encontrada (ID: ${maitre.id}).`);
  }

  // 2. Departamentos Oficiais da Maître
  const deptConfigs = [
    { name: "Diretoria & Sócios", code: "DIR", description: "Gestão estratégica, governança e novos negócios" },
    { name: "Tech Recruiting", code: "TRC", description: "Hunting de especialistas em tecnologia, produto e engenharia" },
    { name: "Recursos Humanos & R&S", code: "RHS", description: "Atração, seleção, hunting corporativo e DHO" },
  ];

  const deptMap = new Map<string, string>();
  for (const d of deptConfigs) {
    let dept = await prisma.department.findFirst({
      where: { organizationId: maitre.id, name: d.name },
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          organizationId: maitre.id,
          name: d.name,
          code: d.code,
          description: d.description,
        },
      });
      console.log(`✓ Departamento criado: ${d.name}`);
    }
    deptMap.set(d.name, dept.id);
  }

  // 3. Cargos (Positions)
  const posConfigs = [
    { title: "Diretora & Administradora de Operações", dept: "Diretoria & Sócios", level: "DIRETORIA", salary: 18000 },
    { title: "Tech Recruiter & Consultor de R&S", dept: "Tech Recruiting", level: "SENIOR", salary: 9500 },
    { title: "Recrutadora Sênior & Headhunter", dept: "Recursos Humanos & R&S", level: "SENIOR", salary: 8800 },
    { title: "Recrutadora Plena", dept: "Recursos Humanos & R&S", level: "PLENO", salary: 6200 },
    { title: "Consultora de Atração & Seleção", dept: "Recursos Humanos & R&S", level: "PLENO", salary: 5500 },
  ];

  const posMap = new Map<string, string>();
  for (const p of posConfigs) {
    let pos = await prisma.position.findFirst({
      where: { organizationId: maitre.id, title: p.title },
    });
    if (!pos) {
      pos = await prisma.position.create({
        data: {
          organizationId: maitre.id,
          departmentId: deptMap.get(p.dept),
          title: p.title,
          level: p.level,
          baseSalary: p.salary,
          description: `Atuação estratégica no núcleo de ${p.dept} da Maître Consultoria.`,
        },
      });
      console.log(`✓ Cargo criado: ${p.title}`);
    }
    posMap.set(p.title, pos.id);
  }

  // 4. Vagas Internas de Admissão na Maître Consultoria
  // Cada colaborador passou por uma vaga correspondente antes de ser contratado
  const jobMap = new Map<string, string>();
  const stageMap = new Map<string, string>();

  for (const p of posConfigs) {
    let job = await prisma.job.findFirst({
      where: { organizationId: maitre.id, title: p.title },
    });
    if (!job) {
      job = await prisma.job.create({
        data: {
          organizationId: maitre.id,
          title: p.title,
          department: p.dept,
          location: "São Paulo, SP (Híbrido)",
          employmentType: "CLT",
          seniority: p.level,
          salaryMin: p.salary * 0.9,
          salaryMax: p.salary * 1.1,
          status: "CLOSED", // Vaga preenchida
          description: `Processo seletivo interno para a posição de ${p.title} na Maître Consultoria.`,
        },
      });

      // Estágios da Vaga
      const stages = [
        { name: "Triagem", order: 1 },
        { name: "Entrevista Técnica & Fit", order: 2 },
        { name: "Apresentação de Case", order: 3 },
        { name: "Proposta Aceita", order: 4 },
        { name: "Contratado", order: 5 },
      ];

      for (const s of stages) {
        const stage = await prisma.stage.create({
          data: {
            name: s.name,
            order: s.order,
            jobId: job.id,
            organizationId: maitre.id,
          },
        });
        if (s.name === "Contratado") {
          stageMap.set(job.id, stage.id);
        }
      }
      console.log(`✓ Vaga e estágios criados para: ${p.title}`);
    } else {
      let hiredStage = await prisma.stage.findFirst({
        where: { jobId: job.id, name: "Contratado" },
      });
      if (!hiredStage) {
        hiredStage = await prisma.stage.create({
          data: {
            name: "Contratado",
            order: 5,
            jobId: job.id,
            organizationId: maitre.id,
          },
        });
      }
      stageMap.set(job.id, hiredStage.id);
    }
    jobMap.set(p.title, job.id);
  }

  // 5. Dados Completos da Equipe Maître
  const teamMembers = [
    {
      firstName: "Adriana",
      lastName: "Maître",
      email: "adriana@maitrework.com.br",
      phone: "(11) 98111-2233",
      jobTitle: "Diretora & Administradora de Operações",
      department: "Diretoria & Sócios",
      registrationNumber: "MTR-001",
      admissionDate: new Date("2021-01-15T09:00:00.000Z"),
      salary: 18000,
      cpf: "123.456.789-01",
      rg: "12.345.678-9 SSP/SP",
      pis: "123.45678.90-1",
      birthDate: new Date("1985-04-12T00:00:00.000Z"),
      gender: "Feminino",
      civilStatus: "Casada",
      address: "Avenida Paulista, 1000, Apto 142 - Bela Vista, São Paulo - SP",
      bankDetails: {
        banco: "Itaú Unibanco (341)",
        agencia: "0345",
        conta: "98765-4",
        tipo: "Conta Corrente",
        pix: "adriana@maitrework.com.br",
      },
      boxPosition: "TOP_TALENT", // Alto Desempenho / Alto Potencial
      perfScore: 5.0,
      potScore: 5.0,
      strengths: "Liderança inspiradora, visão estratégica 360°, governança e negociação executiva de alto nível.",
      improvements: "Delegação de processos operacionais para focar 100% na expansão comercial enterprise.",
      pdiTitle: "PDI 2026 — Liderança Executiva & Expansão de Clientes Enterprise",
      pdiDescription: "Desenvolvimento contínuo em governança corporativa, conselhos consultivos e hunting internacional.",
      pdiCategory: "LEADERSHIP",
      pdiActions: [
        { item: "Estruturação dos SLAs de entrega para clientes enterprise", done: true },
        { item: "Conclusão da certificação em Governança de Pessoas & ESG", done: true },
        { item: "Mentorias quinzenais com lideranças técnicas e hunting da equipe", done: false },
        { item: "Expansão de parcerias estratégicas B2B com ecossistemas de inovação", done: false },
      ],
    },
    {
      firstName: "Pedro",
      lastName: "Albuquerque",
      email: "pedro@maitrework.com.br",
      phone: "(11) 98555-6677",
      jobTitle: "Tech Recruiter & Consultor de R&S",
      department: "Tech Recruiting",
      registrationNumber: "MTR-002",
      admissionDate: new Date("2022-05-10T09:00:00.000Z"),
      salary: 9500,
      cpf: "234.567.890-12",
      rg: "23.456.789-0 SSP/SP",
      pis: "234.56789.01-2",
      birthDate: new Date("1993-08-20T00:00:00.000Z"),
      gender: "Masculino",
      civilStatus: "Solteiro",
      address: "Rua Augusta, 1500, Conjunto 81 - Consolação, São Paulo - SP",
      bankDetails: {
        banco: "Banco Inter (077)",
        agencia: "0001",
        conta: "1234567-8",
        tipo: "Conta Corrente",
        pix: "pedro@maitrework.com.br",
      },
      boxPosition: "HIGH_PERFORMER", // Alto Desempenho / Bom Potencial
      perfScore: 4.8,
      potScore: 4.6,
      strengths: "Hunting técnico avançado, domínio de stacks modernas (Node, React, Python, Cloud), agilidade no pipeline.",
      improvements: "Aprimorar técnicas de persuasão de candidatos passivos em posições C-level/Staff.",
      pdiTitle: "PDI 2026 — Especialização em Talent Intelligence & Hunting com IA",
      pdiDescription: "Domínio de metodologias de triagem assistida por IA e estruturação de pipelines técnicos de alta escassez.",
      pdiCategory: "TECH_SKILLS",
      pdiActions: [
        { item: "Certificação avançada em Tech Sourcing & People Analytics", done: true },
        { item: "Construção do banco de talentos especializado em Engenharia de IA", done: false },
        { item: "Redução do time-to-hire técnico da Maître para menos de 16 dias", done: false },
      ],
    },
    {
      firstName: "Erika",
      lastName: "Santos",
      email: "erika@maitrework.com.br",
      phone: "(11) 98222-3344",
      jobTitle: "Recrutadora Sênior & Headhunter",
      department: "Recursos Humanos & R&S",
      registrationNumber: "MTR-003",
      admissionDate: new Date("2022-08-01T09:00:00.000Z"),
      salary: 8800,
      cpf: "345.678.901-23",
      rg: "34.567.890-1 SSP/SP",
      pis: "345.67890.12-3",
      birthDate: new Date("1990-11-05T00:00:00.000Z"),
      gender: "Feminino",
      civilStatus: "Casada",
      address: "Rua Pamplona, 780, Apto 43 - Jardim Paulista, São Paulo - SP",
      bankDetails: {
        banco: "Bradesco (237)",
        agencia: "1245",
        conta: "34567-8",
        tipo: "Conta Corrente",
        pix: "erika@maitrework.com.br",
      },
      boxPosition: "TOP_TALENT", // Alto Desempenho / Alto Potencial
      perfScore: 4.9,
      potScore: 4.7,
      strengths: "Relacionamento impecável com clientes, entrevistas por competências profundas e fit cultural apurado.",
      improvements: "Capacitação em métricas financeiras de consultoria e precificação de projetos DHO.",
      pdiTitle: "PDI 2026 — Executive Search & Consultoria Estratégica em DHO",
      pdiDescription: "Formação em assessoria de conselhos de administração e projetos de arquitetura de cargos e salários.",
      pdiCategory: "LEADERSHIP",
      pdiActions: [
        { item: "Conclusão da formação em Assessment Comportamental DISC & Fit 3D", done: true },
        { item: "Mentoria interna para recrutadoras juniores e estagiárias", done: false },
        { item: "Apresentação de relatórios executivos de shortlist em padrão internacional", done: false },
      ],
    },
    {
      firstName: "Lauriana",
      lastName: "Ferreira",
      email: "lauriana@maitrework.com.br",
      phone: "(11) 98333-4455",
      jobTitle: "Recrutadora Plena",
      department: "Recursos Humanos & R&S",
      registrationNumber: "MTR-004",
      admissionDate: new Date("2023-03-15T09:00:00.000Z"),
      salary: 6200,
      cpf: "456.789.012-34",
      rg: "45.678.901-2 SSP/SP",
      pis: "456.78901.23-4",
      birthDate: new Date("1995-02-18T00:00:00.000Z"),
      gender: "Feminino",
      civilStatus: "Solteira",
      address: "Rua Vergueiro, 2200, Apto 92 - Vila Mariana, São Paulo - SP",
      bankDetails: {
        banco: "Nubank (260)",
        agencia: "0001",
        conta: "8765432-1",
        tipo: "Conta Pagamentos",
        pix: "lauriana@maitrework.com.br",
      },
      boxPosition: "KEY_PROFESSIONAL", // Bom Desempenho / Bom Potencial
      perfScore: 4.3,
      potScore: 4.2,
      strengths: "Comprometimento, organização impecável de agendas, empatia e clareza no contato com os candidatos.",
      improvements: "Aumentar autonomia em negociações salariais com gestores contratantes.",
      pdiTitle: "PDI 2026 — Hunting Consultivo & Gestão de Relacionamento B2B",
      pdiDescription: "Evolução do papel operacional de R&S para consultoria de negócios e parcerias com clientes.",
      pdiCategory: "SOFT_SKILLS",
      pdiActions: [
        { item: "Alinhamento autônomo de perfil de vaga com Hiring Managers", done: true },
        { item: "Workshop de Comunicação Assertiva & Negociação em R&S", done: false },
        { item: "Atingir taxa de conversão em entrevistas presenciais superior a 80%", done: false },
      ],
    },
    {
      firstName: "Kheviany",
      lastName: "Ramos",
      email: "kheviany@maitrework.com.br",
      phone: "(11) 98444-5566",
      jobTitle: "Consultora de Atração & Seleção",
      department: "Recursos Humanos & R&S",
      registrationNumber: "MTR-005",
      admissionDate: new Date("2023-10-02T09:00:00.000Z"),
      salary: 5500,
      cpf: "567.890.123-45",
      rg: "56.789.012-3 SSP/SP",
      pis: "567.89012.34-5",
      birthDate: new Date("1997-07-25T00:00:00.000Z"),
      gender: "Feminino",
      civilStatus: "Solteira",
      address: "Alameda Santos, 1800, Apto 51 - Cerqueira César, São Paulo - SP",
      bankDetails: {
        banco: "Santander (033)",
        agencia: "2104",
        conta: "456789-0",
        tipo: "Conta Corrente",
        pix: "kheviany@maitrework.com.br",
      },
      boxPosition: "FUTURE_LEADER", // Alto Potencial / Desempenho em ascensão
      perfScore: 4.2,
      potScore: 4.6,
      strengths: "Dinamismo, facilidade de aprendizagem, excelente redação e engajamento em candidate experience.",
      improvements: "Profundidade técnica na análise de perfis sêniores e mapeamento de mercado.",
      pdiTitle: "PDI 2026 — Candidate Experience, Inbound Recruiting & People Analytics",
      pdiDescription: "Criação de esteiras humanizadas de atração e análise de métricas de funil no ATS.",
      pdiCategory: "TECH_SKILLS",
      pdiActions: [
        { item: "Implementação da régua de feedbacks automatizados via WhatsApp", done: true },
        { item: "Trilha de People Analytics & Indicadores de R&S na plataforma", done: false },
        { item: "Condução de dinâmicas de grupo e painéis de talentos", done: false },
      ],
    },
  ];

  // 6. Cadastrar cada colaborador no fluxo completo:
  // User -> Candidate -> Application (Contratado) -> Offer -> HireConversion (Admissão Digital) -> Documentos -> Employee (Core HR) -> 9-Box & PDI
  for (const m of teamMembers) {
    console.log(`\n⚙️ Processando colaborador: ${m.firstName} ${m.lastName} (${m.email})...`);

    // A. Localizar o Usuário
    const user = await prisma.user.findFirst({
      where: { email: { equals: m.email, mode: "insensitive" } },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          jobTitle: m.jobTitle,
          department: m.department,
          phone: m.phone,
          status: "ACTIVE",
          organizationId: maitre.id,
        },
      });
    }

    // B. Candidato
    let candidate = await prisma.candidate.findFirst({
      where: { email: { equals: m.email, mode: "insensitive" } },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          organizationId: maitre.id,
          userId: user?.id || null,
          source: "Processo Seletivo Interno Maître",
          profileSummary: `${m.jobTitle} na Maître Consultoria. Admissão em ${m.admissionDate.toLocaleDateString("pt-BR")}.`,
          tags: JSON.stringify(["Equipe Maître", m.department, "Contratado"]),
        },
      });
      console.log(`  ✓ Registro de Candidato criado: ${m.firstName} (ID: ${candidate.id})`);
    } else {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          organizationId: maitre.id,
          userId: user?.id || candidate.userId,
          profileSummary: `${m.jobTitle} na Maître Consultoria. Admissão em ${m.admissionDate.toLocaleDateString("pt-BR")}.`,
        },
      });
      console.log(`  ✓ Registro de Candidato atualizado: ${m.firstName}`);
    }

    // C. Vaga e Aplicação (Contratado)
    const jobId = jobMap.get(m.jobTitle);
    const stageId = stageMap.get(jobId || "");

    let application = await prisma.application.findFirst({
      where: { candidateId: candidate.id, jobId: jobId || "" },
    });

    if (!application && jobId && stageId) {
      application = await prisma.application.create({
        data: {
          candidateId: candidate.id,
          jobId: jobId,
          stageId: stageId,
          priority: "PRIORIZADO",
          fitCategory: "ALTO_FIT",
          matchScore: 96.5,
          salaryExpectation: m.salary,
          createdAt: new Date(m.admissionDate.getTime() - 20 * 86400000), // 20 dias antes da admissão
          enteredStageAt: m.admissionDate,
        },
      });
      console.log(`  ✓ Candidatura registrada e aprovada.`);
    }

    // D. Proposta Aprovada (Offer)
    if (application) {
      const existingOffer = await prisma.offer.findFirst({
        where: { applicationId: application.id },
      });
      if (!existingOffer) {
        await prisma.offer.create({
          data: {
            applicationId: application.id,
            salaryOffered: m.salary,
            employmentType: "CLT",
            status: "APPROVED",
            startDate: m.admissionDate,
            createdAt: new Date(m.admissionDate.getTime() - 5 * 86400000),
          },
        });
        console.log(`  ✓ Proposta salarial formalizada e aprovada.`);
      }

      // E. Admissão Digital (HireConversion)
      let conversion = await prisma.hireConversion.findFirst({
        where: { applicationId: application.id },
      });

      const additionalDataJson = JSON.stringify({
        cpf: m.cpf,
        rg: m.rg,
        pis: m.pis,
        birthDate: m.birthDate.toISOString().split("T")[0],
        gender: m.gender,
        civilStatus: m.civilStatus,
        address: m.address,
        bankDetails: m.bankDetails,
        registrationNumber: m.registrationNumber,
        admissionDate: m.admissionDate.toISOString().split("T")[0],
        workSchedule: "08:30 - 18:00 (Seg a Sex)",
        emergencyContact: {
          nome: "Contato Familiar",
          parentesco: "Familiar",
          telefone: "(11) 98999-1122",
        },
        dependentsCount: 0,
      });

      if (!conversion) {
        conversion = await prisma.hireConversion.create({
          data: {
            applicationId: application.id,
            convertedBy: "SYSTEM",
            employeeCode: m.registrationNumber,
            status: "CONVERTED",
            admissionStatus: "APPROVED",
            convertedAt: m.admissionDate,
            targetStartDate: m.admissionDate,
            notes: `Admissão digital homologada com sucesso para a equipe Maître Consultoria em ${m.admissionDate.toLocaleDateString("pt-BR")}.`,
            additionalData: additionalDataJson,
            reviewedBy: "Admin",
            reviewedAt: m.admissionDate,
          },
        });
        console.log(`  ✓ Dossiê de Admissão Digital (Conecta Operações) homologado.`);
      } else {
        await prisma.hireConversion.update({
          where: { id: conversion.id },
          data: {
            employeeCode: m.registrationNumber,
            status: "CONVERTED",
            admissionStatus: "APPROVED",
            additionalData: additionalDataJson,
          },
        });
      }

      // F. Documentos de Admissão Digital Aprovados pelo DP
      const docTypes = [
        { classification: "RG_CNH", name: `RG_CNH_${m.firstName}.pdf` },
        { classification: "CPF", name: `Comprovante_CPF_${m.firstName}.pdf` },
        { classification: "CTPS", name: `Carteira_Trabalho_Digital_${m.firstName}.pdf` },
        { classification: "ASO", name: `Atestado_Saude_Ocupacional_Admissional_${m.firstName}.pdf` },
        { classification: "RESIDENCIA", name: `Comprovante_Residencia_${m.firstName}.pdf` },
        { classification: "DADOS_BANCARIOS", name: `Comprovante_Conta_Bancaria_${m.firstName}.pdf` },
        { classification: "TERMO_LGPD", name: `Termo_Consentimento_LGPD_Assinado_${m.firstName}.pdf` },
      ];

      for (const d of docTypes) {
        const existingDoc = await prisma.document.findFirst({
          where: {
            candidateId: candidate.id,
            organizationId: maitre.id,
            classification: d.classification,
          },
        });

        if (!existingDoc) {
          await prisma.document.create({
            data: {
              organizationId: maitre.id,
              candidateId: candidate.id,
              classification: d.classification,
              originalName: d.name,
              mimeType: "application/pdf",
              sizeBytes: 1024 * 350, // ~350 KB
              storageKey: `admission/${candidate.id}/${d.classification.toLowerCase()}.pdf`,
              status: "APPROVED",
              createdAt: m.admissionDate,
            },
          });
        }
      }
      console.log(`  ✓ Todos os 7 documentos de admissão DP homologados como APPROVED.`);
    }

    // G. Cadastro Formal no Core HR (Employee)
    let employee = await prisma.employee.findFirst({
      where: { email: { equals: m.email, mode: "insensitive" } },
    });

    const empData = {
      organizationId: maitre.id,
      userId: user?.id || null,
      candidateId: candidate.id,
      registrationNumber: m.registrationNumber,
      fullName: `${m.firstName} ${m.lastName}`,
      email: m.email,
      phone: m.phone,
      cpf: m.cpf,
      rg: m.rg,
      birthDate: m.birthDate,
      gender: m.gender,
      status: "ACTIVE",
      employmentType: "CLT",
      admissionDate: m.admissionDate,
      salary: m.salary,
      departmentId: deptMap.get(m.department) || null,
      positionId: posMap.get(m.jobTitle) || null,
      workSchedule: "08:30 - 18:00 (Seg a Sex)",
      address: m.address,
      bankDetails: JSON.stringify(m.bankDetails),
      notes: `Colaborador(a) ativo(a) da Maître Consultoria. Matrícula: ${m.registrationNumber}.`,
    };

    if (!employee) {
      employee = await prisma.employee.create({
        data: empData,
      });
      console.log(`  ✓ Colaborador registrado no Core HR (ID: ${employee.id}).`);
    } else {
      await prisma.employee.update({
        where: { id: employee.id },
        data: empData,
      });
      console.log(`  ✓ Registro do Core HR atualizado.`);
    }

    // H. Conecta Desenvolvimento (Matriz 9-Box & Avaliação de Desempenho)
    const existingEval = await prisma.performanceEvaluation.findFirst({
      where: { candidateId: candidate.id, cycleName: "Ciclo Integrado Maître 2026" },
    });

    if (!existingEval) {
      await prisma.performanceEvaluation.create({
        data: {
          organizationId: maitre.id,
          candidateId: candidate.id,
          cycleName: "Ciclo Integrado Maître 2026",
          performanceScore: m.perfScore,
          potentialScore: m.potScore,
          boxPosition: m.boxPosition,
          strengths: m.strengths,
          improvements: m.improvements,
          competencies: JSON.stringify([
            { name: "Ética & Confidencialidade", score: 5.0 },
            { name: "Assertividade em Hunting", score: m.perfScore },
            { name: "Relacionamento com Clientes", score: m.potScore },
            { name: "Adoção de Tecnologia & IA", score: 4.8 },
          ]),
          evaluatedAt: new Date("2026-02-15T14:00:00.000Z"),
        },
      });
      console.log(`  ✓ Avaliação 9-Box registrada: ${m.boxPosition} (Desempenho: ${m.perfScore} | Potencial: ${m.potScore}).`);
    }

    // I. Conecta Desenvolvimento (PDI - Plano de Desenvolvimento Individual)
    const existingPDI = await prisma.developmentPlan.findFirst({
      where: { candidateId: candidate.id, title: m.pdiTitle },
    });

    if (!existingPDI) {
      await prisma.developmentPlan.create({
        data: {
          organizationId: maitre.id,
          candidateId: candidate.id,
          title: m.pdiTitle,
          description: m.pdiDescription,
          category: m.pdiCategory,
          status: "IN_PROGRESS",
          targetDate: new Date("2026-12-31T23:59:59.000Z"),
          actionItems: JSON.stringify(m.pdiActions),
        },
      });
      console.log(`  ✓ Plano de Desenvolvimento Individual (PDI) ativado.`);
    }
  }

  // 7. Conecta Aprendizagem (Cursos e Certificados da Maître)
  console.log("\n📚 Configurando trilhas e inscrições no Conecta Aprendizagem...");
  const coursesData = [
    {
      title: "Onboarding Institucional & Cultura Maître Consultoria",
      slug: "onboarding-cultura-maitre",
      description: "História, valores inegociáveis, padrões de excelência e governança em hunting executivo da Maître.",
      category: "ONBOARDING",
      durationMinutes: 120,
      isOnboardingDefault: true,
      modules: JSON.stringify([
        { title: "Nossa Origem & Missão de Conectar Talentos", duration: 30 },
        { title: "Valores: Ética, Sigilo e Assertividade", duration: 30 },
        { title: "Padrões Operacionais do Ecossistema Maître Conecta", duration: 60 },
      ]),
    },
    {
      title: "Metodologia de Hunting Estratégico & Fit 3D",
      slug: "metodologia-hunting-fit-3d",
      description: "Critérios avançados de triagem tridimensional (Técnico, Comportamental e Cultural) assistidos por IA.",
      category: "METODOLOGIA_MAITRE",
      durationMinutes: 90,
      isOnboardingDefault: false,
      modules: JSON.stringify([
        { title: "Os 3 Pilares do Fit Tridimensional", duration: 30 },
        { title: "Condução de Entrevistas por Competências", duration: 30 },
        { title: "Construção de Shortlists Executivos para Clientes", duration: 30 },
      ]),
    },
    {
      title: "Compliance, LGPD & Sigilo em Processos de R&S",
      slug: "compliance-lgpd-res",
      description: "Boas práticas jurídicas, consentimento, retenção e privacidade de dados de candidatos e empresas.",
      category: "COMPLIANCE_LGPD",
      durationMinutes: 60,
      isOnboardingDefault: true,
      modules: JSON.stringify([
        { title: "A LGPD aplicada ao Recrutamento & Seleção", duration: 30 },
        { title: "Gestão Segura de Documentos no Maître Conecta", duration: 30 },
      ]),
    },
  ];

  for (const c of coursesData) {
    let course = await prisma.course.findFirst({
      where: { organizationId: maitre.id, slug: c.slug },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          organizationId: maitre.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          category: c.category,
          durationMinutes: c.durationMinutes,
          isOnboardingDefault: c.isOnboardingDefault,
          modules: c.modules,
          status: "PUBLISHED",
        },
      });
      console.log(`✓ Curso publicado: ${c.title}`);
    }

    // Inscrever todos os membros da equipe no curso de Onboarding e Compliance
    for (const m of teamMembers) {
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: { courseId: course.id, employeeEmail: m.email },
      });

      if (!existingEnrollment) {
        await prisma.courseEnrollment.create({
          data: {
            organizationId: maitre.id,
            courseId: course.id,
            employeeName: `${m.firstName} ${m.lastName}`,
            employeeEmail: m.email,
            progressPercent: 100,
            status: "COMPLETED",
            score: 9.8,
            completedAt: new Date("2026-01-20T17:00:00.000Z"),
            certificateCode: `MTR-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          },
        });
      }
    }
  }

  // 8. Conecta Cultura (Pesquisa de Clima Ativa & Reconhecimentos Mútuos)
  console.log("\n🌟 Configurando ciclo de clima e mural de reconhecimento no Conecta Cultura...");

  let survey = await prisma.climateSurvey.findFirst({
    where: { organizationId: maitre.id, title: "Pulso de Clima & Engajamento Maître 2026" },
  });

  if (!survey) {
    survey = await prisma.climateSurvey.create({
      data: {
        organizationId: maitre.id,
        title: "Pulso de Clima & Engajamento Maître 2026",
        description: "Avaliação contínua de bem-estar, autonomia, liderança e orgulho de pertencer à Maître Consultoria.",
        status: "ACTIVE",
        targetAudience: "ALL",
        questions: JSON.stringify([
          "Em uma escala de 0 a 10, o quanto você recomendaria a Maître como um excelente lugar para trabalhar?",
          "A liderança oferece apoio e direcionamento claro para o seu crescimento?",
          "Você sente que seu trabalho gera impacto direto no sucesso dos nossos clientes?",
        ]),
      },
    });

    // Respostas simuladas e autênticas da equipe
    const responses = [
      { dept: "Diretoria & Sócios", nps: 10, feedback: "Orgulho imenso do nosso propósito e da evolução consistente da equipe." },
      { dept: "Tech Recruiting", nps: 10, feedback: "Ambiente fantástico, autonomia técnica e ferramentas inovadoras para o dia a dia." },
      { dept: "Recursos Humanos & R&S", nps: 10, feedback: "Cultura de colaboração real e respeito mútuo. Dá gosto trabalhar aqui!" },
      { dept: "Recursos Humanos & R&S", nps: 9, feedback: "Apoio constante da gestão e grandes oportunidades de desenvolvimento." },
      { dept: "Recursos Humanos & R&S", nps: 10, feedback: "Acolhimento impecável e sentimento de pertencer a algo transformador." },
    ];

    for (const r of responses) {
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          organizationId: maitre.id,
          department: r.dept,
          npsScore: r.nps,
          feedback: r.feedback,
          dimensionScores: JSON.stringify({
            lideranca: 4.9,
            colaboracao: 5.0,
            infraestrutura: 4.8,
            orgulho: 5.0,
          }),
        },
      });
    }
    console.log("✓ Ciclo de Clima criado com eNPS 100.");
  }

  // Reconhecimentos Públicos de Cultura
  const recognitions = [
    {
      sender: "Adriana Maître",
      receiver: "Pedro Albuquerque",
      receiverDept: "Tech Recruiting",
      pillar: "INOVACAO",
      message: "Parabéns, Pedro! A condução dos processos de Tech e a estruturação das novas metodologias elevaram muito nosso padrão.",
    },
    {
      sender: "Pedro Albuquerque",
      receiver: "Erika Santos",
      receiverDept: "Recursos Humanos & R&S",
      pillar: "EXCELENCIA",
      message: "Erika, sensacional seu fechamento de diretoria essa semana! Sua leitura de perfil executivo é cirúrgica.",
    },
    {
      sender: "Erika Santos",
      receiver: "Lauriana Ferreira",
      receiverDept: "Recursos Humanos & R&S",
      pillar: "COLABORACAO",
      message: "Lauriana, muito obrigado pela parceria de sempre no apoio dos shortlists e organização dos clientes. Você é nota 10!",
    },
    {
      sender: "Lauriana Ferreira",
      receiver: "Kheviany Ramos",
      receiverDept: "Recursos Humanos & R&S",
      pillar: "FOCO_NO_CLIENTE",
      message: "Kheviany, os candidatos têm elogiado muito o seu carinho e retorno rápido nos processos. Parabéns pelo cuidado!",
    },
    {
      sender: "Kheviany Ramos",
      receiver: "Adriana Maître",
      receiverDept: "Diretoria & Sócios",
      pillar: "RESPEITO",
      message: "Adriana, obrigada pela liderança inspiradora e pela confiança no meu trabalho todos os dias. Inspiração pura!",
    },
  ];

  for (const rec of recognitions) {
    const exists = await prisma.cultureRecognition.findFirst({
      where: {
        organizationId: maitre.id,
        senderName: rec.sender,
        receiverName: rec.receiver,
      },
    });

    if (!exists) {
      await prisma.cultureRecognition.create({
        data: {
          organizationId: maitre.id,
          senderName: rec.sender,
          receiverName: rec.receiver,
          receiverDepartment: rec.receiverDept,
          valuePillar: rec.pillar,
          message: rec.message,
          likesCount: 5,
        },
      });
    }
  }
  console.log("✓ Reconhecimentos de Cultura cadastrados no Mural.");

  console.log("\n🎉 SUCESSO TOTAL! Equipe Maître Consultoria completamente integrada em todos os 9 módulos!");
}

populateMaitreTeam()
  .catch((err) => {
    console.error("❌ Erro ao popular equipe Maître:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
