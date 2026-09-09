import { NextRequest } from "next/server";

export const CORRELATION_HEADER = "x-request-id";

/**
 * Extrai ou gera um Correlation ID para a requisição.
 */
export function getOrCreateRequestId(req?: NextRequest | Headers | null): string {
  if (req) {
    let headerValue: string | null = null;
    if ("headers" in req && typeof req.headers.get === "function") {
      headerValue = req.headers.get(CORRELATION_HEADER);
    } else if (typeof (req as Headers).get === "function") {
      headerValue = (req as Headers).get(CORRELATION_HEADER);
    }

    if (headerValue && headerValue.trim()) {
      return headerValue.trim();
    }
  }

  // Gera um UUIDv4 único caso não exista
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Logger estruturado com suporte a correlation ID e metadados.
 */
export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  route?: string;
  [key: string]: any;
}

export function createStructuredLog(
  level: "INFO" | "WARN" | "ERROR" | "SECURITY",
  message: string,
  context?: LogContext
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context?.requestId || "system",
    tenantId: context?.tenantId || null,
    userId: context?.userId || null,
    route: context?.route || null,
    ...context,
  };

  if (level === "ERROR" || level === "SECURITY") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "WARN") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }

  return logEntry;
}
