-- AlterTable Job
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "isInternalPosting" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable ProjectDeliverable
ALTER TABLE "ProjectDeliverable"
  ADD COLUMN IF NOT EXISTS "clientFeedback" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedByClient" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "clientApprovedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "clientApproverEmail" TEXT;

-- CreateTable InternalApplication
CREATE TABLE IF NOT EXISTS "InternalApplication" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "coverLetter" TEXT,
  "managerApprovalStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "managerFeedback" TEXT,
  "eligibilitySnapshot" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InternalApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable CareerTrack
CREATE TABLE IF NOT EXISTS "CareerTrack" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "trackType" TEXT NOT NULL DEFAULT 'Y_DUAL',
  "description" TEXT,
  "levels" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CareerTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable ConsultingTimesheet
CREATE TABLE IF NOT EXISTS "ConsultingTimesheet" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "consultantName" TEXT NOT NULL,
  "consultantEmail" TEXT,
  "workDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hours" DOUBLE PRECISION NOT NULL,
  "activityDescription" TEXT NOT NULL,
  "billable" BOOLEAN NOT NULL DEFAULT true,
  "hourlyRate" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "approverName" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConsultingTimesheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "InternalApplication_organizationId_jobId_idx" ON "InternalApplication"("organizationId", "jobId");
CREATE INDEX IF NOT EXISTS "InternalApplication_employeeId_idx" ON "InternalApplication"("employeeId");
CREATE INDEX IF NOT EXISTS "InternalApplication_organizationId_status_idx" ON "InternalApplication"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CareerTrack_organizationId_idx" ON "CareerTrack"("organizationId");

CREATE INDEX IF NOT EXISTS "ConsultingTimesheet_projectId_workDate_idx" ON "ConsultingTimesheet"("projectId", "workDate");
CREATE INDEX IF NOT EXISTS "ConsultingTimesheet_organizationId_idx" ON "ConsultingTimesheet"("organizationId");
CREATE INDEX IF NOT EXISTS "ConsultingTimesheet_organizationId_status_idx" ON "ConsultingTimesheet"("organizationId", "status");

-- AddForeignKeys
ALTER TABLE "InternalApplication"
  ADD CONSTRAINT "InternalApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalApplication"
  ADD CONSTRAINT "InternalApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalApplication"
  ADD CONSTRAINT "InternalApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CareerTrack"
  ADD CONSTRAINT "CareerTrack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsultingTimesheet"
  ADD CONSTRAINT "ConsultingTimesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ConsultingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsultingTimesheet"
  ADD CONSTRAINT "ConsultingTimesheet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
