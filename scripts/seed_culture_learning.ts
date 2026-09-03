import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCultureAndLearning() {
  console.log("🌱 Semeando dados corporativos para Conecta Cultura e Conecta Aprendizagem...");

  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error("Nenhuma organização encontrada para vincular os dados.");
    }

    console.log(`Organização vinculada: ${org.name} (${org.id})`);

    // 1. CULTURA: Pesquisa de Clima & eNPS
    let survey = await prisma.climateSurvey.findFirst({
      where: { organizationId: org.id },
    });

    if (!survey) {
      survey = await prisma.climateSurvey.create({
        data: {
          organizationId: org.id,
          title: "Pesquisa de Clima Organizacional & eNPS — Q3 2026",
          description: "Pesquisa corporativa para mapeamento de satisfação, promotores de marca e diagnóstico contínuo de liderança e bem-estar.",
          status: "ACTIVE",
          targetAudience: "ALL",
          startDate: new Date(),
          questions: JSON.stringify([
            { id: "enps", text: "Em uma escala de 0 a 10, o quanto você recomendaria nossa empresa como um excelente lugar para trabalhar?", type: "NPS" },
            { id: "leadership", text: "Sinto que minha liderança direta me apoia no meu desenvolvimento e ouve minhas ideias.", type: "LIKERT" },
            { id: "communication", text: "A comunicação interna é clara, transparente e acessível entre áreas.", type: "LIKERT" },
            { id: "recognition", text: "Me sinto devidamente reconhecido(a) e valorizado(a) pelo trabalho que realizo.", type: "LIKERT" },
            { id: "workload", text: "O equilíbrio entre minha vida profissional e pessoal é respeitado e saudável.", type: "LIKERT" },
            { id: "strategy", text: "Compreendo claramente as metas estratégicas e o propósito da empresa para este ano.", type: "LIKERT" }
          ])
        },
      });
      console.log(`✓ Pesquisa de Clima criada: "${survey.title}"`);
    }

    // Respostas anônimas de demonstração (se não existirem)
    const existingResponsesCount = await prisma.surveyResponse.count({
      where: { surveyId: survey.id },
    });

    if (existingResponsesCount === 0) {
      const sampleResponses = [
        { department: "Tecnologia", nps: 10, leadership: 4.8, communication: 4.5, recognition: 4.2, workload: 4.0, strategy: 4.7, feedback: "Excelente autonomia técnica e clareza nos objetivos." },
        { department: "Tecnologia", nps: 9, leadership: 4.5, communication: 4.0, recognition: 4.5, workload: 3.8, strategy: 4.5, feedback: "Muito orgulho do produto e do time." },
        { department: "Gente & Gestão", nps: 10, leadership: 5.0, communication: 4.8, recognition: 4.9, workload: 4.5, strategy: 5.0, feedback: "Cultura acolhedora e foco genuíno nas pessoas." },
        { department: "Comercial", nps: 8, leadership: 4.0, communication: 3.9, recognition: 3.8, workload: 3.5, strategy: 4.2, feedback: "Metas desafiadoras, poderíamos ter mais alinhamentos entre squads." },
        { department: "Operações", nps: 9, leadership: 4.7, communication: 4.2, recognition: 4.1, workload: 4.0, strategy: 4.6, feedback: "Processos bem definidos e ambiente colaborativo." },
        { department: "Operações", nps: 7, leadership: 3.5, communication: 3.2, recognition: 3.0, workload: 3.0, strategy: 3.8, feedback: "Precisamos de ferramentas mais ágeis para o dia a dia." },
        { department: "Comercial", nps: 10, leadership: 4.9, communication: 4.6, recognition: 4.8, workload: 4.2, strategy: 4.9, feedback: "Ambiente vibrante com grande reconhecimento dos resultados." },
      ];

      for (const r of sampleResponses) {
        await prisma.surveyResponse.create({
          data: {
            surveyId: survey.id,
            organizationId: org.id,
            department: r.department,
            npsScore: r.nps,
            dimensionScores: JSON.stringify({
              leadership: r.leadership,
              communication: r.communication,
              recognition: r.recognition,
              workload: r.workload,
              strategy: r.strategy,
            }),
            feedback: r.feedback,
          },
        });
      }
      console.log(`✓ 7 respostas de pesquisa criadas para eNPS.`);
    }

    // Mural de Reconhecimento
    const recognitionsCount = await prisma.cultureRecognition.count({
      where: { organizationId: org.id },
    });

    if (recognitionsCount === 0) {
      await prisma.cultureRecognition.createMany({
        data: [
          {
            organizationId: org.id,
            senderName: "Patricia Ramos (RH)",
            receiverName: "Lucas Mendonça",
            receiverDepartment: "Engenharia de Software",
            valuePillar: "EXCELENCIA",
            message: "Parabéns pela velocidade e rigor na entrega da nova arquitetura de dados! O time inteiro se inspirou na sua dedicação.",
            likesCount: 14,
          },
          {
            organizationId: org.id,
            senderName: "Gabriel Silveira",
            receiverName: "Mariana Souza",
            receiverDepartment: "Gente e Gestão",
            valuePillar: "FOCO_NO_CLIENTE",
            message: "A condução do processo seletivo dos finalistas foi impecável. Os gestores elogiaram muito a precisão do Fit 3D!",
            likesCount: 19,
          },
          {
            organizationId: org.id,
            senderName: "Carla Esteves",
            receiverName: "Time de Onboarding Digital",
            receiverDepartment: "Operações & DP",
            valuePillar: "COLABORACAO",
            message: "A integração dos 5 novos contratados nesta segunda-feira foi extremamente acolhedora e fluida. Muito obrigado pela parceria!",
            likesCount: 22,
          }
        ]
      });
      console.log(`✓ 3 reconhecimentos de equipe publicados no Mural.`);
    }

    // 2. APRENDIZAGEM (LMS CORPORATIVO)
    const coursesCount = await prisma.course.count({
      where: { organizationId: org.id },
    });

    if (coursesCount === 0) {
      const coursesData = [
        {
          title: "Trilha de Onboarding Institucional & Boas-Vindas",
          slug: "onboarding-institucional",
          description: "Jornada obrigatória de boas-vindas: história da empresa, valores, cultura, segurança e ferramentas essenciais para sua atuação.",
          category: "ONBOARDING",
          durationMinutes: 90,
          isOnboardingDefault: true,
          status: "PUBLISHED",
          modules: JSON.stringify([
            {
              title: "Módulo 1: Propósito, Missão e Nossos Valores",
              lessons: [
                { id: "l1", title: "Quem somos e nossa trajetória no mercado", durationMin: 15, type: "VIDEO" },
                { id: "l2", title: "Os 5 Pilares de Cultura da Maître", durationMin: 15, type: "SLIDES" }
              ]
            },
            {
              title: "Módulo 2: Segurança, Compliance e Ferramentas",
              lessons: [
                { id: "l3", title: "Políticas de Segurança da Informação e LGPD", durationMin: 30, type: "READING" },
                { id: "l4", title: "Guia de Ferramentas de Trabalho e Comunicação", durationMin: 30, type: "VIDEO" }
              ]
            }
          ])
        },
        {
          title: "Liderança Ágil & Gestão Estratégica de Pessoas",
          slug: "lideranca-agil",
          description: "Metodologia prática para líderes: feedbacks contínuos, alinhamento de metas OKR, 9-Box e desenvolvimento de sucessores.",
          category: "LIDERANCA",
          durationMinutes: 180,
          isOnboardingDefault: false,
          status: "PUBLISHED",
          modules: JSON.stringify([
            {
              title: "Módulo 1: Fundamentos da Liderança Servidora",
              lessons: [
                { id: "l1", title: "Do comando e controle à facilitação de times", durationMin: 30, type: "VIDEO" },
                { id: "l2", title: "Como estruturar 1:1s produtivas e empáticas", durationMin: 30, type: "VIDEO" }
              ]
            },
            {
              title: "Módulo 2: Governança de Metas e Matriz 9-Box",
              lessons: [
                { id: "l3", title: "Calibração de Desempenho e Potencial", durationMin: 60, type: "SLIDES" },
                { id: "l4", title: "Construção de PDIs com base em competências", durationMin: 60, type: "WORKBOOK" }
              ]
            }
          ])
        },
        {
          title: "Compliance, Privacidade de Dados & LGPD na Prática",
          slug: "compliance-lgpd",
          description: "Conformidade com a Lei 13.709/2018: tratamento de dados pessoais de clientes e candidatos, direitos do titular e segurança.",
          category: "COMPLIANCE_LGPD",
          durationMinutes: 120,
          isOnboardingDefault: false,
          status: "PUBLISHED",
          modules: JSON.stringify([
            {
              title: "Módulo 1: Princípios Fundamentais da LGPD",
              lessons: [
                { id: "l1", title: "Bases legais e dados sensíveis em RH", durationMin: 40, type: "VIDEO" },
                { id: "l2", title: "Direitos do Titular (DSR) e Ciclo de Retenção", durationMin: 40, type: "SLIDES" },
                { id: "l3", title: "Boas práticas diárias contra vazamento de dados", durationMin: 40, type: "READING" }
              ]
            }
          ])
        },
        {
          title: "Metodologia Maître: Hunting Executivo & Triagem 3D",
          slug: "metodologia-maitre-hunting",
          description: "O método proprietário da Maître: calibração de perfil técnico, aderência cultural profunda e pareceres de hunting para C-Level.",
          category: "METODOLOGIA_MAITRE",
          durationMinutes: 150,
          isOnboardingDefault: false,
          status: "PUBLISHED",
          modules: JSON.stringify([
            {
              title: "Módulo 1: Diagnóstico de Perfil com o Gestor",
              lessons: [
                { id: "l1", title: "Briefing de vagas e definição de competências críticas", durationMin: 45, type: "VIDEO" },
                { id: "l2", title: "Entrevistas por competências e scorecards estruturados", durationMin: 45, type: "SLIDES" },
                { id: "l3", title: "Redação de pareceres executivos para contratação", durationMin: 60, type: "CASE_STUDY" }
              ]
            }
          ])
        }
      ];

      for (const c of coursesData) {
        const createdCourse = await prisma.course.create({
          data: {
            organizationId: org.id,
            title: c.title,
            slug: c.slug,
            description: c.description,
            category: c.category,
            durationMinutes: c.durationMinutes,
            isOnboardingDefault: c.isOnboardingDefault,
            status: c.status,
            modules: c.modules,
          },
        });

        // Criar uma matrícula de exemplo no primeiro curso (concluído com certificado)
        if (c.slug === "onboarding-institucional") {
          await prisma.courseEnrollment.create({
            data: {
              organizationId: org.id,
              courseId: createdCourse.id,
              employeeName: "Mariana Souza - Teste Master",
              employeeEmail: "mariana.master@empresa.com.br",
              progressPercent: 100,
              status: "COMPLETED",
              completedAt: new Date(),
              certificateCode: "MC-CERT-2026-98102",
              score: 9.8,
            }
          });
        }
      }
      console.log(`✓ 4 Cursos corporativos e 1 matrícula certificada criados com sucesso.`);
    }

    console.log("🎉 Carga inicial de Cultura e Aprendizagem concluída com sucesso!");
  } catch (err) {
    console.error("Erro na carga inicial de dados:", err);
  } finally {
    await pool.end();
  }
}

seedCultureAndLearning();
