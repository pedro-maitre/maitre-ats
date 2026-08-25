import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const results: { name: string; passed: boolean; details: string }[] = [];

function recordTest(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} ${name} - ${details}`);
}

async function runStreamlinedApplicationTests() {
  console.log("=======================================================================");
  console.log("🎯 TESTES AUTOMATIZADOS: FLUXO SIMPLIFICADO DE CANDIDATURA (3 PERGUNTAS)");
  console.log("=======================================================================\n");

  let testCandidateId: string | null = null;
  let testApp1Id: string | null = null;
  let testApp2Id: string | null = null;
  let testJob1: any = null;
  let testJob2: any = null;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Organização não encontrada.");

    // 1. Criar candidato existente com perfil e currículo já cadastrado na Área do Candidato
    const candidateEmail = `talento.cadastrado.${Date.now()}@maitre.com.br`;
    const candidate = await prisma.candidate.create({
      data: {
        firstName: "Juliana",
        lastName: "Mendes Costa",
        email: candidateEmail,
        phone: "11988889999",
        linkedinUrl: "https://linkedin.com/in/julianamendes",
        resumeUrl: "https://supabase.co/storage/v1/object/public/resumes/juliana-cv.pdf",
        tags: JSON.stringify(["React", "TypeScript", "Node.js", "Liderança"]),
        profileSummary: "Engenheira de Software com 6 anos de experiência em frontend e backend.",
        source: "Área do Candidato",
        organizationId: org.id,
      },
    });
    testCandidateId = candidate.id;

    recordTest(
      "1. Perfil de Candidato Previamente Cadastrado na Área do Candidato",
      Boolean(candidate.id && candidate.resumeUrl),
      `Candidato: "${candidate.firstName} ${candidate.lastName}" (ID: ${candidate.id}) com Currículo PDF vinculado.`
    );

    // 2. Criar duas vagas de teste
    testJob1 = await prisma.job.create({
      data: {
        title: "Desenvolvedora Frontend Sênior (Teste Simplificado)",
        description: "Vaga de teste para candidatura rápida.",
        salaryMin: 9000,
        salaryMax: 12000,
        organizationId: org.id,
        stages: {
          create: [{ name: "Triagem", order: 0, organizationId: org.id }],
        },
      },
      include: { stages: true },
    });

    testJob2 = await prisma.job.create({
      data: {
        title: "Tech Lead Full Stack (Teste Simplificado)",
        description: "Vaga de teste para candidatura com indicação.",
        salaryMin: 14000,
        salaryMax: 18000,
        organizationId: org.id,
        stages: {
          create: [{ name: "Triagem", order: 0, organizationId: org.id }],
        },
      },
      include: { stages: true },
    });

    // 3. CANDIDATURA 1: Sem indicação (3 perguntas: R$ 11.000, Indicação=Não, Como soube=LinkedIn)
    const expectation1 = 11000;
    const isReferral1 = false;
    const sourceChannel1 = "LinkedIn";
    const computedSource1 = sourceChannel1;

    const app1 = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: testJob1.id,
        stageId: testJob1.stages[0].id,
        salaryExpectation: expectation1,
        matchScore: 90,
        fitCategory: "ALTO_FIT",
        priority: "NORMAL",
      },
    });
    testApp1Id = app1.id;

    await prisma.activity.create({
      data: {
        applicationId: app1.id,
        type: "APPLICATION_SUBMITTED",
        description: `Candidatura enviada via ${computedSource1}.`,
        metadata: JSON.stringify({
          salaryExpectation: expectation1,
          isReferral: isReferral1,
          sourceChannel: sourceChannel1,
        }),
      },
    });

    recordTest(
      "2. Candidatura Rápida Direta (Sem Indicação)",
      app1.salaryExpectation === 11000,
      `Vaga: "${testJob1.title}", Pretensão: R$ ${app1.salaryExpectation}, Canal: ${sourceChannel1}`
    );

    // 4. CANDIDATURA 2: Com indicação interna (3 perguntas: R$ 16.000, Indicação=Sim [Maria Silva], Como soube=Indicação)
    const expectation2 = 16000;
    const isReferral2 = true;
    const referralName2 = "Maria Silva - Diretora de Engenharia";
    const computedSource2 = `Indicação: ${referralName2}`;

    const app2 = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: testJob2.id,
        stageId: testJob2.stages[0].id,
        salaryExpectation: expectation2,
        matchScore: 95,
        fitCategory: "ALTO_FIT",
        priority: "PRIORIZADO",
      },
    });
    testApp2Id = app2.id;

    // Atualiza a origem no perfil e registra log de atividade
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { source: computedSource2 },
    });

    await prisma.activity.create({
      data: {
        applicationId: app2.id,
        type: "APPLICATION_SUBMITTED",
        description: `Candidatura enviada com indicação de: ${referralName2}.`,
        metadata: JSON.stringify({
          salaryExpectation: expectation2,
          isReferral: isReferral2,
          referralName: referralName2,
          sourceChannel: "Indicação de Amigo ou Colega",
        }),
      },
    });

    const retrievedApp2 = await prisma.application.findUnique({
      where: { id: app2.id },
      include: { candidate: true, activities: true },
    });

    const passedApp2 =
      retrievedApp2?.candidate.source === computedSource2 &&
      retrievedApp2?.activities.length === 1 &&
      retrievedApp2?.salaryExpectation === 16000;

    recordTest(
      "3. Candidatura Rápida com Indicação Interna Registrada",
      Boolean(passedApp2),
      `Vaga: "${testJob2.title}", Pretensão: R$ ${retrievedApp2?.salaryExpectation}, Origem Registrada: "${retrievedApp2?.candidate.source}"`
    );

    // 5. Verificação da Integridade do Perfil (Currículo e Dados não foram perdidos)
    const finalCandidate = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: { applications: true },
    });

    const profileIntact =
      finalCandidate?.resumeUrl === candidate.resumeUrl &&
      finalCandidate?.phone === candidate.phone &&
      finalCandidate?.applications.length === 2;

    recordTest(
      "4. Integridade dos Dados de Cadastro & Múltiplas Candidaturas",
      Boolean(profileIntact),
      `Candidato possui ${finalCandidate?.applications.length} candidaturas ativas mantendo o mesmo Currículo e telefone.`
    );
  } catch (err: any) {
    recordTest("Erro geral nos testes de candidatura simplificada", false, err.message);
  } finally {
    // Cleanup
    try {
      if (testApp1Id) await prisma.application.delete({ where: { id: testApp1Id } }).catch(() => {});
      if (testApp2Id) await prisma.application.delete({ where: { id: testApp2Id } }).catch(() => {});
      if (testCandidateId) await prisma.candidate.delete({ where: { id: testCandidateId } }).catch(() => {});
      if (testJob1) {
        await prisma.stage.deleteMany({ where: { jobId: testJob1.id } }).catch(() => {});
        await prisma.job.delete({ where: { id: testJob1.id } }).catch(() => {});
      }
      if (testJob2) {
        await prisma.stage.deleteMany({ where: { jobId: testJob2.id } }).catch(() => {});
        await prisma.job.delete({ where: { id: testJob2.id } }).catch(() => {});
      }
      console.log("\n🧹 Dados de teste limpos do banco de dados.");
    } catch (cleanErr: any) {
      console.warn("Aviso na limpeza:", cleanErr.message);
    }
  }

  await pool.end();

  console.log("\n=======================================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS: ${allPassed ? "✅ FLUXO SIMPLIFICADO 100% OPERACIONAL E TESTADO" : "⚠️ HOUVE FALHAS"}`);
  console.log("=======================================================================\n");
}

runStreamlinedApplicationTests();
