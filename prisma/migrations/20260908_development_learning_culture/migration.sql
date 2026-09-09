-- AlterTable PerformanceEvaluation
ALTER TABLE "PerformanceEvaluation" 
  ALTER COLUMN "candidateId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "evaluationType" TEXT NOT NULL DEFAULT 'MANAGER',
  ADD COLUMN IF NOT EXISTS "evaluatorRole" TEXT;

-- AlterTable DevelopmentPlan
ALTER TABLE "DevelopmentPlan" 
  ALTER COLUMN "candidateId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "goals" TEXT;

-- AlterTable Course
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "quizQuestions" TEXT,
  ADD COLUMN IF NOT EXISTS "minPassingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
  ADD COLUMN IF NOT EXISTS "minAttendancePercent" INTEGER NOT NULL DEFAULT 75;

-- AlterTable CourseEnrollment
ALTER TABLE "CourseEnrollment"
  ADD COLUMN IF NOT EXISTS "attendancePercent" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "quizScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "quizCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isCertified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable TrainingClass
CREATE TABLE IF NOT EXISTS "TrainingClass" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "instructorName" TEXT,
  "locationOrUrl" TEXT,
  "attendanceRecords" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrainingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable CultureActionPlan
CREATE TABLE IF NOT EXISTS "CultureActionPlan" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dimension" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "ownerEmail" TEXT,
  "targetDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "description" TEXT,
  "kpiSuccessIndicator" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CultureActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "PerformanceEvaluation_organizationId_employeeId_idx" ON "PerformanceEvaluation"("organizationId", "employeeId");
CREATE INDEX IF NOT EXISTS "PerformanceEvaluation_cycleName_evaluationType_idx" ON "PerformanceEvaluation"("cycleName", "evaluationType");

CREATE INDEX IF NOT EXISTS "DevelopmentPlan_organizationId_employeeId_idx" ON "DevelopmentPlan"("organizationId", "employeeId");

CREATE INDEX IF NOT EXISTS "TrainingClass_organizationId_courseId_idx" ON "TrainingClass"("organizationId", "courseId");
CREATE INDEX IF NOT EXISTS "TrainingClass_startDate_idx" ON "TrainingClass"("startDate");

CREATE INDEX IF NOT EXISTS "CultureActionPlan_organizationId_surveyId_idx" ON "CultureActionPlan"("organizationId", "surveyId");
CREATE INDEX IF NOT EXISTS "CultureActionPlan_organizationId_status_idx" ON "CultureActionPlan"("organizationId", "status");

-- AddForeignKeys
DO $$ BEGIN
  ALTER TABLE "PerformanceEvaluation" ADD CONSTRAINT "PerformanceEvaluation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DevelopmentPlan" ADD CONSTRAINT "DevelopmentPlan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "TrainingClass" ADD CONSTRAINT "TrainingClass_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "TrainingClass" ADD CONSTRAINT "TrainingClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CultureActionPlan" ADD CONSTRAINT "CultureActionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CultureActionPlan" ADD CONSTRAINT "CultureActionPlan_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ClimateSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
