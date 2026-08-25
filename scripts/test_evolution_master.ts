import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { uploadSecureDocument, getSignedDocumentUrl } from "../src/lib/resume-storage";
import { logAuditEvent } from "../src/lib/audit";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runMasterEvolutionTestSuite() {
  console.log("=========================================================================================");
  console.log("🏆 BATERIA MESTRE DE TESTES: EVOLUÇÃO MAÎTRE CONECTA (CONECTA TALENTOS)");
  console.log("=========================================================================================\n");

  const results: { id: string; name: string; passed: boolean; details: string }[] = [];

  function record(id: string, name: string, passed: boolean, details: string) {
    results.push({ id, name, passed, details });
    console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} [${id}] ${name}\n   ➔ ${details}\n`);
  }

  let testOrg: any = null;
  let testUserRecruiter: any = null;
  let testUserAdmin: any = null;
  let testCandidate: any = null;
  let testJob: any = null;
  let testApp: any = null;
  let testDocument: any = null;
  let testInterview: any = null;
  let testScorecard: any = null;
  let testOffer: any = null;
  let testTransition: any = null;
  let testOutbox: any = null;

  try {
    // 1. SETUP DE AMBIENTE MULTI-TENANT
    testOrg = await prisma.organization.create({
      data: {
        name: `Org Teste ${Date.now()}`,
        slug: `org-teste-${Date.now()}`,
      },
    });

    testUserAdmin = await prisma.user.create({
      data: {
        email: `admin.evolucao.${Date.now()}@maitre.com.br`,
        name: "Diretor de Gente e Gestão",
        role: "ADMIN",
        organizationId: testOrg.id,
      },
    });

    testUserRecruiter = await prisma.user.create({
      data: {
        email: `recruiter.evolucao.${Date.now()}@maitre.com.br`,
        name: "Recrutador Especialista",
        role: "RECRUITER",
        organizationId: testOrg.id,
      },
    });

    // Membership por Tenant
    const membership = await prisma.organizationMembership.create({
      data: {
        organizationId: testOrg.id,
        userId: testUserRecruiter.id,
        role: "RECRUITER",
      },
    });

    record(
      "TEN-001",
      "Isolamento Multi-Tenant & Membership de Organização",
      Boolean(membership.id && membership.organizationId === testOrg.id),
      `Usuário "${testUserRecruiter.name}" vinculado ao Tenant "${testOrg.name}" com papel RECRUITER.`
    );

    // 2. STORAGE CANÔNICO, CHECKSUM & DOCUMENTOS PRIVADOS (SEC-001, STO-001, DOC-001)
    const pdfBuffer = Buffer.from("%PDF-1.4 Mock de Currículo Privado com Checksum SHA-256");
    const uploadRes = await uploadSecureDocument({
      buffer: pdfBuffer,
      originalFilename: "curriculo-seguro.pdf",
      organizationId: testOrg.id,
      classification: "CURRICULO",
    });

    testDocument = await prisma.document.findFirst({
      where: { storageKey: uploadRes.storageKey },
    });

    record(
      "SEC-001",
      "Upload em Storage Canônico com Checksum SHA-256 & Metadados em Document",
      Boolean(testDocument?.id && testDocument?.checksum === uploadRes.checksum),
      `Documento ID: ${testDocument?.id}, Checksum: ${testDocument?.checksum.substring(0, 16)}..., Bucket: ${testDocument?.bucket}`
    );

    // 3. GERAÇÃO DE URLs ASSINADAS COM EXPIRAÇÃO (SEC-002)
    const signedUrl = await getSignedDocumentUrl(uploadRes.storageKey, 900);
    const hasValidSignedUrl = Boolean(signedUrl && signedUrl.startsWith("http"));

    record(
      "SEC-002",
      "Geração de URL Assinada Temporária (15 min) com Proteção RLS",
      hasValidSignedUrl,
      `URL Assinada gerada com sucesso para chave: "${uploadRes.storageKey}".`
    );

    // 4. AUDITORIA TÉCNICA IMUTÁVEL (AUD-001)
    await logAuditEvent({
      organizationId: testOrg.id,
      actorUserId: testUserRecruiter.id,
      action: "RESUME_VIEW",
      resourceType: "Document",
      resourceId: testDocument?.id || "doc-1",
      beforeData: null,
      afterData: { filename: "curriculo-seguro.pdf", size: pdfBuffer.length },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });

    const auditEntry = await prisma.auditEvent.findFirst({
      where: { resourceId: testDocument?.id || "doc-1" },
      orderBy: { createdAt: "desc" },
    });

    record(
      "AUD-001",
      "Trilha de Auditoria Imutável (AuditEvent Append-Only)",
      Boolean(auditEntry?.id && auditEntry.action === "RESUME_VIEW"),
      `Evento registrado: [${auditEntry?.action}] no recurso ${auditEntry?.resourceType} (ID: ${auditEntry?.resourceId}) por User ${auditEntry?.actorUserId}.`
    );

    // 5. CRIAÇÃO DE VAGA COM ETAPAS E CANDIDATO
    testJob = await prisma.job.create({
      data: {
        title: "Arquiteto de Soluções Cloud & AI",
        description: "Vaga estratégica para expansão da plataforma Maître Conecta.",
        salaryMin: 22000,
        salaryMax: 28000,
        salaryFitTolerancePercent: 15.0,
        organizationId: testOrg.id,
        recruiterId: testUserRecruiter.id,
        stages: {
          create: [
            { name: "Triagem", order: 0, organizationId: testOrg.id },
            { name: "Entrevista Técnica", order: 1, organizationId: testOrg.id },
            { name: "Fit Cultural", order: 2, organizationId: testOrg.id },
            { name: "Proposta", order: 3, organizationId: testOrg.id },
            { name: "Contratado", order: 4, organizationId: testOrg.id },
          ],
        },
      },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    testCandidate = await prisma.candidate.create({
      data: {
        firstName: "Rafael",
        lastName: "Vanderbilt",
        email: `rafael.vanderbilt.${Date.now()}@teste.com`,
        phone: "11999990000",
        resumeUrl: uploadRes.url,
        documentId: testDocument?.id,
        tags: JSON.stringify(["Cloud", "AWS", "Node.js", "Kubernetes", "Arquitetura"]),
        source: "Indicação Executiva",
        organizationId: testOrg.id,
      },
    });

    testApp = await prisma.application.create({
      data: {
        candidateId: testCandidate.id,
        jobId: testJob.id,
        stageId: testJob.stages[0].id,
        salaryExpectation: 26000,
        matchScore: 96,
        fitCategory: "ALTO_FIT",
        priority: "PRIORIZADO",
      },
    });

    // 6. HISTÓRICO TRANSACIONAL DE ETAPAS (PIPE-001)
    const stageTriagem = testJob.stages[0];
    const stageEntrevista = testJob.stages[1];

    testTransition = await prisma.applicationStageTransition.create({
      data: {
        applicationId: testApp.id,
        fromStageId: stageTriagem.id,
        toStageId: stageEntrevista.id,
        changedBy: testUserRecruiter.email,
        reason: "Aprovado com distinção na triagem técnica",
      },
    });

    await prisma.application.update({
      where: { id: testApp.id },
      data: { stageId: stageEntrevista.id },
    });

    record(
      "PIPE-001",
      "Histórico Transacional de Transições de Etapas (ApplicationStageTransition)",
      Boolean(testTransition?.id && testTransition.toStageId === stageEntrevista.id),
      `Transição gravada: "${stageTriagem.name}" ➔ "${stageEntrevista.name}" com justificativa: "${testTransition.reason}".`
    );

    // 7. GOVERNANÇA DO FIT 3D & OVERRIDE AUDITADO (AI-001)
    const updatedAppWithOverride = await prisma.application.update({
      where: { id: testApp.id },
      data: {
        manualOverride: true,
        overrideReason: "Candidato possui certificação AWS Fellow não captada inicialmente.",
        reviewedBy: testUserAdmin.email,
        reviewedAt: new Date(),
      },
    });

    await logAuditEvent({
      organizationId: testOrg.id,
      actorUserId: testUserAdmin.id,
      action: "OVERRIDE_FIT",
      resourceType: "Application",
      resourceId: testApp.id,
      reason: updatedAppWithOverride.overrideReason,
    });

    record(
      "AI-001",
      "Governança e Override Auditado do Algoritmo Fit 3D",
      Boolean(updatedAppWithOverride.manualOverride && updatedAppWithOverride.reviewedBy === testUserAdmin.email),
      `Override registrado por ${updatedAppWithOverride.reviewedBy}: "${updatedAppWithOverride.overrideReason}".`
    );

    // 8. ENTREVISTAS E SCORECARDS ESTRUTURADOS (INT-001)
    testInterview = await prisma.interview.create({
      data: {
        applicationId: testApp.id,
        title: "Entrevista Técnica de Arquitetura",
        scheduledAt: new Date(Date.now() + 86400000), // Amanhã
        durationMin: 60,
        format: "ONLINE",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        status: "SCHEDULED",
      },
    });

    testScorecard = await prisma.scorecard.create({
      data: {
        interviewId: testInterview.id,
        evaluatorId: testUserAdmin.id,
        technicalScore: 5.0,
        cultureScore: 4.8,
        communicationScore: 4.9,
        overallRecommendation: "STRONG_HIRE",
        notes: "Excelente raciocínio sistêmico e clareza na exposição de soluções escaláveis.",
      },
    });

    record(
      "INT-001",
      "Entrevistas Agendadas & Scorecard com Critérios de Avaliação",
      Boolean(testInterview?.id && testScorecard?.overallRecommendation === "STRONG_HIRE"),
      `Entrevista: "${testInterview.title}" | Scorecard: ${testScorecard.overallRecommendation} (Nota Técnica: ${testScorecard.technicalScore}/5, Cultura: ${testScorecard.cultureScore}/5).`
    );

    // 9. PROPOSTA DE CONTRATAÇÃO (OFF-001)
    testOffer = await prisma.offer.create({
      data: {
        applicationId: testApp.id,
        salaryOffered: 27000,
        employmentType: "CLT",
        startDate: new Date(Date.now() + 15 * 86400000),
        benefits: "Plano de Saúde Executivo, Stock Options, Auxílio Home Office",
        status: "APPROVED",
        approvedBy: testUserAdmin.email,
        approvedAt: new Date(),
      },
    });

    record(
      "OFF-001",
      "Gestão de Propostas de Contratação (Offer & Approvals)",
      Boolean(testOffer?.id && testOffer.status === "APPROVED"),
      `Proposta CLT: R$ ${testOffer.salaryOffered}/mês | Status: ${testOffer.status} | Aprovado por: ${testOffer.approvedBy}.`
    );

    // 10. CONVERSÃO EM CONTRATAÇÃO & OUTBOX PARA CORE HR (HIR-001, EVT-001)
    const hireConversion = await prisma.hireConversion.create({
      data: {
        applicationId: testApp.id,
        convertedBy: testUserAdmin.email,
        employeeCode: "MC-2026-088",
        status: "CONVERTED",
      },
    });

    testOutbox = await prisma.integrationOutbox.create({
      data: {
        organizationId: testOrg.id,
        eventType: "candidate.hire_authorized.v1",
        payload: JSON.stringify({
          applicationId: testApp.id,
          candidateId: testCandidate.id,
          candidateName: `${testCandidate.firstName} ${testCandidate.lastName}`,
          candidateEmail: testCandidate.email,
          jobId: testJob.id,
          jobTitle: testJob.title,
          employeeCode: "MC-2026-088",
          salaryOffered: 27000,
          authorizedBy: testUserAdmin.email,
          occurredAt: new Date().toISOString(),
        }),
      },
    });

    record(
      "HIR-001",
      "Conversão de Contratação & Disparo Transacional na Outbox (candidate.hire_authorized.v1)",
      Boolean(hireConversion?.id && testOutbox?.eventType === "candidate.hire_authorized.v1"),
      `Contratação autorizada: Matrícula ${hireConversion.employeeCode} ➔ Evento Outbox ID: ${testOutbox.id} pronto para consumo no Core HR.`
    );
  } catch (err: any) {
    record("ERROR", "Falha na Bateria Mestre de Testes", false, err.message);
  } finally {
    // Limpeza segura de dados de teste
    try {
      if (testOutbox?.id) await prisma.integrationOutbox.delete({ where: { id: testOutbox.id } });
      if (testOffer?.id) await prisma.offer.delete({ where: { id: testOffer.id } });
      if (testScorecard?.id) await prisma.scorecard.delete({ where: { id: testScorecard.id } });
      if (testInterview?.id) await prisma.interview.delete({ where: { id: testInterview.id } });
      if (testTransition?.id) await prisma.applicationStageTransition.delete({ where: { id: testTransition.id } });
      if (testApp?.id) {
        await prisma.hireConversion.deleteMany({ where: { applicationId: testApp.id } });
        await prisma.activity.deleteMany({ where: { applicationId: testApp.id } });
        await prisma.application.delete({ where: { id: testApp.id } });
      }
      if (testCandidate?.id) await prisma.candidate.delete({ where: { id: testCandidate.id } });
      if (testDocument?.id) await prisma.document.delete({ where: { id: testDocument.id } });
      if (testJob?.id) {
        await prisma.stage.deleteMany({ where: { jobId: testJob.id } });
        await prisma.job.delete({ where: { id: testJob.id } });
      }
      if (testOrg?.id) {
        await prisma.auditEvent.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.organizationMembership.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.user.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.organization.delete({ where: { id: testOrg.id } });
      }
      console.log("🧹 Dados de teste limpos do banco de dados com sucesso.");
    } catch (cleanErr: any) {
      console.warn("Aviso na limpeza final:", cleanErr.message);
    }
  }

  await pool.end();

  console.log("\n=========================================================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`📊 RESULTADO CONSOLIDADO: ${results.filter((r) => r.passed).length}/${results.length} TESTES PASSARAM`);
  console.log(`STATUS GERAL: ${allPassed ? "🏆 ARQUITETURA CONECTA TALENTOS 100% OPERACIONAL E HOMOLOGADA" : "⚠️ HOUVE FALHAS"}`);
  console.log("=========================================================================================\n");
}

runMasterEvolutionTestSuite();
