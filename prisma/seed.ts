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
  console.log("🌱 Semeando dados essenciais de forma não-destrutiva (sem apagar dados existentes)...");

  // 1. Organização Principal (Maître Consultoria)
  let org = await prisma.organization.findFirst({
    where: { slug: "maitre" },
  });

  const orgData = {
    name: "Maître Consultoria",
    slug: "maitre",
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
    bannerSubheadline: "Conectamos talentos extraordinários às melhores oportunidades do mercado.",
    aboutUs: "A Maître Consultoria é referência na condução de processos seletivos estratégicos e hunting executivo.",
    cultureValues: "Ética inegociável, assertividade, confidencialidade e inovação contínua.",
  };

  if (!org) {
    org = await prisma.organization.create({
      data: orgData,
    });
    console.log("✓ Organização Maître Consultoria criada com perfil completo.");
  } else {
    await prisma.organization.update({
      where: { id: org.id },
      data: orgData,
    });
    console.log("✓ Perfil da Maître Consultoria atualizado.");
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 2. Usuários e colaboradores essenciais
  const usersToEnsure = [
    {
      email: "admin@maitrework.com.br",
      name: "Admin",
      role: "SUPER_ADMIN",
      jobTitle: "Administrador do Sistema",
      department: "Tecnologia & Inovação",
      phone: "(11) 99999-0000",
    },
    {
      email: "adriana@maitrework.com.br",
      name: "Adriana",
      role: "ADMIN",
      jobTitle: "Diretora & Administradora de Operações",
      department: "Diretoria & Sócios",
      phone: "(11) 98111-2233",
    },
    {
      email: "pedro@maitrework.com.br",
      name: "Pedro",
      role: "RECRUITER",
      jobTitle: "Tech Recruiter & Consultor de R&S",
      department: "Tech Recruiting",
      phone: "(11) 98555-6677",
    },
    {
      email: "erika@maitrework.com.br",
      name: "Erika",
      role: "RECRUITER",
      jobTitle: "Recrutadora Sênior & Headhunter",
      department: "Recursos Humanos / R&S",
      phone: "(11) 98222-3344",
    },
    {
      email: "lauriana@maitrework.com.br",
      name: "Lauriana",
      role: "RECRUITER",
      jobTitle: "Recrutadora Plena",
      department: "Recursos Humanos / R&S",
      phone: "(11) 98333-4455",
    },
    {
      email: "kheviany@maitrework.com.br",
      name: "Kheviany",
      role: "RECRUITER",
      jobTitle: "Consultora de Atração & Seleção",
      department: "Recursos Humanos / R&S",
      phone: "(11) 98444-5566",
    },
  ];

  for (const u of usersToEnsure) {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: u.email, mode: "insensitive" } },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          jobTitle: u.jobTitle,
          department: u.department,
          phone: u.phone,
          status: "ACTIVE",
          password: hashedPassword,
          organizationId: org.id,
        },
      });
      console.log(`✓ Usuário ${u.name} (${u.email}) criado com sucesso.`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          jobTitle: u.jobTitle,
          department: u.department,
          phone: u.phone,
          status: "ACTIVE",
          organizationId: org.id,
        },
      });
      console.log(`✓ Colaborador ${u.name} sincronizado.`);
    }
  }

  // 3. Vaga padrão se não houver nenhuma
  const existingJob = await prisma.job.findFirst({
    where: { organizationId: org.id },
  });

  if (!existingJob) {
    const recruiter = await prisma.user.findFirst({
      where: { role: "RECRUITER" },
    });

    const job = await prisma.job.create({
      data: {
        title: "Desenvolvedor Frontend Sênior",
        description: "Vaga para desenvolvedor frontend com experiência em Next.js e React.",
        department: "Tecnologia",
        location: "Remoto",
        status: "OPEN",
        organizationId: org.id,
        recruiterId: recruiter?.id || null,
      },
    });

    const stages = [
      { name: "Aplicado", order: 1 },
      { name: "Triagem", order: 2 },
      { name: "Entrevista", order: 3 },
      { name: "Teste Técnico", order: 4 },
      { name: "Proposta", order: 5 },
      { name: "Contratado", order: 6 },
      { name: "Rejeitado", order: 7 },
    ];

    for (const s of stages) {
      await prisma.stage.create({
        data: {
          name: s.name,
          order: s.order,
          jobId: job.id,
        },
      });
    }
    console.log("✓ Vaga padrão e etapas criadas.");
  }

  console.log("🎉 Seed não-destrutivo concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
