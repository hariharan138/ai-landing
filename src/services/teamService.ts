import { apiClient } from "./api";
import { TeamMember, Tenant, ApiResponse } from "@/types/domain";

export const teamService = {
  async getTeamMembers(tenantId: string) {
    return apiClient.get<ApiResponse<TeamMember[]>>(`/tenants/${tenantId}/team`);
  },

  async addTeamMember(
    tenantId: string,
    data: { email: string; role: "admin" | "member" | "viewer" },
  ) {
    return apiClient.post<ApiResponse<TeamMember>>(`/tenants/${tenantId}/team`, data);
  },

  async updateTeamMember(tenantId: string, memberId: string, data: { role: string }) {
    return apiClient.put<ApiResponse<TeamMember>>(`/tenants/${tenantId}/team/${memberId}`, data);
  },

  async removeTeamMember(tenantId: string, memberId: string) {
    return apiClient.delete<ApiResponse<void>>(`/tenants/${tenantId}/team/${memberId}`);
  },

  async getTenant(tenantId: string) {
    return apiClient.get<ApiResponse<Tenant>>(`/tenants/${tenantId}`);
  },

  async updateTenant(tenantId: string, data: Partial<Tenant>) {
    return apiClient.put<ApiResponse<Tenant>>(`/tenants/${tenantId}`, data);
  },
};
