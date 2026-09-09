-- CreateTable EmployeePositionHistory
CREATE TABLE IF NOT EXISTS "EmployeePositionHistory" (
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

    CONSTRAINT "EmployeePositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmployeeVacation
CREATE TABLE IF NOT EXISTS "EmployeeVacation" (
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

    CONSTRAINT "EmployeeVacation_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmployeeLeave
CREATE TABLE IF NOT EXISTS "EmployeeLeave" (
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

    CONSTRAINT "EmployeeLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable OffboardingProcess
CREATE TABLE IF NOT EXISTS "OffboardingProcess" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OffboardingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "EmployeePositionHistory_employeeId_effectiveDate_idx" ON "EmployeePositionHistory"("employeeId", "effectiveDate");
CREATE INDEX IF NOT EXISTS "EmployeeVacation_employeeId_vacationStart_idx" ON "EmployeeVacation"("employeeId", "vacationStart");
CREATE INDEX IF NOT EXISTS "EmployeeLeave_employeeId_startDate_idx" ON "EmployeeLeave"("employeeId", "startDate");
CREATE INDEX IF NOT EXISTS "OffboardingProcess_organizationId_status_idx" ON "OffboardingProcess"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "OffboardingProcess_employeeId_idx" ON "OffboardingProcess"("employeeId");

-- AddForeignKeys
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeePositionHistory" ADD CONSTRAINT "EmployeePositionHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeVacation" ADD CONSTRAINT "EmployeeVacation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeLeave" ADD CONSTRAINT "EmployeeLeave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OffboardingProcess" ADD CONSTRAINT "OffboardingProcess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OffboardingProcess" ADD CONSTRAINT "OffboardingProcess_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
