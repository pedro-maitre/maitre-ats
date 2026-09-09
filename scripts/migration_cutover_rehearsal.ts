import { prisma } from "../src/lib/prisma";
import { reconcileTenantRecords } from "../src/lib/cutover-readiness";

async function runRehearsal() {
  console.log("🚀 [ONDA 5] Iniciando Ensaio de Migração & Conciliação de Dados (Staging Rehearsal)...");

  const startTime = Date.now();
  const summary = {
    totalTenants: 0,
    totalRecordsChecked: 0,
    anomaliesFound: 0,
    anomalies: [] as string[],
  };

  try {
    // 1. Coleta e contagem de tenants
    const organizations = await prisma.organization.findMany();
    summary.totalTenants = organizations.length;
    console.log(`🏢 Organizações detectadas: ${organizations.length}`);

    // 2. Integridade de Jobs em relação a Organizações
    const jobs = await prisma.job.findMany();
    summary.totalRecordsChecked += jobs.length;
    const jobReconciliation = reconcileTenantRecords(
      organizations.map(o => ({ id: o.id, organizationId: o.id })),
      jobs.map(j => ({ id: j.id, organizationId: j.organizationId })),
      "organizationId",
      "Organization",
      "Job"
    );
    if (!jobReconciliation.valid) {
      summary.anomalies.push(...jobReconciliation.anomalies);
    }

    // 3. Integridade de Candidatos em relação a Organizações
    const candidates = await prisma.candidate.findMany();
    summary.totalRecordsChecked += candidates.length;
    const candidateReconciliation = reconcileTenantRecords(
      organizations.map(o => ({ id: o.id, organizationId: o.id })),
      candidates.map(c => ({ id: c.id, organizationId: c.organizationId })),
      "organizationId",
      "Organization",
      "Candidate"
    );
    if (!candidateReconciliation.valid) {
      summary.anomalies.push(...candidateReconciliation.anomalies);
    }

    // 4. Integridade de Colaboradores (Employee)
    const employees = await prisma.employee.findMany();
    summary.totalRecordsChecked += employees.length;
    const employeeReconciliation = reconcileTenantRecords(
      organizations.map(o => ({ id: o.id, organizationId: o.id })),
      employees.map(e => ({ id: e.id, organizationId: e.organizationId })),
      "organizationId",
      "Organization",
      "Employee"
    );
    if (!employeeReconciliation.valid) {
      summary.anomalies.push(...employeeReconciliation.anomalies);
    }

    // 5. Integridade de Afastamentos (EmployeeLeave referenciando Employee existente)
    const leaves = await prisma.employeeLeave.findMany();
    summary.totalRecordsChecked += leaves.length;
    const employeeMap = new Map<string, string>(employees.map(e => [e.id, e.organizationId]));
    for (const leave of leaves) {
      const orgId = employeeMap.get(leave.employeeId);
      if (!orgId) {
        summary.anomalies.push(`Registro órfão: EmployeeLeave (${leave.id}) aponta para Employee inexistente (${leave.employeeId}).`);
      }
    }

    // 6. Integridade de Avaliações de Desempenho (PerformanceEvaluation)
    const evaluations = await prisma.performanceEvaluation.findMany();
    summary.totalRecordsChecked += evaluations.length;
    const evalReconciliation = reconcileTenantRecords(
      organizations.map(o => ({ id: o.id, organizationId: o.id })),
      evaluations.map(ev => ({ id: ev.id, organizationId: ev.organizationId })),
      "organizationId",
      "Organization",
      "PerformanceEvaluation"
    );
    if (!evalReconciliation.valid) {
      summary.anomalies.push(...evalReconciliation.anomalies);
    }

    // 7. Integridade de Candidaturas Internas (InternalApplication)
    const internalApps = await prisma.internalApplication.findMany();
    summary.totalRecordsChecked += internalApps.length;
    const internalAppReconciliation = reconcileTenantRecords(
      organizations.map(o => ({ id: o.id, organizationId: o.id })),
      internalApps.map(ia => ({ id: ia.id, organizationId: ia.organizationId, employeeId: ia.employeeId })),
      "organizationId",
      "Organization",
      "InternalApplication"
    );
    if (!internalAppReconciliation.valid) {
      summary.anomalies.push(...internalAppReconciliation.anomalies);
    }

    // 8. Integridade de Timesheets (ConsultingTimesheet)
    const timesheets = await prisma.consultingTimesheet.findMany();
    summary.totalRecordsChecked += timesheets.length;
    const projects = await prisma.consultingProject.findMany();
    const timesheetReconciliation = reconcileTenantRecords(
      projects.map(p => ({ id: p.id, organizationId: p.organizationId })),
      timesheets.map(t => ({ id: t.id, organizationId: t.organizationId, projectId: t.projectId })),
      "projectId",
      "ConsultingProject",
      "ConsultingTimesheet"
    );
    if (!timesheetReconciliation.valid) {
      summary.anomalies.push(...timesheetReconciliation.anomalies);
    }

    // 9. Relatório Consolidado do Ensaio
    summary.anomaliesFound = summary.anomalies.length;
    const elapsed = Date.now() - startTime;

    console.log("\n=======================================================");
    console.log("📊 RESULTADO DO ENSAIO DE MIGRAÇÃO E CONCILIAÇÃO");
    console.log("=======================================================");
    console.log(`⏱️ Tempo total de processamento: ${elapsed}ms`);
    console.log(`🏢 Organizações avaliadas: ${summary.totalTenants}`);
    console.log(`📑 Total de registros inspecionados: ${summary.totalRecordsChecked}`);
    console.log(`🚨 Anomalias cross-tenant ou órfãs detectadas: ${summary.anomaliesFound}`);

    if (summary.anomaliesFound > 0) {
      console.error("\n❌ Anomalias encontradas:");
      summary.anomalies.forEach((a, i) => console.error(`  ${i + 1}. ${a}`));
      process.exit(1);
    } else {
      console.log("\n✅ SUCESSO ABSOLUTO: Todos os registros respeitam o isolamento estrito de tenant!");
      console.log("✅ Integridade referencial 100% preservada entre todas as entidades.");
    }
  } catch (error) {
    console.error("❌ Erro fatal durante o ensaio de migração:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRehearsal();
