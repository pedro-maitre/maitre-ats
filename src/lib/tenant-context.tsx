"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  _count?: {
    jobs: number;
    candidates: number;
    users: number;
  };
}

interface TenantContextType {
  selectedTenantId: string; // "ALL" ou ID da organização
  selectedTenant: OrganizationSummary | null;
  organizations: OrganizationSummary[];
  setSelectedTenantId: (id: string) => void;
  setOrganizations: (orgs: OrganizationSummary[]) => void;
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
  children,
  initialOrganizations = [],
}: {
  children: React.ReactNode;
  initialOrganizations?: OrganizationSummary[];
}) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(initialOrganizations);
  const [selectedTenantId, setSelectedTenantIdState] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Recuperar seleção salva do localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("maitre_selected_tenant");
      if (saved) {
        setSelectedTenantIdState(saved);
      }
    }
  }, []);

  const refreshOrganizations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (err) {
      console.error("Erro ao carregar organizações:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedTenantId = (id: string) => {
    setSelectedTenantIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("maitre_selected_tenant", id);
      // Disparar evento para outros componentes reagirem se necessário
      window.dispatchEvent(new CustomEvent("maitre_tenant_changed", { detail: { tenantId: id } }));
    }
  };

  const selectedTenant =
    selectedTenantId === "ALL"
      ? null
      : organizations.find((o) => o.id === selectedTenantId) || null;

  return (
    <TenantContext.Provider
      value={{
        selectedTenantId,
        selectedTenant,
        organizations,
        setSelectedTenantId,
        setOrganizations,
        isLoading,
        refreshOrganizations,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant deve ser utilizado dentro de um TenantProvider");
  }
  return context;
}
