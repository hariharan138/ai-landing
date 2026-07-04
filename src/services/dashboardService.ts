const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export type Period = "today" | "week" | "month" | "year";

export interface DashboardMetrics {
  period: string;
  compare_label: string;
  currency: string;
  total_sales: number;
  total_sales_delta_pct: number | null;
  orders: number;
  orders_delta_pct: number | null;
  food_cost_pct: number;
  food_cost_pp_delta: number | null;
  active_alerts: number;
  critical_alerts: number;
  gross_margin_pct: number;
  gross_margin_pp_delta: number | null;
  sync_status: string;
  sync_pct: number;
  last_sync: string | null;
  range_start?: string;
  range_end?: string;
}

export interface MetricsTrend {
  period: string;
  labels: string[];
  sales: number[];
  orders: number[];
  food_cost_pct: number[];
  margin_pct: number[];
  prev_sales: number[];
  prev_orders: number[];
  prev_food_cost_pct: number[];
  prev_margin_pct: number[];
  current_label: string;
  previous_label: string;
  anchor_date: string | null;
}

export interface StockSummary {
  total_units: number;
  items_in_stock: number;
  total_items: number;
}

export interface ChannelBreakdownData {
  period: string;
  currency: string;
  total: number;
  items: { name: string; value: number }[];
}

export interface ReconciliationData {
  pos_revenue: number;
  tally_purchases: number;
  purchase_returns: number;
  sales_returns: number;
  tally_returns: number;
  net_cost: number;
  gross_margin: number;
  food_cost_pct: number;
  margin_pct: number;
  pos_orders: number;
  tally_voucher_count: number;
  pos_branches: string[];
  tally_branches: string[];
  branches_only_pos: string[];
  branches_only_tally: string[];
  branches_both: string[];
  daily: { date: string; pos_revenue: number; tally_cost: number }[];
  currency: string;
}

export interface StockItem {
  item: string;
  current_stock: number;
  status: "critical" | "low" | "ok";
}

export interface TopItem {
  item: string;
  revenue: number;
  qty: number;
  orders: number;
  pct: number;
}

export interface BranchSummaryItem {
  branch: string;
  sales: number;
  orders: number;
  food_cost_pct: number;
  gross_margin_pct: number;
  active_alerts: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function qs(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null);
  return entries.length
    ? "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
    : "";
}

export const dashboardService = {
  getMetrics(period: Period, branch?: string | null) {
    return apiFetch<DashboardMetrics>(`/dashboard/metrics${qs({ period, branch })}`);
  },

  getMetricsTrend(period: "week" | "month" | "year", branch?: string | null) {
    return apiFetch<MetricsTrend>(`/dashboard/metrics-trend${qs({ period, branch })}`);
  },

  getStockSummary(branch?: string | null) {
    return apiFetch<StockSummary>(`/dashboard/stock-summary${qs({ branch })}`);
  },

  getChannelBreakdown(period: Period, branch?: string | null) {
    return apiFetch<ChannelBreakdownData>(`/dashboard/channel-breakdown${qs({ period, branch })}`);
  },

  getReconciliation(period: Period, branch?: string | null) {
    return apiFetch<ReconciliationData>(`/dashboard/reconciliation${qs({ period, branch })}`);
  },

  getStockItems(branch?: string | null, limit = 10) {
    return apiFetch<{ items: StockItem[] }>(`/dashboard/stock-items${qs({ branch, limit })}`);
  },

  getTopItems(period: Period, branch?: string | null, limit = 5) {
    return apiFetch<{ items: TopItem[]; currency: string }>(
      `/dashboard/top-items${qs({ period, branch, limit })}`,
    );
  },

  getBranchSummary(period: Period) {
    return apiFetch<{ period: string; currency: string; items: BranchSummaryItem[] }>(
      `/dashboard/branch-summary${qs({ period })}`,
    );
  },
};
