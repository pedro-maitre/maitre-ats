import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CultureDashboardClient, {
  SurveyItem,
  ResponseItem,
  RecognitionItem,
  CultureActionPlanItem,
} from "@/components/culture/CultureDashboardClient";
import { sanitizeSurveyResponsesWithKAnonymity } from "@/lib/anonymity";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Cultura (Clima & eNPS) | Maître Conecta",
  description: "Pesquisas de Clima Organizacional com K-Anonimato LGPD, eNPS, Mural de Reconhecimento e Planos de Ação",
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

  const { getServerTenantScope } = await import("@/lib/security");
  const resolvedParams = searchParams ? await searchParams : {};
  const scope = await getServerTenantScope(session, resolvedParams.orgId);

  let organizations: any[] = [];
  let activeSurvey: SurveyItem | null = null;
  let responses: ResponseItem[] = [];
  let recognitions: RecognitionItem[] = [];
  let actionPlans: CultureActionPlanItem[] = [];
  let departmentsMaskedCount = 0;
  let isKAnonymized = false;
  let orgId = "";

  try {
    const orgWhere = scope.isGlobalAccess ? {} : { id: scope.organizationId };
    organizations = await prisma.organization.findMany({
      where: orgWhere,
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    // Buscar organização ativa estritamente dentro do escopo permitido
    orgId = scope.organizationId || organizations[0]?.id || "";

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

      const rawResponses: ResponseItem[] = responsesDb.map((r) => {
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

      // Aplicação estrita de K-Anonimato (k >= 5) para conformidade com LGPD
      const anonymityResult = sanitizeSurveyResponsesWithKAnonymity(rawResponses, 5);
      responses = anonymityResult.sanitizedResponses;
      departmentsMaskedCount = anonymityResult.departmentsMaskedCount;
      isKAnonymized = anonymityResult.isKAnonymized;
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

    // Buscar Planos de Ação (T-15)
    const actionPlansDb = await prisma.cultureActionPlan.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    actionPlans = actionPlansDb.map((ap) => {
      const progressPercent = ap.status === "DONE" ? 100 : ap.status === "IN_PROGRESS" ? 50 : 0;
      return {
        id: ap.id,
        surveyId: ap.surveyId,
        dimension: ap.dimension,
        title: ap.title,
        description: ap.description || "",
        ownerName: ap.ownerName,
        targetDate: ap.targetDate ? ap.targetDate.toISOString() : new Date().toISOString(),
        status: ap.status,
        progressPercent,
        createdAt: ap.createdAt.toISOString(),
      };
    });
  } catch (err) {
    console.error("Erro ao carregar dados de cultura:", err);
  }

  return (
    <CultureDashboardClient
      activeSurvey={activeSurvey ? JSON.parse(JSON.stringify(activeSurvey)) : null}
      responses={JSON.parse(JSON.stringify(responses))}
      recognitions={JSON.parse(JSON.stringify(recognitions))}
      actionPlans={actionPlans}
      departmentsMaskedCount={departmentsMaskedCount}
      isKAnonymized={isKAnonymized}
      canManage={canManage}
      organizations={JSON.parse(JSON.stringify(organizations))}
      currentOrgId={orgId}
    />
  );
}
