import { prisma } from "../src/lib/prisma";

async function inspect() {
  console.log("=== INSPEÇÃO DETALHADA DO BANCO DE DADOS ===");

  const orgs = await prisma.organization.findMany();
  console.log(`\n🏢 Organizações (${orgs.length}):`);
  for (const o of orgs) {
    console.log(` - [${o.id}] ${o.name} (slug: ${o.slug}, master: ${o.isMaster})`);
  }

  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, jobTitle: true, department: true } });
  console.log(`\n👥 Usuários (${users.length}):`);
  for (const u of users) {
    console.log(` - ${u.email} | ${u.name} | Role: ${u.role} | Cargo: ${u.jobTitle} | Dept: ${u.department}`);
  }

  const employees = await prisma.employee.findMany({
    include: { department: true, position: true }
  });
  console.log(`\n👔 Colaboradores (Employee) (${employees.length}):`);
  for (const e of employees) {
    console.log(` - ${e.registrationNumber}: ${e.fullName} (${e.email}) | Dept: ${e.department?.name || "N/A"} | Cargo: ${e.position?.title || "N/A"}`);
  }

  const jobs = await prisma.job.findMany({
    include: { _count: { select: { applications: true, stages: true } } }
  });
  console.log(`\n💼 Vagas (Jobs) (${jobs.length}):`);
  for (const j of jobs) {
    console.log(` - [${j.id}] ${j.title} | Status: ${j.status} | Dept: ${j.department} | Inscrições: ${j._count.applications} | Estágios: ${j._count.stages}`);
  }

  const candidates = await prisma.candidate.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, _count: { select: { applications: true } } }
  });
  console.log(`\n👤 Candidatos (${candidates.length}):`);
  for (const c of candidates) {
    console.log(` - [${c.id}] ${c.firstName} ${c.lastName} (${c.email}) | Candidaturas: ${c._count.applications}`);
  }

  const apps = await prisma.application.count();
  const stages = await prisma.stage.count();
  const docs = await prisma.document.count();
  const courses = await prisma.course.count();
  const enrollments = await prisma.courseEnrollment.count();
  const surveys = await prisma.climateSurvey.count();
  const responses = await prisma.surveyResponse.count();
  const recognitions = await prisma.cultureRecognition.count();
  const evals = await prisma.performanceEvaluation.count();
  const pdis = await prisma.developmentPlan.count();
  const conversions = await prisma.hireConversion.count();
  const offers = await prisma.offer.count();

  console.log(`\n📊 Contadores Globais:`);
  console.log(` - Candidaturas (Application): ${apps}`);
  console.log(` - Estágios (Stage): ${stages}`);
  console.log(` - Propostas (Offer): ${offers}`);
  console.log(` - Admissões (HireConversion): ${conversions}`);
  console.log(` - Documentos (Document): ${docs}`);
  console.log(` - Cursos: ${courses} | Inscrições: ${enrollments}`);
  console.log(` - Pesquisas de Clima: ${surveys} | Respostas: ${responses}`);
  console.log(` - Reconhecimentos Mural: ${recognitions}`);
  console.log(` - Avaliações 9-Box: ${evals} | PDIs: ${pdis}`);
}

inspect()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
