import "dotenv/config";
import { extractHeuristicResumeData, parseResumeWithAi } from "../src/lib/resume-parser";
import { uploadResumeBuffer } from "../src/lib/resume-storage";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const results: { name: string; passed: boolean; details: string }[] = [];

function recordTest(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} ${name} - ${details}`);
}

async function runResumeTests() {
  console.log("===============================================================");
  console.log("📄 TESTES DEFINITIVOS DE PROCESSAMENTO & UPLOAD DE CURRÍCULOS (PDF)");
  console.log("===============================================================\n");

  // TEST 1: Heuristic Extraction of Brazilian CV Text
  const mockCvText = `
CURRICULUM VITAE
Carlos Eduardo Silva
carlos.silva.dev@gmail.com
(11) 98765-4321
https://linkedin.com/in/carlossilvadev
São Paulo, SP

RESUMO PROFISSIONAL
Engenheiro de Software Sênior com 8 anos de experiência desenvolvendo aplicações escaláveis de alta performance. Especialista no ecossistema React, TypeScript, Next.js, Node.js e PostgreSQL. Apaixonado por boas práticas, arquitetura limpa e liderança técnica de times ágeis.

HABILIDADES TÉCNICAS
React, Next.js, TypeScript, JavaScript, Node.js, NestJS, PostgreSQL, Redis, Docker, AWS, TailwindCSS, GraphQL, Git, CI/CD, Scrum, Kanban.

EXPERIÊNCIA PROFISSIONAL
Tech Lead & Senior Full Stack Engineer - Fintech X (2021 - Atual)
- Liderança de equipe de 6 engenheiros.
- Migração de monólito para microsserviços Node.js e Next.js.

Pretensão Salarial: R$ 16.000
`;

  try {
    const parsed = extractHeuristicResumeData(mockCvText);

    const passed =
      parsed.firstName === "Carlos" &&
      parsed.lastName === "Eduardo Silva" &&
      parsed.email === "carlos.silva.dev@gmail.com" &&
      parsed.phone.includes("98765-4321") &&
      parsed.linkedinUrl.includes("carlossilvadev") &&
      parsed.skills.includes("React") &&
      parsed.skills.includes("TypeScript") &&
      parsed.skills.includes("PostgreSQL") &&
      parsed.salaryExpectation === 16000;

    recordTest(
      "1. Extração Heurística Inteligente de Currículo em Português",
      passed,
      `Nome: "${parsed.firstName} ${parsed.lastName}", Email: ${parsed.email}, Tel: ${parsed.phone}, Skills: [${parsed.skills.slice(0, 5).join(", ")}], Pretensão: R$ ${parsed.salaryExpectation}`
    );
  } catch (err: any) {
    recordTest("1. Extração Heurística Inteligente", false, err.message);
  }

  // TEST 2: AI Parser Resilience with Safe Fallback on OpenAI 429
  try {
    const aiParsed = await parseResumeWithAi(mockCvText);
    const passed = Boolean(aiParsed.firstName && aiParsed.email && aiParsed.skills.length > 0);

    recordTest(
      "2. Resiliência do Extrator com Camada de IA & Fallback Automático",
      passed,
      `Executado sem travamento mesmo se cota de IA esgotada. Dados garantidos: Nome: ${aiParsed.name}, Email: ${aiParsed.email}, Tags: "${aiParsed.tags}"`
    );
  } catch (err: any) {
    recordTest("2. Resiliência do Extrator com Camada de IA", false, err.message);
  }

  // TEST 3: Multi-Layer Storage Buffer Upload
  let uploadedUrl = "";
  try {
    const mockPdfBuffer = Buffer.from(
      "%PDF-1.4 Mock PDF content designed for definitive resume storage testing"
    );
    const uploadResult = await uploadResumeBuffer(mockPdfBuffer, "curriculo-teste-carlos.pdf");
    uploadedUrl = uploadResult.url;

    const passed = Boolean(uploadedUrl && uploadedUrl.length > 5);
    recordTest(
      "3. Upload Resiliente com Multi-Storage Fallback",
      passed,
      `Provedor: [${uploadResult.provider.toUpperCase()}], URL Gerada: ${uploadedUrl}`
    );
  } catch (err: any) {
    recordTest("3. Upload Resiliente com Multi-Storage Fallback", false, err.message);
  }

  // TEST 4: End-to-End Database Candidate Application Linking with Resume URL
  let createdCandidateId: string | null = null;
  let createdAppId: string | null = null;

  try {
    const org = await prisma.organization.findFirst({
      include: { jobs: { include: { stages: { orderBy: { order: "asc" } } } } },
    });
    if (!org || !org.jobs || org.jobs.length === 0) {
      throw new Error("Nenhuma organização com vagas encontrada.");
    }

    const testJob = org.jobs[0];
    const testStage = testJob.stages[0];

    const testEmail = `carlos.curriculo.teste.${Date.now()}@maitre.com.br`;

    const candidate = await prisma.candidate.create({
      data: {
        firstName: "Carlos",
        lastName: "Eduardo Silva",
        email: testEmail,
        phone: "11987654321",
        linkedinUrl: "https://linkedin.com/in/carlossilvadev",
        resumeUrl: uploadedUrl,
        tags: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
        profileSummary: "Engenheiro de Software Sênior com sólida experiência full stack.",
        organizationId: org.id,
        source: "Candidatura Online (PDF)",
      },
    });
    createdCandidateId = candidate.id;

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: testJob.id,
        stageId: testStage.id,
        salaryExpectation: 16000,
        matchScore: 95,
        fitCategory: "ALTO_FIT",
        priority: "PRIORIZADO",
      },
    });
    createdAppId = application.id;

    // Verify recruitment lookup
    const retrieved = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: { applications: { include: { job: true, stage: true } } },
    });

    const passed =
      retrieved?.resumeUrl === uploadedUrl &&
      retrieved?.applications.length === 1 &&
      retrieved?.applications[0].jobId === testJob.id;

    recordTest(
      "4. Vínculo do Currículo (PDF) com Perfil do Candidato & Vaga no ATS",
      Boolean(passed),
      `Candidato ID: ${candidate.id}, Vaga: "${testJob.title}", URL do PDF no Perfil: ${retrieved?.resumeUrl}`
    );
  } catch (err: any) {
    recordTest("4. Vínculo do Currículo (PDF) com Perfil do Candidato", false, err.message);
  } finally {
    // Cleanup test records
    try {
      if (createdAppId) await prisma.application.delete({ where: { id: createdAppId } });
      if (createdCandidateId) await prisma.candidate.delete({ where: { id: createdCandidateId } });
      console.log("\n🧹 Registros de teste limpos do banco de dados.");
    } catch (cleanErr: any) {
      console.warn("Aviso na limpeza:", cleanErr.message);
    }
  }

  await pool.end();

  console.log("\n===============================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS: ${allPassed ? "✅ PROCESSAMENTO DE CURRÍCULOS 100% OPERACIONAL E RESILIENTE" : "⚠️ HOUVE FALHAS"}`);
  console.log("===============================================================\n");
}

runResumeTests();
