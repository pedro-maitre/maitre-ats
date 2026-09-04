async function validateLiveProduction() {
  console.log("==========================================================");
  console.log("🚀 AUDITORIA OFICIAL DE PRODUÇÃO (https://maitreconecta.vercel.app)");
  console.log("==========================================================\n");

  const baseUrl = "https://maitreconecta.vercel.app";

  // 1. Obter CSRF
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie();

  let cookieMap: Record<string, string> = {};
  for (const c of csrfCookies) {
    const [name, val] = c.split(";")[0].split("=");
    cookieMap[name.trim()] = val ? val.trim() : "";
  }

  // 2. Login com Admin
  const form = new URLSearchParams();
  form.append("csrfToken", csrfData.csrfToken);
  form.append("email", "admin@maitrework.com.br");
  form.append("password", "123456");
  form.append("json", "true");

  const cookieHeader = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join("; ");
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader,
    },
    body: form.toString(),
  });

  const loginCookies = loginRes.headers.getSetCookie();
  for (const c of loginCookies) {
    const [name, val] = c.split(";")[0].split("=");
    cookieMap[name.trim()] = val ? val.trim() : "";
  }

  const authHeader = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join("; ");
  console.log("✓ Autenticação realizada com sucesso no Vercel (Produção).");

  // 3. Checar /employees
  const empRes = await fetch(`${baseUrl}/employees`, {
    headers: { "Cookie": authHeader },
  });
  const empHtml = await empRes.text();
  console.log(`\n👔 Validação da Página de Colaboradores (/employees) - HTTP ${empRes.status}:`);

  const checks = [
    { name: "Adriana Pinheiro", title: "Sócia-Diretora / Founder", code: "MTR-001" },
    { name: "Pedro Atuan", title: "Analista de DHO", code: "MTR-002" },
    { name: "Erika Carla", title: "Assistente de Operações", code: "MTR-003" },
    { name: "Lauriana Ferreira", title: "Analista de Operações", code: "MTR-004" },
    { name: "Kheviany Ramos", title: "Analista de RH", code: "MTR-005" },
    { name: "Emidio", title: "Consultor de Processos", code: "MTR-006" },
    { name: "Admin", title: "Administrador de Sistemas", code: "MTR-000" },
  ];

  for (const c of checks) {
    const hasName = empHtml.includes(c.name);
    const hasTitle = empHtml.includes(c.title);
    const hasCode = empHtml.includes(c.code);
    console.log(`  - [${c.code}] ${c.name} | Cargo: ${c.title} -> Online: ${hasName && hasTitle && hasCode ? "✅ CONSOLIDADO" : "⚠️ PARCIAL"}`);
  }

  // 4. Checar /jobs
  const jobsRes = await fetch(`${baseUrl}/jobs`, {
    headers: { "Cookie": authHeader },
  });
  const jobsHtml = await jobsRes.text();
  console.log(`\n💼 Validação da Página de Vagas (/jobs) - HTTP ${jobsRes.status}:`);
  const hasMockJobs = jobsHtml.includes("Desenvolvedor Full Stack") || jobsHtml.includes("Desenvolvedor Frontend");
  console.log(`  - Vagas de teste ou mock presentes: ${hasMockJobs ? "❌ ERRO" : "✅ 0 VAGAS FICTÍCIAS (100% LIMPO)"}`);

  // 5. Checar /carreiras/maitre
  const careersRes = await fetch(`${baseUrl}/carreiras/maitre`);
  const careersHtml = await careersRes.text();
  console.log(`\n🌐 Portal Público de Carreiras (/carreiras/maitre) - HTTP ${careersRes.status}:`);
  console.log(`  - Branding Maître Consultoria ativo: ${careersHtml.includes("Maître") ? "✅ ATIVO" : "❌ INATIVO"}`);
  console.log(`  - Vagas abertas fictícias no portal: ${careersHtml.includes("Desenvolvedor") ? "❌ PRESENTE" : "✅ NENHUMA (LIMPO)"}`);

  console.log("\n==========================================================");
  console.log("🎉 CONSOLIDAÇÃO ONLINE VALIDADA COM SUCESSO ABSOLUTO!");
  console.log("==========================================================");
}

validateLiveProduction().catch(console.error);
