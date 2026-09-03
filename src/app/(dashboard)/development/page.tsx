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
  const [conversions, formalEmployees, candidates, organizations] = await Promise.all([
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
    prisma.employee.findMany({
      include: {
        department: true,
        position: true,
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.candidate.findMany({
      include: {
        performanceEvaluations: {
          orderBy: { evaluatedAt: "desc" },
          take: 1,
        },
        developmentPlans: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const candidateEmailMap = new Map(candidates.map((c) => [c.email.toLowerCase(), c]));

  // Formata os colaboradores vindos do ATS (conversões de vaga)
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

  const conversionEmails = new Set(conversions.map((c) => c.application?.candidate?.email?.toLowerCase()).filter(Boolean));

  // Integra colaboradores cadastrados diretamente no Core HR ou via importação em lote
  for (const emp of formalEmployees) {
    if (!emp.email || conversionEmails.has(emp.email.toLowerCase())) continue;

    const cand = (emp.candidateId ? candidateMap.get(emp.candidateId) : null) || candidateEmailMap.get(emp.email.toLowerCase());
    if (!cand) continue;

    const latestEval = cand.performanceEvaluations[0] || null;
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

    formattedEmployees.push({
      candidateId: cand.id,
      candidateName: emp.fullName,
      candidateEmail: emp.email,
      candidatePhone: emp.phone,
      jobTitle: emp.position?.title || "Colaborador",
      department: emp.department?.name || "Geral",
      organizationId: emp.organizationId,
      organizationName: emp.organization?.name || "Empresa",
      employeeCode: emp.registrationNumber || "SEM_MATRICULA",
      status: emp.status,
      hiredAt: emp.admissionDate ? emp.admissionDate.toISOString() : emp.createdAt.toISOString(),
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
      pdiPlans: cand.developmentPlans.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        category: p.category,
        targetDate: p.targetDate ? p.targetDate.toISOString() : null,
        completedAt: p.completedAt ? p.completedAt.toISOString() : null,
      })),
    });
  }

  return (
    <DevelopmentDashboardClient
      employees={formattedEmployees}
      organizations={organizations}
    />
  );
}
