/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  let conversions: any[] = [];
  let formalEmployees: any[] = [];
  let candidates: any[] = [];
  let organizations: any[] = [];

  try {
    const [convRes, formRes, candRes, orgRes] = await Promise.all([
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

    conversions = convRes || [];
    formalEmployees = formRes || [];
    candidates = candRes || [];
    organizations = orgRes || [];
  } catch (err) {
    console.error("Erro ao carregar dados de desenvolvimento:", err);
  }

  const candidateMap = new Map<string, any>(candidates.map((c) => [c.id, c]));
  const candidateEmailMap = new Map<string, any>();
  for (const c of candidates) {
    if (c.email) {
      candidateEmailMap.set(c.email.toLowerCase(), c);
    }
  }

  // Formata os colaboradores vindos do ATS (conversões de vaga) com proteção contra nulos
  const formattedEmployees: DevelopmentEmployeeItem[] = conversions
    .filter((conv) => conv.application && conv.application.candidate)
    .map((conv) => {
      const app = conv.application || {};
      const candidate = app.candidate || {};
      const org = app.job?.organization || { id: "", name: "Empresa" };
      const latestEval = candidate.performanceEvaluations?.[0] || null;

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
        candidateId: candidate.id || "",
        candidateName: `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Colaborador",
        candidateEmail: candidate.email || "",
        candidatePhone: candidate.phone || null,
        jobTitle: app.job?.title || "Cargo",
        department: app.job?.department || "Geral",
        organizationId: org.id || "",
        organizationName: org.name || "Empresa",
        employeeCode: conv.employeeCode || null,
        status: conv.status || "ACTIVE",
        hiredAt: conv.convertedAt ? new Date(conv.convertedAt).toISOString() : new Date().toISOString(),
        currentEvaluation: latestEval
          ? {
              id: latestEval.id,
              performanceScore: latestEval.performanceScore,
              potentialScore: latestEval.potentialScore,
              boxPosition: latestEval.boxPosition as NineBoxPosition,
              competencies: parsedCompetencies,
              strengths: latestEval.strengths || null,
              improvements: latestEval.improvements || null,
              evaluatedAt: latestEval.evaluatedAt ? new Date(latestEval.evaluatedAt).toISOString() : new Date().toISOString(),
            }
          : null,
        pdiPlans: (candidate.developmentPlans || []).map((p: any) => ({
          id: p.id,
          title: p.title || "Meta de Desenvolvimento",
          description: p.description || null,
          status: p.status || "PLANNED",
          category: p.category || "GENERAL",
          targetDate: p.targetDate ? new Date(p.targetDate).toISOString() : null,
          completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
        })),
      };
    });

  const conversionEmails = new Set(
    conversions
      .map((c) => c.application?.candidate?.email?.toLowerCase())
      .filter(Boolean)
  );

  // Integra colaboradores cadastrados diretamente no Core HR ou via importação em lote
  for (const emp of formalEmployees) {
    if (!emp.email || conversionEmails.has(emp.email.toLowerCase())) continue;

    const cand = (emp.candidateId ? candidateMap.get(emp.candidateId) : null) || candidateEmailMap.get(emp.email.toLowerCase());
    if (!cand) continue;

    const latestEval = cand.performanceEvaluations?.[0] || null;
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
      candidateName: emp.fullName || "Colaborador",
      candidateEmail: emp.email,
      candidatePhone: emp.phone || null,
      jobTitle: emp.position?.title || "Colaborador",
      department: emp.department?.name || "Geral",
      organizationId: emp.organizationId,
      organizationName: emp.organization?.name || "Empresa",
      employeeCode: emp.registrationNumber || "SEM_MATRICULA",
      status: emp.status || "ACTIVE",
      hiredAt: emp.admissionDate ? new Date(emp.admissionDate).toISOString() : new Date(emp.createdAt).toISOString(),
      currentEvaluation: latestEval
        ? {
            id: latestEval.id,
            performanceScore: latestEval.performanceScore,
            potentialScore: latestEval.potentialScore,
            boxPosition: latestEval.boxPosition as NineBoxPosition,
            competencies: parsedCompetencies,
            strengths: latestEval.strengths || null,
            improvements: latestEval.improvements || null,
            evaluatedAt: latestEval.evaluatedAt ? new Date(latestEval.evaluatedAt).toISOString() : new Date().toISOString(),
          }
        : null,
      pdiPlans: (cand.developmentPlans || []).map((p: any) => ({
        id: p.id,
        title: p.title || "Meta de Desenvolvimento",
        description: p.description || null,
        status: p.status || "PLANNED",
        category: p.category || "GENERAL",
        targetDate: p.targetDate ? new Date(p.targetDate).toISOString() : null,
        completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
      })),
    });
  }

  return (
    <DevelopmentDashboardClient
      employees={JSON.parse(JSON.stringify(formattedEmployees))}
      organizations={JSON.parse(JSON.stringify(organizations))}
    />
  );
}
