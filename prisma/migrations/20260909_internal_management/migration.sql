-- =========================================================================
-- MIGRAÇÃO VERSIONADA: Central de Gestão Interna da Maître Consultoria
-- Data: Setembro de 2026
-- =========================================================================

-- 1. Extensões em ConsultingProject
ALTER TABLE "ConsultingProject"
  ADD COLUMN IF NOT EXISTS "projectType" TEXT NOT NULL DEFAULT 'PROJECT',
  ADD COLUMN IF NOT EXISTS "clientOrganizationId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConsultingProject_clientOrganizationId_fkey'
  ) THEN
    ALTER TABLE "ConsultingProject"
      ADD CONSTRAINT "ConsultingProject_clientOrganizationId_fkey"
      FOREIGN KEY ("clientOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ConsultingProject_clientOrganizationId_idx" ON "ConsultingProject"("clientOrganizationId");

-- 2. Configuração da Central de Gestão Interna
CREATE TABLE IF NOT EXISTS "InternalConsultingConfig" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "adminMasterUserId" TEXT NOT NULL,
  "defaultTimezone" TEXT NOT NULL DEFAULT 'America/Fortaleza',
  "weeklyMeetingDay" INTEGER NOT NULL DEFAULT 1,
  "weeklyMeetingTime" TEXT NOT NULL DEFAULT '15:30',
  "weeklyMeetingDuration" INTEGER NOT NULL DEFAULT 60,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalConsultingConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InternalConsultingConfig_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "InternalConsultingConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Reuniões de Alinhamento Semanal
CREATE TABLE IF NOT EXISTS "WeeklyMeeting" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "facilitatorId" TEXT NOT NULL,
  "participantsJson" TEXT,
  "agendaTopicsJson" TEXT,
  "notesMarkdown" TEXT,
  "decisionsJson" TEXT,
  "concludedSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WeeklyMeeting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyMeeting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WeeklyMeeting_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WeeklyMeeting_organizationId_scheduledAt_idx" ON "WeeklyMeeting"("organizationId", "scheduledAt");

-- 4. Tarefas Internas
CREATE TABLE IF NOT EXISTS "InternalTask" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT,
  "clientOrganizationId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'TODO',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "dueDate" TIMESTAMP(3),
  "startDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "creatorId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "reviewerId" TEXT,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
  "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  "blockReason" TEXT,
  "blockedAt" TIMESTAMP(3),
  "originType" TEXT NOT NULL DEFAULT 'DIRECT',
  "originMeetingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InternalTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InternalTask_clientOrganizationId_fkey" FOREIGN KEY ("clientOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InternalTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ConsultingProject"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InternalTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InternalTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InternalTask_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InternalTask_originMeetingId_fkey" FOREIGN KEY ("originMeetingId") REFERENCES "WeeklyMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InternalTask_organizationId_status_idx" ON "InternalTask"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "InternalTask_assigneeId_status_idx" ON "InternalTask"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "InternalTask_projectId_idx" ON "InternalTask"("projectId");
CREATE INDEX IF NOT EXISTS "InternalTask_dueDate_idx" ON "InternalTask"("dueDate");
CREATE INDEX IF NOT EXISTS "InternalTask_clientOrganizationId_idx" ON "InternalTask"("clientOrganizationId");

-- 5. Membros da Tarefa
CREATE TABLE IF NOT EXISTS "TaskMember" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'COLLABORATOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskMember_taskId_userId_key" UNIQUE ("taskId", "userId"),
  CONSTRAINT "TaskMember_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Subtarefas
CREATE TABLE IF NOT EXISTS "InternalSubtask" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "assigneeId" TEXT,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalSubtask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InternalSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InternalSubtask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InternalSubtask_taskId_idx" ON "InternalSubtask"("taskId");

-- 7. Checklist da Tarefa
CREATE TABLE IF NOT EXISTS "TaskChecklistItem" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TaskChecklistItem_taskId_idx" ON "TaskChecklistItem"("taskId");

-- 8. Comentários de Tarefas
CREATE TABLE IF NOT EXISTS "TaskComment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- 9. Anexos de Tarefas
CREATE TABLE IF NOT EXISTS "TaskAttachment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- 10. Decisões de Revisão / Aprovação
CREATE TABLE IF NOT EXISTS "TaskReviewDecision" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "comments" TEXT,
  "deliverableVersion" TEXT DEFAULT '1.0',
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskReviewDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskReviewDecision_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskReviewDecision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TaskReviewDecision_taskId_idx" ON "TaskReviewDecision"("taskId");

-- 11. Notificações Internas In-App
CREATE TABLE IF NOT EXISTS "InternalNotification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "linkUrl" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InternalNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InternalNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InternalNotification_userId_isRead_idx" ON "InternalNotification"("userId", "isRead");
