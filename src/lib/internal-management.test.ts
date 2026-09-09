import { describe, it, expect } from "vitest";
import {
  checkIsAdminMaster,
  hasInternalPermission,
  validateTaskTransition,
  getNextWeeklyMeetingDate,
  calculateTeamWorkloadDistribution,
  InternalUserContext,
} from "./internal-management";

describe("Central de Gestão Interna da Maître: Testes Unitários de Regras & Segurança", () => {
  const adrianaId = "cmtlmunu80003lol7jp7c4tzh";
  const pedroId = "cmtlmunjd0000lol7vpa1bi6t";
  const erikaId = "cmtlmunn50001lol76coc8m36";

  const adrianaCtx: InternalUserContext = {
    userId: adrianaId,
    email: "adriana@maitrework.com.br",
    name: "Adriana Pinheiro",
    role: "ADMIN",
    organizationId: "cmtk6ngr00000j4l7xjiur3b2",
    isMasterOrg: true,
    isAdminMaster: true,
  };

  const pedroCtx: InternalUserContext = {
    userId: pedroId,
    email: "pedro@maitrework.com.br",
    name: "Pedro Atuan",
    role: "RECRUITER",
    organizationId: "cmtk6ngr00000j4l7xjiur3b2",
    isMasterOrg: true,
    isAdminMaster: false,
  };

  const clientCtx: InternalUserContext = {
    userId: "client-user-999",
    email: "rh@clientecorporativo.com.br",
    name: "Gestor Cliente",
    role: "HIRING_MANAGER",
    organizationId: "org-cliente-externo",
    isMasterOrg: false,
    isAdminMaster: false,
  };

  // =========================================================================
  // 1. Exclusividade da Admin Master (Adriana)
  // =========================================================================
  describe("1. Exclusividade e Validação de Admin Master", () => {
    it("reconhece unicamente o ID verificado da Adriana na organização Master", () => {
      expect(checkIsAdminMaster(adrianaId, adrianaId, true)).toBe(true);
    });

    it("rejeita qualquer outro usuário como Admin Master, mesmo com papel ADMIN ou RECRUITER", () => {
      expect(checkIsAdminMaster(pedroId, adrianaId, true)).toBe(false);
      expect(checkIsAdminMaster(erikaId, adrianaId, true)).toBe(false);
      expect(checkIsAdminMaster("conta-admin-tecnica", adrianaId, true)).toBe(false);
    });

    it("rejeita Admin Master se a organização não for a empresa mantenedora Master", () => {
      expect(checkIsAdminMaster(adrianaId, adrianaId, false)).toBe(false);
    });
  });

  // =========================================================================
  // 2. Matriz de Permissões Granulares
  // =========================================================================
  describe("2. Autorização e Matriz de Permissões Granulares", () => {
    it("concede autoridade plena de gestão e governança à Admin Master", () => {
      expect(hasInternalPermission(adrianaCtx, "internal.task.create")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.task.assign")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.project.manage")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.meeting.manage")).toBe(true);
      expect(hasInternalPermission(adrianaCtx, "internal.config.manage")).toBe(true);
    });

    it("permite ao integrante operacional criar tarefas e atualizar itens sob sua responsabilidade", () => {
      expect(hasInternalPermission(pedroCtx, "internal.task.create")).toBe(true);

      // Atualizar tarefa onde ele é o responsável
      expect(
        hasInternalPermission(pedroCtx, "internal.task.update", {
          taskAssigneeId: pedroId,
          taskCreatorId: adrianaId,
        })
      ).toBe(true);
    });

    it("impede que o integrante operacional altere tarefas de terceiros onde não colabora", () => {
      expect(
        hasInternalPermission(pedroCtx, "internal.task.update", {
          taskAssigneeId: erikaId,
          taskCreatorId: adrianaId,
          taskMemberIds: [erikaId],
        })
      ).toBe(false);
    });

    it("impede que o integrante operacional gerencie configurações da Central ou reuniões globais", () => {
      expect(hasInternalPermission(pedroCtx, "internal.config.manage")).toBe(false);
      expect(hasInternalPermission(pedroCtx, "internal.meeting.manage")).toBe(false);
      expect(hasInternalPermission(pedroCtx, "internal.project.manage")).toBe(false);
    });

    it("bloqueia estritamente clientes externos de qualquer permissão interna da Maître", () => {
      expect(hasInternalPermission(clientCtx, "internal.task.create")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.task.update")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.project.manage")).toBe(false);
      expect(hasInternalPermission(clientCtx, "internal.meeting.manage")).toBe(false);
    });
  });

  // =========================================================================
  // 3. Validação de Transições de Tarefas
  // =========================================================================
  describe("3. Regras de Transição e Bloqueio de Tarefas", () => {
    it("exige responsável principal para mover tarefa de A Fazer para Em Andamento", () => {
      const semResponsavel = validateTaskTransition("TODO", "IN_PROGRESS", {
        requiresApproval: false,
        hasApprovedReview: false,
        assigneeId: null,
      });
      expect(semResponsavel.allowed).toBe(false);
      expect(semResponsavel.reason).toContain("responsável principal");

      const comResponsavel = validateTaskTransition("TODO", "IN_PROGRESS", {
        requiresApproval: false,
        hasApprovedReview: false,
        assigneeId: pedroId,
      });
      expect(comResponsavel.allowed).toBe(true);
    });

    it("exige justificativa fundamentada para cancelamento", () => {
      const cancelamentoVazio = validateTaskTransition("IN_PROGRESS", "CANCELLED", {
        requiresApproval: false,
        hasApprovedReview: false,
        cancellationReason: "",
      });
      expect(cancelamentoVazio.allowed).toBe(false);

      const cancelamentoJustificado = validateTaskTransition("IN_PROGRESS", "CANCELLED", {
        requiresApproval: false,
        hasApprovedReview: false,
        cancellationReason: "Demanda cancelada pelo cliente por mudança de escopo.",
      });
      expect(cancelamentoJustificado.allowed).toBe(true);
    });

    it("impede conclusão de tarefa com revisão obrigatória sem parecer aprovado do revisor", () => {
      const pendenteRevisao = validateTaskTransition("IN_REVIEW", "COMPLETED", {
        requiresApproval: true,
        hasApprovedReview: false,
      });
      expect(pendenteRevisao.allowed).toBe(false);
      expect(pendenteRevisao.reason).toContain("aprovação formal");

      const aprovado = validateTaskTransition("IN_REVIEW", "COMPLETED", {
        requiresApproval: true,
        hasApprovedReview: true,
      });
      expect(aprovado.allowed).toBe(true);
    });
  });

  // =========================================================================
  // 4. Ritual da Reunião Semanal (Segundas 15h30)
  // =========================================================================
  describe("4. Programação da Reunião Semanal e Fusos", () => {
    it("calcula a próxima segunda-feira às 15h30 a partir de um domingo", () => {
      // Domingo 08/09/2026 10h00
      const domingo = new Date("2026-09-06T10:00:00.000Z");
      const proximaSegunda = getNextWeeklyMeetingDate(domingo, 1, "15:30");

      expect(proximaSegunda.getDay()).toBe(1); // Segunda-feira
      expect(proximaSegunda.getHours()).toBe(15);
      expect(proximaSegunda.getMinutes()).toBe(30);
    });

    it("se for segunda-feira de manhã, a reunião é no mesmo dia às 15h30", () => {
      const segundaManha = new Date("2026-09-07T09:00:00.000Z");
      const reuniaoHoje = getNextWeeklyMeetingDate(segundaManha, 1, "15:30");

      expect(reuniaoHoje.getDate()).toBe(segundaManha.getDate());
      expect(reuniaoHoje.getHours()).toBe(15);
      expect(reuniaoHoje.getMinutes()).toBe(30);
    });
  });

  // =========================================================================
  // 5. Balanceamento Operacional da Equipe
  // =========================================================================
  describe("5. Distribuição Não-Punitiva de Volume Operacional", () => {
    it("calcula com precisão a distribuição de tarefas sem gerar rankings punitivos", () => {
      const members = [
        { id: pedroId, name: "Pedro Atuan" },
        { id: erikaId, name: "Erika Carla" },
      ];

      const tasks = [
        { assigneeId: pedroId, status: "IN_PROGRESS", isBlocked: false, dueDate: null },
        { assigneeId: pedroId, status: "COMPLETED", isBlocked: false, dueDate: null },
        { assigneeId: erikaId, status: "IN_PROGRESS", isBlocked: true, dueDate: null },
      ];

      const distribution = calculateTeamWorkloadDistribution(members, tasks);

      expect(distribution.length).toBe(2);
      const pedroStats = distribution.find((d) => d.userId === pedroId)!;
      const erikaStats = distribution.find((d) => d.userId === erikaId)!;

      expect(pedroStats.totalAssigned).toBe(2);
      expect(pedroStats.inProgress).toBe(1);
      expect(pedroStats.completed).toBe(1);
      expect(pedroStats.blocked).toBe(0);

      expect(erikaStats.totalAssigned).toBe(1);
      expect(erikaStats.blocked).toBe(1);
    });

    it("identifica tarefas em atraso (overdue) com precisão temporal", () => {
      const pastDate = new Date(Date.now() - 86400000); // Ontem
      const futureDate = new Date(Date.now() + 86400000); // Amanhã

      const members = [{ id: pedroId, name: "Pedro Atuan" }];
      const tasks = [
        { assigneeId: pedroId, status: "IN_PROGRESS", isBlocked: false, dueDate: pastDate },
        { assigneeId: pedroId, status: "IN_PROGRESS", isBlocked: false, dueDate: futureDate },
        { assigneeId: pedroId, status: "COMPLETED", isBlocked: false, dueDate: pastDate }, // Concluída não conta como atrasada
      ];

      const distribution = calculateTeamWorkloadDistribution(members, tasks);
      expect(distribution[0].overdue).toBe(1);
    });
  });

  // =========================================================================
  // 6. Testes Negativos de Autorização e Integridade
  // =========================================================================
  describe("6. Testes Negativos de Autorização e Violações de Permissão", () => {
    it("impede que um integrante não-revisor aprove uma entrega", () => {
      expect(
        hasInternalPermission(pedroCtx, "internal.delivery.review", {
          reviewerId: adrianaId, // A revisora é Adriana
        })
      ).toBe(false);
    });

    it("permite aprovação se o integrante for o revisor formalmente designado", () => {
      expect(
        hasInternalPermission(pedroCtx, "internal.delivery.review", {
          reviewerId: pedroId,
        })
      ).toBe(true);
    });

    it("impede que um integrante exclua tarefa criada por outro membro", () => {
      expect(
        hasInternalPermission(pedroCtx, "internal.task.delete", {
          taskCreatorId: adrianaId,
        })
      ).toBe(false);
    });

    it("impede que um integrante atribua tarefas a terceiros sem ser criador ou Admin Master", () => {
      expect(
        hasInternalPermission(pedroCtx, "internal.task.assign", {
          taskCreatorId: erikaId,
        })
      ).toBe(false);
    });

    it("Admin Master tem bypass legítimo e autorizado para revisar, atribuir e gerenciar qualquer tarefa", () => {
      expect(
        hasInternalPermission(adrianaCtx, "internal.delivery.review", {
          reviewerId: pedroId,
        })
      ).toBe(true);

      expect(
        hasInternalPermission(adrianaCtx, "internal.task.assign", {
          taskCreatorId: erikaId,
        })
      ).toBe(true);

      expect(
        hasInternalPermission(adrianaCtx, "internal.task.delete", {
          taskCreatorId: erikaId,
        })
      ).toBe(true);
    });
  });
});
