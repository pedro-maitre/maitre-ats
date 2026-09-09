/**
 * Utilitários analíticos para People Analytics, Turnover e Absenteísmo (Core HR).
 */

export interface AnalyticsEmployeeInput {
  id: string;
  fullName: string;
  admissionDate: Date | string;
  terminationDate?: Date | string | null;
  status: string;
  departmentId?: string | null;
  department?: { id?: string; name: string } | null;
  position?: { title: string } | null;
}

export interface AnalyticsOffboardingInput {
  id: string;
  employeeId: string;
  terminationType: string; // SEM_JUSTA_CAUSA, COM_JUSTA_CAUSA, PEDIDO_DEMISSAO, ACORDO_MUTUO, TERMINO_CONTRATO
  lastWorkingDay: Date | string;
  status: string; // IN_PROGRESS, COMPLETED, CANCELLED
}

export interface AnalyticsLeaveInput {
  id: string;
  employeeId: string;
  type: string;
  cidCode?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: string; // ACTIVE, FINISHED, CANCELLED
}

export interface TurnoverResult {
  activeCount: number;
  totalHiresPeriod: number;
  totalTerminationsPeriod: number;
  voluntaryTerminations: number;
  involuntaryTerminations: number;
  otherTerminations: number;
  averageHeadcount: number;
  generalTurnoverRate: number; // Percentual ex: 3.5%
  voluntaryTurnoverRate: number;
  involuntaryTurnoverRate: number;
  byDepartment: Array<{
    departmentName: string;
    activeCount: number;
    terminationsCount: number;
    turnoverRate: number;
  }>;
}

export interface AbsenteeismResult {
  activeHeadcount: number;
  periodDays: number;
  totalWorkableDays: number;
  totalLostDays: number;
  absenteeismRate: number; // Percentual ex: 2.1%
  leavesCount: number;
  topReasons: Array<{
    type: string;
    count: number;
    lostDays: number;
  }>;
}

export interface TenureResult {
  averageActiveTenureMonths: number;
  averageTerminatedTenureMonths: number;
  medianTenureMonths: number;
  tenureDistribution: {
    lessThan6Months: number;
    sixTo12Months: number;
    oneTo2Years: number;
    twoTo5Years: number;
    moreThan5Years: number;
  };
}

/**
 * Calcula os índices de Turnover Geral, Voluntário e Involuntário.
 * Período padrão: 12 meses retroativos a partir de referenceDate.
 */
export function calculateTurnoverMetrics(
  employees: AnalyticsEmployeeInput[],
  offboardings: AnalyticsOffboardingInput[] = [],
  referenceDate: Date = new Date(),
  periodMonths: number = 12
): TurnoverResult {
  const cutoffDate = new Date(referenceDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);

  const activeEmployees = employees.filter((e) => e.status !== "TERMINATED");
  const activeCount = activeEmployees.length;

  // Admissões no período
  const hiresInPeriod = employees.filter((e) => {
    const adm = new Date(e.admissionDate);
    return adm >= cutoffDate && adm <= referenceDate;
  }).length;

  // Desligamentos no período
  const terminatedEmployees = employees.filter((e) => {
    if (e.status !== "TERMINATED" || !e.terminationDate) return false;
    const term = new Date(e.terminationDate);
    return term >= cutoffDate && term <= referenceDate;
  });

  const offboardingsMap = new Map<string, AnalyticsOffboardingInput>();
  offboardings.forEach((off) => {
    if (off.status !== "CANCELLED") {
      offboardingsMap.set(off.employeeId, off);
    }
  });

  let voluntaryCount = 0;
  let involuntaryCount = 0;
  let otherCount = 0;

  terminatedEmployees.forEach((emp) => {
    const off = offboardingsMap.get(emp.id);
    const type = off?.terminationType || "SEM_JUSTA_CAUSA";

    if (type === "PEDIDO_DEMISSAO") {
      voluntaryCount++;
    } else if (type === "SEM_JUSTA_CAUSA" || type === "COM_JUSTA_CAUSA") {
      involuntaryCount++;
    } else {
      otherCount++;
    }
  });

  const totalTerminations = terminatedEmployees.length;

  // Efetivo médio no período
  const initialHeadcountEstimated = Math.max(1, activeCount + totalTerminations - hiresInPeriod);
  const averageHeadcount = Math.max(1, (initialHeadcountEstimated + activeCount) / 2);

  const generalTurnoverRate = parseFloat(((totalTerminations / averageHeadcount) * 100).toFixed(2));
  const voluntaryTurnoverRate = parseFloat(((voluntaryCount / averageHeadcount) * 100).toFixed(2));
  const involuntaryTurnoverRate = parseFloat(((involuntaryCount / averageHeadcount) * 100).toFixed(2));

  // Turnover por departamento
  const deptMap = new Map<string, { active: number; term: number }>();
  employees.forEach((emp) => {
    const deptName = emp.department?.name || "Geral";
    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, { active: 0, term: 0 });
    }
    const stat = deptMap.get(deptName)!;
    if (emp.status !== "TERMINATED") {
      stat.active++;
    } else if (emp.terminationDate) {
      const termDate = new Date(emp.terminationDate);
      if (termDate >= cutoffDate && termDate <= referenceDate) {
        stat.term++;
      }
    }
  });

  const byDepartment = Array.from(deptMap.entries()).map(([departmentName, data]) => {
    const avg = Math.max(1, (data.active + data.term) / 2);
    const rate = parseFloat(((data.term / avg) * 100).toFixed(2));
    return {
      departmentName,
      activeCount: data.active,
      terminationsCount: data.term,
      turnoverRate: rate,
    };
  }).sort((a, b) => b.turnoverRate - a.turnoverRate);

  return {
    activeCount,
    totalHiresPeriod: hiresInPeriod,
    totalTerminationsPeriod: totalTerminations,
    voluntaryTerminations: voluntaryCount,
    involuntaryTerminations: involuntaryCount,
    otherTerminations: otherCount,
    averageHeadcount: Math.round(averageHeadcount),
    generalTurnoverRate,
    voluntaryTurnoverRate,
    involuntaryTurnoverRate,
    byDepartment,
  };
}

/**
 * Calcula a Taxa de Absenteísmo a partir de afastamentos médicos e licenças registradas.
 */
export function calculateAbsenteeismRate(
  employees: AnalyticsEmployeeInput[],
  leaves: AnalyticsLeaveInput[] = [],
  periodDays: number = 30,
  referenceDate: Date = new Date()
): AbsenteeismResult {
  const activeEmployees = employees.filter((e) => e.status !== "TERMINATED");
  const activeHeadcount = activeEmployees.length;

  // Considera 5 dias úteis a cada 7 dias corridos (~21-22 dias úteis num mês de 30 dias)
  const workingDaysRatio = 5 / 7;
  const workingDaysInPeriod = Math.round(periodDays * workingDaysRatio);
  const totalWorkableDays = activeHeadcount * workingDaysInPeriod;

  const startDateCutoff = new Date(referenceDate);
  startDateCutoff.setDate(startDateCutoff.getDate() - periodDays);

  let totalLostDays = 0;
  const reasonsMap = new Map<string, { count: number; lostDays: number }>();
  let validLeavesCount = 0;

  leaves.forEach((leave) => {
    if (leave.status === "CANCELLED") return;

    const leaveStart = new Date(leave.startDate);
    const leaveEnd = leave.endDate ? new Date(leave.endDate) : new Date(referenceDate);

    // Verifica sobreposição com a janela do período
    const effectiveStart = leaveStart > startDateCutoff ? leaveStart : startDateCutoff;
    const effectiveEnd = leaveEnd < referenceDate ? leaveEnd : referenceDate;

    if (effectiveEnd >= effectiveStart) {
      const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
      const diffCalendarDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      // Estima dias úteis perdidos
      const lostWorkDays = Math.round(diffCalendarDays * workingDaysRatio);

      totalLostDays += lostWorkDays;
      validLeavesCount++;

      const typeKey = leave.cidCode ? `${leave.type} (CID: ${leave.cidCode})` : leave.type;
      if (!reasonsMap.has(typeKey)) {
        reasonsMap.set(typeKey, { count: 0, lostDays: 0 });
      }
      const item = reasonsMap.get(typeKey)!;
      item.count++;
      item.lostDays += lostWorkDays;
    }
  });

  const absenteeismRate =
    totalWorkableDays > 0 ? parseFloat(((totalLostDays / totalWorkableDays) * 100).toFixed(2)) : 0;

  const topReasons = Array.from(reasonsMap.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      lostDays: data.lostDays,
    }))
    .sort((a, b) => b.lostDays - a.lostDays);

  return {
    activeHeadcount,
    periodDays,
    totalWorkableDays,
    totalLostDays,
    absenteeismRate,
    leavesCount: validLeavesCount,
    topReasons,
  };
}

/**
 * Calcula métricas de permanência (Tenure) em meses para o time.
 */
export function calculateTenureMetrics(
  employees: AnalyticsEmployeeInput[],
  referenceDate: Date = new Date()
): TenureResult {
  const activeTenures: number[] = [];
  const termTenures: number[] = [];

  const distribution = {
    lessThan6Months: 0,
    sixTo12Months: 0,
    oneTo2Years: 0,
    twoTo5Years: 0,
    moreThan5Years: 0,
  };

  employees.forEach((emp) => {
    const adm = new Date(emp.admissionDate).getTime();
    const isTerm = emp.status === "TERMINATED" && emp.terminationDate;
    const end = isTerm ? new Date(emp.terminationDate!).getTime() : referenceDate.getTime();

    const months = Math.max(0, parseFloat(((end - adm) / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1)));

    if (isTerm) {
      termTenures.push(months);
    } else {
      activeTenures.push(months);

      if (months < 6) distribution.lessThan6Months++;
      else if (months <= 12) distribution.sixTo12Months++;
      else if (months <= 24) distribution.oneTo2Years++;
      else if (months <= 60) distribution.twoTo5Years++;
      else distribution.moreThan5Years++;
    }
  });

  const avgActive =
    activeTenures.length > 0
      ? parseFloat((activeTenures.reduce((a, b) => a + b, 0) / activeTenures.length).toFixed(1))
      : 0;

  const avgTerm =
    termTenures.length > 0
      ? parseFloat((termTenures.reduce((a, b) => a + b, 0) / termTenures.length).toFixed(1))
      : 0;

  const allTenures = [...activeTenures].sort((a, b) => a - b);
  const mid = Math.floor(allTenures.length / 2);
  const medianTenureMonths =
    allTenures.length === 0
      ? 0
      : allTenures.length % 2 !== 0
      ? allTenures[mid]
      : parseFloat(((allTenures[mid - 1] + allTenures[mid]) / 2).toFixed(1));

  return {
    averageActiveTenureMonths: avgActive,
    averageTerminatedTenureMonths: avgTerm,
    medianTenureMonths,
    tenureDistribution: distribution,
  };
}
