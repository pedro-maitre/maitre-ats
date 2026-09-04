import { prisma } from "../src/lib/prisma";

async function syncRoles() {
  console.log("Iniciando alinhamento estrito dos papéis de usuário no banco de dados...");

  // 1. Adriana Pinheiro -> ADMIN (Diretoria & Operações)
  const adriana = await prisma.user.updateMany({
    where: { email: { equals: "adriana@maitrework.com.br", mode: "insensitive" } },
    data: { role: "ADMIN" },
  });
  console.log(`✓ Adriana alinhada para papel 'ADMIN' (${adriana.count} registro atualizado).`);

  // 2. Admin -> SUPER_ADMIN
  const admin = await prisma.user.updateMany({
    where: { email: { equals: "admin@maitrework.com.br", mode: "insensitive" } },
    data: { role: "SUPER_ADMIN" },
  });
  console.log(`✓ Admin confirmado como 'SUPER_ADMIN' (${admin.count} registro).`);

  // 3. Kheviany -> HIRING_MANAGER
  const kheviany = await prisma.user.updateMany({
    where: { email: { equals: "kheviany@maitrework.com.br", mode: "insensitive" } },
    data: { role: "HIRING_MANAGER" },
  });
  console.log(`✓ Kheviany confirmada como 'HIRING_MANAGER' (${kheviany.count} registro).`);

  // 4. Recrutadores -> RECRUITER
  const recruiters = ["pedro@maitrework.com.br", "erika@maitrework.com.br", "lauriana@maitrework.com.br", "emidio@maitrework.com.br"];
  for (const email of recruiters) {
    await prisma.user.updateMany({
      where: { email: { equals: email, mode: "insensitive" } },
      data: { role: "RECRUITER" },
    });
  }
  console.log(`✓ Recrutadores alinhados como 'RECRUITER'.`);

  const currentUsers = await prisma.user.findMany({
    select: { name: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log("\nEstado final dos usuários no banco:");
  console.table(currentUsers);

  await prisma.$disconnect();
}

syncRoles().catch(console.error);
