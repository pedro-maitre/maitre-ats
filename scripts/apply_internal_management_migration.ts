import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🛠️ Executando migração de banco de dados para a Central de Gestão Interna...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const migrationFile = path.join(
      process.cwd(),
      "prisma",
      "migrations",
      "20260909_internal_management",
      "migration.sql"
    );

    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Arquivo de migração não encontrado: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, "utf-8");

    console.log(`📄 Aplicando script SQL: ${migrationFile}...`);
    await pool.query(sql);

    console.log("✅ Migração da Central de Gestão Interna executada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migração SQL:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
