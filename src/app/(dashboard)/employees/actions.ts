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

    await logAuditEvent({
      organizationId: conversion.application.job.organizationId,
      actorUserId: user.id,
      action: "CANDIDATE_UPDATE",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: { status: newStatus, candidate: conversion.application.candidate.email },
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
 * Cadastra um novo colaborador manual diretamente no Core HR.
 */
export async function createDirectEmployee(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN"]);

    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim() || "";
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = (formData.get("phone") as string)?.trim();
    const jobTitle = (formData.get("jobTitle") as string)?.trim();
    const department = (formData.get("department") as string)?.trim() || "Geral";
    const salary = parseFloat((formData.get("salary") as string)?.replace(/[^0-9.]/g, "") || "0");
    const employeeCode = (formData.get("employeeCode") as string)?.trim() || `MC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    if (!firstName || !email || !jobTitle) {
      throw new Error("Nome, E-mail e Cargo são obrigatórios.");
    }

    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Organização não configurada.");

    // Busca ou cria a vaga do cargo
    let job = await prisma.job.findFirst({
      where: { title: jobTitle, organizationId: org.id },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          title: jobTitle,
          description: `Cargo cadastrado diretamente no Core HR para ${jobTitle}.`,
          department,
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

    // Cria ou atualiza o candidato
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

    // Cria aplicação
    const app = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: job.id,
        stageId: job.stages[0].id,
        matchScore: 100,
        fitCategory: "ALTO_FIT",
        priority: "PRIORIZADO",
        salaryExpectation: salary,
      },
    });

    // Cria Conversão no Core HR
    const conversion = await prisma.hireConversion.create({
      data: {
        applicationId: app.id,
        convertedBy: user.email || "SYSTEM",
        employeeCode,
        status: "ACTIVE",
      },
    });

    // Registra evento na Outbox
    await prisma.integrationOutbox.create({
      data: {
        organizationId: org.id,
        eventType: "candidate.hire_authorized.v1",
        payload: JSON.stringify({
          applicationId: app.id,
          candidateId: candidate.id,
          candidateName: `${firstName} ${lastName}`,
          candidateEmail: email,
          jobId: job.id,
          jobTitle,
          employeeCode,
          salaryOffered: salary,
          authorizedBy: user.email,
          occurredAt: new Date().toISOString(),
        }),
      },
    });

    await logAuditEvent({
      organizationId: org.id,
      actorUserId: user.id,
      action: "HIRE_AUTHORIZED",
      resourceType: "HireConversion",
      resourceId: conversion.id,
      afterData: { employeeCode, email, jobTitle },
    });

    revalidatePath("/employees");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao cadastrar colaborador:", err);
    return { success: false, error: err.message || "Falha ao cadastrar colaborador." };
  }
}
