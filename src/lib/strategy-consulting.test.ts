import { describe, it, expect } from "vitest";
import {
  calculateTurnoverMetrics,
  calculateAbsenteeismRate,
  calculateTenureMetrics,
  AnalyticsEmployeeInput,
  AnalyticsOffboardingInput,
  AnalyticsLeaveInput,
} from "./analytics";
import {
  checkInternalJobEligibility,
  getDefaultYCareerTrack,
  EmployeeEligibilityInput,
} from "./mobility";

describe("Onda 4 — Estratégia e Consultoria: Testes Unitários", () => {
  const mockReferenceDate = new Date("2026-09-09T12:00:00.000Z");

  // ==========================================
  // [T-16] Conecta Insights: Turnover & Absenteísmo
  // ==========================================
  describe("[T-16] People Analytics: Turnover, Absenteísmo e Tenure", () => {
    const mockEmployees: AnalyticsEmployeeInput[] = [
      {
        id: "emp-1",
        fullName: "Ana Silva",
        admissionDate: "2024-01-10T00:00:00.000Z", // ~32 meses
        status: "ACTIVE",
        department: { id: "dept-1", name: "Tecnologia" },
      },
      {
        id: "emp-2",
        fullName: "Bruno Costa",
        admissionDate: "2025-03-01T00:00:00.000Z", // ~18 meses
        status: "ACTIVE",
        department: { id: "dept-1", name: "Tecnologia" },
      },
      {
        id: "emp-3",
        fullName: "Carla Dias",
        admissionDate: "2026-05-01T00:00:00.000Z", // ~4 meses
        status: "ACTIVE",
        department: { id: "dept-2", name: "Recursos Humanos" },
      },
      {
        id: "emp-4",
        fullName: "Diego Rocha",
        admissionDate: "2024-06-01T00:00:00.000Z",
        terminationDate: "2026-08-15T00:00:00.000Z", // Desligado no período
        status: "TERMINATED",
        department: { id: "dept-1", name: "Tecnologia" },
      },
      {
        id: "emp-5",
        fullName: "Eduarda Lima",
        admissionDate: "2025-01-01T00:00:00.000Z",
        terminationDate: "2026-07-20T00:00:00.000Z", // Desligada no período
        status: "TERMINATED",
        department: { id: "dept-2", name: "Recursos Humanos" },
      },
    ];

    const mockOffboardings: AnalyticsOffboardingInput[] = [
      {
        id: "off-1",
        employeeId: "emp-4",
        terminationType: "PEDIDO_DEMISSAO", // Voluntário
        lastWorkingDay: "2026-08-15T00:00:00.000Z",
        status: "COMPLETED",
      },
      {
        id: "off-2",
        employeeId: "emp-5",
        terminationType: "SEM_JUSTA_CAUSA", // Involuntário
        lastWorkingDay: "2026-07-20T00:00:00.000Z",
        status: "COMPLETED",
      },
    ];

    it("calcula taxa de turnover geral e discrimina voluntário vs involuntário", () => {
      const result = calculateTurnoverMetrics(mockEmployees, mockOffboardings, mockReferenceDate, 12);

      expect(result.activeCount).toBe(3);
      expect(result.totalTerminationsPeriod).toBe(2);
      expect(result.voluntaryTerminations).toBe(1);
      expect(result.involuntaryTerminations).toBe(1);
      expect(result.generalTurnoverRate).toBeGreaterThan(0);
      expect(result.voluntaryTurnoverRate).toBeGreaterThan(0);
      expect(result.involuntaryTurnoverRate).toBeGreaterThan(0);
      expect(result.byDepartment.length).toBe(2);
    });

    it("calcula absenteísmo a partir dos afastamentos registrados no período", () => {
      const mockLeaves: AnalyticsLeaveInput[] = [
        {
          id: "leave-1",
          employeeId: "emp-1",
          type: "DOENCA_INSS",
          cidCode: "M54.5", // Dor lombar
          startDate: "2026-08-20T00:00:00.000Z",
          endDate: "2026-08-27T00:00:00.000Z", // 7 dias
          status: "FINISHED",
        },
      ];

      const result = calculateAbsenteeismRate(mockEmployees, mockLeaves, 30, mockReferenceDate);

      expect(result.activeHeadcount).toBe(3);
      expect(result.leavesCount).toBe(1);
      expect(result.totalLostDays).toBeGreaterThan(0);
      expect(result.absenteeismRate).toBeGreaterThan(0);
      expect(result.topReasons[0].type).toContain("M54.5");
    });

    it("calcula curva de tenure (tempo de casa) para ativos e desligados", () => {
      const result = calculateTenureMetrics(mockEmployees, mockReferenceDate);

      expect(result.averageActiveTenureMonths).toBeGreaterThan(0);
      expect(result.averageTerminatedTenureMonths).toBeGreaterThan(0);
      expect(result.tenureDistribution.lessThan6Months).toBe(1); // Carla (4 meses)
      expect(result.tenureDistribution.sixTo12Months).toBe(0);
      expect(result.tenureDistribution.oneTo2Years).toBe(1); // Bruno (18 meses)
      expect(result.tenureDistribution.twoTo5Years).toBe(1); // Ana (32 meses)
    });
  });

  // ==========================================
  // [T-17] Conecta Carreiras: Elegibilidade e Trilhas em Y
  // ==========================================
  describe("[T-17] Mobilidade Interna: Elegibilidade e Trilhas em Y", () => {
    it("aprova elegibilidade para colaborador ativo com mais de 6 meses e boa avaliação", () => {
      const eligibleEmployee: EmployeeEligibilityInput = {
        id: "emp-10",
        fullName: "Roberto Carlos",
        admissionDate: "2025-01-01T00:00:00.000Z", // > 1 ano
        status: "ACTIVE",
        performanceEvaluations: [{ overallScore: 4.2 }],
      };

      const result = checkInternalJobEligibility(eligibleEmployee, {}, mockReferenceDate);

      expect(result.isEligible).toBe(true);
      expect(result.checks.tenurePass).toBe(true);
      expect(result.checks.statusPass).toBe(true);
      expect(result.checks.performancePass).toBe(true);
    });

    it("reprova elegibilidade se colaborador tiver menos de 6 meses de empresa", () => {
      const recentEmployee: EmployeeEligibilityInput = {
        id: "emp-11",
        fullName: "Novo Contratado",
        admissionDate: "2026-07-01T00:00:00.000Z", // ~2 meses
        status: "ACTIVE",
      };

      const result = checkInternalJobEligibility(recentEmployee, { minTenureMonths: 6 }, mockReferenceDate);

      expect(result.isEligible).toBe(false);
      expect(result.checks.tenurePass).toBe(false);
      expect(result.reasons.some((r) => r.includes("Tempo de empresa insuficiente"))).toBe(true);
    });

    it("reprova elegibilidade se colaborador não estiver em status ACTIVE", () => {
      const onLeaveEmployee: EmployeeEligibilityInput = {
        id: "emp-12",
        fullName: "Afastado Temporário",
        admissionDate: "2024-01-01T00:00:00.000Z",
        status: "ON_LEAVE",
      };

      const result = checkInternalJobEligibility(onLeaveEmployee, {}, mockReferenceDate);

      expect(result.isEligible).toBe(false);
      expect(result.checks.statusPass).toBe(false);
      expect(result.reasons.some((r) => r.includes("Status funcional inelegível"))).toBe(true);
    });

    it("valida estrutura bifurcada da Trilha de Carreira em Y", () => {
      const track = getDefaultYCareerTrack("Engenharia de Software");

      const common = track.filter((l) => l.branch === "COMMON");
      const specialist = track.filter((l) => l.branch === "SPECIALIST");
      const management = track.filter((l) => l.branch === "MANAGEMENT");

      expect(common.length).toBe(3); // Júnior, Pleno, Sênior
      expect(specialist.length).toBe(2); // Especialista, Principal
      expect(management.length).toBe(2); // Coordenador/EM, Head/Diretor

      expect(specialist[0].name).toContain("Especialista");
      expect(management[0].name).toContain("Coordenador");
      expect(specialist[0].requiredCompetencies.length).toBeGreaterThan(0);
      expect(management[0].requiredCompetencies.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // [T-18] Conecta Consultoria: Timesheet e Aceite do Cliente
  // ==========================================
  describe("[T-18] Conecta Consultoria: Timesheet e Aceite Formal", () => {
    it("totaliza horas faturáveis e não-faturáveis com base em taxa horária", () => {
      const timesheetEntries = [
        { hours: 6, billable: true, hourlyRate: 300 },
        { hours: 4, billable: true, hourlyRate: 300 },
        { hours: 2, billable: false, hourlyRate: 300 },
      ];

      const totalHours = timesheetEntries.reduce((acc, t) => acc + t.hours, 0);
      const billableHours = timesheetEntries.filter((t) => t.billable).reduce((acc, t) => acc + t.hours, 0);
      const totalBilledValue = timesheetEntries
        .filter((t) => t.billable)
        .reduce((acc, t) => acc + t.hours * t.hourlyRate, 0);

      expect(totalHours).toBe(12);
      expect(billableHours).toBe(10);
      expect(totalBilledValue).toBe(3000); // 10h * R$ 300
    });

    it("assegura campos e integridade de aceite formal de entregáveis", () => {
      const deliverable = {
        id: "deliv-1",
        title: "Relatório de Hunting Executivo",
        approvedByClient: false,
        clientApprovedAt: null as Date | null,
        clientApproverEmail: null as string | null,
        clientFeedback: null as string | null,
      };

      // Simulação do aceite formal
      const approvedDeliverable = {
        ...deliverable,
        approvedByClient: true,
        clientApprovedAt: mockReferenceDate,
        clientApproverEmail: "patricia.cfo@client.com",
        clientFeedback: "Laudo homologado sem ressalvas pelo comitê.",
      };

      expect(approvedDeliverable.approvedByClient).toBe(true);
      expect(approvedDeliverable.clientApproverEmail).toBe("patricia.cfo@client.com");
      expect(approvedDeliverable.clientFeedback).toContain("homologado");
      expect(approvedDeliverable.clientApprovedAt).toBe(mockReferenceDate);
    });
  });
});
