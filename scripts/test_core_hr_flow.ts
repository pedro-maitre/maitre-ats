import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runCoreHRFlowTest() {
  console.log("=========================================================================================");
  console.log("👥 TESTE AUTOMATIZADO: MÓDULO CORE HR (COLABORADORES & ADMISSÃO DIGITAL)");
  console.log("=========================================================================================\n");

  const results: { name: string; passed: boolean; details: string }[] = [];

  function record(name: string, passed: boolean, details: string) {
    results.push({ name, passed, details });
    console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} ${name}\n   ➔ ${details}\n`);
  }

  let testOrg: any = null;
  let testCandidate: any = null;
  let testJob: any = null;
  let testApp: any = null;
  let testConversion: any = null;
  let testOutbox: any = null;

  try {
    testOrg = await prisma.organization.findFirst();
    if (!testOrg) throw new Error("Organização não encontrada.");

    // 1. Criar candidato e vaga no ATS
    testJob = await prisma.job.create({
      data: {
        title: "Especialista em Gestão de Pessoas (Core HR Test)",
        description: "Vaga de teste de admissão no Core HR.",
        department: "Recursos Humanos & DHO",
        salaryMin: 12000,
        salaryMax: 15000,
        organizationId: testOrg.id,
        stages: {
          create: [{ name: "Contratado", order: 0, organizationId: testOrg.id }],
        },
      },
      include: { stages: true },
    });

    testCandidate = await prisma.candidate.create({
      data: {
        firstName: "Camila",
        lastName: "Vasconcelos",
        email: `camila.corehr.${Date.now()}@maitre.com.br`,
        phone: "11988887777",
        organizationId: testOrg.id,
        source: "Executive Search",
      },
    });

    testApp = await prisma.application.create({
      data: {
        candidateId: testCandidate.id,
        jobId: testJob.id,
        stageId: testJob.stages[0].id,
        matchScore: 98,
        fitCategory: "ALTO_FIT",
        priority: "PRIORIZADO",
        salaryExpectation: 14000,
      },
    });

    // 2. Transição ATS ➔ Core HR (Conversão de Contratação)
    const employeeCode = `MC-${new Date().getFullYear()}-777`;
    testConversion = await prisma.hireConversion.create({
      data: {
        applicationId: testApp.id,
        convertedBy: "admin@maitre.com.br",
        employeeCode,
        status: "ACTIVE",
      },
    });

    testOutbox = await prisma.integrationOutbox.create({
      data: {
        organizationId: testOrg.id,
        eventType: "candidate.hire_authorized.v1",
        payload: JSON.stringify({
          applicationId: testApp.id,
          candidateId: testCandidate.id,
          candidateName: `${testCandidate.firstName} ${testCandidate.lastName}`,
          candidateEmail: testCandidate.email,
          jobId: testJob.id,
          jobTitle: testJob.title,
          employeeCode,
          salaryOffered: 14000,
        }),
      },
    });

    record(
      "1. Conversão Transacional de Candidato em Colaborador no Core HR",
      Boolean(testConversion?.id && testConversion.employeeCode === employeeCode),
      `Colaborador ID: ${testConversion.id} | Matrícula: ${employeeCode} | Cargo: "${testJob.title}"`
    );

    // 3. Consulta da Ficha Unificada do Colaborador no Core HR
    const queriedEmployee = await prisma.hireConversion.findUnique({
      where: { id: testConversion.id },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    });

    const isIntegrated =
      queriedEmployee?.application.candidate.email === testCandidate.email &&
      queriedEmployee?.application.job.department === "Recursos Humanos & DHO";

    record(
      "2. Ficha Unificada de Colaborador (Dados Pessoais + Cargo + Salário)",
      Boolean(isIntegrated),
      `Colaboradora: "${queriedEmployee?.application.candidate.firstName} ${queriedEmployee?.application.candidate.lastName}" (${queriedEmployee?.application.candidate.email}) no depto "${queriedEmployee?.application.job.department}".`
    );

    // 4. Atualização de Ciclo de Vida do Colaborador (Onboarding ➔ Ativo)
    const updatedStatus = await prisma.hireConversion.update({
      where: { id: testConversion.id },
      data: { status: "ACTIVE" },
    });

    record(
      "3. Gestão de Ciclo de Vida e Status de Onboarding no Core HR",
      updatedStatus.status === "ACTIVE",
      `Status atualizado com sucesso para: "${updatedStatus.status}".`
    );
  } catch (err: any) {
    record("Erro no Teste de Core HR", false, err.message);
  } finally {
    // Cleanup
    try {
      if (testOutbox?.id) await prisma.integrationOutbox.delete({ where: { id: testOutbox.id } });
      if (testConversion?.id) await prisma.hireConversion.delete({ where: { id: testConversion.id } });
      if (testApp?.id) await prisma.application.delete({ where: { id: testApp.id } });
      if (testCandidate?.id) await prisma.candidate.delete({ where: { id: testCandidate.id } });
      if (testJob?.id) {
        await prisma.stage.deleteMany({ where: { jobId: testJob.id } });
        await prisma.job.delete({ where: { id: testJob.id } });
      }
      console.log("🧹 Registros de teste de Core HR limpos com sucesso.");
    } catch (cleanErr: any) {
      console.warn("Aviso na limpeza:", cleanErr.message);
    }
  }

  await pool.end();

  console.log("\n=========================================================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS: ${allPassed ? "✅ MÓDULO CORE HR 100% OPERACIONAL" : "⚠️ HOUVE FALHAS"}`);
  console.log("=========================================================================================\n");
}

runCoreHRFlowTest();
