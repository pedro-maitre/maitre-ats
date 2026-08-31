import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "RESUME_DOWNLOAD"
  | "RESUME_VIEW"
  | "STAGE_CHANGE"
  | "CANDIDATE_CREATE"
  | "CANDIDATE_UPDATE"
  | "CANDIDATE_DELETE"
  | "JOB_CREATE"
  | "JOB_UPDATE"
  | "JOB_DELETE"
  | "ROLE_CHANGE"
  | "OVERRIDE_FIT"
  | "INTERVIEW_SCHEDULED"
  | "SCORECARD_SUBMITTED"
  | "OFFER_CREATED"
  | "OFFER_APPROVED"
  | "OFFER_STATUS_CHANGED"
  | "HIRE_AUTHORIZED"
  | "CLIENT_CREATE"
  | "CLIENT_UPDATE"
  | "CLIENT_DELETE"
  | "ORGANIZATION_CREATE"
  | "ORGANIZATION_UPDATE"
  | "ORGANIZATION_DELETE"
  | "EXPORT_DATA"
  | "LGPD_REQUEST"
  | "WHATSAPP_SENT"
  | "FEEDBACK_GENERATED";

export interface LogAuditEventParams {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
}

/**
 * Registra um evento de auditoria imutável (Append-Only) no banco de dados.
 * Utilizado para rastreabilidade de segurança, LGPD e governança corporativa.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        organizationId: params.organizationId || undefined,
        actorUserId: params.actorUserId || undefined,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        beforeData: params.beforeData ? JSON.stringify(params.beforeData) : undefined,
        afterData: params.afterData ? JSON.stringify(params.afterData) : undefined,
        ipAddress: params.ipAddress || undefined,
        userAgent: params.userAgent || undefined,
        reason: params.reason || undefined,
      },
    });
  } catch (err: any) {
    // Audit logging failure should not crash the main thread, but must be logged to console
    console.error("CRITICAL: Failed to write AuditEvent:", err.message);
  }
}
