/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { prisma } from "@/lib/prisma";
import DevelopmentDashboardClient, {
  DevelopmentEmployeeItem,
} from "@/components/development/DevelopmentDashboardClient";
import { type NineBoxPosition } from "@/lib/nineBox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conecta Desenvolvimento (9-Box & PDI) | Maître Conecta",
  description: "Gestão de Competências, Matriz 9-Box, Ciclos de Avaliação e PDI",
};

export default async function DevelopmentPage() {
  const [conversions, organizations] = await Promise.all([
    prisma.hireConversion.findMany({
      include: {
        application: {
          include: {
            candidate: {
              include: {
                performanceEvaluations: {
                  orderBy: { evaluatedAt: "desc" },
                  take: 1,
                },
                developmentPlans: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
            job: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
      orderBy: { convertedAt: "desc" },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Formata os colaboradores
  const formattedEmployees: DevelopmentEmployeeItem[] = conversions.map((conv) => {
    const app = conv.application;
    const candidate = app.candidate;
    const org = app.job.organization;
    const latestEval = candidate.performanceEvaluations[0] || null;

    let parsedCompetencies: Record<string, number> = {
      leadership: 3.5,
      communication: 4.0,
      execution: 3.5,
      resilience: 4.0,
      autonomy: 3.5,
    };

    if (latestEval?.competencies) {
      try {
        parsedCompetencies = JSON.parse(latestEval.competencies);
      } catch {
        // fallback
      }
    }

    return {
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      jobTitle: app.job.title,
      department: app.job.department,
      organizationId: org.id,
      organizationName: org.name,
      employeeCode: conv.employeeCode,
      status: conv.status,
      hiredAt: conv.convertedAt.toISOString(),
      currentEvaluation: latestEval
        ? {
            id: latestEval.id,
            performanceScore: latestEval.performanceScore,
            potentialScore: latestEval.potentialScore,
            boxPosition: latestEval.boxPosition as NineBoxPosition,
            competencies: parsedCompetencies,
            strengths: latestEval.strengths,
            improvements: latestEval.improvements,
            evaluatedAt: latestEval.evaluatedAt.toISOString(),
          }
        : null,
      pdiPlans: candidate.developmentPlans.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        category: p.category,
        targetDate: p.targetDate ? p.targetDate.toISOString() : null,
        completedAt: p.completedAt ? p.completedAt.toISOString() : null,
      })),
    };
  });

  return (
    <DevelopmentDashboardClient
      employees={formattedEmployees}
      organizations={organizations}
    />
  );
}
