require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Import pure logic functions
const {
  calculateSalaryFit,
  extractKeywords,
  calculateSkillsMatch,
  evaluateApplicationFit,
  getFitBadgeStyle,
} = require('../src/lib/fit-evaluator');

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name} - ${details}`);
}

async function runTriagemAndFitTests() {
  console.log('====================================================');
  console.log('🎯 TESTES AUTOMATIZADOS: MOTOR DE FIT 3D & TRIAGEM INTELIGENTE');
  console.log('====================================================\n');

  // TEST 1: Salary Fit - Within Budget
  try {
    const res = calculateSalaryFit(8000, 6000, 10000);
    const passed = res.status === 'WITHIN_BUDGET' && res.isKnockout === false;
    recordTest(
      '1. Salary Fit: Pretensão dentro da faixa (R$ 8k vs Faixa 6k-10k)',
      passed,
      `Status: ${res.status}, Label: "${res.label}", Knockout: ${res.isKnockout}`
    );
  } catch (err) {
    recordTest('1. Salary Fit: Pretensão dentro da faixa', false, err.message);
  }

  // TEST 2: Salary Fit - Slightly Above (15% Tolerance)
  try {
    const res = calculateSalaryFit(11000, 6000, 10000); // 10% above
    const passed = res.status === 'SLIGHTLY_ABOVE' && res.diffPercentage === 10 && res.isKnockout === false;
    recordTest(
      '2. Salary Fit: Tolerância até 15% (R$ 11k vs Teto 10k => +10%)',
      passed,
      `Status: ${res.status}, Label: "${res.label}", Diff%: +${res.diffPercentage}%, Knockout: ${res.isKnockout}`
    );
  } catch (err) {
    recordTest('2. Salary Fit: Tolerância até 15%', false, err.message);
  }

  // TEST 3: Salary Fit - Out of Budget (Knockout Alert)
  try {
    const res = calculateSalaryFit(15000, 6000, 10000); // 50% above
    const passed = res.status === 'OUT_OF_BUDGET' && res.diffPercentage === 50 && res.isKnockout === true;
    recordTest(
      '3. Salary Fit: Fora da Faixa / Knockout (R$ 15k vs Teto 10k => +50%)',
      passed,
      `Status: ${res.status}, Label: "${res.label}", Knockout: ${res.isKnockout}`
    );
  } catch (err) {
    recordTest('3. Salary Fit: Fora da Faixa / Knockout', false, err.message);
  }

  // TEST 4: Keyword Extraction & Skills Match
  try {
    const jobTitle = 'Desenvolvedor Full Stack React Node.js';
    const jobDescription = 'Buscamos desenvolvedor com domínio em TypeScript, Next.js, PostgreSQL e TailwindCSS para atuar em projetos escaláveis.';
    const candidateTags = ['React', 'Node.js', 'TypeScript', 'PostgreSQL'];
    const candidateSummary = 'Engenheiro de software experiente em desenvolvimento full stack com React, Node.js e bancos relacionais.';

    const match = calculateSkillsMatch(candidateTags, candidateSummary, jobTitle, jobDescription, 'Engenharia');
    const passed = match.score >= 70 && match.matchedSkills.length > 0;

    recordTest(
      '4. Skills & Keyword Match Heurístico',
      passed,
      `Score: ${match.score}%, Skills Combinadas: [${match.matchedSkills.join(', ')}]`
    );
  } catch (err) {
    recordTest('4. Skills & Keyword Match Heurístico', false, err.message);
  }

  // TEST 5: 3-Dimensional Application Evaluation (Alto Fit)
  try {
    const job = {
      title: 'Desenvolvedor React Senior',
      description: 'Experiência sólida com React, TypeScript, Next.js e TailwindCSS',
      department: 'Tecnologia',
      salaryMin: 10000,
      salaryMax: 15000,
    };
    const candidate = {
      tags: JSON.stringify(['React', 'TypeScript', 'Next.js', 'TailwindCSS']),
      profileSummary: 'Desenvolvedor React sênior focado em front-end moderno',
    };
    const application = {
      salaryExpectation: 14000,
    };

    const evalResult = evaluateApplicationFit(job, candidate, application);
    const passed = evalResult.fitCategory === 'ALTO_FIT' && evalResult.prioritySuggestion === 'PRIORIZADO';

    recordTest(
      '5. Avaliação Global 3D (Perfil Ideal => ALTO FIT)',
      passed,
      `FitCategory: ${evalResult.fitCategory}, Prioridade: ${evalResult.prioritySuggestion}, Badge Label: "${evalResult.summaryBadge.label}"`
    );
  } catch (err) {
    recordTest('5. Avaliação Global 3D (Perfil Ideal => ALTO FIT)', false, err.message);
  }

  // TEST 6: 3-Dimensional Application Evaluation (Fora do Orçamento => BAIXO FIT)
  try {
    const job = {
      title: 'Analista de RH Junior',
      description: 'Recrutamento e seleção e triagem de talentos',
      salaryMin: 3000,
      salaryMax: 4000,
    };
    const candidate = {
      tags: JSON.stringify(['Recrutamento', 'RH']),
      profileSummary: 'Analista junior',
    };
    const application = {
      salaryExpectation: 8000, // 100% above
    };

    const evalResult = evaluateApplicationFit(job, candidate, application);
    const passed = evalResult.fitCategory === 'BAIXO_FIT' && evalResult.salaryFit.isKnockout === true;

    recordTest(
      '6. Avaliação Global 3D (Desvio Salarial => BAIXO FIT / ALERTA)',
      passed,
      `FitCategory: ${evalResult.fitCategory}, Salary Status: ${evalResult.salaryFit.status}, Badge Label: "${evalResult.summaryBadge.label}"`
    );
  } catch (err) {
    recordTest('6. Avaliação Global 3D (Desvio Salarial => BAIXO FIT / ALERTA)', false, err.message);
  }

  // TEST 7: Database Persistence & Batch Operations Simulation
  let testJob = null;
  let testCand1 = null;
  let testCand2 = null;
  let testApp1 = null;
  let testApp2 = null;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Nenhuma organização encontrada.');

    // Create a temporary job with 2 stages
    testJob = await prisma.job.create({
      data: {
        title: 'Vaga Teste Fit 3D',
        description: 'Vaga de teste para validação de processamento em lote e triagem',
        salaryMin: 5000,
        salaryMax: 7000,
        organizationId: org.id,
        stages: {
          create: [
            { name: 'Triagem Inicial', order: 0, organizationId: org.id },
            { name: 'Fit Cultural', order: 1, organizationId: org.id },
          ],
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    const stageTriagem = testJob.stages[0];
    const stageFitCultural = testJob.stages[1];

    // Create 2 test candidates
    testCand1 = await prisma.candidate.create({
      data: {
        firstName: 'Talento',
        lastName: 'Alto Fit Teste',
        email: `altofit.${Date.now()}@teste.com`,
        organizationId: org.id,
        tags: JSON.stringify(['React', 'Node.js']),
      },
    });

    testCand2 = await prisma.candidate.create({
      data: {
        firstName: 'Talento',
        lastName: 'Médio Fit Teste',
        email: `mediofit.${Date.now()}@teste.com`,
        organizationId: org.id,
        tags: JSON.stringify(['Marketing']),
      },
    });

    // Create 2 applications in Triagem
    testApp1 = await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateId: testCand1.id,
        stageId: stageTriagem.id,
        salaryExpectation: 6000,
        fitCategory: 'ALTO_FIT',
        matchScore: 85,
        priority: 'NORMAL',
      },
    });

    testApp2 = await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateId: testCand2.id,
        stageId: stageTriagem.id,
        salaryExpectation: 7500,
        fitCategory: 'MEDIO_FIT',
        matchScore: 50,
        priority: 'NORMAL',
      },
    });

    // 1. Batch move to 'Fit Cultural'
    const appIds = [testApp1.id, testApp2.id];
    await prisma.application.updateMany({
      where: { id: { in: appIds } },
      data: { stageId: stageFitCultural.id, enteredStageAt: new Date() },
    });

    // 2. Batch prioritize
    await prisma.application.updateMany({
      where: { id: { in: appIds } },
      data: { priority: 'PRIORIZADO' },
    });

    // Verify database state
    const updatedApps = await prisma.application.findMany({
      where: { id: { in: appIds } },
    });

    const allMoved = updatedApps.every((a) => a.stageId === stageFitCultural.id);
    const allPrioritized = updatedApps.every((a) => a.priority === 'PRIORIZADO');

    recordTest(
      '7. Persistência no Banco & Ações em Lote (Batch Move + Batch Priority)',
      allMoved && allPrioritized,
      `2 candidatos movidos para "${stageFitCultural.name}" e priorizados com sucesso.`
    );
  } catch (err) {
    recordTest('7. Persistência no Banco & Ações em Lote', false, err.message);
  } finally {
    // Cleanup temporary test data
    try {
      if (testApp1) await prisma.application.delete({ where: { id: testApp1.id } }).catch(() => {});
      if (testApp2) await prisma.application.delete({ where: { id: testApp2.id } }).catch(() => {});
      if (testCand1) await prisma.candidate.delete({ where: { id: testCand1.id } }).catch(() => {});
      if (testCand2) await prisma.candidate.delete({ where: { id: testCand2.id } }).catch(() => {});
      if (testJob) {
        await prisma.stage.deleteMany({ where: { jobId: testJob.id } }).catch(() => {});
        await prisma.job.delete({ where: { id: testJob.id } }).catch(() => {});
      }
      console.log('\n🧹 Dados de teste limpos do banco de dados.');
    } catch (cleanupErr) {
      console.warn('Erro na limpeza:', cleanupErr.message);
    }
  }

  await pool.end();

  console.log('\n====================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO FINAL: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS GERAL: ${allPassed ? '✅ TODOS OS TESTES PASSARAM COM SUCESSO!' : '⚠️ ATENÇÃO: HOUVE FALHAS'}`);
  console.log('====================================================\n');
}

runTriagemAndFitTests();
