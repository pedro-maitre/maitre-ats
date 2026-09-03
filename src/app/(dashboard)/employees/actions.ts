/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

/**
 * Atualiza o status de Onboarding do Colaborador no Core HR.
 */
export async function updateEmployeeOnboardingStatus(
  conversionId: string,
  newStatus: "CONVERTED" | "PENDING_ONBOARDING" | "ACTIVE" | "OFFBOARDED"
) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN", "RECRUITER"]);

    const conversion = await prisma.hireConversion.update({
      where: { id: conversionId },
      data: {
        status: newStatus,
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: { select: { organizationId: true, title: true } },
          },
        },
      },
    });

    // Se houver um Employee correspondente por email, sincroniza o status
    const candidateEmail = conversion.application.candidate.email;
    if (candidateEmail) {
      await prisma.employee.updateMany({
        where: { email: candidateEmail },
        data: {
          status: newStatus === "OFFBOARDED" ? "TERMINATED" : "ACTIVE",
        },
      });
    }

    await logAuditEvent({
      organizationId: conversion.application.job.organizationId,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: { status: newStatus, candidate: candidateEmail },
      reason: `Status de onboarding alterado para ${newStatus} por ${user.email}.`,
    });

    revalidatePath("/employees");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao atualizar status de onboarding:", err);
    return { success: false, error: err.message || "Falha ao atualizar status." };
  }
}

/**
 * Cadastra um novo colaborador diretamente no Core HR (Modelos Employee, Department e Position).
 */
export async function createDirectEmployee(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN"]);

    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const cpf = (formData.get("cpf") as string)?.trim() || null;
    const jobTitle = (formData.get("jobTitle") as string)?.trim();
    const departmentName = (formData.get("department") as string)?.trim() || "Geral";
    const salary = parseFloat((formData.get("salary") as string)?.replace(/[^0-9.]/g, "") || "0");
    const employmentType = (formData.get("employmentType") as string)?.trim() || "CLT";
    const employeeCode = (formData.get("employeeCode") as string)?.trim() || `MC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const targetOrgId = (formData.get("organizationId") as string)?.trim();

    if (!firstName || !email || !jobTitle) {
      throw new Error("Nome, E-mail e Cargo são obrigatórios.");
    }

    let org: any = null;
    if (targetOrgId) {
      org = await prisma.organization.findUnique({ where: { id: targetOrgId } });
    }
    if (!org) {
      org = await prisma.organization.findFirst({
        where: { isMaster: true },
      }) || (await prisma.organization.findFirst());
    }

    if (!org) throw new Error("Organização não configurada no sistema.");

    // 1. Busca ou cria o Departamento
    let department = await prisma.department.findFirst({
      where: {
        organizationId: org.id,
        name: { equals: departmentName, mode: "insensitive" },
      },
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: departmentName,
        },
      });
    }

    // 2. Busca ou cria o Cargo (Position)
    let position = await prisma.position.findFirst({
      where: {
        organizationId: org.id,
        title: { equals: jobTitle, mode: "insensitive" },
      },
    });

    if (!position) {
      position = await prisma.position.create({
        data: {
          organizationId: org.id,
          departmentId: department.id,
          title: jobTitle,
          baseSalary: salary > 0 ? salary : null,
        },
      });
    }

    // 3. Cria ou atualiza o Colaborador na tabela Employee
    const existingEmployee = await prisma.employee.findFirst({
      where: { organizationId: org.id, email },
    });

    let employee: any;
    if (existingEmployee) {
      employee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          fullName,
          phone,
          cpf,
          salary: salary > 0 ? salary : existingEmployee.salary,
          departmentId: department.id,
          positionId: position.id,
          employmentType,
          status: "ACTIVE",
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          organizationId: org.id,
          registrationNumber: employeeCode,
          fullName,
          email,
          cpf,
          phone,
          salary,
          employmentType,
          status: "ACTIVE",
          departmentId: department.id,
          positionId: position.id,
        },
      });
    }

    // 4. Criação compatível de Candidate + Application + HireConversion para integridade com ATS legado
    let job = await prisma.job.findFirst({
      where: { title: jobTitle, organizationId: org.id },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          title: jobTitle,
          description: `Cargo cadastrado no Core HR para ${jobTitle}.`,
          department: departmentName,
          salaryMin: salary,
          salaryMax: salary,
          status: "CLOSED",
          organizationId: org.id,
          stages: {
            create: [{ name: "Contratado", order: 0, organizationId: org.id }],
          },
        },
        include: { stages: true },
      });
    }

    const candidate = await prisma.candidate.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone,
      },
      create: {
        firstName,
        lastName,
        email,
        phone,
        organizationId: org.id,
        source: "Admissão Direta Core HR",
      },
    });

    let app = await prisma.application.findFirst({
      where: { candidateId: candidate.id, jobId: job.id },
    });

    if (!app) {
      app = await prisma.application.create({
        data: {
          candidateId: candidate.id,
          jobId: job.id,
          stageId: job.stages[0]?.id || "",
          matchScore: 100,
          fitCategory: "ALTO_FIT",
          priority: "PRIORIZADO",
          salaryExpectation: salary,
        },
      });
    }

    await prisma.hireConversion.upsert({
      where: { applicationId: app.id },
      update: {
        status: "ACTIVE",
        employeeCode,
      },
      create: {
        applicationId: app.id,
        convertedBy: user.email || "SYSTEM",
        employeeCode,
        status: "ACTIVE",
      },
    });

    // 5. Auditoria e Outbox
    await prisma.integrationOutbox.create({
      data: {
        organizationId: org.id,
        eventType: "employee.created.v1",
        payload: JSON.stringify({
          employeeId: employee.id,
          fullName,
          email,
          employeeCode,
          department: departmentName,
          position: jobTitle,
          salary,
          authorizedBy: user.email,
          occurredAt: new Date().toISOString(),
        }),
      },
    });

    await logAuditEvent({
      organizationId: org.id,
      actorUserId: user.id,
      action: "HIRE_AUTHORIZED",
      resourceType: "Employee",
      resourceId: employee.id,
      afterData: { employeeCode, email, jobTitle, department: departmentName },
      reason: `Colaborador cadastrado no Core HR por ${user.email}.`,
    });

    revalidatePath("/employees");
    return { success: true, employeeId: employee.id };
  } catch (err: any) {
    console.error("Erro ao cadastrar colaborador:", err);
    return { success: false, error: err.message || "Falha ao cadastrar colaborador." };
  }
}
