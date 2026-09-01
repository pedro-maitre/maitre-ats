import {
  FEEDBACK_TEMPLATES,
  FEEDBACK_CATEGORIES,
  applyTemplateVariables,
  getUnfilledVariables,
  sanitizeBrazilianPhone,
  generateWhatsAppLink,
  ANTI_DISCRIMINATION_RULES,
} from "../src/lib/feedback-templates";
import { prisma } from "../src/lib/prisma";

async function runFeedbackModuleTests() {
  console.log("=================================================");
  console.log("🧪 BATERIA DE TESTES: MÓDULO DE FEEDBACK WHATSAPP");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // TESTE 1: Quantidade de templates e integridade dos números
  assert(FEEDBACK_TEMPLATES.length === 23, "Catálogo contém exatamente os 23 templates do Manual Oficial");
  assert(FEEDBACK_CATEGORIES.length === 6, "Existem as 6 categorias oficiais de etapas");

  const numbers = FEEDBACK_TEMPLATES.map((t) => t.number);
  const isSequential = numbers.every((num, idx) => num === idx + 1);
  assert(isSequential, "Templates estão numerados sequencialmente de 1 a 23");

  // TESTE 2: Sanitização de telefone brasileiro
  const phone1 = sanitizeBrazilianPhone("(11) 98765-4321");
  const phone2 = sanitizeBrazilianPhone("5511987654321");
  const phone3 = sanitizeBrazilianPhone("21912345678");
  assert(phone1 === "5511987654321", "Adiciona DDI 55 para telefone com DDD (11) 98765-4321");
  assert(phone2 === "5511987654321", "Mantém DDI 55 caso já presente");
  assert(phone3 === "5521912345678", "Converte DDD 21 para formato 5521912345678");

  // TESTE 3: Geração de link wa.me com texto codificado
  const testMessage = "Olá, Lucas! Parabéns pela aprovação na vaga de Desenvolvedor.";
  const waLink = generateWhatsAppLink("(11) 99999-8888", testMessage);
  assert(
    waLink.startsWith("https://wa.me/5511999998888?text="),
    "Link do WhatsApp gerado corretamente com protocolo https://wa.me/"
  );
  assert(
    waLink.includes(encodeURIComponent("Olá, Lucas!")),
    "Texto do link devidamente encodado com URI encode"
  );

  // TESTE 4: Substituição de variáveis
  const sampleTemplate = FEEDBACK_TEMPLATES.find((t) => t.id === "confirmacao-recebimento")!;
  const filledMessage = applyTemplateVariables(sampleTemplate.rawTemplate, {
    NOME: "Carolina",
    RECRUTADOR: "Pedro Alcantara",
    EMPRESA_CONTRATANTE: "Tech Corp",
    VAGA: "Arquiteta de Software",
    DATA_PRAZO: "3 dias úteis",
    LINK_PRIVACIDADE: "https://maitreconecta.vercel.app/privacidade",
  });

  assert(filledMessage.includes("Olá, Carolina!"), "Substituiu [NOME] por Carolina");
  assert(filledMessage.includes("Pedro Alcantara"), "Substituiu [RECRUTADOR] por Pedro Alcantara");
  assert(filledMessage.includes("Arquiteta de Software"), "Substituiu [VAGA] por Arquiteta de Software");

  const remainingTags = getUnfilledVariables(filledMessage);
  assert(remainingTags.length === 0, "Nenhuma tag não preenchida restou após a substituição completa");

  // TESTE 5: Detecção de tags não preenchidas
  const partialMessage = applyTemplateVariables(sampleTemplate.rawTemplate, {
    NOME: "Roberto",
  });
  const unreplaced = getUnfilledVariables(partialMessage);
  assert(unreplaced.length > 0, "Identificou tags pendentes de preenchimento corretamente");
  assert(unreplaced.includes("[RECRUTADOR]"), "Detectou [RECRUTADOR] como pendente");

  // TESTE 6: Regras de Não Discriminação
  assert(ANTI_DISCRIMINATION_RULES.length >= 5, "Existem pelo menos 5 regras anti-discriminação mapeadas");

  // TESTE 7: Teste no Banco de Dados (Activity + AuditEvent)
  console.log("\n--- Teste de Persistência no Banco de Dados ---");
  try {
    const org = await prisma.organization.findFirst();
    if (org) {
      // Cria ou busca candidato de teste
      const candidate = await prisma.candidate.upsert({
        where: { email: "teste.feedback@maitreconsultoria.com.br" },
        update: { phone: "11988887777" },
        create: {
          firstName: "Candidato",
          lastName: "Teste Feedback",
          email: "teste.feedback@maitreconsultoria.com.br",
          phone: "11988887777",
          organizationId: org.id,
        },
      });

      // Cria vaga de teste
      const job = await prisma.job.findFirst({
        where: { organizationId: org.id },
      });

      if (job) {
        // Cria ou busca estágio
        let stage = await prisma.stage.findFirst({
          where: { jobId: job.id },
        });

        if (!stage) {
          stage = await prisma.stage.create({
            data: {
              name: "Triagem",
              order: 1,
              jobId: job.id,
              organizationId: org.id,
            },
          });
        }

        // Cria application
        let app = await prisma.application.findFirst({
          where: { candidateId: candidate.id, jobId: job.id },
        });

        if (!app) {
          app = await prisma.application.create({
            data: {
              candidateId: candidate.id,
              jobId: job.id,
              stageId: stage.id,
            },
          });
        }

        // Cria Activity de feedback
        const activity = await prisma.activity.create({
          data: {
            applicationId: app.id,
            type: "WHATSAPP_FEEDBACK_SENT",
            description: "Feedback WhatsApp enviado: #17 Não continuidade após entrevista",
            metadata: JSON.stringify({
              templateId: "nao-continuidade-apos-entrevista",
              templateNumber: 17,
              templateTitle: "Não continuidade após entrevista",
              phone: "11988887777",
            }),
          },
        });

        assert(!!activity.id, "Activity de envio de feedback criada com sucesso no banco");

        // Cria AuditEvent
        const audit = await prisma.auditEvent.create({
          data: {
            organizationId: org.id,
            action: "FEEDBACK_WHATSAPP_SENT",
            resourceType: "Candidate",
            resourceId: candidate.id,
            afterData: JSON.stringify({
              templateId: "nao-continuidade-apos-entrevista",
              phone: "11988887777",
            }),
          },
        });

        assert(!!audit.id, "Log de auditoria (AuditEvent) registrado com sucesso");
      }
    }
  } catch (err: any) {
    console.error("Erro ao testar persistência:", err);
  }

  console.log("\n=================================================");
  console.log(`📊 RESULTADO FINAL: ${passedTests} de ${totalTests} testes passaram!`);
  console.log("=================================================\n");

  if (passedTests === totalTests) {
    console.log("🎉 TODOS OS TESTES DO MÓDULO DE FEEDBACK PASSARAM COM SUCESSO!");
    process.exit(0);
  } else {
    console.error("⚠️ Alguns testes falharam.");
    process.exit(1);
  }
}

runFeedbackModuleTests();
