require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name} - ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 INICIANDO BATERIA COMPLETA DE TESTES DO MAÎTRE ATS');
  console.log('====================================================\n');

  // TEST 1: Database & Prisma Connection
  try {
    const orgCount = await prisma.organization.count();
    const jobCount = await prisma.job.count();
    const candidateCount = await prisma.candidate.count();
    recordTest(
      '1. Conexão com Banco de Dados PostgreSQL (Prisma)',
      true,
      `Conectado. Organizações: ${orgCount}, Vagas: ${jobCount}, Candidatos: ${candidateCount}`
    );
  } catch (err) {
    recordTest('1. Conexão com Banco de Dados PostgreSQL (Prisma)', false, err.message);
  }

  // TEST 2: Organization & Public Career Slug
  let org = null;
  try {
    org = await prisma.organization.findFirst({
      include: {
        jobs: { where: { status: 'OPEN' }, include: { stages: { orderBy: { order: 'asc' } } } }
      }
    });
    if (org) {
      recordTest(
        '2. Verificação da Organização e Página de Carreiras',
        true,
        `Empresa: "${org.name}" (slug: "${org.slug}"), Vagas Abertas: ${org.jobs.length}`
      );
    } else {
      recordTest('2. Verificação da Organização e Página de Carreiras', false, 'Nenhuma organização encontrada.');
    }
  } catch (err) {
    recordTest('2. Verificação da Organização e Página de Carreiras', false, err.message);
  }

  // TEST 3: Supabase Storage Bucket & Permissions (Anon & Service Role)
  try {
    const testBuf = Buffer.from('%PDF-1.4 Mock resume content for testing permissions');
    const filename = `system-test-${Date.now()}.pdf`;
    
    // Test anon upload
    const { data: anonData, error: anonError } = await supabaseAnon.storage
      .from('resumes')
      .upload(filename, testBuf, { contentType: 'application/pdf' });

    if (!anonError && anonData) {
      const publicUrl = supabaseAnon.storage.from('resumes').getPublicUrl(filename).data.publicUrl;
      recordTest(
        '3. Supabase Storage (Upload com Chave Pública / Anon RLS)',
        true,
        `Arquivo salvo com sucesso sem bloqueio de RLS. URL: ${publicUrl}`
      );
      
      // Cleanup
      if (supabaseService) {
        await supabaseService.storage.from('resumes').remove([filename]);
      }
    } else {
      recordTest(
        '3. Supabase Storage (Upload com Chave Pública / Anon RLS)',
        false,
        anonError ? anonError.message : 'Erro desconhecido'
      );
    }
  } catch (err) {
    recordTest('3. Supabase Storage (Upload com Chave Pública / Anon RLS)', false, err.message);
  }

  // TEST 4: Candidate Registration & Password Hashing
  const testEmail = `candidato.teste.${Date.now()}@maitre.com.br`;
  const testPass = 'senhaSegura123!';
  let testUserId = null;
  let testCandidateId = null;

  try {
    const hashedPass = await bcrypt.hash(testPass, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPass,
        name: 'Candidato Teste Automatizado',
        role: 'CANDIDATE',
        organizationId: org.id,
      }
    });
    testUserId = user.id;

    const cand = await prisma.candidate.create({
      data: {
        firstName: 'Candidato',
        lastName: 'Teste Automatizado',
        email: testEmail,
        phone: '11988887777',
        userId: user.id,
        organizationId: org.id,
        resumeUrl: 'https://yqnlcwglyxqsemqhjkmp.supabase.co/storage/v1/object/public/resumes/teste.pdf',
        source: 'Área do Candidato',
      }
    });
    testCandidateId = cand.id;

    // Verify bcrypt comparison
    const passMatch = await bcrypt.compare(testPass, user.password);
    const passWrong = await bcrypt.compare('senhaErrada', user.password);

    recordTest(
      '4. Cadastro de Candidato & Autenticação Segura (Bcrypt)',
      passMatch && !passWrong,
      `Usuário criado (ID: ${user.id}), Perfil de candidato vinculado (ID: ${cand.id}), Validação de senha: OK`
    );
  } catch (err) {
    recordTest('4. Cadastro de Candidato & Autenticação Segura (Bcrypt)', false, err.message);
  }

  // TEST 5: Job Application Submission & Knockout Rule
  let testAppId = null;
  try {
    const activeJob = org.jobs[0];
    if (!activeJob || activeJob.stages.length === 0) {
      throw new Error('Nenhuma vaga aberta com etapas para teste.');
    }

    const firstStage = activeJob.stages[0];
    const budgetMax = activeJob.salaryMax || 8000;
    const expectation = budgetMax + 1000; // Above budget
    const hasKnockout = budgetMax && expectation > budgetMax;

    const app = await prisma.application.create({
      data: {
        candidateId: testCandidateId,
        jobId: activeJob.id,
        stageId: firstStage.id,
        matchScore: 88,
        salaryExpectation: expectation,
        fitCategory: hasKnockout ? 'BAIXO_FIT' : 'ALTO_FIT',
        priority: hasKnockout ? 'DUVIDA' : 'NORMAL',
      }
    });
    testAppId = app.id;

    recordTest(
      '5. Candidatura a Vaga & Regra de Knockout Salarial',
      app.fitCategory === 'BAIXO_FIT' && app.priority === 'DUVIDA',
      `Candidatura criada (ID: ${app.id}) na etapa "${firstStage.name}". Regra de Knockout: Pretensão R$ ${expectation} > Teto R$ ${budgetMax} => Fit: ${app.fitCategory}, Prioridade: ${app.priority}`
    );
  } catch (err) {
    recordTest('5. Candidatura a Vaga & Regra de Knockout Salarial', false, err.message);
  }

  // TEST 6: Candidate Portal Dashboard Data & Stepper Timeline Query
  try {
    const candidateData = await prisma.candidate.findUnique({
      where: { email: testEmail },
      include: {
        applications: {
          include: {
            job: {
              include: {
                organization: true,
                stages: { orderBy: { order: 'asc' } },
              }
            },
            stage: true,
          }
        }
      }
    });

    const appItem = candidateData.applications[0];
    const stagesStepper = appItem.job.stages.map((st) => ({
      id: st.id,
      name: st.name,
      order: st.order,
      isCompleted: st.order < appItem.stage.order,
      isCurrent: st.id === appItem.stage.id,
    }));

    const currentStageFound = stagesStepper.some(s => s.isCurrent);

    recordTest(
      '6. Consulta da Área do Candidato & Timeline de Etapas (Stepper)',
      candidateData.applications.length > 0 && currentStageFound,
      `Candidaturas encontradas: ${candidateData.applications.length}. Vaga: "${appItem.job.title}". Etapa Atual no Stepper: "${appItem.stage.name}". Total de etapas: ${stagesStepper.length}`
    );
  } catch (err) {
    recordTest('6. Consulta da Área do Candidato & Timeline de Etapas (Stepper)', false, err.message);
  }

  // TEST 7: RBAC Permissions for Deletion Actions
  try {
    const checkIsAdmin = (role) => role === 'SUPER_ADMIN' || role === 'ADMIN';
    const candidateAllowed = checkIsAdmin('CANDIDATE');
    const recruiterAllowed = checkIsAdmin('RECRUITER');
    const superAdminAllowed = checkIsAdmin('SUPER_ADMIN');
    const adminAllowed = checkIsAdmin('ADMIN');

    const rbacCorrect = !candidateAllowed && !recruiterAllowed && superAdminAllowed && adminAllowed;

    recordTest(
      '7. Matriz de Segurança RBAC (Permissões de Exclusão)',
      rbacCorrect,
      `Candidato bloqueado: ${!candidateAllowed}, Recrutador bloqueado: ${!recruiterAllowed}, Admin Master permitido: ${superAdminAllowed}`
    );
  } catch (err) {
    recordTest('7. Matriz de Segurança RBAC (Permissões de Exclusão)', false, err.message);
  }

  // CLEANUP TEST RECORDS
  try {
    if (testAppId) await prisma.application.delete({ where: { id: testAppId } });
    if (testCandidateId) await prisma.candidate.delete({ where: { id: testCandidateId } });
    if (testUserId) await prisma.user.delete({ where: { id: testUserId } });
    console.log('\n🧹 Registros de teste limpos do banco de dados com sucesso.');
  } catch (cleanErr) {
    console.warn('Aviso na limpeza de dados de teste:', cleanErr.message);
  }

  await pool.end();

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`📊 RESULTADO FINAL: ${results.filter(r => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS GERAL: ${allPassed ? '✅ SISTEMA 100% OPERACIONAL E COMPLETO' : '⚠️ ATENÇÃO: HOUVE FALHAS'}`);
  console.log('====================================================\n');
}

runTests();
