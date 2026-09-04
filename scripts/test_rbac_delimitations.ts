import { prisma } from "../src/lib/prisma";
import { isSuperAdmin, isAdminOrAbove, isRecruiterOrAbove, isHiringManager, isCandidate } from "../src/lib/security";

async function runTests() {
  console.log("==================================================");
  console.log("🛡️ INICIANDO BATERIA DE TESTES DE DELIMITAÇÃO RBAC");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // TEST 1: Validação das funções de guards em security.ts
  console.log("--- 1. Validação de Guards & Hierarquia de Tipos ---");
  assert(isSuperAdmin("SUPER_ADMIN") && !isSuperAdmin("ADMIN"), "isSuperAdmin restrito a SUPER_ADMIN");
  assert(isAdminOrAbove("SUPER_ADMIN") && isAdminOrAbove("ADMIN") && !isAdminOrAbove("RECRUITER"), "isAdminOrAbove abrange SUPER_ADMIN e ADMIN apenas");
  assert(isRecruiterOrAbove("SUPER_ADMIN") && isRecruiterOrAbove("ADMIN") && isRecruiterOrAbove("RECRUITER") && !isRecruiterOrAbove("HIRING_MANAGER"), "isRecruiterOrAbove abrange operacional e diretoria");
  assert(isHiringManager("HIRING_MANAGER") && !isHiringManager("RECRUITER"), "isHiringManager restrito a HIRING_MANAGER");
  assert(isCandidate("CANDIDATE") && !isCandidate("RECRUITER"), "isCandidate restrito a CANDIDATE");

  // TEST 2: Validação dos usuários no Banco de Dados
  console.log("\n--- 2. Validação dos Papéis dos Usuários no Banco ---");
  const users = await prisma.user.findMany({
    select: { email: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u.role]));

  assert(userMap.get("admin@maitrework.com.br") === "SUPER_ADMIN", "admin@maitrework.com.br possui papel SUPER_ADMIN");
  assert(userMap.get("adriana@maitrework.com.br") === "ADMIN", "adriana@maitrework.com.br possui papel ADMIN (Diretoria)");
  assert(userMap.get("kheviany@maitrework.com.br") === "HIRING_MANAGER", "kheviany@maitrework.com.br possui papel HIRING_MANAGER (Cliente B2B)");
  assert(userMap.get("pedro@maitrework.com.br") === "RECRUITER", "pedro@maitrework.com.br possui papel RECRUITER");
  assert(userMap.get("erika@maitrework.com.br") === "RECRUITER", "erika@maitrework.com.br possui papel RECRUITER");

  // TEST 3: Verificação de que não há sobreposição de SUPER_ADMIN
  console.log("\n--- 3. Verificação de Integridade de Super Admins ---");
  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN");
  assert(superAdmins.length === 1 && superAdmins[0].email === "admin@maitrework.com.br", "Existe apenas 1 SUPER_ADMIN canônico no banco (admin@maitrework.com.br)");

  console.log("\n==================================================");
  console.log(`📊 RESULTADO FINAL: ${passed} passaram | ${failed} falharam`);
  console.log("==================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
