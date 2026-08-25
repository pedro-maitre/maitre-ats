import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data (optional, but good for rerunning)
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Maître Consultoria",
      slug: "maitre",
    },
  });

  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Create Users
  await prisma.user.create({
    data: {
      email: "admin@maitrework.com.br",
      name: "Admin",
      role: "SUPER_ADMIN",
      password: hashedPassword,
      organizationId: org.id,
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: "rh@maitre.com.br",
      name: "Recruiter Patricia",
      role: "RECRUITER",
      password: hashedPassword,
      organizationId: org.id,
    },
  });

  // Create Job
  const job = await prisma.job.create({
    data: {
      title: "Desenvolvedor Frontend Sênior",
      description: "Vaga para desenvolvedor frontend com experiência em Next.js e React.",
      department: "Tecnologia",
      location: "Remoto",
      status: "OPEN",
      organizationId: org.id,
      recruiterId: recruiter.id,
    },
  });

  // Create Stages
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

  // Fetch created stages to use their IDs
  const createdStages = await prisma.stage.findMany({ where: { jobId: job.id } });
  const appliedStage = createdStages.find((s) => s.name === "Aplicado");
  const screeningStage = createdStages.find((s) => s.name === "Triagem");

  // Create Candidates
  const c1 = await prisma.candidate.create({
    data: {
      firstName: "João",
      lastName: "Silva",
      email: "joao@example.com",
      phone: "11999999999",
      source: "LinkedIn",
      tags: JSON.stringify(["React", "Next.js"]),
      organizationId: org.id,
    },
  });

  const c2 = await prisma.candidate.create({
    data: {
      firstName: "Maria",
      lastName: "Souza",
      email: "maria@example.com",
      phone: "11888888888",
      source: "Referral",
      tags: JSON.stringify(["Vue", "Node.js"]),
      organizationId: org.id,
    },
  });

  // Create Applications
  if (appliedStage && screeningStage) {
    await prisma.application.create({
      data: {
        candidateId: c1.id,
        jobId: job.id,
        stageId: appliedStage.id,
        matchScore: 85.5,
      },
    });

    await prisma.application.create({
      data: {
        candidateId: c2.id,
        jobId: job.id,
        stageId: screeningStage.id,
        matchScore: 92.0,
      },
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
