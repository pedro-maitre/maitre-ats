async function diagnose() {
  const baseUrl = "http://localhost:3000";

  // Login local
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfCookie = csrfRes.headers.get("set-cookie") || "";
  const csrf = await csrfRes.json();

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie,
    },
    body: `csrfToken=${encodeURIComponent(csrf.csrfToken)}&email=admin@maitrework.com.br&password=123456&json=true`,
    redirect: "manual",
  });

  const sessionToken = loginRes.headers.getSetCookie().find((c) => c.includes("session-token"));
  const authCookie = sessionToken ? sessionToken.split(";")[0] : "";

  const problemRoutes = [
    "/jobs",
    "/candidates",
    "/learning",
    "/insights",
    "/users",
    "/settings/organization",
  ];

  console.log("DIAGNÓSTICO LOCAL DAS ROTAS 500:");
  for (const route of problemRoutes) {
    try {
      const res = await fetch(`${baseUrl}${route}`, {
        headers: { "Cookie": authCookie },
      });
      console.log(`\n--- ROTA ${route}: HTTP ${res.status} ---`);
      if (res.status !== 200) {
        const text = await res.text();
        console.log("Trecho de erro:", text.slice(0, 1000));
      }
    } catch (e: any) {
      console.log(`Erro ao chamar ${route}:`, e.message);
    }
  }
}

diagnose().catch(console.error);
