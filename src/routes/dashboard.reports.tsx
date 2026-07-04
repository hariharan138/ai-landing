import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Percent,
  PieChart,
  List,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from "recharts";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import {
  paletteColor,
  fmtCurrency,
  TONE_ICON_BG,
  ChartGradientDefs,
  deepFillX,
  deepFillY,
} from "@/components/dashboard/shared";
import type { Tone } from "@/components/dashboard/shared";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ReportSummary {
  total_revenue: number;
  total_orders: number;
  total_items_sold: number;
  avg_order_value: number;
  total_purchases: number;
  purchase_count: number;
  purchase_returns: number;
  sales_returns: number;
  net_cost: number;
  gross_profit: number;
  food_cost_pct: number;
  gross_margin_pct: number;
  material_in: number;
  material_in_qty: number;
  material_out: number;
  material_out_qty: number;
}

interface DailyRow {
  date: string;
  sales: number;
  orders: number;
  purchases: number;
  purchase_returns: number;
  sales_returns: number;
  net_cost: number;
  gross_profit: number;
  food_cost_pct: number;
  margin_pct: number;
}

interface ReportData {
  from_date: string;
  to_date: string;
  currency: string;
  summary: ReportSummary;
  daily: DailyRow[];
  top_items: { item: string; revenue: number; qty: number; orders: number }[];
  channels: { name: string; total: number; orders: number }[];
  branches: { branch: string; revenue: number; orders: number }[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function aed(v: number): string {
  return `AED ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(v: string): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return v;
  }
}

type ReportTab = "daily" | "items" | "channels" | "branches";

const KPI_CARDS: { key: keyof ReportSummary; label: string; icon: typeof DollarSign; tone: Tone; format: "currency" | "number" | "pct" }[] = [
  { key: "total_revenue", label: "Total Revenue", icon: DollarSign, tone: "primary", format: "currency" },
  { key: "total_orders", label: "Total Orders", icon: ShoppingCart, tone: "info", format: "number" },
  { key: "avg_order_value", label: "Avg Order Value", icon: TrendingUp, tone: "success", format: "currency" },
  { key: "total_items_sold", label: "Items Sold", icon: Package, tone: "info", format: "number" },
  { key: "total_purchases", label: "Total Purchases", icon: DollarSign, tone: "warning", format: "currency" },
  { key: "gross_profit", label: "Gross Profit", icon: TrendingUp, tone: "success", format: "currency" },
  { key: "food_cost_pct", label: "Food Cost %", icon: Percent, tone: "warning", format: "pct" },
  { key: "gross_margin_pct", label: "Gross Margin %", icon: Percent, tone: "success", format: "pct" },
];

function ReportsPage() {
  const { branch } = useBranchFilter();
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState<ReportTab>("daily");

  const queryKey = ["reports", "summary", fromDate, toDate, branch];

  const { data, isLoading, refetch, isFetching } = useQuery<ReportData>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ from_date: fromDate, to_date: toDate });
      if (branch && branch !== "all") params.set("branch", branch);
      const res = await fetch(`${API_BASE}/api/reports/summary?${params}`);
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    staleTime: 30_000,
    enabled: !!fromDate && !!toDate,
  });

  const summary = data?.summary;
  const daily = data?.daily ?? [];
  const topItems = data?.top_items ?? [];
  const channels = data?.channels ?? [];
  const branches = data?.branches ?? [];

  const channelTotal = channels.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Reports
          </h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Generate custom P&L reports for any date range
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[11px]"
            disabled={!data || isLoading}
            onClick={() => {
              const params = new URLSearchParams({ from_date: fromDate, to_date: toDate });
              if (branch && branch !== "all") params.set("branch", branch);
              window.open(`${API_BASE}/api/reports/summary/csv?${params}`, "_blank");
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-[11px]">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Date Range + Generate ───────────────────────────── */}
      <Card className="border border-border/60 bg-card shadow-sm">
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 w-[180px] rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[12px] text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 w-[180px] rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[12px] text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>
            </div>
            <Button size="sm" className="gap-1.5 text-[11px] h-9" onClick={() => refetch()} loading={isFetching}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPI_CARDS.map((kpi) => {
            const val = summary[kpi.key];
            const display = kpi.format === "currency"
              ? aed(val as number)
              : kpi.format === "pct"
                ? `${(val as number).toFixed(1)}%`
                : (val as number).toLocaleString();
            return (
              <Card key={kpi.key} className="border border-border/60 bg-card shadow-sm">
                <CardContent className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", TONE_ICON_BG[kpi.tone])}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[20px] font-bold text-foreground tabular-nums leading-tight">
                    {isLoading ? "..." : display}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Tab Selector ───────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 w-fit">
        {[
          { id: "daily" as ReportTab, label: "Daily Breakdown", icon: List },
          { id: "items" as ReportTab, label: "Top Items", icon: Layers },
          { id: "channels" as ReportTab, label: "Channels", icon: PieChart },
          { id: "branches" as ReportTab, label: "Branches", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Daily Breakdown Table ──────────────────────────── */}
      {activeTab === "daily" && (
        <Card className="border border-border/60 bg-card shadow-sm overflow-hidden">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="text-[14px] font-bold text-foreground">Daily Breakdown</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data?.from_date && data?.to_date
                ? `${fmtDate(data.from_date)} — ${fmtDate(data.to_date)}`
                : "Daily revenue, costs, and margin"}
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  {["Date", "Sales (AED)", "Orders", "Purchases", "Net Cost", "Gross Profit", "Food Cost %", "Margin %"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3.5 w-16 animate-pulse rounded bg-muted/60" /></td>
                      ))}
                    </tr>
                  ))
                ) : daily.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-[12px]">No data for this date range. Try adjusting the dates.</td>
                  </tr>
                ) : (
                  daily.map((row) => (
                    <tr key={row.date} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground text-[11px]">{fmtDate(row.date)}</td>
                      <td className="px-4 py-3 tabular-nums text-foreground font-medium">{aed(row.sales)}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.orders}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{aed(row.purchases)}</td>
                      <td className="px-4 py-3 tabular-nums text-warning font-medium">{aed(row.net_cost)}</td>
                      <td className="px-4 py-3 tabular-nums text-success font-medium">{aed(row.gross_profit)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "tabular-nums font-medium",
                          row.food_cost_pct > 40 ? "text-destructive" : row.food_cost_pct > 25 ? "text-warning" : "text-success",
                        )}>
                          {row.food_cost_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "tabular-nums font-medium",
                          row.margin_pct < 40 ? "text-destructive" : row.margin_pct < 60 ? "text-warning" : "text-success",
                        )}>
                          {row.margin_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {daily.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border/60 bg-muted/20">
                    <td className="px-4 py-3 font-bold text-foreground text-[11px]">Total</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground">{aed(daily.reduce((s, r) => s + r.sales, 0))}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground">{daily.reduce((s, r) => s + r.orders, 0)}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground">{aed(daily.reduce((s, r) => s + r.purchases, 0))}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-warning">{aed(daily.reduce((s, r) => s + r.net_cost, 0))}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-success">{aed(daily.reduce((s, r) => s + r.gross_profit, 0))}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground" colSpan={2}>{/* not meaningful to sum pcts */}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {/* ── Top Items ───────────────────────────────────────── */}
      {activeTab === "items" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card shadow-sm lg:col-span-2">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="text-[14px] font-bold text-foreground">Top Selling Items</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Highest revenue items in this period</p>
            </CardHeader>
            <CardContent className="px-5 py-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      {["#", "Item", "Revenue", "Qty Sold", "Orders"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-[12px]">No item data available</td></tr>
                    ) : (
                      topItems.map((item, i) => (
                        <tr key={item.item} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground text-[11px]">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-foreground text-[11px]">{item.item}</td>
                          <td className="px-4 py-3 tabular-nums text-foreground font-medium">{aed(item.revenue)}</td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">{item.qty}</td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">{item.orders}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {topItems.length > 0 && (
            <Card className="border border-border/60 bg-card shadow-sm lg:col-span-2">
              <CardHeader className="px-5 pb-2 pt-5">
                <CardTitle className="text-[14px] font-bold text-foreground">Item Revenue Chart</CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-3">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItems.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                      <ChartGradientDefs />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} horizontal={false} />
                      <XAxis type="number" fontSize={9} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                      />
                      <YAxis type="category" dataKey="item" fontSize={9} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={120} />
                      <Tooltip
                        cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                              <p className="font-bold text-foreground mb-1">{d.item}</p>
                              <p className="text-muted-foreground tabular-nums">{aed(d.revenue)}</p>
                              <p className="text-muted-foreground tabular-nums">{d.qty} units, {d.orders} orders</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="revenue" radius={[0, 8, 8, 0]} maxBarSize={24}>
                        {topItems.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={deepFillX(i)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Channels ────────────────────────────────────────── */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card shadow-sm">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="text-[14px] font-bold text-foreground">Channel Breakdown</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sales by order channel</p>
            </CardHeader>
            <CardContent className="px-5 py-3">
              <div className="space-y-4">
                {channels.length > 0 ? channels.map((ch, i) => {
                  const pct = channelTotal > 0 ? (ch.total / channelTotal) * 100 : 0;
                  const color = paletteColor(i);
                  return (
                    <div key={ch.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[12px] font-bold text-foreground">{ch.name}</span>
                        </div>
                        <span className="text-[12px] font-bold text-foreground tabular-nums">
                          {aed(ch.total)} <span className="text-muted-foreground font-medium">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-8 text-center text-[12px] text-muted-foreground">No channel data</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card shadow-sm">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="text-[14px] font-bold text-foreground">Channel Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-3">
              <div className="h-[300px] flex items-center justify-center">
                {channels.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={channels}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {channels.map((_, i) => (
                          <Cell key={i} fill={paletteColor(i)} fillOpacity={0.85} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const pct = channelTotal > 0 ? (d.total / channelTotal) * 100 : 0;
                          return (
                            <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                              <p className="font-bold text-foreground mb-1">{d.name}</p>
                              <p className="text-muted-foreground tabular-nums">{aed(d.total)}</p>
                              <p className="text-muted-foreground tabular-nums">{pct.toFixed(1)}% share</p>
                            </div>
                          );
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-[12px] text-muted-foreground">No channel data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Branches ────────────────────────────────────────── */}
      {activeTab === "branches" && (
        <Card className="border border-border/60 bg-card shadow-sm">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-[14px] font-bold text-foreground">Branch Performance</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Revenue and orders by branch</p>
          </CardHeader>
          <CardContent className="px-5 py-3">
            <div className="h-[300px]">
              {branches.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branches} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <ChartGradientDefs />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} vertical={false} />
                    <XAxis dataKey="branch" fontSize={10} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                    <YAxis fontSize={9} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                            <p className="font-bold text-foreground mb-1">{d.branch}</p>
                            <p className="text-muted-foreground tabular-nums">{aed(d.revenue)}</p>
                            <p className="text-muted-foreground tabular-nums">{d.orders} orders</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {branches.map((_, i) => (
                        <Cell key={i} fill={deepFillY(i)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">No branch data</div>
              )}
            </div>
          </CardContent>
          {branches.length > 0 && (
            <div className="overflow-x-auto border-t border-border/40">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    {["Branch", "Revenue", "Orders", "Share %"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b, i) => {
                    const totalRev = branches.reduce((s, br) => s + br.revenue, 0);
                    const share = totalRev > 0 ? (b.revenue / totalRev) * 100 : 0;
                    return (
                      <tr key={b.branch} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground text-[11px]">{b.branch}</td>
                        <td className="px-4 py-3 tabular-nums text-foreground font-medium">{aed(b.revenue)}</td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{b.orders}</td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{share.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
