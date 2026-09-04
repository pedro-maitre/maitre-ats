import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Semeando base canônica limpa da Maître Consultoria...");

  // 1. Organização Principal (Maître Consultoria)
  let org = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: "maitre" },
        { name: { contains: "Maître", mode: "insensitive" } },
      ],
    },
  });

  const orgData = {
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
      data: orgData,
    });
    console.log(`✓ Organização Maître Consultoria criada: ${org.name} (${org.id})`);
  } else {
    org = await prisma.organization.update({
      where: { id: org.id },
      data: orgData,
    });
    console.log(`✓ Perfil da Maître Consultoria consolidado: ${org.name}`);
  }

  // 2. Departamentos Oficiais
  const departmentsData = [
    { name: "Diretoria & Sócios", code: "DIR", description: "Liderança executiva, governança institucional e gestão estratégica" },
    { name: "Operações & Consultoria", code: "OPC", description: "Gestão operacional, consultoria de processos e hunting corporativo" },
    { name: "Tech Recruiting", code: "TRC", description: "Hunting especializado em tecnologia, engenharia de software e liderança técnica" },
    { name: "Recursos Humanos & R&S", code: "RHS", description: "Atração, seleção, triagem de talentos, relações humanas e DHO" },
    { name: "Tecnologia & Inovação", code: "TEC", description: "Infraestrutura de tecnologia, suporte, segurança e plataforma ATS" },
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsData) {
    let dept = await prisma.department.findFirst({
      where: { organizationId: org.id, name: d.name },
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: d.name,
          code: d.code,
          description: d.description,
        },
      });
    }
    deptMap.set(d.name, dept.id);
  }
  console.log("✓ Departamentos oficiais sincronizados.");

  // 3. Cargos Oficiais
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
    let pos = await prisma.position.findFirst({
      where: { organizationId: org.id, title: p.title },
    });
    if (!pos) {
      pos = await prisma.position.create({
        data: {
          organizationId: org.id,
          departmentId: deptMap.get(p.dept),
          title: p.title,
          level: p.level,
          baseSalary: p.salary,
          description: `Posição oficial da equipe Maître Consultoria em ${p.dept}.`,
        },
      });
    }
    posMap.set(p.title, pos.id);
  }
  console.log("✓ Cargos oficiais sincronizados.");

  // 4. Usuários e Colaboradores Reais da Maître Consultoria
  const defaultPassword = "123456";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

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
    let user = await prisma.user.findFirst({
      where: { email: { equals: m.email, mode: "insensitive" } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: m.email,
          name: m.name,
          role: m.role,
          jobTitle: m.jobTitle,
          department: m.department,
          phone: m.phone,
          bio: m.bio,
          status: "ACTIVE",
          password: hashedPassword,
          organizationId: org.id,
        },
      });
      console.log(`✓ Usuário criado: ${user.name} (${user.email}) | Role: ${user.role}`);
    } else {
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
      console.log(`✓ Usuário sincronizado: ${user.name} (${user.email})`);
    }

    let emp = await prisma.employee.findFirst({
      where: { email: { equals: m.email, mode: "insensitive" } },
    });

    const empData = {
      organizationId: org.id,
      userId: user.id,
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
    };

    if (!emp) {
      emp = await prisma.employee.create({ data: empData });
      console.log(`✓ Colaborador cadastrado no Core HR: [${emp.registrationNumber}] ${emp.fullName}`);
    } else {
      emp = await prisma.employee.update({
        where: { id: emp.id },
        data: empData,
      });
      console.log(`✓ Colaborador sincronizado no Core HR: [${emp.registrationNumber}] ${emp.fullName}`);
    }
  }

  // 5. Cursos Institucionais Oficiais
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
      where: { organizationId: org.id, slug: c.slug },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          organizationId: org.id,
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
      console.log(`✓ Curso oficial publicado: ${c.title}`);
    }
  }

  console.log("\n🎉 Seed canônico da Maître Consultoria concluído com sucesso!");
  console.log("ℹ️ Módulo de Vagas e Candidatos mantido 100% limpo, pronto para cadastros reais.");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
