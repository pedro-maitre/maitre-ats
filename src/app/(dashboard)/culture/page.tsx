import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CultureDashboardClient, {
  SurveyItem,
  ResponseItem,
  RecognitionItem,
} from "@/components/culture/CultureDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Cultura (Clima & eNPS) | Maître Conecta",
  description: "Pesquisas de Clima Organizacional, eNPS, Engajamento e Rituais de Cultura",
};

export default async function CulturePage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = session?.user?.role || "RECRUITER";
  const canManage = role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECRUITER";

  const resolvedParams = searchParams ? await searchParams : {};

  let organizations: any[] = [];
  let activeSurvey: SurveyItem | null = null;
  let responses: ResponseItem[] = [];
  let recognitions: RecognitionItem[] = [];
  let orgId = "";

  try {
    organizations = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    // Buscar organização ativa: searchParams > session > primeira do banco
    orgId = resolvedParams.orgId || session?.user?.organizationId || organizations[0]?.id || "";

    // Buscar ciclo ativo de pesquisa de clima
    const activeSurveyDb = await prisma.climateSurvey.findFirst({
      where: {
        status: "ACTIVE",
        ...(orgId ? { organizationId: orgId } : {}),
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeSurveyDb) {
      activeSurvey = {
        id: activeSurveyDb.id,
        title: activeSurveyDb.title,
        description: activeSurveyDb.description,
        status: activeSurveyDb.status,
        startDate: activeSurveyDb.startDate.toISOString(),
        responsesCount: activeSurveyDb._count.responses,
      };

      const responsesDb = await prisma.surveyResponse.findMany({
        where: { surveyId: activeSurveyDb.id },
        orderBy: { respondedAt: "desc" },
      });

      responses = responsesDb.map((r) => {
        let parsedDimensions = {};
        if (r.dimensionScores) {
          try {
            parsedDimensions = JSON.parse(r.dimensionScores);
          } catch {
            parsedDimensions = {};
          }
        }
        return {
          id: r.id,
          department: r.department,
          npsScore: r.npsScore,
          dimensionScores: parsedDimensions,
          feedback: r.feedback,
          respondedAt: r.respondedAt.toISOString(),
        };
      });
    }

    // Buscar reconhecimentos do mural
    const recognitionsDb = await prisma.cultureRecognition.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    recognitions = recognitionsDb.map((rec) => ({
      id: rec.id,
      senderName: rec.senderName,
      receiverName: rec.receiverName,
      receiverDepartment: rec.receiverDepartment,
      valuePillar: rec.valuePillar,
      message: rec.message,
      likesCount: rec.likesCount,
      createdAt: rec.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("Erro ao carregar dados de cultura:", err);
  }

  return (
    <CultureDashboardClient
      activeSurvey={activeSurvey ? JSON.parse(JSON.stringify(activeSurvey)) : null}
      responses={JSON.parse(JSON.stringify(responses))}
      recognitions={JSON.parse(JSON.stringify(recognitions))}
      canManage={canManage}
      organizations={JSON.parse(JSON.stringify(organizations))}
      currentOrgId={orgId}
    />
  );
}
