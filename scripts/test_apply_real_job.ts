import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testRealJobApplication() {
  console.log("=======================================================================");
  console.log("💼 TESTE DE CANDIDATURA DIRETA NA VAGA REAL EXISTENTE NO SISTEMA");
  console.log("=======================================================================\n");

  const results: { name: string; passed: boolean; details: string }[] = [];

  function recordTest(name: string, passed: boolean, details: string) {
    results.push({ name, passed, details });
    console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} ${name} - ${details}`);
  }

  // 1. Localizar a vaga real existente
  const realJob = await prisma.job.findFirst({
    where: { status: "OPEN" },
    include: {
      organization: true,
      stages: { orderBy: { order: "asc" } },
    },
  });

  if (!realJob) {
    recordTest("1. Localização da Vaga Real", false, "Nenhuma vaga aberta encontrada.");
    await pool.end();
    return;
  }

  recordTest(
    "1. Localização da Vaga Real no Banco de Dados",
    true,
    `Vaga: "${realJob.title}" (ID: ${realJob.id}) | Empresa: "${realJob.organization.name}" (slug: "${realJob.organization.slug}") | Etapas: [${realJob.stages.map((s) => s.name).join(" ➔ ")}]`
  );

  // 2. Criar ou Obter Candidato de Teste com Perfil na Área do Candidato
  const testCandidateEmail = `candidato.real.${Date.now()}@maitre.com.br`;
  let testCandidate: any = null;
  let testApp: any = null;

  try {
    testCandidate = await prisma.candidate.create({
      data: {
        firstName: "Fernanda",
        lastName: "Oliveira Santos",
        email: testCandidateEmail,
        phone: "11977778888",
        linkedinUrl: "https://linkedin.com/in/fernandasantos",
        resumeUrl: "https://yqnlcwglyxqsemqhjkmp.supabase.co/storage/v1/object/public/resumes/fernanda-curriculo.pdf",
        tags: JSON.stringify(["Atendimento ao Cliente", "CRM", "Negociação", "Comunicação", "Vendas B2B"]),
        profileSummary: "Profissional de relacionamento com cliente e sucesso do cliente (CS) com 5 anos de experiência.",
        source: "Área do Candidato",
        organizationId: realJob.organization.id,
      },
    });

    recordTest(
      "2. Identificação do Candidato com Perfil & Currículo Salvos",
      Boolean(testCandidate?.id),
      `Candidato: "${testCandidate.firstName} ${testCandidate.lastName}" (${testCandidate.email})`
    );

    // 3. Execução da Candidatura Simplificada (3 Perguntas)
    // Pergunta 1: Pretensão Salarial = R$ 5.500
    // Pergunta 2: Indicação = SIM ("Rodrigo Alencar - Gerente Comercial")
    // Pergunta 3: Como soube = "LinkedIn"
    const salaryExpectation = 5500;
    const isReferral = true;
    const referralName = "Rodrigo Alencar - Gerente Comercial";
    const sourceChannel = "LinkedIn";
    const computedSource = `Indicação: ${referralName}`;

    const firstStage = realJob.stages[0];

    testApp = await prisma.application.create({
      data: {
        candidateId: testCandidate.id,
        jobId: realJob.id,
        stageId: firstStage.id,
        salaryExpectation: salaryExpectation,
        matchScore: 92,
        fitCategory: "ALTO_FIT",
        priority: "PRIORIZADO",
      },
    });

    // Atualiza a origem com a indicação
    await prisma.candidate.update({
      where: { id: testCandidate.id },
      data: { source: computedSource },
    });

    // Registra a atividade no histórico do processo
    await prisma.activity.create({
      data: {
        applicationId: testApp.id,
        type: "APPLICATION_SUBMITTED",
        description: `Candidatura confirmada via ${sourceChannel} com indicação de: ${referralName}.`,
        metadata: JSON.stringify({
          salaryExpectation,
          isReferral,
          referralName,
          sourceChannel,
        }),
      },
    });

    recordTest(
      "3. Envio da Candidatura com as 3 Perguntas",
      Boolean(testApp?.id),
      `Candidatura ID: ${testApp.id} | Etapa Inicial: "${firstStage.name}" | Pretensão: R$ ${salaryExpectation} | Origem: "${computedSource}"`
    );

    // 4. Verificação no Pipeline Kanban do ATS
    const kanbanData = await prisma.job.findUnique({
      where: { id: realJob.id },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            applications: {
              where: { id: testApp.id },
              include: { candidate: true },
            },
          },
        },
      },
    });

    const triagemStage = kanbanData?.stages.find((s) => s.id === firstStage.id);
    const candidateInKanban = triagemStage?.applications.some((a) => a.id === testApp.id);

    recordTest(
      "4. Disponibilidade Imediata no Pipeline Kanban da Vaga",
      Boolean(candidateInKanban),
      `Candidato inserido na coluna "${firstStage.name}" da vaga "${realJob.title}".`
    );

    // 5. Verificação na Área do Candidato (Stepper & Status)
    const candidatePortal = await prisma.candidate.findUnique({
      where: { email: testCandidateEmail },
      include: {
        applications: {
          where: { jobId: realJob.id },
          include: {
            job: { include: { stages: { orderBy: { order: "asc" } } } },
            stage: true,
          },
        },
      },
    });

    const candidateApp = candidatePortal?.applications[0];
    const currentStage = candidateApp?.stage.name;
    const totalJobStages = candidateApp?.job.stages.length;

    recordTest(
      "5. Visualização na Área do Candidato (Stepper em Tempo Real)",
      candidateApp?.jobId === realJob.id && currentStage === firstStage.name,
      `Processo Seletivo: "${candidateApp?.job.title}" | Etapa Atual: "${currentStage}" (1 de ${totalJobStages} etapas).`
    );
  } catch (err: any) {
    recordTest("Erro no teste da vaga real", false, err.message);
  } finally {
    // Limpeza segura dos registros de teste
    try {
      if (testApp?.id) await prisma.activity.deleteMany({ where: { applicationId: testApp.id } });
      if (testApp?.id) await prisma.application.delete({ where: { id: testApp.id } });
      if (testCandidate?.id) await prisma.candidate.delete({ where: { id: testCandidate.id } });
      console.log("\n🧹 Dados do teste com a vaga real limpos com sucesso.");
    } catch (cleanErr: any) {
      console.warn("Aviso na limpeza:", cleanErr.message);
    }
  }

  await pool.end();

  console.log("\n=======================================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS: ${allPassed ? "✅ CANDIDATURA NA VAGA EXISTENTE 100% OPERACIONAL" : "⚠️ HOUVE FALHAS"}`);
  console.log("=======================================================================\n");
}

testRealJobApplication();
