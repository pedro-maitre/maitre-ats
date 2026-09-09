-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#D4AF37',
    "bannerHeadline" TEXT,
    "bannerSubheadline" TEXT,
    "aboutUs" TEXT,
    "websiteUrl" TEXT,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "cnpj" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "foundedYear" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "addressZipCode" TEXT,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "addressNeighborhood" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "cultureValues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "jobTitle" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "linkedinUrl" TEXT,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RECRUITER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "employmentType" TEXT,
    "seniority" TEXT,
    "requiredSkills" TEXT,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "salaryFitTolerancePercent" DOUBLE PRECISION DEFAULT 15.0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "organizationId" TEXT NOT NULL,
    "hiringManagerId" TEXT,
    "recruiterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resumeUrl" TEXT,
    "documentId" TEXT,
    "linkedinUrl" TEXT,
    "source" TEXT,
    "profileSummary" TEXT,
    "tags" TEXT,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "jobId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "fitCategory" TEXT,
    "salaryExpectation" DOUBLE PRECISION,
    "enteredStageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "algorithmVersion" TEXT DEFAULT 'v3.0-fit3d',
    "aiExplanation" TEXT,
    "aiSnapshot" TEXT,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStageTransition" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStageTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "candidateId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'SUPABASE_PRIVATE',
    "bucket" TEXT NOT NULL DEFAULT 'resumes-private',
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'CURRICULO',
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "retentionUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "beforeData" TEXT,
    "afterData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "format" TEXT NOT NULL DEFAULT 'ONLINE',
    "meetingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "technicalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cultureScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallRecommendation" TEXT NOT NULL DEFAULT 'HIRE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "salaryOffered" DOUBLE PRECISION NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'CLT',
    "startDate" TIMESTAMP(3),
    "benefits" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireConversion" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "convertedBy" TEXT NOT NULL,
    "employeeCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONVERTED',
    "token" TEXT,
    "admissionStatus" TEXT NOT NULL DEFAULT 'PENDING_DOCUMENTS',
    "additionalData" TEXT,
    "targetStartDate" TIMESTAMP(3),
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HireConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationOutbox" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "structuredData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateConsent" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,

    CONSTRAINT "CandidateConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 730,
    "actionOnExpiry" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "justification" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceEvaluation" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentPlan" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevelopmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClimateSurvey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "questions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClimateSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "department" TEXT,
    "npsScore" INTEGER NOT NULL,
    "dimensionScores" TEXT,
    "feedback" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CultureRecognition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverDepartment" TEXT,
    "valuePillar" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CultureRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "coverUrl" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "modules" TEXT NOT NULL,
    "isOnboardingDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT,
    "candidateId" TEXT,
    "employeeName" TEXT NOT NULL,
    "employeeEmail" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "certificateCode" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT,
    "title" TEXT NOT NULL,
    "cboCode" TEXT,
    "level" TEXT,
    "baseSalary" DOUBLE PRECISION,
    "description" TEXT,
    "requirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "candidateId" TEXT,
    "registrationNumber" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "employmentType" TEXT NOT NULL DEFAULT 'CLT',
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminationDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "departmentId" TEXT,
    "positionId" TEXT,
    "managerId" TEXT,
    "workSchedule" TEXT DEFAULT '08:00 - 18:00 (Seg a Sex)',
    "address" TEXT,
    "bankDetails" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultingProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'HUNTING_EXECUTIVO',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "consultantName" TEXT,
    "consultantEmail" TEXT,
    "budget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultingProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDeliverable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "criticalityLevel" TEXT NOT NULL DEFAULT 'HIGH',
    "currentHolderName" TEXT,
    "riskOfLoss" TEXT NOT NULL DEFAULT 'MEDIUM',
    "impactOfLoss" TEXT NOT NULL DEFAULT 'HIGH',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionCandidate" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeEmail" TEXT,
    "currentRole" TEXT,
    "readiness" TEXT NOT NULL DEFAULT 'READY_1_2_YEARS',
    "performanceRating" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "potentialRating" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "developmentActions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Job_organizationId_status_idx" ON "Job"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_userId_key" ON "Candidate"("userId");

-- CreateIndex
CREATE INDEX "Candidate_organizationId_createdAt_idx" ON "Candidate"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Application_jobId_stageId_idx" ON "Application"("jobId", "stageId");

-- CreateIndex
CREATE INDEX "ApplicationStageTransition_applicationId_changedAt_idx" ON "ApplicationStageTransition"("applicationId", "changedAt");

-- CreateIndex
CREATE INDEX "Document_organizationId_candidateId_idx" ON "Document"("organizationId", "candidateId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "Interview_applicationId_scheduledAt_idx" ON "Interview"("applicationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Scorecard_interviewId_evaluatorId_idx" ON "Scorecard"("interviewId", "evaluatorId");

-- CreateIndex
CREATE INDEX "Offer_applicationId_idx" ON "Offer"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "HireConversion_applicationId_key" ON "HireConversion"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "HireConversion_token_key" ON "HireConversion"("token");

-- CreateIndex
CREATE INDEX "IntegrationOutbox_organizationId_status_occurredAt_idx" ON "IntegrationOutbox"("organizationId", "status", "occurredAt");

-- CreateIndex
CREATE INDEX "CandidateConsent_candidateId_purpose_idx" ON "CandidateConsent"("candidateId", "purpose");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_email_requestType_idx" ON "DataSubjectRequest"("email", "requestType");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PerformanceEvaluation_organizationId_candidateId_idx" ON "PerformanceEvaluation"("organizationId", "candidateId");

-- CreateIndex
CREATE INDEX "DevelopmentPlan_organizationId_candidateId_idx" ON "DevelopmentPlan"("organizationId", "candidateId");

-- CreateIndex
CREATE INDEX "ClimateSurvey_organizationId_status_idx" ON "ClimateSurvey"("organizationId", "status");

-- CreateIndex
CREATE INDEX "SurveyResponse_organizationId_surveyId_idx" ON "SurveyResponse"("organizationId", "surveyId");

-- CreateIndex
CREATE INDEX "CultureRecognition_organizationId_createdAt_idx" ON "CultureRecognition"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Course_organizationId_category_idx" ON "Course"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_certificateCode_key" ON "CourseEnrollment"("certificateCode");

-- CreateIndex
CREATE INDEX "CourseEnrollment_organizationId_courseId_idx" ON "CourseEnrollment"("organizationId", "courseId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_employeeEmail_idx" ON "CourseEnrollment"("employeeEmail");

-- CreateIndex
CREATE INDEX "Department_organizationId_name_idx" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Position_organizationId_title_idx" ON "Position"("organizationId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_organizationId_status_idx" ON "Employee"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "ConsultingProject_organizationId_status_idx" ON "ConsultingProject"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ConsultingProject_category_idx" ON "ConsultingProject"("category");

-- CreateIndex
CREATE INDEX "ProjectDeliverable_projectId_status_idx" ON "ProjectDeliverable"("projectId", "status");

-- CreateIndex
CREATE INDEX "SuccessionPlan_organizationId_criticalityLevel_idx" ON "SuccessionPlan"("organizationId", "criticalityLevel");

-- CreateIndex
CREATE INDEX "SuccessionCandidate_planId_readiness_idx" ON "SuccessionCandidate"("planId", "readiness");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageTransition" ADD CONSTRAINT "ApplicationStageTransition_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageTransition" ADD CONSTRAINT "ApplicationStageTransition_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageTransition" ADD CONSTRAINT "ApplicationStageTransition_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireConversion" ADD CONSTRAINT "HireConversion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationOutbox" ADD CONSTRAINT "IntegrationOutbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateConsent" ADD CONSTRAINT "CandidateConsent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionPolicy" ADD CONSTRAINT "RetentionPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceEvaluation" ADD CONSTRAINT "PerformanceEvaluation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceEvaluation" ADD CONSTRAINT "PerformanceEvaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevelopmentPlan" ADD CONSTRAINT "DevelopmentPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevelopmentPlan" ADD CONSTRAINT "DevelopmentPlan_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimateSurvey" ADD CONSTRAINT "ClimateSurvey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ClimateSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CultureRecognition" ADD CONSTRAINT "CultureRecognition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultingProject" ADD CONSTRAINT "ConsultingProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ConsultingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlan" ADD CONSTRAINT "SuccessionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidate" ADD CONSTRAINT "SuccessionCandidate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SuccessionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
