import { describe, it, expect } from 'vitest';
import { reconcileTenantRecords, evaluateGovernanceGates } from './cutover-readiness';

describe('Onda 5 — Prontidão para Cutover e Conciliação Multitenant', () => {
  it('deve aprovar registros quando toda a hierarquia de tenants é consistente', () => {
    const orgs = [
      { id: 'org-1', organizationId: 'org-1' },
      { id: 'org-2', organizationId: 'org-2' },
    ];

    const employees = [
      { id: 'emp-1', organizationId: 'org-1' },
      { id: 'emp-2', organizationId: 'org-2' },
    ];

    const result = reconcileTenantRecords(
      orgs,
      employees,
      'organizationId',
      'Organization',
      'Employee'
    );

    expect(result.valid).toBe(true);
    expect(result.anomalies.length).toBe(0);
  });

  it('deve detectar anomalia de registro órfão', () => {
    const orgs = [
      { id: 'org-1', organizationId: 'org-1' },
    ];

    const employees = [
      { id: 'emp-orphan', organizationId: 'org-inexistente' },
    ];

    const result = reconcileTenantRecords(
      orgs,
      employees,
      'organizationId',
      'Organization',
      'Employee'
    );

    expect(result.valid).toBe(false);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0]).toContain('Registro órfão');
  });

  it('deve detectar vazamento cross-tenant entre pai e filho', () => {
    const jobs = [
      { id: 'job-1', organizationId: 'org-alpha' },
    ];

    // Candidatura diz pertencer a org-beta, mas aponta para job-1 de org-alpha
    const apps = [
      { id: 'app-leaked', organizationId: 'org-beta', jobId: 'job-1' },
    ];

    const result = reconcileTenantRecords(
      jobs,
      apps,
      'jobId',
      'Job',
      'Application'
    );

    expect(result.valid).toBe(false);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0]).toContain('Vazamento cross-tenant');
  });

  it('deve validar e aprovar todos os 10 Gates de Governança (G0 a G9) com checklist completo', () => {
    const gates = evaluateGovernanceGates({
      backupVerified: true,
      tenantIsolationCovered: true,
      storageSignedUrlsOnly: true,
      noHardcodedSecrets: true,
      migrationsVersioned: true,
      coreHrComplete: true,
      automatedTestsCount: 75,
      automatedTestsPassed: true,
      securityHeadersConfigured: true,
      rollbackPlanTested: true,
      turnoverAndAbsenceLive: true,
      mobilityAndTimesheetLive: true,
    });

    expect(gates.length).toBe(10);
    const allApproved = gates.every(g => g.status === 'APROVADO');
    expect(allApproved).toBe(true);

    const g0 = gates.find(g => g.gate === 'G0');
    expect(g0?.status).toBe('APROVADO');

    const g2 = gates.find(g => g.gate === 'G2');
    expect(g2?.status).toBe('APROVADO');

    const g8 = gates.find(g => g.gate === 'G8');
    expect(g8?.status).toBe('APROVADO');

    const g9 = gates.find(g => g.gate === 'G9');
    expect(g9?.status).toBe('APROVADO');
  });

  it('deve reprovar Gate G2 e G9 caso falte isolamento ou ensaio de rollback', () => {
    const gates = evaluateGovernanceGates({
      backupVerified: true,
      tenantIsolationCovered: false, // FALHA
      storageSignedUrlsOnly: true,
      noHardcodedSecrets: true,
      migrationsVersioned: true,
      coreHrComplete: true,
      automatedTestsCount: 75,
      automatedTestsPassed: true,
      securityHeadersConfigured: true,
      rollbackPlanTested: false, // FALHA
      turnoverAndAbsenceLive: true,
      mobilityAndTimesheetLive: true,
    });

    const g2 = gates.find(g => g.gate === 'G2');
    expect(g2?.status).toBe('REPROVADO');

    const g9 = gates.find(g => g.gate === 'G9');
    expect(g9?.status).toBe('REPROVADO');
  });
});
