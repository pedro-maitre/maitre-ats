import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

async function main() {
  console.log("Iniciando migração das colunas White-Label na tabela Organization...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const queries = [
      `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;`,
      `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#D4AF37';`,
      `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "bannerHeadline" TEXT;`,
      `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "bannerSubheadline" TEXT;`,
      `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "aboutUs" TEXT;`,
      `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;`,
    ];

    for (const sql of queries) {
      console.log(`Executando: ${sql}`);
      await pool.query(sql);
    }

    console.log("\n✅ Todas as colunas White-Label foram adicionadas com sucesso no PostgreSQL remoto!");

    // Testar consulta com Prisma
    const res = await pool.query(`SELECT id, name, slug, "primaryColor", "logoUrl" FROM "Organization" LIMIT 5;`);
    console.log("Linhas encontradas na Organization:", res.rows);
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
