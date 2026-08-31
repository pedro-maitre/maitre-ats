import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

async function main() {
  console.log("Iniciando migração das colunas do Conecta Operações (Admissão Digital)...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const queries = [
      // Colunas em Document
      `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'APPROVED';`,
      `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;`,
      
      // Colunas em HireConversion
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "token" TEXT;`,
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "admissionStatus" TEXT DEFAULT 'PENDING_DOCUMENTS';`,
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "additionalData" TEXT;`,
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "targetStartDate" TIMESTAMP(3);`,
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;`,
      `ALTER TABLE "HireConversion" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);`,
      
      // Unique index para token
      `CREATE UNIQUE INDEX IF NOT EXISTS "HireConversion_token_key" ON "HireConversion"("token");`,
    ];

    for (const sql of queries) {
      console.log(`Executando: ${sql}`);
      await pool.query(sql);
    }

    console.log("\n✅ Todas as colunas do Conecta Operações foram adicionadas no PostgreSQL!");
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
