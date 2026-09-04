import { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export type Role = "SUPER_ADMIN" | "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | "CANDIDATE";

export class UnauthorizedError extends Error {
  constructor(message: string = "Acesso não autorizado.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Acesso negado para este recurso.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Funções auxiliares para verificação de permissão e hierarquia.
 */
export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN";
}

export function isAdminOrAbove(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isRecruiterOrAbove(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECRUITER";
}

export function isHiringManager(role?: string | null): boolean {
  return role === "HIRING_MANAGER";
}

export function isCandidate(role?: string | null): boolean {
  return role === "CANDIDATE";
}

/**
 * Valida se a sessão do usuário está ativa e possui o papel exigido.
 */
export function requireAuth(session: Session | null, allowedRoles?: Role[]) {
  if (!session?.user?.email) {
    throw new UnauthorizedError("Sessão expirada ou não autenticado.");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError("Seu nível de acesso não permite realizar esta ação.");
    }
  }

  return session.user;
}

/**
 * Validação estrita de Tenant/Organização no servidor (Defesa contra IDOR/BOLA).
 * Garante que o usuário autenticado pertence à organização do recurso acessado.
 */
export async function requireTenantAccess(
  session: Session | null,
  targetOrganizationId: string
) {
  const user = requireAuth(session);

  // SUPER_ADMIN tem acesso global para suporte e manutenção
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  if (!user.email) {
    throw new UnauthorizedError("E-mail não associado à sessão.");
  }

  // Busca o usuário no banco para verificar vínculo direto ou membership
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase() },
    include: {
      memberships: true,
    },
  });

  if (!dbUser) {
    throw new UnauthorizedError("Usuário não localizado no banco de dados.");
  }

  // Verifica organização direta
  if (dbUser.organizationId === targetOrganizationId) {
    return true;
  }

  // Verifica memberships ativas por tenant
  const hasMembership = dbUser.memberships.some(
    (m: any) => m.organizationId === targetOrganizationId
  );

  if (!hasMembership) {
    throw new ForbiddenError("Você não possui permissão para acessar recursos deste cliente.");
  }

  return true;
}
