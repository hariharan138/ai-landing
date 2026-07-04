import { create } from "zustand";
import { Tenant, TeamMember } from "@/types/domain";

interface TenantState {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  teamMembers: TeamMember[];

  setCurrentTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: Tenant[]) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  switchTenant: (tenantId: string) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  currentTenant: null,
  tenants: [],
  teamMembers: [],

  setCurrentTenant: (tenant) => {
    if (tenant) {
      localStorage.setItem("current_tenant_id", tenant.id);
    }
    set({ currentTenant: tenant });
  },

  setTenants: (tenants) => set({ tenants }),

  setTeamMembers: (members) => set({ teamMembers: members }),

  switchTenant: (tenantId) => {
    const { tenants } = get();
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      get().setCurrentTenant(tenant);
    }
  },
}));
