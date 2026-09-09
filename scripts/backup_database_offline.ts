import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

async function runBackup() {
  console.log("📦 Iniciando extração de backup frio de segurança (Onda 0)...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const [
    organizations,
    users,
    memberships,
    jobs,
    stages,
    candidates,
    applications,
    transitions,
    documents,
    interviews,
    scorecards,
    offers,
    hireConversions,
    departments,
    positions,
    employees,
    performanceEvaluations,
    developmentPlans,
    climateSurveys,
    surveyResponses,
    cultureRecognitions,
    courses,
    courseEnrollments,
    consultingProjects,
    projectDeliverables,
    successionPlans,
    successionCandidates,
    retentionPolicies,
    candidateConsents,
    dataSubjectRequests,
    auditEvents,
  ] = await Promise.all([
    prisma.organization.findMany(),
    prisma.user.findMany(),
    prisma.organizationMembership.findMany(),
    prisma.job.findMany(),
    prisma.stage.findMany(),
    prisma.candidate.findMany(),
    prisma.application.findMany(),
    prisma.applicationStageTransition.findMany(),
    prisma.document.findMany(),
    prisma.interview.findMany(),
    prisma.scorecard.findMany(),
    prisma.offer.findMany(),
    prisma.hireConversion.findMany(),
    prisma.department.findMany(),
    prisma.position.findMany(),
    prisma.employee.findMany(),
    prisma.performanceEvaluation.findMany(),
    prisma.developmentPlan.findMany(),
    prisma.climateSurvey.findMany(),
    prisma.surveyResponse.findMany(),
    prisma.cultureRecognition.findMany(),
    prisma.course.findMany(),
    prisma.courseEnrollment.findMany(),
    prisma.consultingProject.findMany(),
    prisma.projectDeliverable.findMany(),
    prisma.successionPlan.findMany(),
    prisma.successionCandidate.findMany(),
    prisma.retentionPolicy.findMany(),
    prisma.candidateConsent.findMany(),
    prisma.dataSubjectRequest.findMany(),
    prisma.auditEvent.findMany({ take: 1000, orderBy: { createdAt: "desc" } }),
  ]);

  const backupData = {
    metadata: {
      timestamp,
      version: "v1.0-onda0",
      totalOrganizations: organizations.length,
      totalUsers: users.length,
      totalEmployees: employees.length,
      totalJobs: jobs.length,
      totalCandidates: candidates.length,
      totalApplications: applications.length,
      totalDocuments: documents.length,
    },
    tables: {
      organizations,
      users,
      memberships,
      jobs,
      stages,
      candidates,
      applications,
      transitions,
      documents,
      interviews,
      scorecards,
      offers,
      hireConversions,
      departments,
      positions,
      employees,
      performanceEvaluations,
      developmentPlans,
      climateSurveys,
      surveyResponses,
      cultureRecognitions,
      courses,
      courseEnrollments,
      consultingProjects,
      projectDeliverables,
      successionPlans,
      successionCandidates,
      retentionPolicies,
      candidateConsents,
      dataSubjectRequests,
      auditEvents,
    },
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const hash = createHash("sha256").update(jsonStr).digest("hex");
  const filePath = path.join(backupDir, `backup_pre_onda0_${timestamp}.json`);

  fs.writeFileSync(filePath, jsonStr, "utf-8");

  // Salva também o checksum
  fs.writeFileSync(`${filePath}.sha256`, `${hash}  ${path.basename(filePath)}\n`, "utf-8");

  console.log(`✅ Backup salvo com sucesso em: ${filePath}`);
  console.log(`🔒 Checksum SHA-256: ${hash}`);
  console.log(`📊 Estatísticas: ${organizations.length} orgs, ${users.length} users, ${employees.length} employees, ${jobs.length} jobs, ${candidates.length} candidates, ${documents.length} docs.`);

  await prisma.$disconnect();
}

runBackup().catch((err) => {
  console.error("❌ Falha na geração do backup frio:", err);
  process.exit(1);
});
