/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const body = await req.json();
    const {
      applicationId,
      candidateName,
      feedbackType, // "REJECTION_TRIAGEM" | "REJECTION_INTERVIEW" | "FUTURE_TALENT" | "GENERAL"
      strengths,
      improvements,
      customNotes,
    } = body;

    // Busca dados da candidatura se tiver applicationId
    let jobTitle = "nossa oportunidade";
    let companyName = "Maître Conecta";
    let candidateEmail = "";

    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          candidate: true,
          job: { select: { title: true, organization: { select: { name: true } } } },
        },
      });

      if (app) {
        jobTitle = app.job.title;
        companyName = app.job.organization.name;
        candidateEmail = app.candidate.email;
      }
    }

    const firstName = candidateName ? candidateName.split(" ")[0] : "Candidato";

    // OpenAI Integration com fallback heurístico instantâneo
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (openaiApiKey && openaiApiKey !== "mock" && !openaiApiKey.startsWith("sk-placeholder")) {
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const prompt = `Você é um especialista em Recrutamento Humanizado e Gestão de Pessoas da empresa ${companyName}.
Gere uma mensagem de feedback personalizada, empática, profissional e encorajadora para o candidato(a) ${firstName} referente ao processo seletivo da vaga "${jobTitle}".

Parâmetros do Feedback:
- Tipo: ${feedbackType || "Encerramento do processo seletivo"}
- Pontos Fortes Observados: ${strengths || "Excelente apresentação e perfil profissional"}
- Pontos de Desenvolvimento / Critérios da Vaga: ${improvements || "Buscamos um perfil com maior profundidade em requisitos específicos desta posição"}
- Observações adicionais do recrutador: ${customNotes || "Perfil promissor para futuras oportunidades"}

Diretrizes:
- Tom acolhedor, transparente e construtivo (Employer Branding positivo).
- Agradeça pela dedicação e tempo investido no processo.
- Destaque os pontos fortes reais mencionados.
- Explique que o perfil continuará ativo em nosso Banco de Talentos para novas oportunidades.
- Formato: Texto pronto para e-mail ou WhatsApp, sem chavões robóticos.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const feedbackText = completion.choices[0]?.message?.content;
        if (feedbackText) {
          return NextResponse.json({ success: true, feedback: feedbackText });
        }
      } catch (aiErr) {
        console.error("OpenAI error in generate-feedback, using heuristic fallback:", aiErr);
      }
    }

    // Heuristic Humanized Fallback (0ms)
    let fallbackText = `Olá, ${firstName}!\n\nEsperamos que esteja bem.\n\nQueremos agradecer sinceramente pelo tempo, dedicação e interesse em fazer parte da equipe da ${companyName} no processo seletivo para a posição de *${jobTitle}*.\n\n`;

    if (strengths) {
      fallbackText += `Durante nossa avaliação, identificamos pontos muito positivos em seu perfil, especialmente: ${strengths}.\n\n`;
    }

    if (feedbackType === "REJECTION_INTERVIEW") {
      fallbackText += `Chegamos a uma fase muito concorrida e decidimos seguir com outro profissional cujo momento de carreira e experiência prática estavam mais alinhados aos desafios imediatos desta vaga específica.`;
    } else {
      fallbackText += `Neste momento, decidimos seguir com candidaturas com maior aderência aos requisitos técnicos prioritários da vaga.`;
    }

    if (improvements) {
      fallbackText += ` Para seus próximos passos, recomendamos continuar desenvolvendo: ${improvements}.\n\n`;
    } else {
      fallbackText += `\n\n`;
    }

    fallbackText += `Seu currículo permanecerá ativo em nosso Banco de Talentos, e entraremos em contato assim que surgirem novas oportunidades aderentes ao seu talento.\n\nDesejamos muito sucesso em sua jornada profissional!\n\nAtenciosamente,\n*Equipe de Atração & Seleção — ${companyName}*`;

    return NextResponse.json({
      success: true,
      feedback: fallbackText,
      isFallback: true,
    });
  } catch (error: any) {
    console.error("Erro na rota de geração de feedback:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao gerar feedback." },
      { status: 500 }
    );
  }
}
