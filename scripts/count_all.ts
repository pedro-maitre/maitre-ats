import { prisma } from "../src/lib/prisma";

async function countAll() {
  const models = [
    "organization",
    "user",
    "organizationMembership",
    "job",
    "stage",
    "candidate",
    "application",
    "applicationStageTransition",
    "interview",
    "scorecard",
    "offer",
    "hireConversion",
    "document",
    "candidateConsent",
    "retentionPolicy",
    "dataSubjectRequest",
    "evaluation",
    "activity",
    "climateSurvey",
    "surveyResponse",
    "cultureRecognition",
    "course",
    "courseEnrollment",
    "department",
    "position",
    "employee",
    "consultingProject",
    "projectDeliverable",
    "successionPlan",
    "successionCandidate",
  ];

  console.log("=== CONTAGEM COMPLETA DO BANCO ===");
  for (const m of models) {
    try {
      const count = await (prisma as any)[m].count();
      console.log(` - ${m}: ${count}`);
    } catch (e: any) {
      console.log(` - ${m}: ERRO (${e.message})`);
    }
  }
}

countAll()
  .then(() => prisma.$disconnect())
  .catch(console.error);
