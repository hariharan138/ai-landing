import { z } from "zod";

/* Authentication schemas */
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  tenant_name: z.string().min(2, "Tenant name must be at least 2 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/* Team schemas */
export const addTeamMemberSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "member", "viewer"]),
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;

/* Tenant schemas */
export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  logo_url: z.string().url().optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

/* Generic pagination */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
