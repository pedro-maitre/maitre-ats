-- AlterTable: Replace global Candidate email uniqueness with multitenant (organizationId, email) compound uniqueness

-- DropIndex
DROP INDEX IF EXISTS "Candidate_email_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Candidate_organizationId_email_key" ON "Candidate"("organizationId", "email");
