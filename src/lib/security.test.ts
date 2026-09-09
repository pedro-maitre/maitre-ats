import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isSuperAdmin,
  isAdminOrAbove,
  isRecruiterOrAbove,
  isHiringManager,
  isCandidate,
  requireAuth,
  requireTenantAccess,
  getServerTenantScope,
  UnauthorizedError,
  ForbiddenError,
} from "./security";
import { prisma } from "./prisma";

// Mock do Prisma
vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Security & RBAC Unit Tests", () => {
  describe("Role Hierarchy Helpers", () => {
    it("identifies SUPER_ADMIN correctly", () => {
      expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
      expect(isSuperAdmin("ADMIN")).toBe(false);
      expect(isSuperAdmin("RECRUITER")).toBe(false);
      expect(isSuperAdmin(null)).toBe(false);
    });

    it("identifies ADMIN or above correctly", () => {
      expect(isAdminOrAbove("SUPER_ADMIN")).toBe(true);
      expect(isAdminOrAbove("ADMIN")).toBe(true);
      expect(isAdminOrAbove("RECRUITER")).toBe(false);
      expect(isAdminOrAbove(null)).toBe(false);
    });

    it("identifies RECRUITER or above correctly", () => {
      expect(isRecruiterOrAbove("SUPER_ADMIN")).toBe(true);
      expect(isRecruiterOrAbove("ADMIN")).toBe(true);
      expect(isRecruiterOrAbove("RECRUITER")).toBe(true);
      expect(isRecruiterOrAbove("HIRING_MANAGER")).toBe(false);
      expect(isRecruiterOrAbove("CANDIDATE")).toBe(false);
    });

    it("identifies HIRING_MANAGER correctly", () => {
      expect(isHiringManager("HIRING_MANAGER")).toBe(true);
      expect(isHiringManager("RECRUITER")).toBe(false);
    });

    it("identifies CANDIDATE correctly", () => {
      expect(isCandidate("CANDIDATE")).toBe(true);
      expect(isCandidate("RECRUITER")).toBe(false);
    });
  });

  describe("requireAuth", () => {
    it("throws UnauthorizedError if session is null", () => {
      expect(() => requireAuth(null)).toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError if session.user has no email", () => {
      expect(() => requireAuth({ user: { email: "" } } as any)).toThrow(UnauthorizedError);
    });

    it("returns user when authenticated without role restriction", () => {
      const session = { user: { email: "user@test.com", role: "CANDIDATE" } } as any;
      const user = requireAuth(session);
      expect(user.email).toBe("user@test.com");
    });

    it("returns user when user role matches allowedRoles", () => {
      const session = { user: { email: "admin@test.com", role: "ADMIN" } } as any;
      const user = requireAuth(session, ["SUPER_ADMIN", "ADMIN"]);
      expect(user.role).toBe("ADMIN");
    });

    it("throws ForbiddenError when user role is not in allowedRoles", () => {
      const session = { user: { email: "recruiter@test.com", role: "RECRUITER" } } as any;
      expect(() => requireAuth(session, ["SUPER_ADMIN", "ADMIN"])).toThrow(ForbiddenError);
    });
  });

  describe("requireTenantAccess", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("allows SUPER_ADMIN to access any tenant without database lookup", async () => {
      const session = { user: { email: "super@maitre.com", role: "SUPER_ADMIN" } } as any;
      const result = await requireTenantAccess(session, "tenant-client-xyz");
      expect(result).toBe(true);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("allows tenant user to access their own organization", async () => {
      const session = { user: { email: "admin@empresa-a.com", role: "ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "admin@empresa-a.com",
        organizationId: "org-a",
        memberships: [],
      });

      const result = await requireTenantAccess(session, "org-a");
      expect(result).toBe(true);
    });

    it("allows user with membership in target organization", async () => {
      const session = { user: { email: "consultant@maitre.com", role: "ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "consultant@maitre.com",
        organizationId: "org-primary",
        memberships: [{ organizationId: "org-client-b" }],
      });

      const result = await requireTenantAccess(session, "org-client-b");
      expect(result).toBe(true);
    });

    it("blocks cross-tenant access with ForbiddenError when user has no linkage", async () => {
      const session = { user: { email: "user@empresa-a.com", role: "ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@empresa-a.com",
        organizationId: "org-a",
        memberships: [],
      });

      await expect(requireTenantAccess(session, "org-b")).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getServerTenantScope", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns global access scope for SUPER_ADMIN when no org requested", async () => {
      const session = { user: { email: "super@maitre.com", role: "SUPER_ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "super@maitre.com",
        organizationId: "org-master",
        organization: { isMaster: true },
        memberships: [],
      });

      const scope = await getServerTenantScope(session);
      expect(scope.isGlobalAccess).toBe(true);
      expect(scope.organizationId).toBeUndefined();
      expect(scope.activeOrgId).toBeNull();
    });

    it("returns specific scope for Master Admin when specific org is requested", async () => {
      const session = { user: { email: "admin@maitre.com", role: "ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "admin@maitre.com",
        organizationId: "org-master",
        organization: { isMaster: true },
        memberships: [],
      });

      const scope = await getServerTenantScope(session, "tenant-client-123");
      expect(scope.isGlobalAccess).toBe(true);
      expect(scope.organizationId).toBe("tenant-client-123");
      expect(scope.activeOrgId).toBe("tenant-client-123");
    });

    it("returns isolated primary organization scope for standard tenant user", async () => {
      const session = { user: { email: "rh@empresa-c.com", role: "ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "rh@empresa-c.com",
        organizationId: "org-empresa-c",
        organization: { isMaster: false },
        memberships: [],
      });

      const scope = await getServerTenantScope(session);
      expect(scope.isGlobalAccess).toBe(false);
      expect(scope.organizationId).toBe("org-empresa-c");
      expect(scope.activeOrgId).toBe("org-empresa-c");
    });

    it("strictly forbids cross-tenant access when a client user attempts to query another tenant", async () => {
      const session = { user: { email: "rh@empresa-c.com", role: "ADMIN" } } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        email: "rh@empresa-c.com",
        organizationId: "org-empresa-c",
        organization: { isMaster: false },
        memberships: [],
      });

      await expect(getServerTenantScope(session, "org-empresa-d")).rejects.toThrow(ForbiddenError);
    });
  });
});
