import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runUserManagementTests() {
  console.log("====================================================");
  console.log("👥 TESTES AUTOMATIZADOS: GESTÃO DE USUÁRIOS (CRIAÇÃO & EXCLUSÃO)");
  console.log("====================================================\n");

  let passed = 0;
  let total = 0;

  const testEmail = `test.recruiter.${Date.now()}@maitre.com.br`;
  let createdUserId = "";

  try {
    // Obter ou criar organização
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Maître Teste", slug: "maitre-test" },
      });
    }

    // TESTE 1: Criação de Usuário com Senha Criptografada (Bcrypt) e Role RECRUITER
    total++;
    const plainPassword = "SenhaForte123@";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: "Recrutador Teste Auto",
        email: testEmail,
        password: hashedPassword,
        role: "RECRUITER",
        organizationId: org.id,
      },
      include: {
        organization: true,
      },
    });

    createdUserId = newUser.id;

    if (newUser.id && newUser.email === testEmail && newUser.role === "RECRUITER") {
      console.log(`✅ [PASS] 1. Criação de Usuário - ID: ${newUser.id}, Email: ${newUser.email}, Role: ${newUser.role}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] 1. Falha na criação do usuário.`);
    }

    // TESTE 2: Validação da Senha com Bcrypt
    total++;
    const isPasswordValid = await bcrypt.compare(plainPassword, newUser.password!);
    const isWrongPasswordInvalid = !(await bcrypt.compare("SenhaIncorreta", newUser.password!));

    if (isPasswordValid && isWrongPasswordInvalid) {
      console.log(`✅ [PASS] 2. Validação Criptográfica de Senha (Bcrypt) - Hash válido e autenticação confirmada.`);
      passed++;
    } else {
      console.error(`❌ [FAIL] 2. Falha na validação da senha com bcrypt.`);
    }

    // TESTE 3: Detecção de E-mail Duplicado
    total++;
    let caughtDuplicate = false;
    try {
      await prisma.user.create({
        data: {
          name: "Outro Usuário",
          email: testEmail, // Mesmo e-mail
          password: hashedPassword,
          role: "RECRUITER",
          organizationId: org.id,
        },
      });
    } catch (err: any) {
      caughtDuplicate = true;
    }

    if (caughtDuplicate) {
      console.log(`✅ [PASS] 3. Unicidade de E-mail - Bloqueio de duplicata verificado.`);
      passed++;
    } else {
      console.error(`❌ [FAIL] 3. Falha: Permitiu cadastrar e-mail duplicado.`);
    }

    // TESTE 4: Atualização de Nível de Acesso (Promover para SUPER_ADMIN)
    total++;
    const updatedUser = await prisma.user.update({
      where: { id: createdUserId },
      data: {
        name: "Recrutador Promovido",
        role: "SUPER_ADMIN",
      },
    });

    if (updatedUser.role === "SUPER_ADMIN" && updatedUser.name === "Recrutador Promovido") {
      console.log(`✅ [PASS] 4. Atualização de Dados e Cargo - Promovido para SUPER_ADMIN com sucesso.`);
      passed++;
    } else {
      console.error(`❌ [FAIL] 4. Falha ao atualizar cargo do usuário.`);
    }

    // TESTE 5: Criação de Vaga vinculada ao Recrutador e Exclusão Segura
    total++;
    const testJob = await prisma.job.create({
      data: {
        title: "Vaga Teste Recrutador",
        description: "Vaga para testar desacoplamento",
        status: "OPEN",
        organizationId: org.id,
        recruiterId: createdUserId,
      },
    });

    // Simular rotina de exclusão segura (desacoplamento em transaction)
    await prisma.$transaction(async (tx) => {
      await tx.job.updateMany({
        where: { recruiterId: createdUserId },
        data: { recruiterId: null },
      });
      await tx.user.delete({
        where: { id: createdUserId },
      });
    });

    const verifyDeleted = await prisma.user.findUnique({
      where: { id: createdUserId },
    });

    const verifyJobUnlinked = await prisma.job.findUnique({
      where: { id: testJob.id },
    });

    // Limpar vaga de teste
    await prisma.job.delete({ where: { id: testJob.id } });

    if (!verifyDeleted && verifyJobUnlinked?.recruiterId === null) {
      console.log(`✅ [PASS] 5. Exclusão Segura & Desacoplamento de Vagas - Usuário removido e vaga desacoplada.`);
      passed++;
    } else {
      console.error(`❌ [FAIL] 5. Falha na exclusão segura do usuário.`);
    }

  } catch (error) {
    console.error("❌ Erro fatal durante a execução dos testes:", error);
  } finally {
    await pool.end();
  }

  console.log("\n====================================================");
  console.log(`📊 RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM`);
  if (passed === total) {
    console.log("STATUS GERAL: ✅ TODOS OS TESTES DE GESTÃO DE USUÁRIOS PASSARAM COM SUCESSO!");
  } else {
    console.log("STATUS GERAL: ⚠️ ALGUNS TESTES FALHARAM");
  }
  console.log("====================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runUserManagementTests();
