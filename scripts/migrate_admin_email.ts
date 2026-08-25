import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || "").replace(":5432/", ":6543/"),
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateAdminMasterEmail() {
  console.log("=========================================================");
  console.log("🔄 ATUALIZANDO E-MAIL DO ADMIN MASTER PARA @maitrework.com.br");
  console.log("=========================================================\n");

  try {
    const oldEmail = "admin@maitre.com.br";
    const newEmail = "admin@maitrework.com.br";

    // 1. Procura o usuário admin anterior
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: oldEmail },
          { email: newEmail },
          { role: "SUPER_ADMIN" },
        ],
      },
    });

    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Nenhuma organização cadastrada.");

    const defaultPasswordHash = await bcrypt.hash("123456", 10);

    if (existingAdmin) {
      const updated = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: newEmail,
          name: "Admin Master",
          role: "SUPER_ADMIN",
          // mantem a senha se já existe, ou atualiza se for vazia
          password: existingAdmin.password || defaultPasswordHash,
          organizationId: org.id,
        },
      });
      console.log(`✅ [SUCESSO] Usuário Admin atualizado com sucesso!`);
      console.log(`   ➔ ID: ${updated.id}`);
      console.log(`   ➔ Novo E-mail de Login: ${updated.email}`);
      console.log(`   ➔ Papel: ${updated.role}`);
      console.log(`   ➔ Organização: ${org.name} (${org.id})`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: newEmail,
          name: "Admin Master",
          role: "SUPER_ADMIN",
          password: defaultPasswordHash,
          organizationId: org.id,
        },
      });
      console.log(`✅ [SUCESSO] Novo Usuário Admin Master criado!`);
      console.log(`   ➔ ID: ${created.id}`);
      console.log(`   ➔ E-mail de Login: ${created.email}`);
      console.log(`   ➔ Papel: ${created.role}`);
    }

    // 2. Valida se o login funciona com bcrypt
    const testUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (testUser && testUser.password) {
      const isMatch = await bcrypt.compare("123456", testUser.password);
      console.log(`\n🔐 Validação de Senha (123456): ${isMatch ? "VÁLIDA (OK)" : "SENHA PERSONALIZADA MANTIDA"}`);
    }
  } catch (err: any) {
    console.error("❌ Erro ao atualizar admin:", err.message);
  } finally {
    await pool.end();
  }

  console.log("\n=========================================================");
}

updateAdminMasterEmail();
