import { getAccessToken, clearTokens, refreshAccessToken } from "./auth";

const BASE = "http://localhost:8000";

// ── Core fetch wrapper ────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, options, false);
    clearTokens();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────
export interface PosSale {
  _id: string;
  branch_name?: string;
  order_status?: string;
  [key: string]: unknown;
}

export interface TallyVoucher {
  _id: string;
  branch?: string;
  vouchertype?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  total: number;
  skip: number;
  limit: number;
  items: T[];
}

export interface HealthStatus {
  status: string;
  database: string;
}

// ── Health ────────────────────────────────────────────────
export const healthApi = {
  check: () => request<HealthStatus>("/health"),
};

// ── POS Sales ─────────────────────────────────────────────
export interface PosSalesParams {
  skip?: number;
  limit?: number;
  branch?: string;
  status?: string;
}

export const posSalesApi = {
  list: (params: PosSalesParams = {}) => {
    const q = new URLSearchParams();
    if (params.skip !== undefined) q.set("skip", String(params.skip));
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.branch) q.set("branch", params.branch);
    if (params.status) q.set("status", params.status);
    return request<PaginatedResponse<PosSale>>(`/api/pos-sales?${q}`);
  },
};

// ── Tally Vouchers ────────────────────────────────────────
export interface TallyParams {
  skip?: number;
  limit?: number;
  branch?: string;
  voucher_type?: string;
}

export const tallyApi = {
  list: (params: TallyParams = {}) => {
    const q = new URLSearchParams();
    if (params.skip !== undefined) q.set("skip", String(params.skip));
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.branch) q.set("branch", params.branch);
    if (params.voucher_type) q.set("voucher_type", params.voucher_type);
    return request<PaginatedResponse<TallyVoucher>>(`/api/tally-vouchers?${q}`);
  },
};
