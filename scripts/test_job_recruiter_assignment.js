require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name} - ${details}`);
}

async function runJobRecruiterAssignmentTests() {
  console.log('================================================================');
  console.log('💼 TESTE DE INTEGRAÇÃO: ATRIBUIÇÃO DE VAGAS A RECRUTADORES');
  console.log('================================================================\n');

  let testJobId = null;
  let testRecruiter1Id = null;
  let testRecruiter2Id = null;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Organização não encontrada.');

    // 1. Criar dois recrutadores de teste
    const r1 = await prisma.user.create({
      data: {
        name: 'Recrutador Teste Alfa',
        email: `recrutador.alfa.${Date.now()}@maitre.com.br`,
        role: 'RECRUITER',
        organizationId: org.id,
      },
    });
    testRecruiter1Id = r1.id;

    const r2 = await prisma.user.create({
      data: {
        name: 'Recrutadora Teste Beta',
        email: `recrutadora.beta.${Date.now()}@maitre.com.br`,
        role: 'RECRUITER',
        organizationId: org.id,
      },
    });
    testRecruiter2Id = r2.id;

    recordTest(
      '1. Setup de Recrutadores de Teste',
      Boolean(r1.id && r2.id),
      `Recrutadores criados: "${r1.name}" (ID: ${r1.id}) e "${r2.name}" (ID: ${r2.id})`
    );

    // 2. Criar vaga atribuída ao Recrutador Alfa
    const job = await prisma.job.create({
      data: {
        title: 'Tech Lead Cloud & DevOps (Teste)',
        department: 'Engenharia',
        location: 'Remoto',
        description: 'Vaga de teste para validação de atribuição de recrutador.',
        status: 'OPEN',
        organizationId: org.id,
        recruiterId: r1.id,
        stages: {
          create: [
            { name: 'Triagem', order: 0 },
            { name: 'Entrevista', order: 1 },
          ],
        },
      },
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
      },
    });
    testJobId = job.id;

    recordTest(
      '2. Criação de Vaga com Atribuição Inicial',
      job.recruiterId === r1.id && job.recruiter?.name === r1.name,
      `Vaga criada: "${job.title}". Recrutador vinculado: "${job.recruiter?.name}"`
    );

    // 3. Consulta de "Minhas Vagas" para o Recrutador Alfa
    const myJobsR1 = await prisma.job.findMany({
      where: {
        recruiterId: r1.id,
      },
    });

    const myJobsR2Initial = await prisma.job.findMany({
      where: {
        recruiterId: r2.id,
      },
    });

    recordTest(
      '3. Filtro de Vagas Atribuídas ("Minhas Vagas")',
      myJobsR1.some((j) => j.id === job.id) && !myJobsR2Initial.some((j) => j.id === job.id),
      `Alfa possui a vaga na lista: ${myJobsR1.some((j) => j.id === job.id)} | Beta NÃO possui a vaga: ${!myJobsR2Initial.some((j) => j.id === job.id)}`
    );

    // 4. Reatribuição da Vaga para o Recrutador Beta (Ação do Administrador)
    const reallocatedJob = await prisma.job.update({
      where: { id: job.id },
      data: { recruiterId: r2.id },
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
      },
    });

    recordTest(
      '4. Reatribuição de Vaga para Outro Recrutador (Ação Admin)',
      reallocatedJob.recruiterId === r2.id && reallocatedJob.recruiter?.name === r2.name,
      `Vaga reatribuída com sucesso para: "${reallocatedJob.recruiter?.name}"`
    );

    // 5. Validação da Nova Consulta de "Minhas Vagas"
    const myJobsR1After = await prisma.job.findMany({ where: { recruiterId: r1.id } });
    const myJobsR2After = await prisma.job.findMany({ where: { recruiterId: r2.id } });

    recordTest(
      '5. Atualização Instantânea no Filtro do Recrutador',
      !myJobsR1After.some((j) => j.id === job.id) && myJobsR2After.some((j) => j.id === job.id),
      `Alfa NÃO possui mais a vaga: ${!myJobsR1After.some((j) => j.id === job.id)} | Beta agora possui a vaga: ${myJobsR2After.some((j) => j.id === job.id)}`
    );

    // 6. Desatribuição da Vaga (Sem Recrutador)
    const unassignedJob = await prisma.job.update({
      where: { id: job.id },
      data: { recruiterId: null },
      include: {
        recruiter: true,
      },
    });

    recordTest(
      '6. Desatribuição de Recrutador (Vaga Livre/Geral)',
      unassignedJob.recruiterId === null && unassignedJob.recruiter === null,
      'Vaga desatribuída com sucesso, retornando status "Sem recrutador atribuído".'
    );

  } catch (err) {
    recordTest('Erro na Execução dos Testes', false, err.message);
  } finally {
    if (testJobId) {
      await prisma.stage.deleteMany({ where: { jobId: testJobId } }).catch(() => {});
      await prisma.job.delete({ where: { id: testJobId } }).catch(() => {});
    }
    if (testRecruiter1Id) {
      await prisma.user.delete({ where: { id: testRecruiter1Id } }).catch(() => {});
    }
    if (testRecruiter2Id) {
      await prisma.user.delete({ where: { id: testRecruiter2Id } }).catch(() => {});
    }
    console.log('\n🧹 Registros de teste limpos com sucesso.');
    await pool.end();
  }

  console.log('\n================================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS: ${allPassed ? '✅ SISTEMA DE ATRIBUIÇÃO 100% OPERACIONAL' : '❌ FALHAS DETECTADAS'}`);
  console.log('================================================================\n');
}

runJobRecruiterAssignmentTests();
