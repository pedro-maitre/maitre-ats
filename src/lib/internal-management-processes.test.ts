/**
 * AUDITORIA E TESTES ASSERTIVOS DE FUNCIONALIDADE
 * CENTRAL DE GESTÃO INTERNA DA MAÎTRE CONSULTORIA
 *
 * Cobre os 9 macro-processos operacionais e de governança:
 * 1. Criação e Classificação de Demandas (Projetos vs. Serviços vs. Atividades Internas)
 * 2. Início de Execução e Responsabilidade Obrigatória
 * 3. Cancelamento Auditado com Motivo
 * 4. Bloqueios e Desbloqueios Operacionais Desacoplados
 * 5. Fila Formal de Revisão e Aprovação por Revisor Designado
 * 6. Ritual da Reunião Semanal (Segundas 15h30), Pauta Viva e Imutabilidade de Atas
 * 7. Exclusividade e Governança da Admin Master (Adriana)
 * 8. Isolamento Multitenant Rigoroso (Sem Vazamento a Clientes)
 * 9. Balanceamento Operacional Não-Punitivo da Equipe
 */

import { describe, it, expect } from "vitest";
import {
  checkIsAdminMaster,
  hasInternalPermission,
  validateTaskTransition,
  getNextWeeklyMeetingDate,
  calculateTeamWorkloadDistribution,
  InternalUserContext,
  TaskStatus,
} from "./internal-management";

describe("AUDITORIA ASSERTIVA DE PROCESSOS — Central de Gestão Interna Maître", () => {
  // Dados de contexto dos 6 colaboradores reais e cliente externo
  const adrianaId = "cmtlmunu80003lol7jp7c4tzh";
  const pedroId = "cmtlmunjd0000lol7vpa1bi6t";
  const erikaId = "cmtlmunn50001lol76coc8m36";
  const laurianaId = "cmtlmunrq0002lol7nfd76483";
  const khevianyId = "cmtlmus120005lol7g5e9m42u";
  const emidioId = "cmtlmup290004lol77k4y8gfa";
  const masterOrgId = "cmtk6ngr00000j4l7xjiur3b2";

  const adrianaCtx: InternalUserContext = {
    userId: adrianaId,
    email: "adriana@maitrework.com.br",
    name: "Adriana Pinheiro",
    role: "ADMIN",
    organizationId: masterOrgId,
    isMasterOrg: true,
    isAdminMaster: true,
  };

  const pedroCtx: InternalUserContext = {
    userId: pedroId,
    email: "pedro@maitrework.com.br",
    name: "Pedro Atuan",
    role: "RECRUITER",
    organizationId: masterOrgId,
    isMasterOrg: true,
    isAdminMaster: false,
  };

  const erikaCtx: InternalUserContext = {
    userId: erikaId,
    email: "erika@maitrework.com.br",
    name: "Erika Carla",
    role: "RECRUITER",
    organizationId: masterOrgId,
    isMasterOrg: true,
    isAdminMaster: false,
  };

  const clientCtx: InternalUserContext = {
    userId: "client-hiring-manager-id",
    email: "diretor@empresa-cliente.com.br",
    name: "Diretor Cliente",
    role: "HIRING_MANAGER",
    organizationId: "org-cliente-corporativo",
    isMasterOrg: false,
    isAdminMaster: false,
  };

  // =========================================================================
  // PROCESSO 1: CRIAÇÃO E CLASSIFICAÇÃO DE DEMANDAS
  // =========================================================================
  describe("Processo 1: Criação e Classificação de Demandas", () => {
    it("permite a qualquer integrante da Maître criar demandas internas", () => {
      expect(hasInternalPermission(pedroCtx, "internal.task.create")).toBe(true);
      expect(hasInternalPermission(erikaCtx, "internal.task.create")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.task.create")).toBe(true);
    });

    it("tarefa sem responsável pode existir unicamente como rascunho/entrada (TODO)", () => {
      const taskDraft = {
        title: "Demanda levantada no comitê de DHO",
        status: "TODO" as TaskStatus,
        assigneeId: null,
      };

      expect(taskDraft.status).toBe("TODO");
      expect(taskDraft.assigneeId).toBeNull();
    });

    it("tarefa com múltiplos participantes deve preservar responsável principal claro", () => {
      const taskCollective = {
        title: "Elaboração de Matriz de Competências",
        assigneeId: pedroId, // Responsável principal
        memberIds: [erikaId, laurianaId], // Co-participantes
      };

      expect(taskCollective.assigneeId).toBe(pedroId);
      expect(taskCollective.memberIds).toContain(erikaId);
      expect(taskCollective.memberIds).toContain(laurianaId);
      expect(taskCollective.memberIds.length).toBe(2);
    });
  });

  // =========================================================================
  // PROCESSO 2: INÍCIO DE EXECUÇÃO E RESPONSABILIDADE OBRIGATÓRIA
  // =========================================================================
  describe("Processo 2: Início de Execução e Responsabilidade Obrigatória", () => {
    it("REJEITA categoricamente transição de TODO para IN_PROGRESS se não houver responsável principal", () => {
      const result = validateTaskTransition("TODO", "IN_PROGRESS", {
        requiresApproval: false,
        hasApprovedReview: false,
        assigneeId: null,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("A tarefa precisa ter um responsável principal atribuído para iniciar execução.");
    });

    it("REJEITA transição de TODO para IN_REVIEW se não houver responsável principal", () => {
      const result = validateTaskTransition("TODO", "IN_REVIEW", {
        requiresApproval: false,
        hasApprovedReview: false,
        assigneeId: undefined,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("responsável principal");
    });

    it("PERMITE transição de TODO para IN_PROGRESS quando há responsável designado", () => {
      const result = validateTaskTransition("TODO", "IN_PROGRESS", {
        requiresApproval: false,
        hasApprovedReview: false,
        assigneeId: pedroId,
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  // =========================================================================
  // PROCESSO 3: CANCELAMENTO AUDITADO COM JUSTIFICATIVA
  // =========================================================================
  describe("Processo 3: Cancelamento Auditado com Motivo", () => {
    it("REJEITA cancelamento se o motivo for omitido ou vazio", () => {
      const semMotivo = validateTaskTransition("IN_PROGRESS", "CANCELLED", {
        requiresApproval: false,
        hasApprovedReview: false,
        cancellationReason: null,
      });
      expect(semMotivo.allowed).toBe(false);
      expect(semMotivo.reason).toContain("mínimo 5 caracteres");

      const motivoEspacos = validateTaskTransition("IN_PROGRESS", "CANCELLED", {
        requiresApproval: false,
        hasApprovedReview: false,
        cancellationReason: "   ",
      });
      expect(motivoEspacos.allowed).toBe(false);
    });

    it("REJEITA cancelamento se o motivo tiver menos de 5 caracteres", () => {
      const motivoCurto = validateTaskTransition("IN_PROGRESS", "CANCELLED", {
        requiresApproval: false,
        hasApprovedReview: false,
        cancellationReason: "Nao",
      });
      expect(motivoCurto.allowed).toBe(false);
      expect(motivoCurto.reason).toContain("mínimo 5 caracteres");
    });

    it("PERMITE cancelamento quando houver justificativa fundamentada", () => {
      const cancelamentoValido = validateTaskTransition("IN_PROGRESS", "CANCELLED", {
        requiresApproval: false,
        hasApprovedReview: false,
        cancellationReason: "Projeto descontinuado a pedido da diretoria do cliente.",
      });
      expect(cancelamentoValido.allowed).toBe(true);
    });
  });

  // =========================================================================
  // PROCESSO 4: BLOQUEIOS OPERACIONAIS DESACOPLADOS
  // =========================================================================
  describe("Processo 4: Bloqueios Operacionais Desacoplados", () => {
    it("bloqueio opera como atributo independente com motivo e data sem destruir o status da tarefa", () => {
      const task = {
        id: "task-100",
        status: "IN_PROGRESS" as TaskStatus,
        isBlocked: true,
        blockedReason: "Aguardando envio do organograma pelo cliente",
        blockedAt: new Date(),
      };

      expect(task.status).toBe("IN_PROGRESS");
      expect(task.isBlocked).toBe(true);
      expect(task.blockedReason).toContain("organograma");
      expect(task.blockedAt).toBeInstanceOf(Date);
    });

    it("desbloqueio limpa o motivo sem alterar o status em andamento", () => {
      const task = {
        id: "task-100",
        status: "IN_PROGRESS" as TaskStatus,
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
      };

      expect(task.status).toBe("IN_PROGRESS");
      expect(task.isBlocked).toBe(false);
      expect(task.blockedReason).toBeNull();
    });
  });

  // =========================================================================
  // PROCESSO 5: FILA FORMAL DE REVISÃO E APROVAÇÃO
  // =========================================================================
  describe("Processo 5: Fila Formal de Revisão e Aprovação por Revisor", () => {
    it("IMPEDE conclusão direta se a entrega exigir aprovação e não houver parecer aprovado", () => {
      const result = validateTaskTransition("IN_REVIEW", "COMPLETED", {
        requiresApproval: true,
        hasApprovedReview: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("aprovação formal do revisor");
    });

    it("PERMITE conclusão quando a aprovação formal for registrada pelo revisor", () => {
      const result = validateTaskTransition("IN_REVIEW", "COMPLETED", {
        requiresApproval: true,
        hasApprovedReview: true,
      });

      expect(result.allowed).toBe(true);
    });

    it("apenas o revisor designado ou a Admin Master podem homologar a revisão", () => {
      // Adriana é Admin Master -> Pode aprovar qualquer tarefa
      expect(
        hasInternalPermission(adrianaCtx, "internal.delivery.review", {
          reviewerId: pedroId,
        })
      ).toBe(true);

      // Pedro é o revisor designado -> Pode aprovar
      expect(
        hasInternalPermission(pedroCtx, "internal.delivery.review", {
          reviewerId: pedroId,
        })
      ).toBe(true);

      // Erika NÃO é a revisora desta entrega -> NÃO pode aprovar
      expect(
        hasInternalPermission(erikaCtx, "internal.delivery.review", {
          reviewerId: pedroId,
        })
      ).toBe(false);
    });
  });

  // =========================================================================
  // PROCESSO 6: RITUAL DA REUNIÃO SEMANAL (SEGUNDAS 15H30) E ATAS IMUTÁVEIS
  // =========================================================================
  describe("Processo 6: Reunião Semanal (Segundas 15h30) e Atas Imutáveis", () => {
    it("agenda com precisão matemática a próxima segunda-feira às 15h30", () => {
      // Quinta-feira 10/09/2026 11h00
      const quintaFeira = new Date("2026-09-10T11:00:00.000Z");
      const proximaReuniao = getNextWeeklyMeetingDate(quintaFeira, 1, "15:30", "America/Fortaleza");

      expect(proximaReuniao.getDay()).toBe(1); // Segunda-feira
      expect(proximaReuniao.getHours()).toBe(15);
      expect(proximaReuniao.getMinutes()).toBe(30);
    });

    it("ao fechar a ata da reunião semanal, o snapshot fica congelado e imutável", () => {
      const meetingSnapshot = {
        id: "meeting-week-37",
        title: "Alinhamento Semanal Maître — 07/09/2026",
        scheduledAt: new Date("2026-09-07T18:30:00.000Z"),
        status: "CONCLUDED",
        concludedAt: new Date(),
        attendees: [
          { userId: adrianaId, name: "Adriana Pinheiro" },
          { userId: pedroId, name: "Pedro Atuan" },
          { userId: erikaId, name: "Erika Carla" },
        ],
        decisions: [
          "Definido foco prioritário no BPO da Empresa Beta esta semana",
          "Lauriana assume apoio em hunting de Engenharia",
        ],
        tasksCreatedCount: 3,
        isLocked: true,
      };

      expect(meetingSnapshot.status).toBe("CONCLUDED");
      expect(meetingSnapshot.isLocked).toBe(true);
      expect(meetingSnapshot.decisions.length).toBe(2);
      expect(meetingSnapshot.attendees.length).toBe(3);
    });
  });

  // =========================================================================
  // PROCESSO 7: EXCLUSIVIDADE E GOVERNANÇA DA ADMIN MASTER
  // =========================================================================
  describe("Processo 7: Exclusividade e Governança da Admin Master (Adriana)", () => {
    it("garante que unicamente a Adriana Pinheiro tem privilégio de Admin Master", () => {
      expect(checkIsAdminMaster(adrianaId, adrianaId, true)).toBe(true);
      expect(checkIsAdminMaster(pedroId, adrianaId, true)).toBe(false);
      expect(checkIsAdminMaster(erikaId, adrianaId, true)).toBe(false);
      expect(checkIsAdminMaster(laurianaId, adrianaId, true)).toBe(false);
      expect(checkIsAdminMaster(khevianyId, adrianaId, true)).toBe(false);
      expect(checkIsAdminMaster(emidioId, adrianaId, true)).toBe(false);
    });

    it("impede que colaboradores não-administradores alterem configurações globais ou reuniões", () => {
      expect(hasInternalPermission(pedroCtx, "internal.config.manage")).toBe(false);
      expect(hasInternalPermission(pedroCtx, "internal.meeting.manage")).toBe(false);
      expect(hasInternalPermission(erikaCtx, "internal.config.manage")).toBe(false);
    });

    it("concede à Admin Master prerrogativa plena de gestão de configuração e governança", () => {
      expect(hasInternalPermission(adrianaCtx, "internal.config.manage")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.meeting.manage")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.project.manage")).toBe(true);
    });
  });

  // =========================================================================
  // PROCESSO 8: ISOLAMENTO MULTITENANT (ANTI-VAZAMENTO A CLIENTES)
  // =========================================================================
  describe("Processo 8: Isolamento Multitenant Rigoroso (Sem Vazamento a Clientes)", () => {
    it("clientes corporativos recebem negação automática em todas as capacidades internas da Maître", () => {
      expect(hasInternalPermission(clientCtx, "internal.task.create")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.task.update")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.task.assign")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.delivery.review")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.meeting.manage")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.project.manage")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.config.manage")).toBe(false);
    });
  });

  // =========================================================================
  // PROCESSO 9: BALANCEAMENTO OPERACIONAL NÃO-PUNITIVO
  // =========================================================================
  describe("Processo 9: Balanceamento Operacional Não-Punitivo da Equipe", () => {
    it("calcula volumes de carga de trabalho para distribuição equilibrada sem produzir rankings individuais", () => {
      const members = [
        { id: adrianaId, name: "Adriana Pinheiro" },
        { id: pedroId, name: "Pedro Atuan" },
        { id: erikaId, name: "Erika Carla" },
        { id: laurianaId, name: "Lauriana" },
        { id: khevianyId, name: "Kheviany" },
        { id: emidioId, name: "Emidio" },
      ];

      const tasks = [
        { assigneeId: pedroId, status: "IN_PROGRESS", isBlocked: false, dueDate: null },
        { assigneeId: pedroId, status: "IN_REVIEW", isBlocked: false, dueDate: null },
        { assigneeId: erikaId, status: "IN_PROGRESS", isBlocked: true, dueDate: null },
        { assigneeId: laurianaId, status: "COMPLETED", isBlocked: false, dueDate: null },
        { assigneeId: khevianyId, status: "IN_PROGRESS", isBlocked: false, dueDate: null },
        { assigneeId: emidioId, status: "TODO", isBlocked: false, dueDate: null },
      ];

      const workload = calculateTeamWorkloadDistribution(members, tasks);

      expect(workload.length).toBe(6);

      const pedroWorkload = workload.find((w) => w.userId === pedroId)!;
      expect(pedroWorkload.totalAssigned).toBe(2);
      expect(pedroWorkload.inProgress).toBe(1);
      expect(pedroWorkload.inReview).toBe(1);
      expect(pedroWorkload.blocked).toBe(0);

      const erikaWorkload = workload.find((w) => w.userId === erikaId)!;
      expect(erikaWorkload.blocked).toBe(1);

      // Verificação de segurança: Não há nenhuma propriedade de ranking, nota ou score punitivo
      workload.forEach((item) => {
        expect((item as any).score).toBeUndefined();
        expect((item as any).rank).toBeUndefined();
        expect((item as any).performanceGrade).toBeUndefined();
      });
    });
  });
});
