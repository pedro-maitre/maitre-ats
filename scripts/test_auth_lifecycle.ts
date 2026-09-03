import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authOptions } from "../src/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runAuthTests() {
  console.log("===============================================================");
  console.log("🔐 TESTES DE MANUTENÇÃO ONLINE: AUTENTICAÇÃO E PERSISTÊNCIA");
  console.log("===============================================================\n");

  let passed = 0;
  let total = 0;

  try {
    // 1. Verificar se usuário admin existe
    total++;
    const adminUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      include: { organization: true },
    });

    if (adminUser) {
      console.log(`✅ [PASS] 1. Usuário administrativo encontrado: ${adminUser.email} (Role: ${adminUser.role})`);
      passed++;
    } else {
      console.log("❌ [FAIL] 1. Nenhum usuário SUPER_ADMIN encontrado.");
    }

    // 2. Testar authorize callback do CredentialsProvider com credenciais exatas
    total++;
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === "credentials" || p.name === "Credentials"
    ) as any;

    if (!credentialsProvider) {
      throw new Error("CredentialsProvider não localizado em authOptions.");
    }

    const authorizeFunc = credentialsProvider.options?.authorize || credentialsProvider.authorize;

    // Simular login com senha padrão cadastrada
    const authResult = await authorizeFunc({
      email: adminUser?.email,
      password: "123456", // senha de seed padrão ("123456")
    });

    if (authResult && authResult.email === adminUser?.email) {
      console.log(`✅ [PASS] 2. Authorize com sucesso para ${authResult.email} (Org: ${authResult.organizationName || "N/A"})`);
      passed++;
    } else {
      console.log("❌ [FAIL] 2. Falha no authorize com credenciais corretas.");
    }

    // 3. Testar authorize com e-mail em MAIÚSCULAS e com espaços (Case-Insensitivity & Trim)
    total++;
    const uppercaseEmail = `  ${adminUser?.email.toUpperCase()}  `;
    const caseAuthResult = await authorizeFunc({
      email: uppercaseEmail,
      password: "123456",
    });

    if (caseAuthResult && caseAuthResult.id === adminUser?.id) {
      console.log(`✅ [PASS] 3. Normalização de e-mail (Trim & Insensitive) validada para: "${uppercaseEmail}"`);
      passed++;
    } else {
      console.log("❌ [FAIL] 3. Falha no authorize com e-mail em maiúsculas.");
    }

    // 4. Testar bloqueio com senha incorreta
    total++;
    try {
      await authorizeFunc({
        email: adminUser?.email,
        password: "wrong-password-999",
      });
      console.log("❌ [FAIL] 4. Permitiu login com senha incorreta!");
    } catch (err: any) {
      if (err.message?.includes("incorretos")) {
        console.log("✅ [PASS] 4. Bloqueio correto de senha incorreta capturado.");
        passed++;
      } else {
        console.log("❌ [FAIL] 4. Erro inesperado:", err.message);
      }
    }

    // 5. Testar callbacks jwt() e session() do NextAuth
    total++;
    const initialToken: any = {};
    const jwtResult = await authOptions.callbacks!.jwt!({
      token: initialToken,
      user: authResult as any,
      account: null as any,
    });

    const sessionObj: any = { user: {}, expires: new Date(Date.now() + 86400000).toISOString() };
    const sessionResult = await authOptions.callbacks!.session!({
      session: sessionObj,
      token: jwtResult,
      user: authResult as any,
      newSession: null as any,
      trigger: "update" as any,
    });

    const userObj = sessionResult?.user as any;
    const isSessionComplete =
      userObj?.id === adminUser?.id &&
      userObj?.role === "SUPER_ADMIN" &&
      userObj?.email === adminUser?.email;

    if (isSessionComplete) {
      console.log(`✅ [PASS] 5. Geração de JWT e Sessão enriquecida validada (Role: ${userObj?.role}, ID: ${userObj?.id})`);
      passed++;
    } else {
      console.log("❌ [FAIL] 5. Sessão gerada incompleta:", sessionResult);
    }

    // 6. Verificar persistência de 30 dias na configuração de sessão
    total++;
    if (authOptions.session?.maxAge === 30 * 24 * 60 * 60 && authOptions.jwt?.maxAge === 30 * 24 * 60 * 60) {
      console.log("✅ [PASS] 6. Sessão configurada com persistência ativa de 30 dias (2.592.000 segundos).");
      passed++;
    } else {
      console.log("❌ [FAIL] 6. maxAge de sessão não configurado para 30 dias.");
    }

  } catch (err: any) {
    console.error("Erro nos testes de autenticação:", err);
  } finally {
    await pool.end();
  }

  console.log("\n===============================================================");
  console.log(`📊 RESULTADOS: ${passed}/${total} TESTES PASSARAM`);
  console.log(`STATUS: ${passed === total ? "✅ AUTENTICAÇÃO E PERSISTÊNCIA 100% OPERACIONAIS" : "❌ FALHAS DETECTADAS"}`);
  console.log("===============================================================");
}

runAuthTests();
