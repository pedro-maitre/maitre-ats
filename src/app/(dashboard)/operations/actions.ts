/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";
import { sendAdmissionRequirementEmail } from "@/lib/email";

/**
 * Valida ou Rejeita um documento de admissão individual pelo DP
 */
export async function validateDocument(
  documentId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        candidate: true,
        organization: true,
      },
    });

    if (!doc) {
      return { success: false, error: "Documento não encontrado." };
    }

    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: doc.organizationId,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "Document",
      resourceId: doc.id,
      afterData: {
        status,
        rejectionReason,
        validatedBy: user.email,
      },
    });

    revalidatePath("/operations");
    return { success: true, document: updatedDoc };
  } catch (error: any) {
    console.error("Erro ao validar documento:", error);
    return { success: false, error: error.message || "Erro ao validar documento." };
  }
}

/**
 * Envia notificação de pendência / exigência documental ao candidato
 */
export async function requestRequirement(
  conversionId: string,
  requirementNotes: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const conversion = await prisma.hireConversion.findUnique({
      where: { id: conversionId },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão não encontrado." };
    }

    const app = conversion.application;
    const org = app.job.organization;

    await prisma.hireConversion.update({
      where: { id: conversion.id },
      data: {
        admissionStatus: "REQUIREMENT",
        notes: requirementNotes,
        reviewedBy: user.email,
        reviewedAt: new Date(),
      },
    });

    // Registra na timeline
    await prisma.activity.create({
      data: {
        applicationId: app.id,
        actorId: user.id || undefined,
        type: "NOTE_ADDED",
        description: `⚠️ Pendência de admissão apontada pelo DP: ${requirementNotes}`,
      },
    });

    // Enviar e-mail de exigência
    if (conversion.token) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://maitreconecta.vercel.app";
      const admissionUrl = `${baseUrl}/carreiras/${org.slug}/admissao/${conversion.token}`;

      await sendAdmissionRequirementEmail({
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
        candidateEmail: app.candidate.email,
        jobTitle: app.job.title,
        companyName: org.name,
        admissionUrl,
        requirementNotes,
      });
    }

    // Auditoria
    await logAuditEvent({
      organizationId: org.id,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: {
        admissionStatus: "REQUIREMENT",
        requirementNotes,
      },
    });

    revalidatePath("/operations");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao solicitar exigência:", error);
    return { success: false, error: error.message || "Erro ao solicitar exigência." };
  }
}

/**
 * Efetiva a Admissão Digital, confirma matrícula e integra ao Core HR
 */
export async function finalizeAdmission(
  conversionId: string,
  employeeCode?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const conversion = await prisma.hireConversion.findUnique({
      where: { id: conversionId },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!conversion) {
      return { success: false, error: "Processo de admissão não encontrado." };
    }

    const app = conversion.application;
    const finalCode = employeeCode || conversion.employeeCode || `MAT-${Math.floor(100000 + Math.random() * 900000)}`;

    await prisma.hireConversion.update({
      where: { id: conversion.id },
      data: {
        admissionStatus: "MATRICULATED",
        status: "ACTIVE",
        employeeCode: finalCode,
        reviewedBy: user.email,
        reviewedAt: new Date(),
      },
    });

    // Registra na timeline
    await prisma.activity.create({
      data: {
        applicationId: app.id,
        actorId: user.id || undefined,
        type: "STAGE_CHANGE",
        description: `🏆 Admissão concluída com sucesso! Matrícula ${finalCode} gerada pelo DP (${user.name || user.email}).`,
      },
    });

    // INTEGRAÇÃO CORE HR: Cria ou atualiza formalmente o colaborador na tabela Employee
    try {
      const candidate = app.candidate;
      const orgId = app.job.organizationId;
      const deptName = app.job.department || "Geral";

      // 1. Garante Departamento
      let department = await prisma.department.findFirst({
        where: { organizationId: orgId, name: { equals: deptName, mode: "insensitive" } },
      });
      if (!department) {
        department = await prisma.department.create({
          data: { organizationId: orgId, name: deptName },
        });
      }

      // 2. Garante Cargo (Position)
      let position = await prisma.position.findFirst({
        where: { organizationId: orgId, title: { equals: app.job.title, mode: "insensitive" } },
      });
      if (!position) {
        position = await prisma.position.create({
          data: {
            organizationId: orgId,
            departmentId: department.id,
            title: app.job.title,
            baseSalary: app.salaryExpectation || app.job.salaryMax || null,
          },
        });
      }

      // 3. Upsert em Employee
      const existingEmp = await prisma.employee.findFirst({
        where: { organizationId: orgId, email: candidate.email },
      });

      const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();

      if (existingEmp) {
        await prisma.employee.update({
          where: { id: existingEmp.id },
          data: {
            registrationNumber: finalCode,
            status: "ACTIVE",
            admissionDate: new Date(),
            departmentId: department.id,
            positionId: position.id,
            candidateId: candidate.id,
          },
        });
      } else {
        await prisma.employee.create({
          data: {
            organizationId: orgId,
            registrationNumber: finalCode,
            fullName,
            email: candidate.email,
            phone: candidate.phone,
            status: "ACTIVE",
            admissionDate: new Date(),
            departmentId: department.id,
            positionId: position.id,
            candidateId: candidate.id,
            employmentType: "CLT",
          },
        });
      }
    } catch (coreHrErr) {
      console.warn("Aviso ao sincronizar Core HR na admissão:", coreHrErr);
    }

    // Auditoria
    await logAuditEvent({
      organizationId: app.job.organizationId,
      actorUserId: user.id,
      action: "HIRE_AUTHORIZED",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: {
        admissionStatus: "MATRICULATED",
        employeeCode: finalCode,
      },
    });

    revalidatePath("/operations");
    revalidatePath("/employees");
    return { success: true, employeeCode: finalCode };
  } catch (error: any) {
    console.error("Erro ao efetivar admissão:", error);
    return { success: false, error: error.message || "Erro ao finalizar admissão." };
  }
}

/**
 * Checklist Padrão CLT / Compliance para Desligamento
 */
export const DEFAULT_OFFBOARDING_CHECKLIST = [
  {
    key: "EXAME_DEMISSIONAL_ASO",
    label: "Exame Médico Demissional (ASO)",
    description: "Obrigatório pela NR-7 antes da homologação da rescisão",
    required: true,
    completed: false,
    completedAt: null,
    notes: "",
  },
  {
    key: "DEVOLUCAO_EQUIPAMENTOS",
    label: "Devolução de Equipamentos e Ativos",
    description: "Notebook, carregador, crachá, celular corporativo e token",
    required: true,
    completed: false,
    completedAt: null,
    notes: "",
  },
  {
    key: "REVOGACAO_ACESSOS_TI",
    label: "Revogação de Acessos de TI e Segurança",
    description: "Bloqueio imediato de e-mail corporativo, VPN, Slack, Google Workspace e GitHub",
    required: true,
    completed: false,
    completedAt: null,
    notes: "",
  },
  {
    key: "HOMOLOGACAO_TRCT",
    label: "Assinatura do TRCT e Guias do FGTS",
    description: "Termo de Rescisão de Contrato de Trabalho e Chave de Conectividade Social",
    required: true,
    completed: false,
    completedAt: null,
    notes: "",
  },
  {
    key: "PAGAMENTO_VERBAS",
    label: "Pagamento das Verbas Rescisórias",
    description: "Prazo legal CLT: até 10 dias corridos do término do contrato",
    required: true,
    completed: false,
    completedAt: null,
    notes: "",
  },
  {
    key: "ENTREVISTA_DESLIGAMENTO",
    label: "Entrevista de Desligamento com DHO",
    description: "Coleta de feedback estruturado para gestão de turnover e cultura",
    required: false,
    completed: false,
    completedAt: null,
    notes: "",
  },
];

/**
 * Inicia um processo formal de desligamento / offboarding
 */
export async function startOffboardingProcess(
  employeeId: string,
  data: {
    terminationType: string;
    noticeType: string;
    noticeDate?: string;
    lastWorkingDay: string;
    severancePayEstimate?: number;
    interviewNotes?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { organization: true },
    });

    if (!employee) {
      return { success: false, error: "Colaborador não encontrado." };
    }

    // Verifica se já existe um processo em andamento
    const existing = await prisma.offboardingProcess.findFirst({
      where: { employeeId, status: "IN_PROGRESS" },
    });

    if (existing) {
      return { success: false, error: "Já existe um processo de desligamento em andamento para este colaborador." };
    }

    const process = await prisma.offboardingProcess.create({
      data: {
        employeeId: employee.id,
        organizationId: employee.organizationId,
        terminationType: data.terminationType,
        noticeType: data.noticeType,
        noticeDate: data.noticeDate ? new Date(data.noticeDate) : new Date(),
        lastWorkingDay: new Date(data.lastWorkingDay),
        severancePayEstimate: data.severancePayEstimate ? Number(data.severancePayEstimate) : null,
        status: "IN_PROGRESS",
        checklist: JSON.stringify(DEFAULT_OFFBOARDING_CHECKLIST),
        interviewNotes: data.interviewNotes || null,
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: employee.organizationId,
      actorUserId: user.id,
      action: "EMPLOYEE_OFFBOARDING_STARTED",
      resourceType: "OffboardingProcess",
      resourceId: process.id,
      afterData: {
        employeeId: employee.id,
        employeeName: employee.fullName,
        terminationType: data.terminationType,
        noticeType: data.noticeType,
        lastWorkingDay: data.lastWorkingDay,
      },
    });

    revalidatePath("/operations");
    revalidatePath("/employees");
    return { success: true, process };
  } catch (error: any) {
    console.error("Erro ao iniciar desligamento:", error);
    return { success: false, error: error.message || "Erro ao iniciar processo de desligamento." };
  }
}

/**
 * Atualiza um item do checklist de offboarding
 */
export async function updateOffboardingChecklistItem(
  processId: string,
  itemKey: string,
  completed: boolean,
  notes?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const process = await prisma.offboardingProcess.findUnique({
      where: { id: processId },
      include: { employee: true },
    });

    if (!process) {
      return { success: false, error: "Processo de desligamento não encontrado." };
    }

    let checklist: any[] = [];
    try {
      checklist = JSON.parse(process.checklist || "[]");
    } catch {
      checklist = [...DEFAULT_OFFBOARDING_CHECKLIST];
    }

    const itemIndex = checklist.findIndex((item: any) => item.key === itemKey);
    if (itemIndex >= 0) {
      checklist[itemIndex].completed = completed;
      checklist[itemIndex].completedAt = completed ? new Date().toISOString() : null;
      if (notes !== undefined) {
        checklist[itemIndex].notes = notes;
      }
    } else {
      checklist.push({
        key: itemKey,
        label: itemKey,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        notes: notes || "",
      });
    }

    const updated = await prisma.offboardingProcess.update({
      where: { id: processId },
      data: { checklist: JSON.stringify(checklist) },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: process.organizationId,
      actorUserId: user.id,
      action: "EMPLOYEE_OFFBOARDING_CHECKLIST_UPDATE",
      resourceType: "OffboardingProcess",
      resourceId: process.id,
      afterData: {
        itemKey,
        completed,
        employeeName: process.employee.fullName,
      },
    });

    revalidatePath("/operations");
    return { success: true, checklist };
  } catch (error: any) {
    console.error("Erro ao atualizar checklist:", error);
    return { success: false, error: error.message || "Erro ao atualizar checklist de desligamento." };
  }
}

/**
 * Conclui formalmente o processo de desligamento
 */
export async function completeOffboardingProcess(processId: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const process = await prisma.offboardingProcess.findUnique({
      where: { id: processId },
      include: { employee: true },
    });

    if (!process) {
      return { success: false, error: "Processo de desligamento não encontrado." };
    }

    // Atualiza status do processo
    await prisma.offboardingProcess.update({
      where: { id: processId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Atualiza o colaborador para TERMINATED e fixa data de rescisão
    await prisma.employee.update({
      where: { id: process.employeeId },
      data: {
        status: "TERMINATED",
        terminationDate: process.lastWorkingDay || new Date(),
      },
    });

    // Auditoria
    await logAuditEvent({
      organizationId: process.organizationId,
      actorUserId: user.id,
      action: "EMPLOYEE_TERMINATED",
      resourceType: "OffboardingProcess",
      resourceId: process.id,
      afterData: {
        employeeId: process.employeeId,
        employeeName: process.employee.fullName,
        terminationDate: process.lastWorkingDay,
      },
    });

    revalidatePath("/operations");
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao concluir desligamento:", error);
    return { success: false, error: error.message || "Erro ao finalizar desligamento." };
  }
}

/**
 * Cancela um processo de desligamento
 */
export async function cancelOffboardingProcess(processId: string, reason?: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const process = await prisma.offboardingProcess.findUnique({
      where: { id: processId },
      include: { employee: true },
    });

    if (!process) {
      return { success: false, error: "Processo não encontrado." };
    }

    await prisma.offboardingProcess.update({
      where: { id: processId },
      data: {
        status: "CANCELLED",
        interviewNotes: reason ? `Cancelado: ${reason}` : process.interviewNotes,
      },
    });

    // Garante que o status do colaborador volta a ACTIVE se não estava finalizado
    if (process.employee.status === "TERMINATED") {
      await prisma.employee.update({
        where: { id: process.employeeId },
        data: {
          status: "ACTIVE",
          terminationDate: null,
        },
      });
    }

    revalidatePath("/operations");
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao cancelar desligamento:", error);
    return { success: false, error: error.message || "Erro ao cancelar desligamento." };
  }
}
