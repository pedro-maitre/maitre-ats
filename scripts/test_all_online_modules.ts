async function testAllOnlineModules() {
  console.log("==========================================================");
  console.log("🌐 VALIDAÇÃO GERAL DE TODOS OS MÓDULOS ONLINE NO VERCEL");
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

  // 3. Rotas a testar
  const routes = [
    { path: "/", name: "Painel Executivo Geral" },
    { path: "/jobs", name: "Vagas & Processos Seletivos" },
    { path: "/candidates", name: "Banco de Talentos" },
    { path: "/employees", name: "Core HR (Colaboradores)" },
    { path: "/development", name: "Conecta Desenvolvimento (9-Box & PDI)" },
    { path: "/operations", name: "Conecta Operações (Admissão Digital)" },
    { path: "/learning", name: "Conecta Aprendizagem (LMS & Cursos)" },
    { path: "/culture", name: "Conecta Cultura (Pesquisa de Clima)" },
    { path: "/insights", name: "Conecta Insights (People Analytics)" },
    { path: "/consulting", name: "Conecta Consultoria (Projetos)" },
    { path: "/clients", name: "Empresas Clientes" },
    { path: "/users", name: "Gestão de Usuários & RBAC" },
    { path: "/settings/organization", name: "Perfil da Maître Consultoria" },
    { path: "/carreiras/maitre", name: "Portal Público de Carreiras (White-label)" },
  ];

  console.log("Status de cada módulo online:");
  for (const r of routes) {
    try {
      const res = await fetch(`${baseUrl}${r.path}`, {
        headers: r.path.startsWith("/carreiras") ? {} : { "Cookie": authHeader },
      });
      console.log(`  - [HTTP ${res.status}] ${r.name.padEnd(45)} -> ${res.status === 200 ? "✅ ONLINE" : "⚠️ " + res.status}`);
    } catch (e: any) {
      console.log(`  - [ERRO] ${r.name.padEnd(45)} -> ${e.message}`);
    }
  }

  console.log("\n==========================================================");
  console.log("🎉 AUDITORIA COMPLETA DE TODOS OS MÓDULOS CONCLUÍDA!");
  console.log("==========================================================");
}

testAllOnlineModules().catch(console.error);
