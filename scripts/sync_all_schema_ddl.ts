import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

async function main() {
  console.log("🔍 Sincronizando e aplicando DDL de conciliação de schema completo (Ondas 1 a 5)...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const ddlStatements = [
      // 1. PerformanceEvaluation
      `ALTER TABLE "PerformanceEvaluation" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;`,
      `ALTER TABLE "PerformanceEvaluation" ADD COLUMN IF NOT EXISTS "evaluationType" TEXT NOT NULL DEFAULT 'MANAGER';`,
      `ALTER TABLE "PerformanceEvaluation" ADD COLUMN IF NOT EXISTS "evaluatorRole" TEXT;`,
      `ALTER TABLE "PerformanceEvaluation" ALTER COLUMN "candidateId" DROP NOT NULL;`,
      `CREATE INDEX IF NOT EXISTS "PerformanceEvaluation_organizationId_employeeId_idx" ON "PerformanceEvaluation"("organizationId", "employeeId");`,
      `CREATE INDEX IF NOT EXISTS "PerformanceEvaluation_cycleName_evaluationType_idx" ON "PerformanceEvaluation"("cycleName", "evaluationType");`,

      // 2. DevelopmentPlan
      `ALTER TABLE "DevelopmentPlan" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;`,
      `ALTER TABLE "DevelopmentPlan" ADD COLUMN IF NOT EXISTS "goals" TEXT;`,
      `ALTER TABLE "DevelopmentPlan" ALTER COLUMN "candidateId" DROP NOT NULL;`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentPlan_organizationId_employeeId_idx" ON "DevelopmentPlan"("organizationId", "employeeId");`,

      // 3. CultureActionPlan
      `CREATE TABLE IF NOT EXISTS "CultureActionPlan" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "surveyId" TEXT NOT NULL,
        "dimension" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "responsible" TEXT NOT NULL,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PLANNED',
        "progress" INTEGER NOT NULL DEFAULT 0,
        "budget" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CultureActionPlan_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "CultureActionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "CultureActionPlan_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ClimateSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "CultureActionPlan_organizationId_surveyId_idx" ON "CultureActionPlan"("organizationId", "surveyId");`,

      // 4. Course e CourseEnrollment colunas extras
      `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "quizQuestions" TEXT;`,
      `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "minPassingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0;`,
      `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "minAttendancePercent" INTEGER NOT NULL DEFAULT 75;`,
      `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isOnboardingDefault" BOOLEAN NOT NULL DEFAULT false;`,

      `ALTER TABLE "CourseEnrollment" ADD COLUMN IF NOT EXISTS "attendancePercent" INTEGER NOT NULL DEFAULT 100;`,
      `ALTER TABLE "CourseEnrollment" ADD COLUMN IF NOT EXISTS "quizScore" DOUBLE PRECISION;`,
      `ALTER TABLE "CourseEnrollment" ADD COLUMN IF NOT EXISTS "quizCompletedAt" TIMESTAMP(3);`,
      `ALTER TABLE "CourseEnrollment" ADD COLUMN IF NOT EXISTS "isCertified" BOOLEAN NOT NULL DEFAULT false;`,

      // 5. TrainingClass, CourseQuiz e CourseQuestion
      `CREATE TABLE IF NOT EXISTS "TrainingClass" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "courseId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "instructorName" TEXT,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "location" TEXT,
        "maxCapacity" INTEGER NOT NULL DEFAULT 30,
        "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
        "attendanceRecords" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TrainingClass_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "TrainingClass_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "TrainingClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "TrainingClass_organizationId_courseId_idx" ON "TrainingClass"("organizationId", "courseId");`,

      `CREATE TABLE IF NOT EXISTS "CourseQuiz" (
        "id" TEXT NOT NULL,
        "courseId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CourseQuiz_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "CourseQuiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "CourseQuestion" (
        "id" TEXT NOT NULL,
        "quizId" TEXT NOT NULL,
        "statement" TEXT NOT NULL,
        "options" TEXT NOT NULL,
        "correctIndex" INTEGER NOT NULL,
        "explanation" TEXT,
        CONSTRAINT "CourseQuestion_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "CourseQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "CourseQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "CourseQuestion_quizId_idx" ON "CourseQuestion"("quizId");`,

      // 6. Core HR e Operações: EmployeePositionHistory
      `CREATE TABLE IF NOT EXISTS "EmployeePositionHistory" (
        "id" TEXT NOT NULL,
        "employeeId" TEXT NOT NULL,
        "positionId" TEXT,
        "departmentId" TEXT,
        "previousSalary" DOUBLE PRECISION,
        "newSalary" DOUBLE PRECISION NOT NULL,
        "changeReason" TEXT NOT NULL,
        "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmployeePositionHistory_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "EmployeePositionHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "EmployeePositionHistory_employeeId_effectiveDate_idx" ON "EmployeePositionHistory"("employeeId", "effectiveDate");`,

      // 7. Core HR: EmployeeVacation
      `CREATE TABLE IF NOT EXISTS "EmployeeVacation" (
        "id" TEXT NOT NULL,
        "employeeId" TEXT NOT NULL,
        "acquisitionStart" TIMESTAMP(3) NOT NULL,
        "acquisitionEnd" TIMESTAMP(3) NOT NULL,
        "vacationStart" TIMESTAMP(3) NOT NULL,
        "vacationEnd" TIMESTAMP(3) NOT NULL,
        "daysCount" INTEGER NOT NULL DEFAULT 30,
        "soldDays" INTEGER NOT NULL DEFAULT 0,
        "advance13thSalary" BOOLEAN NOT NULL DEFAULT false,
        "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmployeeVacation_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "EmployeeVacation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "EmployeeVacation_employeeId_vacationStart_idx" ON "EmployeeVacation"("employeeId", "vacationStart");`,

      // 8. Core HR: EmployeeLeave
      `CREATE TABLE IF NOT EXISTS "EmployeeLeave" (
        "id" TEXT NOT NULL,
        "employeeId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "cidCode" TEXT,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "documentUrl" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmployeeLeave_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "EmployeeLeave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "EmployeeLeave_employeeId_startDate_idx" ON "EmployeeLeave"("employeeId", "startDate");`,

      // 9. Operações: OffboardingProcess
      `CREATE TABLE IF NOT EXISTS "OffboardingProcess" (
        "id" TEXT NOT NULL,
        "employeeId" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "terminationType" TEXT NOT NULL,
        "noticeType" TEXT NOT NULL DEFAULT 'TRABALHADO',
        "noticeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastWorkingDay" TIMESTAMP(3) NOT NULL,
        "severancePayEstimate" DOUBLE PRECISION,
        "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        "checklist" TEXT,
        "interviewNotes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3),
        CONSTRAINT "OffboardingProcess_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "OffboardingProcess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "OffboardingProcess_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "OffboardingProcess_organizationId_status_idx" ON "OffboardingProcess"("organizationId", "status");`,
      `CREATE INDEX IF NOT EXISTS "OffboardingProcess_employeeId_idx" ON "OffboardingProcess"("employeeId");`,

      // 10. Job campos Onda 4
      `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "isInternalPosting" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "allowExternal" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "minTenureMonths" INTEGER NOT NULL DEFAULT 6;`,
      `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "minPerformanceScore" DOUBLE PRECISION NOT NULL DEFAULT 3.0;`,

      // 11. ProjectDeliverable campos Onda 4
      `ALTER TABLE "ProjectDeliverable" ADD COLUMN IF NOT EXISTS "clientFeedback" TEXT;`,
      `ALTER TABLE "ProjectDeliverable" ADD COLUMN IF NOT EXISTS "approvedByClient" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "ProjectDeliverable" ADD COLUMN IF NOT EXISTS "clientApprovedAt" TIMESTAMP(3);`,
      `ALTER TABLE "ProjectDeliverable" ADD COLUMN IF NOT EXISTS "clientApproverEmail" TEXT;`,

      // 12. Chaves estrangeiras opcionais seguras
      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'PerformanceEvaluation_employeeId_fkey'
        ) THEN
          ALTER TABLE "PerformanceEvaluation" 
          ADD CONSTRAINT "PerformanceEvaluation_employeeId_fkey" 
          FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'DevelopmentPlan_employeeId_fkey'
        ) THEN
          ALTER TABLE "DevelopmentPlan" 
          ADD CONSTRAINT "DevelopmentPlan_employeeId_fkey" 
          FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;`
    ];

    for (const sql of ddlStatements) {
      await pool.query(sql);
    }

    console.log("✅ Todas as definições DDL sincronizadas e validadas com sucesso no banco PostgreSQL!");
  } catch (error) {
    console.error("❌ Erro ao sincronizar DDL:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
