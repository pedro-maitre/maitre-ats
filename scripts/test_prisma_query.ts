import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Testando busca de organizações via Prisma Client...");

  const clients = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          jobs: true,
          candidates: true,
          users: true,
        },
      },
      jobs: {
        select: {
          id: true,
          title: true,
          status: true,
          department: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  console.log("✅ Consulta de organizações retornou com sucesso!");
  console.log("Total de empresas clientes:", clients.length);
  console.log(
    "Empresas:",
    clients.map((c) => ({
      name: c.name,
      slug: c.slug,
      primaryColor: c.primaryColor,
      jobsCount: c._count.jobs,
      candidatesCount: c._count.candidates,
    }))
  );
}

main()
  .catch((err) => {
    console.error("❌ Erro no teste do Prisma:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
