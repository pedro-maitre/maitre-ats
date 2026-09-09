import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("⚙️ Inicializando configuração da Central de Gestão Interna da Maître...");

  const maitreOrg = await prisma.organization.findFirst({
    where: {
      OR: [{ slug: "maitre" }, { isMaster: true }],
    },
  });

  if (!maitreOrg) {
    throw new Error("Organização Maître Consultoria não encontrada!");
  }

  const adrianaUser = await prisma.user.findFirst({
    where: { email: { equals: "adriana@maitrework.com.br", mode: "insensitive" } },
  });

  if (!adrianaUser) {
    throw new Error("Usuária Adriana Pinheiro não encontrada no banco!");
  }

  console.log(`✓ Organização Maître identificada: ${maitreOrg.name} (${maitreOrg.id})`);
  console.log(`✓ Adriana identificada como Admin Master: ${adrianaUser.name} (${adrianaUser.id})`);

  const config = await prisma.internalConsultingConfig.upsert({
    where: { organizationId: maitreOrg.id },
    create: {
      organizationId: maitreOrg.id,
      adminMasterUserId: adrianaUser.id,
      defaultTimezone: "America/Fortaleza",
      weeklyMeetingDay: 1, // Segunda-feira
      weeklyMeetingTime: "15:30",
      weeklyMeetingDuration: 60,
    },
    update: {
      adminMasterUserId: adrianaUser.id,
      defaultTimezone: "America/Fortaleza",
      weeklyMeetingDay: 1,
      weeklyMeetingTime: "15:30",
    },
  });

  console.log("✅ Configuração da Central sincronizada com sucesso:", config);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Erro ao configurar Central:", err);
  process.exit(1);
});
