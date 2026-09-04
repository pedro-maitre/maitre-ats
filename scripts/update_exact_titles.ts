import { prisma } from "../src/lib/prisma";

async function updateExactTitles() {
  console.log("==========================================================");
  console.log("📝 ATUALIZANDO CARGOS E DADOS EXATOS DOS COLABORADORES");
  console.log("==========================================================\n");

  const org = await prisma.organization.findFirst({
    where: { slug: "maitre" },
  });

  if (!org) {
    throw new Error("Organização Maître Consultoria não encontrada!");
  }

  // 1. Departamentos
  const deptConfigs = [
    { name: "Diretoria & Sócios", code: "DIR", description: "Liderança executiva, governança institucional e gestão estratégica" },
    { name: "Operações & Consultoria", code: "OPC", description: "Gestão operacional, consultoria de processos e suporte de consultoria" },
    { name: "Recursos Humanos & R&S", code: "RHS", description: "DHO, atração, seleção, triagem de talentos e relações humanas" },
    { name: "Tecnologia & Inovação", code: "TEC", description: "Infraestrutura de tecnologia, suporte, segurança e plataforma ATS" },
  ];

  const deptMap = new Map<string, string>();
  for (const d of deptConfigs) {
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

  // 2. Cargos exatos solicitados pelo usuário
  const exactPositions = [
    { title: "Sócia-Diretora / Founder", dept: "Diretoria & Sócios", level: "DIRETORIA", salary: 18000 },
    { title: "Analista de DHO", dept: "Recursos Humanos & R&S", level: "PLENO", salary: 6500 },
    { title: "Assistente de Operações", dept: "Operações & Consultoria", level: "JUNIOR", salary: 3800 },
    { title: "Analista de Operações", dept: "Operações & Consultoria", level: "PLENO", salary: 5500 },
    { title: "Analista de RH", dept: "Recursos Humanos & R&S", level: "PLENO", salary: 5500 },
    { title: "Consultor de Processos", dept: "Operações & Consultoria", level: "SENIOR", salary: 8000 },
    { title: "Administrador de Sistemas", dept: "Tecnologia & Inovação", level: "ESPECIALISTA", salary: 12000 },
  ];

  const posMap = new Map<string, string>();
  for (const p of exactPositions) {
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
          description: `Cargo oficial: ${p.title} no núcleo de ${p.dept}.`,
        },
      });
      console.log(`✓ Cargo criado: ${pos.title}`);
    } else {
      pos = await prisma.position.update({
        where: { id: pos.id },
        data: {
          departmentId: deptMap.get(p.dept),
          level: p.level,
          baseSalary: p.salary,
        },
      });
      console.log(`✓ Cargo atualizado: ${pos.title}`);
    }
    posMap.set(p.title, pos.id);
  }

  // 3. Colaboradores exatos especificados pelo usuário
  const exactTeam = [
    {
      registrationNumber: "MTR-001",
      name: "Adriana Pinheiro",
      email: "adriana@maitrework.com.br",
      jobTitle: "Sócia-Diretora / Founder",
      department: "Diretoria & Sócios",
      role: "ADMIN",
    },
    {
      registrationNumber: "MTR-002",
      name: "Pedro Atuan",
      email: "pedro@maitrework.com.br",
      jobTitle: "Analista de DHO",
      department: "Recursos Humanos & R&S",
      role: "RECRUITER",
    },
    {
      registrationNumber: "MTR-003",
      name: "Erika Carla",
      email: "erika@maitrework.com.br",
      jobTitle: "Assistente de Operações",
      department: "Operações & Consultoria",
      role: "RECRUITER",
    },
    {
      registrationNumber: "MTR-004",
      name: "Lauriana Ferreira",
      email: "lauriana@maitrework.com.br",
      jobTitle: "Analista de Operações",
      department: "Operações & Consultoria",
      role: "RECRUITER",
    },
    {
      registrationNumber: "MTR-005",
      name: "Kheviany Ramos",
      email: "kheviany@maitrework.com.br",
      jobTitle: "Analista de RH",
      department: "Recursos Humanos & R&S",
      role: "HIRING_MANAGER",
    },
    {
      registrationNumber: "MTR-006",
      name: "Emidio",
      email: "emidio@maitrework.com.br",
      jobTitle: "Consultor de Processos",
      department: "Operações & Consultoria",
      role: "RECRUITER",
    },
    {
      registrationNumber: "MTR-000",
      name: "Admin",
      email: "admin@maitrework.com.br",
      jobTitle: "Administrador de Sistemas",
      department: "Tecnologia & Inovação",
      role: "SUPER_ADMIN",
    },
  ];

  console.log("\nSincronizando usuários e colaboradores...");
  for (const m of exactTeam) {
    // A. Atualizar User
    const user = await prisma.user.update({
      where: { email: m.email },
      data: {
        name: m.name,
        role: m.role,
        jobTitle: m.jobTitle,
        department: m.department,
      },
    });

    // B. Atualizar Employee via userId
    const emp = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        registrationNumber: m.registrationNumber,
        fullName: m.name,
        email: m.email,
        departmentId: deptMap.get(m.department) || null,
        positionId: posMap.get(m.jobTitle) || null,
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        registrationNumber: m.registrationNumber,
        fullName: m.name,
        email: m.email,
        departmentId: deptMap.get(m.department) || null,
        positionId: posMap.get(m.jobTitle) || null,
        status: "ACTIVE",
        employmentType: "CLT",
      },
    });

    console.log(`✓ [${emp.registrationNumber}] ${emp.fullName} (${emp.email}) -> Cargo: ${m.jobTitle} | Depto: ${m.department}`);
  }

  // 4. Limpar posições obsoletas
  const validTitles = exactPositions.map((p) => p.title);
  const obsoletePositions = await prisma.position.deleteMany({
    where: {
      organizationId: org.id,
      title: { notIn: validTitles },
    },
  });
  if (obsoletePositions.count > 0) {
    console.log(`\n✓ Removidos ${obsoletePositions.count} cargos obsoletos da taxonomia.`);
  }

  console.log("\n==========================================================");
  console.log("🎉 DADOS REAIS E CARGOS ATUALIZADOS COM SUCESSO!");
  console.log("==========================================================");
}

updateExactTitles()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  });
