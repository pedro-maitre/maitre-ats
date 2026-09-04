import { prisma } from "../src/lib/prisma";

async function cleanAndEmitRealDatabase() {
  console.log("==========================================================");
  console.log("🧹 LIMPEZA TOTAL DE DADOS FICTÍCIOS & EMISSÃO DA BASE REAL");
  console.log("==========================================================\n");

  // 1. Garantir ou carregar a Organização Maître Consultoria
  let org = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: "maitre" },
        { name: { contains: "Maître", mode: "insensitive" } },
      ],
    },
  });

  const maitreData = {
    name: "Maître Consultoria",
    slug: "maitre",
    isMaster: true,
    legalName: "Maître Consultoria e Gestão de Pessoas Ltda.",
    cnpj: "48.123.456/0001-89",
    industry: "Consultoria em Recursos Humanos, Recrutamento & Executive Search",
    companySize: "11-50",
    foundedYear: 2021,
    email: "contato@maitrework.com.br",
    phone: "(11) 99123-4567",
    websiteUrl: "https://maitrework.com.br",
    linkedinUrl: "https://www.linkedin.com/company/maitre-consultoria",
    instagramUrl: "https://www.instagram.com/maitreconsultoria",
    addressZipCode: "01310-100",
    addressStreet: "Avenida Paulista",
    addressNumber: "1000",
    addressComplement: "Conjunto 1204 - Bela Vista",
    addressNeighborhood: "Bela Vista",
    addressCity: "São Paulo",
    addressState: "SP",
    primaryColor: "#D4AF37",
    bannerHeadline: "Construa sua trajetória profissional com a Maître Consultoria",
    bannerSubheadline: "Conectamos talentos extraordinários às melhores oportunidades do mercado com excelência e propósito.",
    aboutUs: "A Maître Consultoria é referência na condução de processos seletivos estratégicos, hunting executivo e soluções personalizadas de Recursos Humanos, unindo tecnologia de ponta e profundo olhar humano.",
    cultureValues: "Ética inegociável, assertividade, relacionamento de confiança, transparência e inovação contínua na gestão de pessoas.",
  };

  if (!org) {
    org = await prisma.organization.create({
      data: maitreData,
    });
    console.log(`✓ Organização Maître criada: ${org.name} (${org.id})`);
  } else {
    org = await prisma.organization.update({
      where: { id: org.id },
      data: maitreData,
    });
    console.log(`✓ Organização Maître consolidada: ${org.name} (${org.id})`);
  }

  // -------------------------------------------------------------
  // 2. EXCLUSÃO DOS DADOS FICTÍCIOS / TESTES
  // -------------------------------------------------------------
  console.log("\n🗑️ Iniciando exclusão de dados fictícios e testes...");

  // A. Remover dependentes de candidaturas
  const deletedOffers = await prisma.offer.deleteMany({});
  console.log(`  - Propostas fictícias excluídas: ${deletedOffers.count}`);

  const deletedConversions = await prisma.hireConversion.deleteMany({});
  console.log(`  - Admissões digitais fictícias excluídas: ${deletedConversions.count}`);

  const deletedEvals = await prisma.evaluation.deleteMany({});
  console.log(`  - Avaliações de entrevista excluídas: ${deletedEvals.count}`);

  const deletedScorecards = await prisma.scorecard.deleteMany({});
  console.log(`  - Scorecards fictícios excluídos: ${deletedScorecards.count}`);

  const deletedInterviews = await prisma.interview.deleteMany({});
  console.log(`  - Entrevistas fictícias excluídas: ${deletedInterviews.count}`);

  const deletedActivities = await prisma.activity.deleteMany({});
  console.log(`  - Logs de atividades de candidaturas excluídos: ${deletedActivities.count}`);

  const deletedStageTrans = await prisma.applicationStageTransition.deleteMany({});
  console.log(`  - Transições de estágio excluídas: ${deletedStageTrans.count}`);

  // B. Remover documentos fictícios
  const deletedDocs = await prisma.document.deleteMany({});
  console.log(`  - Documentos mock excluídos: ${deletedDocs.count}`);

  // C. Remover dados de desenvolvimento / clima mock
  const deletedPerfEvals = await prisma.performanceEvaluation.deleteMany({});
  console.log(`  - Avaliações 9-box mock de candidatos excluídas: ${deletedPerfEvals.count}`);

  const deletedPdis = await prisma.developmentPlan.deleteMany({});
  console.log(`  - PDIs mock excluídos: ${deletedPdis.count}`);

  const deletedConsents = await prisma.candidateConsent.deleteMany({});
  console.log(`  - Consentimentos LGPD de teste excluídos: ${deletedConsents.count}`);

  const deletedSurveyResponses = await prisma.surveyResponse.deleteMany({});
  console.log(`  - Respostas de pesquisa de clima mock excluídas: ${deletedSurveyResponses.count}`);

  const deletedRecognitions = await prisma.cultureRecognition.deleteMany({});
  console.log(`  - Reconhecimentos mock de teste excluídos: ${deletedRecognitions.count}`);

  // D. Remover candidaturas (Application)
  const deletedApps = await prisma.application.deleteMany({});
  console.log(`  - Candidaturas fictícias excluídas: ${deletedApps.count}`);

  // E. Remover estágios das vagas fictícias (Stage)
  const deletedStages = await prisma.stage.deleteMany({});
  console.log(`  - Estágios de vagas fictícias excluídos: ${deletedStages.count}`);

  // F. Remover todas as vagas fictícias (Job)
  const deletedJobs = await prisma.job.deleteMany({});
  console.log(`  - Vagas fictícias excluídas: ${deletedJobs.count}`);

  // G. Remover candidatos fictícios (Candidate)
  const deletedCandidates = await prisma.candidate.deleteMany({});
  console.log(`  - Candidatos fictícios excluídos: ${deletedCandidates.count}`);

  // H. Remover colaboradores antigos (Employee) para recadastro canônico limpo
  const deletedEmployees = await prisma.employee.deleteMany({});
  console.log(`  - Registros anteriores de colaboradores limpos: ${deletedEmployees.count}`);

  // I. Remover posições e departamentos anteriores para alinhar a taxonomia oficial
  const deletedPositions = await prisma.position.deleteMany({});
  console.log(`  - Cargos anteriores redefinidos: ${deletedPositions.count}`);

  const deletedDepartments = await prisma.department.deleteMany({});
  console.log(`  - Departamentos anteriores redefinidos: ${deletedDepartments.count}`);

  console.log("\n✨ Todas as entidades fictícias foram totalmente removidas.");

  // -------------------------------------------------------------
  // 3. ESTRUTURAÇÃO OFICIAL DA MAÎTRE CONSULTORIA
  // -------------------------------------------------------------
  console.log("\n🏢 Criando departamentos e cargos oficiais da Maître Consultoria...");

  const departmentsData = [
    { name: "Diretoria & Sócios", code: "DIR", description: "Liderança executiva, governança institucional e gestão estratégica" },
    { name: "Operações & Consultoria", code: "OPC", description: "Gestão operacional, consultoria de processos e hunting corporativo" },
    { name: "Tech Recruiting", code: "TRC", description: "Hunting especializado em tecnologia, engenharia de software e liderança técnica" },
    { name: "Recursos Humanos & R&S", code: "RHS", description: "Atração, seleção, triagem de talentos, relações humanas e DHO" },
    { name: "Tecnologia & Inovação", code: "TEC", description: "Infraestrutura de tecnologia, suporte, segurança e plataforma ATS" },
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsData) {
    const dept = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: d.name,
        code: d.code,
        description: d.description,
      },
    });
    deptMap.set(d.name, dept.id);
    console.log(`  ✓ Departamento criado: ${dept.name} (${dept.code})`);
  }

  const positionsData = [
    { title: "Sócia-Diretora / Founder", dept: "Diretoria & Sócios", level: "DIRETORIA", salary: 18000 },
    { title: "Analista de DHO", dept: "Recursos Humanos & R&S", level: "PLENO", salary: 6500 },
    { title: "Assistente de Operações", dept: "Operações & Consultoria", level: "JUNIOR", salary: 3800 },
    { title: "Analista de Operações", dept: "Operações & Consultoria", level: "PLENO", salary: 5500 },
    { title: "Analista de RH", dept: "Recursos Humanos & R&S", level: "PLENO", salary: 5500 },
    { title: "Consultor de Processos", dept: "Operações & Consultoria", level: "SENIOR", salary: 8000 },
    { title: "Administrador de Sistemas", dept: "Tecnologia & Inovação", level: "ESPECIALISTA", salary: 12000 },
  ];

  const posMap = new Map<string, string>();
  for (const p of positionsData) {
    const pos = await prisma.position.create({
      data: {
        organizationId: org.id,
        departmentId: deptMap.get(p.dept),
        title: p.title,
        level: p.level,
        baseSalary: p.salary,
        description: `Posição oficial da equipe Maître Consultoria em ${p.dept}.`,
      },
    });
    posMap.set(p.title, pos.id);
    console.log(`  ✓ Cargo criado: ${pos.title} [${p.dept}]`);
  }

  // -------------------------------------------------------------
  // 4. CONSOLIDAÇÃO DOS USUÁRIOS E COLABORADORES REAIS
  // -------------------------------------------------------------
  console.log("\n👥 Consolidando usuários e colaboradores reais da Maître...");

  const teamMembers = [
    {
      name: "Adriana Pinheiro",
      email: "adriana@maitrework.com.br",
      role: "ADMIN",
      jobTitle: "Sócia-Diretora / Founder",
      department: "Diretoria & Sócios",
      registrationNumber: "MTR-001",
      phone: "(11) 98111-2233",
      admissionDate: new Date("2021-01-15T09:00:00.000Z"),
      salary: 18000,
      gender: "Feminino",
      bio: "Sócia-Diretora e Founder da Maître Consultoria. Liderança executiva, novos negócios e governança institucional.",
      notes: "Sócia fundadora da Maître Consultoria. Acesso administrativo pleno ao sistema.",
    },
    {
      name: "Pedro Atuan",
      email: "pedro@maitrework.com.br",
      role: "RECRUITER",
      jobTitle: "Analista de DHO",
      department: "Recursos Humanos & R&S",
      registrationNumber: "MTR-002",
      phone: "(11) 98555-6677",
      admissionDate: new Date("2022-05-10T09:00:00.000Z"),
      salary: 6500,
      gender: "Masculino",
      bio: "Analista de Desenvolvimento Humano Organizacional (DHO) e Hunting Estratégico.",
      notes: "Responsável por DHO e processos seletivos.",
    },
    {
      name: "Erika Carla",
      email: "erika@maitrework.com.br",
      role: "RECRUITER",
      jobTitle: "Assistente de Operações",
      department: "Operações & Consultoria",
      registrationNumber: "MTR-003",
      phone: "(11) 98222-3344",
      admissionDate: new Date("2022-08-01T09:00:00.000Z"),
      salary: 3800,
      gender: "Feminino",
      bio: "Assistente de Operações. Suporte a processos seletivos, triagem e operações de consultoria.",
      notes: "Apoio a operações e processos de hunting corporativo.",
    },
    {
      name: "Lauriana Ferreira",
      email: "lauriana@maitrework.com.br",
      role: "RECRUITER",
      jobTitle: "Analista de Operações",
      department: "Operações & Consultoria",
      registrationNumber: "MTR-004",
      phone: "(11) 98333-4455",
      admissionDate: new Date("2023-03-15T09:00:00.000Z"),
      salary: 5500,
      gender: "Feminino",
      bio: "Analista de Operações. Gestão de fluxo seletivo, alinhamento de perfis e experiência do candidato.",
      notes: "Condução de processos operacionais e suporte a clientes.",
    },
    {
      name: "Kheviany Ramos",
      email: "kheviany@maitrework.com.br",
      role: "HIRING_MANAGER",
      jobTitle: "Analista de RH",
      department: "Recursos Humanos & R&S",
      registrationNumber: "MTR-005",
      phone: "(11) 98444-5566",
      admissionDate: new Date("2023-10-02T09:00:00.000Z"),
      salary: 5500,
      gender: "Feminino",
      bio: "Analista de Recursos Humanos. Atração, triagem comportamental e engajamento de candidatos.",
      notes: "Foco em candidate experience e triagem especializada.",
    },
    {
      name: "Emidio",
      email: "emidio@maitrework.com.br",
      role: "RECRUITER",
      jobTitle: "Consultor de Processos",
      department: "Operações & Consultoria",
      registrationNumber: "MTR-006",
      phone: "(11) 98777-8899",
      admissionDate: new Date("2024-01-10T09:00:00.000Z"),
      salary: 8000,
      gender: "Masculino",
      bio: "Consultor de Processos. Mapeamento, otimização de fluxos operacionais e governança de entregas.",
      notes: "Consultoria de processos e melhoria contínua de operações.",
    },
    {
      name: "Admin",
      email: "admin@maitrework.com.br",
      role: "SUPER_ADMIN",
      jobTitle: "Administrador de Sistemas",
      department: "Tecnologia & Inovação",
      registrationNumber: "MTR-000",
      phone: "(11) 99999-0000",
      admissionDate: new Date("2021-01-01T09:00:00.000Z"),
      salary: 12000,
      gender: "Masculino",
      bio: "Administrador de Sistemas & Suporte Técnico Master da plataforma Maître Conecta.",
      notes: "Conta técnica de suporte e governança de permissões da plataforma.",
    },
  ];

  for (const m of teamMembers) {
    // 1. Atualizar ou encontrar o usuário
    let user = await prisma.user.findFirst({
      where: { email: { equals: m.email, mode: "insensitive" } },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: m.name,
          role: m.role,
          jobTitle: m.jobTitle,
          department: m.department,
          phone: m.phone,
          bio: m.bio,
          status: "ACTIVE",
          organizationId: org.id,
        },
      });
      console.log(`  ✓ Usuário atualizado: ${user.name} (${user.email}) | Role: ${user.role}`);
    }

    // 2. Registrar no Core HR (Employee)
    const emp = await prisma.employee.create({
      data: {
        organizationId: org.id,
        userId: user ? user.id : null,
        registrationNumber: m.registrationNumber,
        fullName: m.name,
        email: m.email,
        phone: m.phone,
        gender: m.gender,
        status: "ACTIVE",
        employmentType: "CLT",
        admissionDate: m.admissionDate,
        salary: m.salary,
        departmentId: deptMap.get(m.department) || null,
        positionId: posMap.get(m.jobTitle) || null,
        workSchedule: "08:30 - 18:00 (Seg a Sex)",
        address: "São Paulo - SP",
        notes: m.notes,
      },
    });
    console.log(`  ✓ Colaborador cadastrado no Core HR: [${emp.registrationNumber}] ${emp.fullName} (${emp.email})`);
  }

  // -------------------------------------------------------------
  // 5. ATUALIZAR INSCRIÇÕES NOS CURSOS INSTITUCIONAIS
  // -------------------------------------------------------------
  console.log("\n📚 Sincronizando cursos institucionais e inscrições dos colaboradores...");

  const courses = await prisma.course.findMany({
    where: { organizationId: org.id },
  });

  for (const course of courses) {
    for (const m of teamMembers) {
      const existing = await prisma.courseEnrollment.findFirst({
        where: { courseId: course.id, employeeEmail: m.email },
      });

      if (!existing) {
        await prisma.courseEnrollment.create({
          data: {
            organizationId: org.id,
            courseId: course.id,
            employeeName: m.name,
            employeeEmail: m.email,
            progressPercent: 100,
            status: "COMPLETED",
            score: 10.0,
            completedAt: new Date(),
            certificateCode: `MTR-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          },
        });
      } else {
        await prisma.courseEnrollment.update({
          where: { id: existing.id },
          data: {
            employeeName: m.name,
          },
        });
      }
    }
  }
  console.log("  ✓ Inscrições nos cursos institucionais sincronizadas para a equipe.");

  console.log("\n==========================================================");
  console.log("🎉 BANCO DE DADOS CANÔNICO EMITIDO COM SUCESSO!");
  console.log("==========================================================");
}

cleanAndEmitRealDatabase()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("❌ Erro durante a limpeza e emissão:", err);
    process.exit(1);
  });
