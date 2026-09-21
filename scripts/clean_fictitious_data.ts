import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🧹 Iniciando expurgo de dados fictícios e preparação da base real...");

  const results: Record<string, number> = {};

  // Lista ordenada por dependência reversa (filhos antes dos pais)
  const modelsToDeleteInOrder = [
    // 1. Logs de auditoria e atividades
    "auditEvent",
    "activity",
    // 2. Tarefas e Consultoria
    "taskReviewDecision",
    "taskAttachment",
    "taskComment",
    "taskChecklistItem",
    "internalSubtask",
    "taskMember",
    "internalTask",
    "weeklyMeeting",
    "consultingTimesheet",
    "projectDeliverable",
    "consultingProject",
    // 3. Clima e Cultura
    "surveyResponse",
    "climateSurvey",
    "cultureActionPlan",
    "cultureRecognition",
    // 4. Treinamentos e Cursos (dados transacionais)
    "courseQuestion",
    "courseQuiz",
    "trainingClass",
    "courseEnrollment",
    // 5. Sucessão e Planos
    "successionCandidate",
    "successionPlan",
    // 6. Avaliações e Planos de Desenvolvimento
    "performanceEvaluation",
    "developmentPlan",
    // 7. Processo Seletivo, Admissões, Conversões e Candidatos
    "hireConversion",
    "scorecard",
    "interview",
    "evaluation",
    "offer",
    "document",
    "candidateConsent",
    "dataSubjectRequest",
    "applicationStageTransition",
    "application",
    "internalApplication",
    "stage",
    "job",
    "candidate",
    // 8. Transações de RH / Férias / Afastamentos / Offboarding
    "employeeVacation",
    "employeeLeave",
    "employeePositionHistory",
    "offboardingProcess",
    // 9. Integrações e Notificações
    "internalNotification",
    "integrationOutbox"
  ];

  await prisma.$transaction(async (tx) => {
    for (const model of modelsToDeleteInOrder) {
      const delegate = (tx as any)[model];
      if (delegate && typeof delegate.deleteMany === "function") {
        const deleted = await delegate.deleteMany({});
        results[model] = deleted.count;
      } else {
        console.log(`ℹ️ Modelo '${model}' não encontrado no cliente Prisma, pulando.`);
      }
    }
  });

  console.log("✅ Limpeza transacional concluída com sucesso!");
  console.log("📊 Registros expurgados por entidade:");
  for (const [entity, count] of Object.entries(results)) {
    if (count > 0) {
      console.log(` - ${entity}: ${count} removido(s)`);
    }
  }

  // Verificação pós-limpeza dos dados mestres preservados
  const orgCount = await prisma.organization.count();
  const userCount = await prisma.user.count();
  const empCount = await prisma.employee.count();
  const deptCount = await prisma.department.count();
  const posCount = await prisma.position.count();
  const courseCount = await prisma.course.count();
  const candidateCount = await prisma.candidate.count();
  const jobCount = await prisma.job.count();

  console.log("\n🏛️ Estado Canônico da Base de Dados:");
  console.log(` - Organizações oficiais: ${orgCount}`);
  console.log(` - Departamentos oficiais: ${deptCount}`);
  console.log(` - Cargos oficiais: ${posCount}`);
  console.log(` - Usuários ativos: ${userCount}`);
  console.log(` - Colaboradores cadastrados: ${empCount}`);
  console.log(` - Cursos no catálogo: ${courseCount}`);
  console.log(` - Candidatos (ativos): ${candidateCount}`);
  console.log(` - Vagas (ativas): ${jobCount}`);
}

main()
  .catch((err) => {
    console.error("❌ Falha durante a limpeza do banco:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
