async function runOnlineCheck() {
  console.log("==========================================================");
  console.log("🌐 TESTANDO CONSOLIDAÇÃO DIRETAMENTE NO AMBIENTE ONLINE");
  console.log("==========================================================\n");

  const baseUrl = "https://maitreconecta.vercel.app";

  // 1. Testar obtenção de CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const initialCookies = csrfRes.headers.getSetCookie();
  console.log(`✓ CSRF Token obtido com sucesso: ${csrfData.csrfToken ? "SIM" : "NÃO"}`);

  // Montar cookie header
  let cookieJar = initialCookies.map(c => c.split(";")[0]).join("; ");

  // 2. Fazer login via credentials
  const formParams = new URLSearchParams();
  formParams.append("csrfToken", csrfData.csrfToken);
  formParams.append("email", "admin@maitrework.com.br");
  formParams.append("password", "123456");
  formParams.append("callbackUrl", `${baseUrl}/employees`);
  formParams.append("json", "true");

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieJar,
    },
    body: formParams.toString(),
  });

  const loginData = await loginRes.json().catch(() => ({}));
  const loginSetCookies = loginRes.headers.getSetCookie();
  const allCookies = [...initialCookies, ...loginSetCookies].map(c => c.split(";")[0]).join("; ");

  console.log(`✓ Resposta do Login:`, loginData);
  console.log(`✓ Cookies recebidos: ${loginSetCookies.length}`);

  // 3. Checar sessão
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { "Cookie": allCookies },
  });
  const sessionData = await sessionRes.json();
  console.log(`✓ Sessão ativa online:`, sessionData);

  // 4. Testar página /employees online
  const employeesPageRes = await fetch(`${baseUrl}/employees`, {
    headers: { "Cookie": allCookies },
  });
  const employeesHtml = await employeesPageRes.text();
  console.log(`\n✓ Página /employees online: HTTP ${employeesPageRes.status} (Tamanho: ${employeesHtml.length} bytes)`);
  console.log(`  - Redirecionou para login: ${employeesHtml.includes("Entrar no Maître Conecta")}`);
  console.log(`  - Adriana Pinheiro presente: ${employeesHtml.includes("Adriana Pinheiro")}`);
  console.log(`  - Sócia-Diretora presente: ${employeesHtml.includes("Sócia-Diretora")}`);
  console.log(`  - Pedro Atuan presente: ${employeesHtml.includes("Pedro Atuan")}`);
  console.log(`  - Analista de DHO presente: ${employeesHtml.includes("Analista de DHO")}`);
  console.log(`  - Erika Carla presente: ${employeesHtml.includes("Erika Carla")}`);
  console.log(`  - Assistente de Operações presente: ${employeesHtml.includes("Assistente de Operações")}`);
  console.log(`  - Lauriana Ferreira presente: ${employeesHtml.includes("Lauriana Ferreira")}`);
  console.log(`  - Analista de Operações presente: ${employeesHtml.includes("Analista de Operações")}`);
  console.log(`  - Kheviany Ramos presente: ${employeesHtml.includes("Kheviany Ramos")}`);
  console.log(`  - Analista de RH presente: ${employeesHtml.includes("Analista de RH")}`);
  console.log(`  - Emidio presente: ${employeesHtml.includes("Emidio")}`);
  console.log(`  - Consultor de Processos presente: ${employeesHtml.includes("Consultor de Processos")}`);

  // 5. Testar página /jobs online
  const jobsPageRes = await fetch(`${baseUrl}/jobs`, {
    headers: { "Cookie": allCookies },
  });
  const jobsHtml = await jobsPageRes.text();
  console.log(`\n✓ Página /jobs online: HTTP ${jobsPageRes.status} (Tamanho: ${jobsHtml.length} bytes)`);
  console.log(`  - Nenhuma vaga fake de Desenvolvedor: ${!jobsHtml.includes("Desenvolvedor Full Stack")}`);
  console.log(`  - Estado de vagas limpo: ${jobsHtml.includes("Nenhuma vaga encontrada") || jobsHtml.includes("Nenhuma vaga") || !jobsHtml.includes("Desenvolvedor")}`);
}

runOnlineCheck().catch(console.error);
