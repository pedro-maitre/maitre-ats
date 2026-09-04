async function testJobsError() {
  const baseUrl = "https://maitreconecta.vercel.app";

  // 1. Pegar CSRF
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie();

  let cookieMap: Record<string, string> = {};
  for (const c of csrfCookies) {
    const [name, val] = c.split(";")[0].split("=");
    cookieMap[name.trim()] = val ? val.trim() : "";
  }

  // 2. Login
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

  const authCookieHeader = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join("; ");
  console.log("Cookies após login:", Object.keys(cookieMap));

  // 3. Requisitar /jobs
  const jobsRes = await fetch(`${baseUrl}/jobs`, {
    headers: { "Cookie": authCookieHeader },
  });

  console.log("Status /jobs:", jobsRes.status);
  const jobsText = await jobsRes.text();
  console.log("Corpo /jobs (primeiros 1000 chars):", jobsText.slice(0, 1000));

  // 4. Requisitar /employees
  const empRes = await fetch(`${baseUrl}/employees`, {
    headers: { "Cookie": authCookieHeader },
  });
  console.log("\nStatus /employees:", empRes.status);
  const empText = await empRes.text();
  console.log("Corpo /employees (primeiros 1000 chars):", empText.slice(0, 1000));
  console.log("Adriana no /employees:", empText.includes("Adriana"));
}

testJobsError().catch(console.error);
