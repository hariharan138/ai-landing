const API_BASE = "http://localhost:8000/api/auth";

export interface User {
  id: string;
  full_name: string;
  email: string;
  provider: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ── Token Storage ────────────────────────────────────────
export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("user", JSON.stringify(tokens.user));
}

export function updateStoredUser(user: User) {
  if (!isBrowser) return;
  localStorage.setItem("user", JSON.stringify(user));
}

const isBrowser = typeof window !== "undefined";

export function getAccessToken(): string | null {
  return isBrowser ? localStorage.getItem("access_token") : null;
}

export function getRefreshToken(): string | null {
  return isBrowser ? localStorage.getItem("refresh_token") : null;
}

export function getStoredUser(): User | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function clearTokens() {
  if (!isBrowser) return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ── Core fetch ────────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message = Array.isArray(detail)
      ? detail.map((e: any) => e.msg || String(e)).join(", ")
      : detail || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

// ── Auth API ─────────────────────────────────────────────
export async function register(full_name: string, email: string, password: string) {
  const res = await apiFetch("/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password }),
  });
  return handleResponse<{ message: string; detail: string }>(res);
}

export async function verifyEmail(email: string, otp: string): Promise<AuthTokens> {
  const res = await apiFetch("/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  const data = await handleResponse<AuthTokens>(res);
  saveTokens(data);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ message: string; detail: string }> {
  const res = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ message: string; detail: string }>(res);
}

export async function sendOtp(email: string, purpose: "login" | "verify" = "login") {
  const res = await apiFetch("/send-otp", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });
  return handleResponse<{ message: string; detail: string }>(res);
}

export async function verifyOtp(
  email: string,
  otp: string,
  purpose: "login" | "verify" = "login",
): Promise<AuthTokens> {
  const res = await apiFetch("/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp, purpose }),
  });
  const data = await handleResponse<AuthTokens>(res);
  saveTokens(data);
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch("/logout", { method: "POST" });
  clearTokens();
}

export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(`${API_BASE}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data: AuthTokens = await res.json();
  saveTokens(data);
  return data;
}

export async function getMe(): Promise<User | null> {
  const res = await apiFetch("/me");
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retry = await apiFetch("/me");
      if (retry.ok) return retry.json();
    }
    clearTokens();
    return null;
  }
  if (!res.ok) return null;
  return res.json();
}

export async function updateProfile(full_name: string): Promise<User> {
  const res = await apiFetch("/me", {
    method: "PATCH",
    body: JSON.stringify({ full_name }),
  });
  const user = await handleResponse<User>(res);
  updateStoredUser(user);
  return user;
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<void> {
  const res = await apiFetch("/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  });
  await handleResponse<{ message: string; detail: string }>(res);
}

export function getGoogleOAuthUrl(): string {
  return `${API_BASE}/google`;
}
