import { useEffect } from "react";
import { useTenantStore } from "@/store/tenantStore";
import { useAuthStore } from "@/store/authStore";
import { teamService } from "@/services/teamService";
import { useQuery } from "@tanstack/react-query";

export function useTenant() {
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant);
  const setTeamMembers = useTenantStore((state) => state.setTeamMembers);
  const user = useAuthStore((state) => state.user);

  const tenantQuery = useQuery({
    queryKey: ["tenant", currentTenant?.id],
    queryFn: () => {
      if (!currentTenant) return null;
      return teamService.getTenant(currentTenant.id);
    },
    enabled: !!currentTenant,
  });

  const teamQuery = useQuery({
    queryKey: ["team", currentTenant?.id],
    queryFn: () => {
      if (!currentTenant) return null;
      return teamService.getTeamMembers(currentTenant.id);
    },
    enabled: !!currentTenant,
  });

  useEffect(() => {
    if (teamQuery.data?.data) {
      setTeamMembers(teamQuery.data.data);
    }
  }, [teamQuery.data, setTeamMembers]);

  // Load tenant from localStorage if not set
  useEffect(() => {
    if (!currentTenant && user) {
      const storedTenantId = localStorage.getItem("current_tenant_id");
      if (storedTenantId) {
        // You might want to fetch the tenant data here
        // For now, we'll just set it when data is available
      }
    }
  }, [user, currentTenant]);

  return {
    currentTenant,
    setCurrentTenant,
    isLoading: tenantQuery.isLoading || teamQuery.isLoading,
    error: tenantQuery.error || teamQuery.error,
  };
}
