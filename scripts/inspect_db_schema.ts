import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const resTables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log("=== TABELAS NO BANCO POSTGRESQL ===");
    const tableNames = resTables.rows.map(r => r.table_name);
    console.log(tableNames.join(", "));

    console.log("\n=== COLUNAS DE TABELAS CRÍTICAS ===");
    for (const t of ["Course", "CourseEnrollment", "PerformanceEvaluation", "DevelopmentPlan", "ClimateSurvey", "CultureRecognition", "EmployeeLeave", "OffboardingProcess"]) {
      if (tableNames.includes(t)) {
        const resCols = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
          [t]
        );
        console.log(`${t}: ${resCols.rows.map(r => r.column_name).join(", ")}`);
      } else {
        console.log(`⚠️ TABELA NÃO ENCONTRADA: ${t}`);
      }
    }
  } catch (err) {
    console.error("Erro ao inspecionar:", err);
  } finally {
    await pool.end();
  }
}

check();
