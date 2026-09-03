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

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Maître Consultoria",
        slug: "maitre",
      },
    });
    console.log("✓ Organização Maître Consultoria criada.");
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 2. Usuários essenciais
  const usersToEnsure = [
    {
      email: "admin@maitrework.com.br",
      name: "Admin",
      role: "SUPER_ADMIN",
    },
    {
      email: "adriana@maitrework.com.br",
      name: "Adriana",
      role: "ADMIN",
    },
    {
      email: "pedro@maitrework.com.br",
      name: "Pedro",
      role: "RECRUITER",
    },
    {
      email: "erika@maitrework.com.br",
      name: "Erika",
      role: "RECRUITER",
    },
    {
      email: "lauriana@maitrework.com.br",
      name: "Lauriana",
      role: "RECRUITER",
    },
    {
      email: "kheviany@maitrework.com.br",
      name: "Kheviany",
      role: "RECRUITER",
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
          password: hashedPassword,
          organizationId: org.id,
        },
      });
      console.log(`✓ Usuário ${u.name} (${u.email}) criado com sucesso.`);
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
