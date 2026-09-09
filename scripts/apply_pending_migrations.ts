import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🛠️ Executando migração de banco de dados para a Onda 4 & 5...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const migrationFile = path.join(
      process.cwd(),
      "prisma",
      "migrations",
      "20260909_strategy_and_consulting",
      "migration.sql"
    );

    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Arquivo de migração não encontrado: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, "utf-8");

    console.log(`📄 Aplicando script SQL: ${migrationFile}...`);
    await pool.query(sql);

    console.log("✅ Migração SQL executada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migração SQL:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
