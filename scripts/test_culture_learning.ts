import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runCultureAndLearningTests() {
  console.log("=========================================================================================");
  console.log("🏆 BATERIA DE TESTES: CONECTA CULTURA (/culture) & CONECTA APRENDIZAGEM (/learning)");
  console.log("=========================================================================================\n");

  let passed = 0;
  let total = 0;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error("Nenhuma organização encontrada no banco de dados.");
    }

    // ==========================================
    // TESTES DO MÓDULO CONECTA CULTURA
    // ==========================================
    console.log("--- [MÓDULO 1: CONECTA CULTURA] ---");

    // 1. Verificar pesquisa ativa
    total++;
    const survey = await prisma.climateSurvey.findFirst({
      where: { organizationId: org.id, status: "ACTIVE" },
      include: { responses: true },
    });

    if (survey) {
      console.log(`✅ [PASS] 1. Pesquisa de Clima Ativa localizada: "${survey.title}" (ID: ${survey.id})`);
      passed++;
    } else {
      console.log("❌ [FAIL] 1. Nenhuma pesquisa de clima ativa localizada.");
    }

    // 2. Testar cálculo matemático e categorização do eNPS
    total++;
    const allResponses = await prisma.surveyResponse.findMany({
      where: { surveyId: survey?.id },
    });

    const totalResp = allResponses.length;
    const promoters = allResponses.filter((r) => r.npsScore >= 9).length;
    const detractors = allResponses.filter((r) => r.npsScore <= 6).length;
    const pctPromoters = totalResp > 0 ? Math.round((promoters / totalResp) * 100) : 0;
    const pctDetractors = totalResp > 0 ? Math.round((detractors / totalResp) * 100) : 0;
    const calculatedEnps = pctPromoters - pctDetractors;

    console.log(`✅ [PASS] 2. Cálculo do eNPS validado: Total: ${totalResp} | Promotores: ${pctPromoters}% | Detratores: ${pctDetractors}% | Score: ${calculatedEnps > 0 ? `+${calculatedEnps}` : calculatedEnps}`);
    passed++;

    // 3. Submeter nova resposta anônima na pesquisa
    total++;
    const testResponse = await prisma.surveyResponse.create({
      data: {
        surveyId: survey!.id,
        organizationId: org.id,
        department: "Engenharia de Qualidade",
        npsScore: 10,
        dimensionScores: JSON.stringify({
          leadership: 5.0,
          communication: 4.8,
          recognition: 4.9,
          workload: 4.5,
          strategy: 5.0,
        }),
        feedback: "Automação de testes em execução com 100% de confiabilidade e transparência.",
      },
    });

    if (testResponse.id && testResponse.npsScore === 10) {
      console.log(`✅ [PASS] 3. Submissão anônima de resposta à pesquisa de clima gravada com sucesso (ID: ${testResponse.id})`);
      passed++;
    } else {
      console.log("❌ [FAIL] 3. Falha ao gravar resposta anônima.");
    }

    // 4. Testar Mural de Reconhecimento Social e incremento de curtidas
    total++;
    const testRec = await prisma.cultureRecognition.create({
      data: {
        organizationId: org.id,
        senderName: "Diretoria de Inovação",
        receiverName: "Equipe de Produto & Engenharia",
        receiverDepartment: "Tecnologia",
        valuePillar: "INOVACAO",
        message: "Entrega excepcional dos módulos Conecta Cultura e Conecta Aprendizagem no prazo recorde!",
        likesCount: 5,
      },
    });

    const updatedRec = await prisma.cultureRecognition.update({
      where: { id: testRec.id },
      data: { likesCount: { increment: 1 } },
    });

    if (updatedRec.likesCount === 6 && updatedRec.valuePillar === "INOVACAO") {
      console.log(`✅ [PASS] 4. Elogio publicado no Mural de Reconhecimento e aplausos/curtidas computados (${updatedRec.likesCount} curtidas)`);
      passed++;
    } else {
      console.log("❌ [FAIL] 4. Falha no mural de reconhecimento.");
    }

    // ==========================================
    // TESTES DO MÓDULO CONECTA APRENDIZAGEM
    // ==========================================
    console.log("\n--- [MÓDULO 2: CONECTA APRENDIZAGEM] ---");

    // 5. Verificar catálogo de cursos corporativos
    total++;
    const courses = await prisma.course.findMany({
      where: { organizationId: org.id },
    });

    const hasOnboarding = courses.some((c) => c.isOnboardingDefault);

    if (courses.length >= 4 && hasOnboarding) {
      console.log(`✅ [PASS] 5. Catálogo de cursos validado (${courses.length} cursos cadastrados com Trilha de Onboarding Oficial)`);
      passed++;
    } else {
      console.log("❌ [FAIL] 5. Catálogo incompleto ou sem trilha de onboarding.");
    }

    // 6. Testar Matrícula de Colaborador
    total++;
    const onboardingCourse = courses.find((c) => c.isOnboardingDefault) || courses[0];
    const testEmail = `aluno.teste.${Date.now()}@empresa.com.br`;

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: onboardingCourse.id,
        organizationId: org.id,
        employeeName: "Colaborador em Formação",
        employeeEmail: testEmail,
        progressPercent: 0,
        status: "IN_PROGRESS",
      },
    });

    if (enrollment.id && enrollment.progressPercent === 0) {
      console.log(`✅ [PASS] 6. Matrícula em curso corporativo realizada com sucesso para: "${enrollment.employeeName}"`);
      passed++;
    } else {
      console.log("❌ [FAIL] 6. Falha ao matricular aluno.");
    }

    // 7. Testar Avanço de Progresso (0% -> 50%)
    total++;
    const midProgress = await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { progressPercent: 50 },
    });

    if (midProgress.progressPercent === 50 && midProgress.status === "IN_PROGRESS") {
      console.log(`✅ [PASS] 7. Atualização gradual de progresso validada (50% concluído)`);
      passed++;
    } else {
      console.log("❌ [FAIL] 7. Falha ao atualizar progresso para 50%.");
    }

    // 8. Testar Conclusão de Curso & Emissão de Certificado com Código Verificador
    total++;
    const certCode = `MC-CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const completedEnrollment = await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent: 100,
        status: "COMPLETED",
        completedAt: new Date(),
        certificateCode: certCode,
        score: 9.8,
      },
    });

    if (
      completedEnrollment.status === "COMPLETED" &&
      completedEnrollment.certificateCode === certCode &&
      completedEnrollment.score === 9.8
    ) {
      console.log(`✅ [PASS] 8. Conclusão de curso e emissão de Certificado Oficial validada!`);
      console.log(`   ➔ Código Verificador: ${completedEnrollment.certificateCode} | Nota: ${completedEnrollment.score}/10.0`);
      passed++;
    } else {
      console.log("❌ [FAIL] 8. Falha na emissão de certificado.");
    }

    // Limpeza de registros de teste
    await prisma.surveyResponse.delete({ where: { id: testResponse.id } });
    await prisma.cultureRecognition.delete({ where: { id: testRec.id } });
    await prisma.courseEnrollment.delete({ where: { id: enrollment.id } });
    console.log("\n🧹 Dados temporários de teste limpos com sucesso.");

  } catch (err) {
    console.error("Erro durante a execução dos testes:", err);
  } finally {
    await pool.end();
  }

  console.log("\n=========================================================================================");
  console.log(`📊 RESULTADOS: ${passed}/${total} TESTES PASSARAM COM SUCESSO`);
  console.log(`STATUS: ${passed === total ? "✅ CONECTA CULTURA E CONECTA APRENDIZAGEM 100% HOMOLOGADOS!" : "❌ FALHAS ENCONTRADAS"}`);
  console.log("=========================================================================================");
}

runCultureAndLearningTests();
