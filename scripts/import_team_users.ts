import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Lista dos colaboradores da Maître Consultoria
const teamUsers = [
  {
    name: "Adriana",
    email: "adriana@maitrework.com.br",
    role: "ADMIN",
    jobTitle: "Diretora & Administradora de Operações",
    department: "Diretoria & Sócios",
    phone: "(11) 98111-2233",
    company: "Maître Consultoria",
    bio: "Gestão executiva, relacionamento com clientes corporativos e governança institucional da Maître.",
  },
  {
    name: "Erika",
    email: "erika@maitrework.com.br",
    role: "RECRUITER",
    jobTitle: "Recrutadora Sênior & Headhunter",
    department: "Recursos Humanos / R&S",
    phone: "(11) 98222-3344",
    company: "Maître Consultoria",
    bio: "Especialista em executive search, hunting estratégico e atração de talentos de média e alta liderança.",
  },
  {
    name: "Lauriana",
    email: "lauriana@maitrework.com.br",
    role: "RECRUITER",
    jobTitle: "Recrutadora Plena",
    department: "Recursos Humanos / R&S",
    phone: "(11) 98333-4455",
    company: "Maître Consultoria",
    bio: "Condução de processos seletivos ponta a ponta com foco em fit cultural e experiência do candidato.",
  },
  {
    name: "Kheviany",
    email: "kheviany@maitrework.com.br",
    role: "RECRUITER",
    jobTitle: "Consultora de Atração & Seleção",
    department: "Recursos Humanos / R&S",
    phone: "(11) 98444-5566",
    company: "Maître Consultoria",
    bio: "Mapeamento de mercado, triagem comportamental e engajamento ativo de talentos.",
  },
  {
    name: "Pedro",
    email: "pedro@maitrework.com.br",
    role: "RECRUITER",
    jobTitle: "Tech Recruiter & Consultor de R&S",
    department: "Tech Recruiting",
    phone: "(11) 98555-6677",
    company: "Maître Consultoria",
    bio: "Foco em posições técnicas, tecnologia, engenharia de software e liderança técnica.",
  },
];

async function importTeam() {
  console.log("==========================================================");
  console.log("👥 CONSOLIDAÇÃO DA MAÎTRE CONSULTORIA & EQUIPE NO BANCO");
  console.log("==========================================================\n");

  try {
    // 1. Localizar ou criar/atualizar a organização Maître Consultoria
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
      console.log(`✓ Organização criada com perfil completo: ${org.name} (${org.id})`);
    } else {
      org = await prisma.organization.update({
        where: { id: org.id },
        data: orgData,
      });
      console.log(`✓ Perfil corporativo da Maître Consultoria atualizado: ${org.name} (${org.id})`);
    }

    // Senha padrão inicial: 123456
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let createdCount = 0;
    let updatedCount = 0;

    for (const member of teamUsers) {
      const cleanEmail = member.email.trim().toLowerCase();

      const existing = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
        },
      });

      if (existing) {
        // Atualizar papel, dados e organização
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: member.name,
            role: member.role,
            jobTitle: member.jobTitle,
            department: member.department,
            phone: member.phone,
            bio: member.bio,
            status: "ACTIVE",
            organizationId: org.id,
            password: existing.password ? existing.password : hashedPassword,
          },
        });
        console.log(`🔄 Colaborador atualizado: ${updated.name} (${updated.email}) | Cargo: ${updated.jobTitle} | Dept: ${updated.department}`);
        updatedCount++;
      } else {
        // Criar novo colaborador
        const created = await prisma.user.create({
          data: {
            name: member.name,
            email: cleanEmail,
            role: member.role,
            jobTitle: member.jobTitle,
            department: member.department,
            phone: member.phone,
            bio: member.bio,
            status: "ACTIVE",
            password: hashedPassword,
            organizationId: org.id,
          },
        });
        console.log(`✨ Colaborador criado: ${created.name} (${created.email}) | Cargo: ${created.jobTitle} | Dept: ${created.department}`);
        createdCount++;
      }
    }

    console.log("\n==========================================================");
    console.log(`📊 RESULTADO: ${createdCount} criados | ${updatedCount} consolidados`);
    console.log(`🏢 Empresa: ${org.name} (CNPJ: ${org.cnpj})`);
    console.log(`🔑 Senha inicial padrão: "${defaultPassword}"`);
    console.log("STATUS: ✅ PERFIL E EQUIPE MAÎTRE CONSOLIDADOS COM SUCESSO!");
    console.log("==========================================================");
  } catch (err) {
    console.error("Erro na consolidação da equipe:", err);
  } finally {
    await pool.end();
  }
}

importTeam();
