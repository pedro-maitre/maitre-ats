import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

async function main() {
  console.log("Iniciando criação das tabelas do Conecta Desenvolvimento (Matriz 9-Box e PDI)...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const queries = [
      // 1. Tabela PerformanceEvaluation
      `CREATE TABLE IF NOT EXISTS "PerformanceEvaluation" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "candidateId" TEXT NOT NULL,
        "evaluatorId" TEXT,
        "cycleName" TEXT NOT NULL DEFAULT 'Ciclo Anual 2026',
        "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
        "potentialScore" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
        "boxPosition" TEXT NOT NULL DEFAULT 'KEY_PROFESSIONAL',
        "competencies" TEXT,
        "strengths" TEXT,
        "improvements" TEXT,
        "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PerformanceEvaluation_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PerformanceEvaluation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "PerformanceEvaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,

      `CREATE INDEX IF NOT EXISTS "PerformanceEvaluation_organizationId_candidateId_idx" ON "PerformanceEvaluation"("organizationId", "candidateId");`,

      // 2. Tabela DevelopmentPlan
      `CREATE TABLE IF NOT EXISTS "DevelopmentPlan" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "candidateId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        "category" TEXT NOT NULL DEFAULT 'TECH_SKILLS',
        "targetDate" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "actionItems" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DevelopmentPlan_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "DevelopmentPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "DevelopmentPlan_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,

      `CREATE INDEX IF NOT EXISTS "DevelopmentPlan_organizationId_candidateId_idx" ON "DevelopmentPlan"("organizationId", "candidateId");`,
    ];

    for (const sql of queries) {
      console.log(`Executando SQL...`);
      await pool.query(sql);
    }

    console.log("\n✅ Tabelas de Desenvolvimento & 9-Box criadas com sucesso no PostgreSQL!");
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
