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

/**
 * Importa colaboradores em lote a partir de arquivo ou texto CSV.
 */
export async function importEmployeesBatch(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN"]);

    const organizationId = (formData.get("organizationId") as string)?.trim();
    const csvContent = (formData.get("csvContent") as string)?.trim();

    if (!organizationId) {
      return { success: false, error: "Empresa de destino é obrigatória." };
    }
    if (!csvContent) {
      return { success: false, error: "Conteúdo CSV vazio ou não fornecido." };
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      return { success: false, error: "Empresa não encontrada no sistema." };
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return { success: false, error: "O CSV deve conter ao menos a linha de cabeçalho e um colaborador." };
    }

    // Detectar separador (, ou ;)
    const firstLine = lines[0];
    const separator = firstLine.includes(";") ? ";" : ",";

    const header = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

    // Identificar índices das colunas
    const nameIdx = header.findIndex((h) => h.includes("nome") || h.includes("name"));
    const emailIdx = header.findIndex((h) => h.includes("mail"));
    const roleIdx = header.findIndex((h) => h.includes("cargo") || h.includes("função") || h.includes("role") || h.includes("position"));
    const deptIdx = header.findIndex((h) => h.includes("depart") || h.includes("setor") || h.includes("área") || h.includes("area"));
    const codeIdx = header.findIndex((h) => h.includes("matr") || h.includes("código") || h.includes("code") || h.includes("id"));
    const cpfIdx = header.findIndex((h) => h.includes("cpf"));
    const salaryIdx = header.findIndex((h) => h.includes("salár") || h.includes("salar") || h.includes("remunera") || h.includes("budget"));
    const typeIdx = header.findIndex((h) => h.includes("tipo") || h.includes("regime") || h.includes("contrato"));

    if (nameIdx === -1 || emailIdx === -1) {
      return {
        success: false,
        error: "O cabeçalho do CSV deve conter ao menos as colunas 'Nome' e 'E-mail'.",
      };
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(separator).map((val) => val.trim().replace(/^["']|["']$/g, ""));
      if (row.length <= 1 && !row[0]) continue;

      const fullName = row[nameIdx] || "";
      const email = (row[emailIdx] || "").toLowerCase();
      const jobTitle = roleIdx !== -1 ? row[roleIdx] || "Colaborador" : "Colaborador";
      const departmentName = deptIdx !== -1 ? row[deptIdx] || "Geral" : "Geral";
      const registrationNumber = codeIdx !== -1 && row[codeIdx] ? row[codeIdx] : `MC-${Math.floor(100000 + Math.random() * 900000)}`;
      const cpf = cpfIdx !== -1 ? row[cpfIdx] || null : null;
      const salaryStr = salaryIdx !== -1 ? row[salaryIdx] : "0";
      const salary = parseFloat(salaryStr.replace(/[^0-9.]/g, "") || "0");
      const employmentType = typeIdx !== -1 ? (row[typeIdx]?.toUpperCase().includes("PJ") ? "PJ" : "CLT") : "CLT";

      if (!fullName || !email || !email.includes("@")) {
        errors.push(`Linha ${i + 1}: Dados inválidos ou e-mail ausente (${lines[i]}).`);
        continue;
      }

      try {
        // 1. Garante Departamento
        let dept = await prisma.department.findFirst({
          where: {
            organizationId,
            name: { equals: departmentName, mode: "insensitive" },
          },
        });
        if (!dept) {
          dept = await prisma.department.create({
            data: { organizationId, name: departmentName },
          });
        }

        // 2. Garante Cargo (Position)
        let pos = await prisma.position.findFirst({
          where: {
            organizationId,
            title: { equals: jobTitle, mode: "insensitive" },
          },
        });
        if (!pos) {
          pos = await prisma.position.create({
            data: {
              organizationId,
              departmentId: dept.id,
              title: jobTitle,
              baseSalary: salary > 0 ? salary : null,
            },
          });
        }

        // 2.5 Garante Candidate para integridade total com Avaliações 9-Box e PDI
        let cand = await prisma.candidate.findFirst({
          where: { email },
        });
        const nameParts = fullName.split(" ");
        const fName = nameParts[0] || "Colaborador";
        const lName = nameParts.slice(1).join(" ") || "";

        if (!cand) {
          cand = await prisma.candidate.create({
            data: {
              organizationId,
              firstName: fName,
              lastName: lName,
              email,
              source: "IMPORTACAO_CORE_HR",
            },
          });
        }

        // 3. Upsert em Employee
        const existingEmp = await prisma.employee.findFirst({
          where: { organizationId, email },
        });

        if (existingEmp) {
          await prisma.employee.update({
            where: { id: existingEmp.id },
            data: {
              fullName,
              registrationNumber,
              cpf,
              candidateId: cand.id,
              salary: salary > 0 ? salary : existingEmp.salary,
              departmentId: dept.id,
              positionId: pos.id,
              employmentType,
              status: "ACTIVE",
            },
          });
        } else {
          await prisma.employee.create({
            data: {
              organizationId,
              fullName,
              email,
              registrationNumber,
              cpf,
              candidateId: cand.id,
              salary: salary > 0 ? salary : null,
              departmentId: dept.id,
              positionId: pos.id,
              employmentType,
              status: "ACTIVE",
            },
          });
        }

        successCount++;
      } catch (rowErr: any) {
        errors.push(`Linha ${i + 1} (${email}): ${rowErr.message}`);
      }
    }

    await logAuditEvent({
      organizationId,
      actorUserId: user.id,
      action: "HIRE_AUTHORIZED",
      resourceType: "Employee",
      resourceId: organizationId,
      afterData: { totalProcessed: lines.length - 1, successCount, errorsCount: errors.length },
      reason: `Importação em lote de ${successCount} colaboradores realizada por ${user.email}.`,
    });

    revalidatePath("/employees");
    revalidatePath(`/clients/${organizationId}`);
    return {
      success: true,
      count: successCount,
      total: lines.length - 1,
      errors,
    };
  } catch (err: any) {
    console.error("Erro na importação em lote:", err);
    return { success: false, error: err.message || "Erro durante o processamento do lote." };
  }
}

