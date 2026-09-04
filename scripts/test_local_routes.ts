async function testLocalJobs() {
  const baseUrl = "http://localhost:3000";

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
  console.log("Cookies locais após login:", Object.keys(cookieMap));

  // 3. Requisitar /jobs
  const jobsRes = await fetch(`${baseUrl}/jobs`, {
    headers: { "Cookie": authCookieHeader },
  });

  console.log("Status /jobs local:", jobsRes.status);
  if (jobsRes.status !== 200) {
    const text = await jobsRes.text();
    console.log("Corpo /jobs:", text.slice(0, 500));
  }

  // 4. Requisitar /employees
  const empRes = await fetch(`${baseUrl}/employees`, {
    headers: { "Cookie": authCookieHeader },
  });
  console.log("Status /employees local:", empRes.status);
  const empText = await empRes.text();
  console.log("Adriana no /employees local:", empText.includes("Adriana"));
  if (!empText.includes("Adriana")) {
    console.log("Trecho de /employees:", empText.slice(0, 800));
  }
}

testLocalJobs().catch(console.error);
