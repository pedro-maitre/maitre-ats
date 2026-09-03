import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  const role = session?.user?.role || "RECRUITER";
  const canManage = role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECRUITER";

  const resolvedParams = searchParams ? await searchParams : {};
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  // Buscar organização ativa: searchParams > session > primeira do banco
  let orgId = resolvedParams.orgId || session?.user?.organizationId;
  if (!orgId) {
    orgId = organizations[0]?.id || "";
  }

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

  const activeSurvey: SurveyItem | null = activeSurveyDb
    ? {
        id: activeSurveyDb.id,
        title: activeSurveyDb.title,
        description: activeSurveyDb.description,
        status: activeSurveyDb.status,
        startDate: activeSurveyDb.startDate.toISOString(),
        responsesCount: activeSurveyDb._count.responses,
      }
    : null;

  // Buscar respostas da pesquisa ativa
  const responsesDb = activeSurveyDb
    ? await prisma.surveyResponse.findMany({
        where: { surveyId: activeSurveyDb.id },
        orderBy: { respondedAt: "desc" },
      })
    : [];

  const responses: ResponseItem[] = responsesDb.map((r) => {
    let parsedDimensions = {};
    if (r.dimensionScores) {
      try {
        parsedDimensions = JSON.parse(r.dimensionScores);
      } catch {
        // fallback
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

  // Buscar reconhecimentos do mural
  const recognitionsDb = await prisma.cultureRecognition.findMany({
    where: orgId ? { organizationId: orgId } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const recognitions: RecognitionItem[] = recognitionsDb.map((rec) => ({
    id: rec.id,
    senderName: rec.senderName,
    receiverName: rec.receiverName,
    receiverDepartment: rec.receiverDepartment,
    valuePillar: rec.valuePillar,
    message: rec.message,
    likesCount: rec.likesCount,
    createdAt: rec.createdAt.toISOString(),
  }));

  return (
    <CultureDashboardClient
      activeSurvey={activeSurvey}
      responses={responses}
      recognitions={recognitions}
      canManage={canManage}
      organizations={JSON.parse(JSON.stringify(organizations))}
      currentOrgId={orgId}
    />
  );
}
