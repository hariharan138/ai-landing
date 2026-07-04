/* Multi-tenant SaaS domain types */

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  owner_id: string;
  subscription_tier: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  user: User;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon?: string;
  glow?: string;
}

export interface Activity {
  id: string;
  tenant_id: string;
  type: "order" | "inventory" | "team" | "settings";
  title: string;
  description?: string;
  actor: User;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
