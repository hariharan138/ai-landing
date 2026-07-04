import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  ArrowDownUp,
  XCircle,
  Download,
  Warehouse,
  TrendingDown,
  ShieldAlert,
  ChevronRight,
  BarChart3,
  Eye,
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
  PieChart,
  Pie,
} from "recharts";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dashboardService, type StockItem } from "@/services/dashboardService";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { DASHBOARD_LIVE_QUERY, paletteColor } from "@/components/dashboard/shared";

export const Route = createFileRoute("/dashboard/inventory")({
  component: InventoryPage,
});

const STATUS_CONFIG = {
  critical: {
    label: "Critical",
    color: "bg-destructive/15 text-destructive border-destructive/30",
    icon: XCircle,
    bar: "bg-destructive",
    chartColor: "var(--color-destructive)",
  },
  low: {
    label: "Low Stock",
    color: "bg-warning/15 text-warning border-warning/30",
    icon: AlertTriangle,
    bar: "bg-warning",
    chartColor: "var(--color-warning)",
  },
  ok: {
    label: "In Stock",
    color: "bg-success/15 text-success border-success/30",
    icon: CheckCircle,
    bar: "bg-success",
    chartColor: "var(--color-success)",
  },
} as const;

function StockGauge({
  value,
  max,
  status,
}: {
  value: number;
  max: number;
  status: StockItem["status"];
}) {
  const r = 28;
  const cx = 32;
  const cy = 32;
  const circumference = 2 * Math.PI * r;
  const trackLen = circumference * 0.75;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const fillLen = trackLen * pct;
  const color = STATUS_CONFIG[status].chartColor;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${trackLen.toFixed(1)} ${circumference.toFixed(1)}`}
        transform={`rotate(135, ${cx}, ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${fillLen.toFixed(1)} ${circumference.toFixed(1)}`}
        transform={`rotate(135, ${cx}, ${cy})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="currentColor"
      >
        {value <= 0 ? "0" : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
      </text>
    </svg>
  );
}

function InventoryPage() {
  const { branch } = useBranchFilter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard", "stock-summary", branch],
    queryFn: () =>
      dashboardService.getStockSummary(branch && branch !== "all" ? branch : undefined),
    ...DASHBOARD_LIVE_QUERY,
  });

  const {
    data: stockData,
    isLoading: stockLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["dashboard", "stock-items", branch],
    queryFn: () =>
      dashboardService.getStockItems(branch && branch !== "all" ? branch : undefined, 50),
    ...DASHBOARD_LIVE_QUERY,
  });

  const items: StockItem[] = stockData?.items ?? [];

  const filtered = items
    .filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (search && !i.item.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) =>
      sortAsc ? a.current_stock - b.current_stock : b.current_stock - a.current_stock,
    );

  const criticalCount = items.filter((i) => i.status === "critical").length;
  const lowCount = items.filter((i) => i.status === "low").length;
  const okCount = items.filter((i) => i.status === "ok").length;
  const maxStock = Math.max(...items.map((i) => i.current_stock), 1);

  // Chart data — top 10 by stock level (sorted descending)
  const barChartData = [...items]
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 10)
    .map((item) => ({
      name: item.item.length > 14 ? item.item.slice(0, 14) + "…" : item.item,
      fullName: item.item,
      stock: Math.max(0, item.current_stock),
      status: item.status,
    }));

  // Status distribution pie
  const statusPieData = [
    { name: "In Stock", value: okCount, fill: "var(--color-success)" },
    { name: "Low Stock", value: lowCount, fill: "var(--color-warning)" },
    { name: "Critical", value: criticalCount, fill: "var(--color-destructive)" },
  ].filter((d) => d.value > 0);

  const healthScore = items.length > 0 ? Math.round((okCount / items.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            Inventory Management
          </h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Current stock levels computed from Tally Material In / Out vouchers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-[11px]"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "TOTAL ITEMS",
            value: summary ? String(summary.total_items) : "...",
            sub: summary ? `${summary.items_in_stock} currently in stock` : "",
            icon: Package,
            tone: "bg-primary/15 text-primary",
          },
          {
            label: "TOTAL UNITS",
            value: summary
              ? summary.total_units.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : "...",
            sub: "Across all stock items",
            icon: BarChart3,
            tone: "bg-info/15 text-info",
          },
          {
            label: "CRITICAL",
            value: String(criticalCount),
            sub: "Zero or negative stock",
            icon: XCircle,
            tone:
              criticalCount > 0
                ? "bg-destructive/15 text-destructive"
                : "bg-success/15 text-success",
          },
          {
            label: "LOW STOCK",
            value: String(lowCount),
            sub: "Below 5 units remaining",
            icon: TrendingDown,
            tone: lowCount > 0 ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
          },
          {
            label: "INVENTORY HEALTH",
            value: `${healthScore}%`,
            sub:
              healthScore >= 80
                ? "Healthy"
                : healthScore >= 50
                  ? "Needs attention"
                  : "Critical state",
            icon: ShieldAlert,
            tone:
              healthScore >= 80
                ? "bg-success/15 text-success"
                : healthScore >= 50
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive",
          },
        ].map((c) => (
          <Card key={c.label} className="border border-border/60 bg-card shadow-sm">
            <CardContent className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {c.label}
                </p>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
                    c.tone,
                  )}
                >
                  <c.icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="text-[22px] font-bold text-foreground tabular-nums leading-tight">
                {summaryLoading || stockLoading ? "..." : c.value}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Alert Banner (if critical items exist) ───────────────────── */}
      {criticalCount > 0 && !stockLoading && (
        <Card className="border border-destructive/30 bg-destructive/[0.04] shadow-sm">
          <CardContent className="px-5 py-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 shrink-0">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-destructive">
                {criticalCount} item{criticalCount !== 1 ? "s" : ""} at critical stock level
              </p>
              <p className="text-[11px] text-destructive/70 mt-0.5">
                These items have zero or negative stock and need immediate restocking. Items:{" "}
                {items
                  .filter((i) => i.status === "critical")
                  .slice(0, 3)
                  .map((i) => i.item)
                  .join(", ")}
                {criticalCount > 3 && ` and ${criticalCount - 3} more`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => setStatusFilter("critical")}
            >
              View Critical
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Charts Row: Stock Levels Bar + Status Distribution Pie ──── */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          {/* Stock Levels Bar Chart */}
          <Card className="border border-border/60 bg-card shadow-sm lg:col-span-3">
            <CardHeader className="px-5 pb-2 pt-5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <CardTitle className="text-[14px] font-bold text-foreground">
                  Stock Levels — Top 10 Items
                </CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Current unit counts for highest-stocked items
              </p>
            </CardHeader>
            <CardContent className="px-5 py-3">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.3}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={9}
                      stroke="var(--color-muted-foreground)"
                      tickLine={false}
                      axisLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      fontSize={9}
                      stroke="var(--color-muted-foreground)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
                      }
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const cfg = STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG];
                        return (
                          <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                            <p className="font-bold text-foreground mb-1">{d.fullName}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Stock:</span>
                              <span className="font-bold tabular-nums">
                                {d.stock.toFixed(1)} units
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-bold" style={{ color: cfg.chartColor }}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="stock"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                      cursor="pointer"
                      onClick={(d) => {
                        const item = items.find((i) => i.item === d.fullName);
                        if (item) setSelectedItem(item);
                      }}
                    >
                      {barChartData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG].chartColor}
                          fillOpacity={0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Pie */}
          <Card className="border border-border/60 bg-card shadow-sm lg:col-span-2 bg-gradient-to-br from-card to-muted/10">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="text-[14px] font-bold text-foreground">
                Status Distribution
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Breakdown of inventory health across all items
              </p>
            </CardHeader>
            <CardContent className="px-5 py-3 flex flex-col items-center">
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const pct =
                          items.length > 0 ? ((d.value / items.length) * 100).toFixed(0) : "0";
                        return (
                          <div className="rounded-xl border border-border bg-popover px-3 py-2 text-[11px] shadow-xl">
                            <p className="font-bold text-foreground">{d.name}</p>
                            <p className="text-muted-foreground tabular-nums">
                              {d.value} items ({pct}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[22px] font-bold text-foreground tabular-nums">
                    {items.length}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-medium">Total Items</p>
                </div>
              </div>

              {/* Legend with click-to-filter */}
              <div className="w-full mt-3 space-y-2">
                {[
                  {
                    key: "ok" as const,
                    label: "In Stock",
                    count: okCount,
                    color: "var(--color-success)",
                  },
                  {
                    key: "low" as const,
                    label: "Low Stock",
                    count: lowCount,
                    color: "var(--color-warning)",
                  },
                  {
                    key: "critical" as const,
                    label: "Critical",
                    count: criticalCount,
                    color: "var(--color-destructive)",
                  },
                ].map((s) => {
                  const pct = items.length > 0 ? (s.count / items.length) * 100 : 0;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStatusFilter(statusFilter === s.key ? "" : s.key)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all text-left",
                        statusFilter === s.key
                          ? "bg-muted/60 ring-1 ring-primary/20"
                          : "hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-[11px] font-medium text-foreground">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-foreground tabular-nums">
                          {s.count}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          ({pct.toFixed(0)}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filters + View Toggle ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock items..."
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-full border border-border/40 bg-muted/30 p-0.5">
          {(["", "critical", "low", "ok"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {s ? STATUS_CONFIG[s].label : "All"}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortAsc(!sortAsc)}
          className="gap-1.5 text-[11px] text-muted-foreground"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
          {sortAsc ? "Lowest first" : "Highest first"}
        </Button>
        <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/30 p-0.5">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all",
              viewMode === "cards"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all",
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            List
          </button>
        </div>
      </div>

      {/* ── Stock Items ──────────────────────────────────────────────── */}
      {stockLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border border-border/60 bg-card shadow-sm animate-pulse">
              <CardContent className="px-4 py-5">
                <div className="h-4 w-24 rounded bg-muted/60 mb-3" />
                <div className="h-6 w-16 rounded bg-muted/60 mb-2" />
                <div className="h-2 w-full rounded bg-muted/40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-border/60 bg-card shadow-sm">
          <CardContent className="py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-muted-foreground">
              No items match your filters
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Try adjusting the search or status filter
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* ── Cards View ──────────────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status];
            const StatusIcon = cfg.icon;
            const pct = maxStock > 0 ? Math.max(0, (item.current_stock / maxStock) * 100) : 0;

            return (
              <Card
                key={item.item}
                className={cn(
                  "border bg-card shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group",
                  item.status === "critical"
                    ? "border-destructive/30 hover:border-destructive/50"
                    : item.status === "low"
                      ? "border-warning/30 hover:border-warning/50"
                      : "border-border/60 hover:border-primary/30",
                  selectedItem?.item === item.item && "ring-1 ring-primary/30",
                )}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="px-4 py-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                          cfg.color.split(" ").slice(0, 1).join(" "),
                        )}
                      >
                        <StatusIcon
                          className={cn("h-4 w-4", cfg.color.split(" ").slice(1, 2).join(" "))}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-foreground truncate">
                          {item.item}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("text-[8px] font-bold px-1.5 py-0 mt-0.5", cfg.color)}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>

                  {/* Stock gauge + value */}
                  <div className="flex items-center justify-between">
                    <StockGauge value={item.current_stock} max={maxStock} status={item.status} />
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-[24px] font-bold tabular-nums leading-tight",
                          item.status === "critical"
                            ? "text-destructive"
                            : item.status === "low"
                              ? "text-warning"
                              : "text-foreground",
                        )}
                      >
                        {item.current_stock <= 0
                          ? "0"
                          : item.current_stock.toLocaleString("en-US", {
                              maximumFractionDigits: 1,
                            })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">units in stock</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                        style={{ width: `${Math.max(item.current_stock > 0 ? 3 : 0, pct)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── List View ───────────────────────────────────────────────── */
        <Card className="border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  {["ITEM", "STATUS", "STOCK LEVEL", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const StatusIcon = cfg.icon;
                  const pct = maxStock > 0 ? Math.max(0, (item.current_stock / maxStock) * 100) : 0;

                  return (
                    <tr
                      key={item.item}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
                              cfg.color.split(" ").slice(0, 1).join(" "),
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "h-3.5 w-3.5",
                                cfg.color.split(" ").slice(1, 2).join(" "),
                              )}
                            />
                          </div>
                          <span className="text-[12px] font-semibold text-foreground">
                            {item.item}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] font-bold px-1.5 py-0", cfg.color)}
                        >
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 w-[40%]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                cfg.bar,
                              )}
                              style={{ width: `${Math.max(item.current_stock > 0 ? 3 : 0, pct)}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[14px] font-bold tabular-nums shrink-0 w-16 text-right",
                              item.status === "critical"
                                ? "text-destructive"
                                : item.status === "low"
                                  ? "text-warning"
                                  : "text-foreground",
                            )}
                          >
                            {item.current_stock <= 0 ? "0" : item.current_stock.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Item Detail Dialog ───────────────────────────────────────── */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-foreground flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-primary" />
              Stock Item Detail
            </DialogTitle>
          </DialogHeader>
          {selectedItem &&
            (() => {
              const cfg = STATUS_CONFIG[selectedItem.status];
              const StatusIcon = cfg.icon;
              const pct =
                maxStock > 0 ? Math.max(0, (selectedItem.current_stock / maxStock) * 100) : 0;

              return (
                <div className="space-y-4 mt-2">
                  {/* Item name + status */}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                        cfg.color.split(" ").slice(0, 1).join(" "),
                      )}
                    >
                      <StatusIcon
                        className={cn("h-5 w-5", cfg.color.split(" ").slice(1, 2).join(" "))}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground">{selectedItem.item}</p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold mt-0.5", cfg.color)}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Gauge + metrics */}
                  <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-background/50 p-4">
                    <StockGauge
                      value={selectedItem.current_stock}
                      max={maxStock}
                      status={selectedItem.status}
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                          Current Stock
                        </p>
                        <p
                          className={cn(
                            "text-[28px] font-bold tabular-nums leading-tight",
                            selectedItem.status === "critical"
                              ? "text-destructive"
                              : selectedItem.status === "low"
                                ? "text-warning"
                                : "text-foreground",
                          )}
                        >
                          {selectedItem.current_stock <= 0
                            ? "0"
                            : selectedItem.current_stock.toLocaleString("en-US", {
                                maximumFractionDigits: 1,
                              })}
                          <span className="text-[12px] font-medium text-muted-foreground ml-1">
                            units
                          </span>
                        </p>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                          style={{
                            width: `${Math.max(selectedItem.current_stock > 0 ? 3 : 0, pct)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status explanation */}
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3",
                      selectedItem.status === "critical"
                        ? "border-destructive/30 bg-destructive/[0.05]"
                        : selectedItem.status === "low"
                          ? "border-warning/30 bg-warning/[0.05]"
                          : "border-success/30 bg-success/[0.05]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-bold",
                        selectedItem.status === "critical"
                          ? "text-destructive"
                          : selectedItem.status === "low"
                            ? "text-warning"
                            : "text-success",
                      )}
                    >
                      {selectedItem.status === "critical"
                        ? "Immediate Action Required"
                        : selectedItem.status === "low"
                          ? "Restock Soon"
                          : "Stock Level Healthy"}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-0.5",
                        selectedItem.status === "critical"
                          ? "text-destructive/70"
                          : selectedItem.status === "low"
                            ? "text-warning/70"
                            : "text-success/70",
                      )}
                    >
                      {selectedItem.status === "critical"
                        ? "This item has zero or negative stock. Place a purchase order immediately to avoid operational disruption."
                        : selectedItem.status === "low"
                          ? "Stock is below 5 units. Consider placing a reorder to maintain adequate supply."
                          : "This item has sufficient stock levels to meet current demand."}
                    </p>
                  </div>

                  {/* Relative position */}
                  <div className="rounded-xl border border-border/30 bg-background/50 px-4 py-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Relative Stock Position
                    </p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">vs. highest item</span>
                      <span className="text-[11px] font-bold text-foreground tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                        style={{
                          width: `${Math.max(selectedItem.current_stock > 0 ? 3 : 0, pct)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
