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

// Lista enviada pelo usuário
const teamUsers = [
  {
    name: "Erika",
    email: "erika@maitrework.com.br",
    role: "RECRUITER",
    company: "Maître Consultoria",
  },
  {
    name: "Lauriana",
    email: "lauriana@maitrework.com.br",
    role: "RECRUITER",
    company: "Maître Consultoria",
  },
  {
    name: "Kheviany",
    email: "kheviany@maitrework.com.br",
    role: "RECRUITER",
    company: "Maître Consultoria",
  },
  {
    name: "Adriana",
    email: "adriana@maitrework.com.br",
    role: "ADMIN",
    company: "Maître Consultoria",
  },
  {
    name: "Pedro",
    email: "pedro@maitrework.com.br",
    role: "RECRUITER",
    company: "Maître Consultoria",
  },
];

async function importTeam() {
  console.log("==========================================================");
  console.log("👥 IMPORTAÇÃO E CONSOLIDAÇÃO DA EQUIPE MAÎTRE NO BANCO");
  console.log("==========================================================\n");

  try {
    // 1. Localizar ou criar a organização Maître Consultoria
    let org = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: "maitre" },
          { name: { contains: "Maître", mode: "insensitive" } },
        ],
      },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Maître Consultoria",
          slug: "maitre",
          primaryColor: "#D4AF37",
        },
      });
      console.log(`✓ Organização criada: ${org.name} (${org.id})`);
    } else {
      console.log(`✓ Organização localizada: ${org.name} (${org.id})`);
    }

    // Senha padrão inicial: 123456 (hash Bcrypt de 10 rounds)
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
        // Atualizar papel e organização se necessário
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: member.name,
            role: member.role,
            organizationId: org.id,
            // Apenas atualiza a senha se estiver sem senha
            password: existing.password ? existing.password : hashedPassword,
          },
        });
        console.log(`🔄 Atualizado: ${updated.name} (${updated.email}) | Papel: ${updated.role}`);
        updatedCount++;
      } else {
        // Criar novo usuário
        const created = await prisma.user.create({
          data: {
            name: member.name,
            email: cleanEmail,
            role: member.role,
            password: hashedPassword,
            organizationId: org.id,
          },
        });
        console.log(`✨ Criado: ${created.name} (${created.email}) | Papel: ${created.role}`);
        createdCount++;
      }
    }

    console.log("\n==========================================================");
    console.log(`📊 RESULTADO: ${createdCount} criados | ${updatedCount} atualizados`);
    console.log(`🔑 Senha inicial padrão configurada: "${defaultPassword}"`);
    console.log("STATUS: ✅ EQUIPE TOTALMENTE CONSOLIDADA NO SUPABASE");
    console.log("==========================================================");
  } catch (err) {
    console.error("Erro na importação da equipe:", err);
  } finally {
    await pool.end();
  }
}

importTeam();
