# MISSION & CONTEXT
You are an expert full-stack engineer and AI architect. Your task is to design, model, and implement an AI-Native Applicant Tracking System (ATS) tailored for high-volume and hunting-based recruitment workflows.

---

## 1. TECH STACK & ARCHITECTURE

- **Frontend:** Next.js (App Router, TypeScript, React 19), TailwindCSS, shadcn/ui, Lucide Icons, @hello-pangea/dnd (for Kanban).
- **Backend:** Node.js (NestJS or Fastify/Express modular) or Python (FastAPI). Clean Architecture with service/repository pattern.
- **Database & ORM:** PostgreSQL + pgvector (for CV semantic search and match), Prisma or Drizzle ORM.
- **Queue & Async Workflows:** Redis + BullMQ (to handle webhook ingestion, AI background processing, WhatsApp message dispatches, and SLA clocks).
- **AI/LLM Layer:** LLM Orchestration with structured outputs (JSON Schema) for CV scoring, semantic parsing, and rubrics evaluation.
- **Messaging Integration:** WhatsApp Cloud API / Webhook-ready messaging adapter.

---

## 2. CORE DOMAIN MODULES & SPECIFICATIONS

### MODULE A: Pipeline Management (Visual Kanban & Smart Search)
1. **Interactive Kanban Board:**
   - Dynamic stage columns per job: `Listados`, `Abordados`, `Talentos Inscritos`, `Fit Cultural`, `Fit Técnico`, `Contratado`, `Reprovado`.
   - Cards display: Candidate initials avatar, Full Name, direct link to profile/CV, days/hours in stage, Origin Tag (`Hunting`, `LinkedIn`, `Indicação`, `GitHub`), Skill badges (e.g., `React`, `Node.js`, `PostgreSQL`), Priority flag (`Priorizado`, `Normal`, `Dúvida`), and AI Fit status.
   - Drag-and-drop mechanics triggering backend stage change events.
2. **Smart Search Engine:**
   - Text input supporting Boolean queries (`AND`, `OR`, `NOT`) across salary ceiling, skills, stage, last company, and location.
   - Semantic Vector Search (`pgvector`) to find matches against candidate CV embeddings based on natural language prompts.

### MODULE B: Triagem Inteligente (AI Scoring & Decision Engine)
1. **3-Dimensional Evaluation Logic:**
   - **Salary Fit:** Binary/tolerance check comparing candidate expectation vs. Job's `min_salary`/`max_salary`.
   - **CV Match:** Embedding cosine similarity + LLM extraction rating match score (0-100%).
   - **Custom Form / Knockout Rules:** Immediate hard-disqualification if candidate fails mandatory criteria.
2. **Fit Categorization View:**
   - Automated grouping into tabs: `Alto Fit`, `Médio Fit`, `Baixo Fit`.
   - Dedicated table list view displaying candidate, expected salary comparison, match score progress bar, and knockout status (`Passou` / `Reprovado`).
   - Bulk actions: Select all / Batch move to next stage / Batch reject with template email.

### MODULE C: InTerview (WhatsApp Conversational Agent)
1. **Interview Wizard & Calibration:**
   - Configuration panel setting question quota and category distribution weights (e.g., `Técnico: 40%`, `Fit Cultural: 30%`, `Trajetória: 30%`).
   - AI auto-generation of questions based on Job Description.
   - Question configuration: Input type (`Texto curto`, `Texto longo`, `Áudio`, `Múltipla escolha`), weight (`Alto`, `Médio`, `Baixo`), rubrics criteria, and knockout toggle.
2. **Workflow Automation & Triggers:**
   - Trigger rule: Automatically send WhatsApp interview invite when a candidate moves to a specified Kanban stage.
   - Configurable delay (e.g., execute after `X` minutes).
   - Dynamic message templates and unique candidate session links.
3. **Analytics Dashboard:**
   - KPI metric cards: `Total de Entrevistas`, `Horas Economizadas` (calculated as `interviews * avg_human_interview_time`), `Pontuação Média`, `CSAT Médio`.
   - Listing of active vs. archived interviews with aggregated response stats.

---

## 3. DATABASE SCHEMA (Prisma Data Model Sample)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Priority {
  PRIORIZADO
  NORMAL
  DUVIDA
}

enum FitCategory {
  ALTO_FIT
  MEDIO_FIT
  BAIXO_FIT
}

enum InputType {
  SHORT_TEXT
  LONG_TEXT
  AUDIO
  MULTIPLE_CHOICE
}

model Job {
  id              String         @id @default(uuid())
  title           String
  description     String
  salaryMin       Float
  salaryMax       Float
  slaDays         Int            @default(30)
  createdAt       DateTime       @default(now())
  stages          JobStage[]
  applications    Application[]
  interviews      BotInterview[]
}

model JobStage {
  id           String        @id @default(uuid())
  jobId        String
  name         String
  orderIndex   Int
  job          Job           @relation(fields: [jobId], references: [id], onDelete: Cascade)
  applications Application[]
}

model Candidate {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  phone        String
  linkedinUrl  String?
  source       String        // Hunting, LinkedIn, Indicação, etc.
  cvText       String?
  cvEmbedding  Unsupported("vector(1536)")?
  applications Application[]
}

model Application {
  id                String         @id @default(uuid())
  jobId             String
  candidateId       String
  stageId           String
  salaryExpectation Float?
  cvScore           Float?
  fitCategory       FitCategory?
  priority          Priority       @default(NORMAL)
  enteredStageAt    DateTime       @default(now())
  job               Job            @relation(fields: [jobId], references: [id])
  candidate         Candidate      @relation(fields: [candidateId], references: [id])
  stage             JobStage       @relation(fields: [stageId], references: [id])
  tags              String[]
  interviewRuns     InterviewRun[]
}

model BotInterview {
  id              String              @id @default(uuid())
  jobId           String
  name            String
  techWeight      Float
  cultureWeight   Float
  careerWeight    Float
  autoTriggerStageId String?
  delayMinutes    Int                 @default(0)
  job             Job                 @relation(fields: [jobId], references: [id])
  questions       InterviewQuestion[]
  interviewRuns   InterviewRun[]
}

model InterviewQuestion {
  id             String         @id @default(uuid())
  botInterviewId String
  questionText   String
  inputType      InputType      @default(SHORT_TEXT)
  weight         String         // Alto, Médio, Baixo
  isKnockout     Boolean        @default(false)
  botInterview   BotInterview   @relation(fields: [botInterviewId], references: [id], onDelete: Cascade)
  rubrics        Json           // Array of expected criteria and weights
}

model InterviewRun {
  id             String         @id @default(uuid())
  applicationId  String
  botInterviewId String
  score          Float?
  csatScore      Float?
  transcripts    Json?
  status         String         @default("PENDING") // PENDING, COMPLETED, FAILED
  completedAt    DateTime?
  application    Application    @relation(fields: [applicationId], references: [id])
  botInterview   BotInterview   @relation(fields: [botInterviewId], references: [id])
}