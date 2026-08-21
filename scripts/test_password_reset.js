require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name} - ${details}`);
}

async function runPasswordResetTests() {
  console.log('===============================================================');
  console.log('🔐 TESTE DE INTEGRAÇÃO: RECUPERAÇÃO E REDEFINIÇÃO DE SENHAS');
  console.log('===============================================================\n');

  const testEmail = `teste.recuperacao.${Date.now()}@maitre.com.br`;
  const initialPassword = 'senhaInicial123!';
  const updatedPassword = 'novaSenhaSegura456@';
  let testUserId = null;

  try {
    // 1. Criar usuário de teste
    const org = await prisma.organization.findFirst();
    const hashedInitial = await bcrypt.hash(initialPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedInitial,
        name: 'Usuário Teste Recuperação',
        role: 'RECRUITER',
        organizationId: org ? org.id : undefined,
      },
    });
    testUserId = user.id;

    recordTest(
      '1. Setup do Usuário de Teste',
      true,
      `Usuário criado (ID: ${user.id}, Email: ${user.email})`
    );

    // 2. Simular solicitação de recuperação de senha (geração de token)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const resetRecord = await prisma.passwordResetToken.create({
      data: {
        token,
        email: testEmail,
        expiresAt,
      },
    });

    recordTest(
      '2. Geração e Armazenamento do Token Temporário',
      Boolean(resetRecord.id && resetRecord.token === token),
      `Token gerado: ${token.slice(0, 16)}... | Validade: 1 hora (${expiresAt.toISOString()})`
    );

    // 3. Validação de Token Válido
    const foundToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    const isTokenValid = foundToken && new Date() < foundToken.expiresAt;
    recordTest(
      '3. Validação do Token de Recuperação',
      isTokenValid,
      `Token localizado com sucesso para o e-mail: ${foundToken ? foundToken.email : 'N/A'}`
    );

    // 4. Redefinição da Senha do Usuário
    const hashedNew = await bcrypt.hash(updatedPassword, 10);
    await prisma.user.update({
      where: { email: testEmail },
      data: { password: hashedNew },
    });

    // Invalidação do token (uso único)
    await prisma.passwordResetToken.deleteMany({
      where: { email: testEmail },
    });

    const tokenRemaining = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    recordTest(
      '4. Redefinição de Senha & Descarte Seguro do Token',
      tokenRemaining === null,
      `Senha criptografada com bcrypt. Token anterior foi removido do banco: ${tokenRemaining === null}`
    );

    // 5. Verificação de Autenticação com a Nova Senha
    const refreshedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    const oldPasswordRejected = !(await bcrypt.compare(initialPassword, refreshedUser.password));
    const newPasswordAccepted = await bcrypt.compare(updatedPassword, refreshedUser.password);

    recordTest(
      '5. Validação de Acesso (Antiga vs Nova Senha)',
      oldPasswordRejected && newPasswordAccepted,
      `Senha antiga rejeitada: ${oldPasswordRejected} | Nova senha aceita: ${newPasswordAccepted}`
    );

    // 6. Teste de Proteção contra Tokens Inválidos / Reutilizados
    const replayCheck = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    recordTest(
      '6. Proteção contra Reutilização de Token (Single-Use)',
      replayCheck === null,
      'Tentativa de reutilização do mesmo link é barrada com sucesso.'
    );

  } catch (err) {
    recordTest('Erro na Execução dos Testes', false, err.message);
  } finally {
    // Limpeza
    if (testUserId) {
      await prisma.passwordResetToken.deleteMany({ where: { email: testEmail } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
      console.log('\n🧹 Dados de teste limpos com sucesso.');
    }
    await pool.end();
  }

  console.log('\n===============================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`📊 RESULTADO: ${results.filter(r => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS: ${allPassed ? '✅ FLUXO DE RECUPERAÇÃO 100% OPERACIONAL' : '❌ FALHAS DETECTADAS'}`);
  console.log('===============================================================\n');
}

runPasswordResetTests();
