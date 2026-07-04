import { useState, lazy, Suspense, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ShoppingCart,
  DollarSign,
  Percent,
  AlertTriangle,
  RefreshCw,
  MapPin,
  TrendingUp,
  Crown,
  Target,
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Plus,
  Minus,
  GripVertical,
  SlidersHorizontal,
  Table2,
  LayoutGrid,
  BarChart3,
  Radar as RadarIcon,
  Layers,
  Eye,
  EyeOff,
  Download,
  Share2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dashboardService, type BranchSummaryItem, type Period } from "@/services/dashboardService";
import {
  DASHBOARD_LIVE_QUERY,
  paletteColor,
  fmtCurrency,
  fmtPct,
  PeriodChip,
  ChartGradientDefs,
  deepFillY,
} from "@/components/dashboard/shared";

const BRANCH_COORDS: Record<string, [number, number]> = {
  "Airport Branch": [25.2532, 55.3657],
  "Downtown Branch": [25.1972, 55.2744],
  "Jumeirah Branch": [25.2048, 55.2708],
  "Mall Branch": [25.1985, 55.2796],
  "Marina Branch": [25.0805, 55.1403],
};

const LazyBranchMap = lazy(() => import("@/components/dashboard/BranchMap"));

export const Route = createFileRoute("/dashboard/branches")({
  component: BranchesPage,
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function rankBadge(rank: number) {
  if (rank === 0) return <Crown className="h-3.5 w-3.5 text-warning" />;
  if (rank === 1)
    return <span className="text-[10px] font-bold text-muted-foreground/70">2nd</span>;
  if (rank === 2)
    return <span className="text-[10px] font-bold text-muted-foreground/70">3rd</span>;
  return <span className="text-[10px] font-bold text-muted-foreground/50">{rank + 1}th</span>;
}

function MarginGauge({ value, size = 72 }: { value: number; size?: number }) {
  const r = size * 0.416;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const trackLen = circumference * 0.75;
  const fillLen = trackLen * Math.min(1, Math.max(0, value / 100));
  const color =
    value >= 65
      ? "var(--color-success)"
      : value >= 40
        ? "var(--color-warning)"
        : "var(--color-destructive)";
  const fontSize = size >= 72 ? 13 : size >= 48 ? 10 : 8;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeWidth={size * 0.083}
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
        strokeWidth={size * 0.083}
        strokeLinecap="round"
        strokeDasharray={`${fillLen.toFixed(1)} ${circumference.toFixed(1)}`}
        transform={`rotate(135, ${cx}, ${cy})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="800"
        fill="currentColor"
      >
        {value.toFixed(0)}%
      </text>
    </svg>
  );
}

function DeltaIndicator({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value <= 0 : value > 0;
  return value !== 0 ? (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums",
        good ? "text-success" : "text-destructive",
      )}
    >
      {value > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}pp
    </span>
  ) : null;
}

type SortKey =
  | "branch"
  | "sales"
  | "orders"
  | "gross_margin_pct"
  | "food_cost_pct"
  | "active_alerts";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";
type ChartTab = "overview" | "radar" | "scatter";

/* ── Main Page ───────────────────────────────────────────────────────────── */

function BranchesPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [selectedBranch, setSelectedBranch] = useState<BranchSummaryItem | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sales");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [chartTab, setChartTab] = useState<ChartTab>("overview");
  const [showComparison, setShowComparison] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", "branch-summary", period],
    queryFn: () => dashboardService.getBranchSummary(period),
    ...DASHBOARD_LIVE_QUERY,
  });

  const items: BranchSummaryItem[] = data?.items ?? [];
  const currency = data?.currency ?? "AED";

  const ranked = useMemo(() => [...items].sort((a, b) => b.sales - a.sales), [items]);

  const filtered = useMemo(() => {
    if (!search) return ranked;
    const q = search.toLowerCase();
    return ranked.filter((b) => b.branch.toLowerCase().includes(q));
  }, [ranked, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "branch") {
      list.sort((a, b) => dir * a.branch.localeCompare(b.branch));
    } else {
      list.sort((a, b) => dir * (a[sortKey] - b[sortKey]));
    }
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalSales = items.reduce((s, i) => s + i.sales, 0);
  const totalOrders = items.reduce((s, i) => s + i.orders, 0);
  const avgMargin = items.length
    ? items.reduce((s, i) => s + i.gross_margin_pct, 0) / items.length
    : 0;
  const avgFoodCost = items.length
    ? items.reduce((s, i) => s + i.food_cost_pct, 0) / items.length
    : 0;
  const totalAlerts = items.reduce((s, i) => s + i.active_alerts, 0);

  const topBranch = ranked[0];
  const bottomBranch = ranked[ranked.length - 1];

  const compareBranches = useMemo(
    () => items.filter((b) => compareIds.has(b.branch)),
    [items, compareIds],
  );

  const toggleCompare = useCallback((branch: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(branch)) next.delete(branch);
      else next.add(branch);
      return next;
    });
  }, []);

  const isComparing = compareIds.size >= 2;

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((k) => {
      if (k === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return k;
      }
      setSortDir("desc");
      return key;
    });
  }, []);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Chart data
  const barData = sorted.map((b) => ({
    name: b.branch.replace(" Branch", ""),
    sales: b.sales,
    orders: b.orders,
    branch: b.branch,
  }));

  const pieData = ranked.map((b, i) => ({
    name: b.branch.replace(" Branch", ""),
    value: b.sales,
    fill: paletteColor(i),
  }));

  const marginData = ranked.map((b, i) => ({
    name: b.branch.replace(" Branch", ""),
    margin: b.gross_margin_pct,
    foodCost: b.food_cost_pct,
    fill: paletteColor(i),
  }));

  // Radar data — only for selected / all
  const radarKeys = useMemo(() => {
    const pool = compareBranches.length >= 2 ? compareBranches : ranked;
    const maxSales = Math.max(...ranked.map((b) => b.sales), 1);
    return pool.map((b, i) => ({
      branch: b.branch.replace(" Branch", ""),
      "Revenue Share": (b.sales / maxSales) * 100,
      Margin: b.gross_margin_pct,
      "Orders Share": (b.orders / Math.max(...ranked.map((x) => x.orders), 1)) * 100,
      "Food Cost (inv)": 100 - b.food_cost_pct,
      "No Alerts": Math.max(0, 100 - b.active_alerts * 20),
      color: paletteColor(ranked.findIndex((r) => r.branch === b.branch)),
    }));
  }, [ranked, compareBranches]);

  // Scatter data
  const scatterData = ranked.map((b, i) => ({
    name: b.branch.replace(" Branch", ""),
    revenue: b.sales,
    margin: b.gross_margin_pct,
    orders: b.orders,
    fill: paletteColor(i),
  }));

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Branch Performance
          </h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Comparative analytics across {items.length} outlet{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-border/40 bg-muted/30 p-0.5">
            {(["today", "week", "month", "year"] as Period[]).map((p) => (
              <PeriodChip
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                active={period === p}
                onClick={() => setPeriod(p)}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-[11px] gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "Total Revenue",
            value: fmtCurrency(totalSales, currency),
            icon: DollarSign,
            tone: "bg-primary/15 text-primary",
            sub: `${items.length} branches`,
          },
          {
            label: "Total Orders",
            value: totalOrders.toLocaleString(),
            icon: ShoppingCart,
            tone: "bg-info/15 text-info",
            sub: `${totalSales > 0 ? fmtCurrency(totalSales / totalOrders, currency) : "—"} avg`,
          },
          {
            label: "Avg Margin",
            value: fmtPct(avgMargin),
            icon: Percent,
            tone: avgMargin >= 50 ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            sub: avgMargin >= 50 ? "Healthy" : "Below target",
          },
          {
            label: "Avg Food Cost",
            value: fmtPct(avgFoodCost),
            icon: Target,
            tone: avgFoodCost <= 35 ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            sub: avgFoodCost <= 35 ? "On target" : "Above target",
          },
          {
            label: "Active Alerts",
            value: String(totalAlerts),
            icon: AlertTriangle,
            tone:
              totalAlerts > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success",
            sub: totalAlerts > 0 ? "Needs attention" : "All clear",
          },
        ].map((c) => (
          <Card key={c.label} className="border border-border/60 bg-card shadow-sm">
            <CardContent className="px-4 py-3.5 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                  c.tone,
                )}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground">{c.label}</p>
                <p className="text-[18px] font-bold text-foreground tabular-nums leading-tight">
                  {isLoading ? "..." : c.value}
                </p>
                <p className="text-[9px] text-muted-foreground/70 truncate">{c.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Top & Bottom Performers ────────────────────────────────────── */}
      {!isLoading && topBranch && bottomBranch && items.length > 1 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card className="border border-success/30 bg-success/[0.03] shadow-sm">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15">
                  <Crown className="h-4 w-4 text-success" />
                </div>
                <p className="text-[11px] font-bold text-success uppercase tracking-wider">
                  Top Performer
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] font-bold text-foreground">{topBranch.branch}</p>
                  <div className="mt-1.5 flex items-center gap-4">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Revenue</p>
                      <p className="text-[13px] font-bold text-foreground tabular-nums">
                        {fmtCurrency(topBranch.sales, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Orders</p>
                      <p className="text-[13px] font-bold text-foreground tabular-nums">
                        {topBranch.orders.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Margin</p>
                      <p className="text-[13px] font-bold text-success tabular-nums">
                        {fmtPct(topBranch.gross_margin_pct)}
                      </p>
                    </div>
                  </div>
                </div>
                <MarginGauge value={topBranch.gross_margin_pct} />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-warning/30 bg-warning/[0.03] shadow-sm">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15">
                  <TrendingUp className="h-4 w-4 text-warning" />
                </div>
                <p className="text-[11px] font-bold text-warning uppercase tracking-wider">
                  Needs Improvement
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] font-bold text-foreground">{bottomBranch.branch}</p>
                  <div className="mt-1.5 flex items-center gap-4">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Revenue</p>
                      <p className="text-[13px] font-bold text-foreground tabular-nums">
                        {fmtCurrency(bottomBranch.sales, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Orders</p>
                      <p className="text-[13px] font-bold text-foreground tabular-nums">
                        {bottomBranch.orders.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Margin</p>
                      <p
                        className={cn(
                          "text-[13px] font-bold tabular-nums",
                          bottomBranch.gross_margin_pct >= 50 ? "text-success" : "text-warning",
                        )}
                      >
                        {fmtPct(bottomBranch.gross_margin_pct)}
                      </p>
                    </div>
                  </div>
                </div>
                <MarginGauge value={bottomBranch.gross_margin_pct} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Charts section with tabs ───────────────────────────────────── */}
      {items.length > 0 && (
        <div className="space-y-3">
          {/* Chart tab switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-0.5">
              {[
                { key: "overview" as ChartTab, label: "Overview", icon: BarChart3 },
                { key: "radar" as ChartTab, label: "Radar", icon: RadarIcon },
                { key: "scatter" as ChartTab, label: "Scatter", icon: Layers },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setChartTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all",
                    chartTab === t.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            {isComparing && (
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary bg-primary/5"
              >
                {compareIds.size} selected
              </Badge>
            )}
          </div>

          {/* Overview: Bar + Pie + Margin + Map */}
          {chartTab === "overview" && (
            <>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <Card className="border border-border/60 bg-card shadow-sm lg:col-span-3">
                  <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[12px] font-bold text-foreground">
                        Revenue by Branch
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-medium text-muted-foreground border-border/40"
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-3">
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <ChartGradientDefs />
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            opacity={0.3}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            fontSize={10}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            fontSize={9}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) =>
                              v >= 1_000_000
                                ? `${(v / 1_000_000).toFixed(1)}M`
                                : v >= 1000
                                  ? `${(v / 1000).toFixed(0)}k`
                                  : String(Math.round(v))
                            }
                          />
                          <ReTooltip
                            cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const pct =
                                totalSales > 0 ? ((d.sales / totalSales) * 100).toFixed(1) : "0";
                              const idx = ranked.findIndex((r) => r.branch === d.branch);
                              return (
                                <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: paletteColor(idx >= 0 ? idx : 0) }}
                                    />
                                    <p className="font-bold text-foreground">{d.name} Branch</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">Revenue</span>
                                      <span className="font-bold text-foreground tabular-nums">
                                        {fmtCurrency(d.sales, currency)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">Orders</span>
                                      <span className="font-bold text-foreground tabular-nums">
                                        {d.orders.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">Share</span>
                                      <span className="font-bold text-primary tabular-nums">
                                        {pct}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey="sales"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={48}
                            cursor="pointer"
                            onClick={(d) => {
                              const branch = items.find((b) => b.branch === d.branch);
                              if (branch) setSelectedBranch(branch);
                            }}
                          >
                            {barData.map((_, i) => (
                              <Cell key={i} fill={deepFillY(i)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 bg-card shadow-sm lg:col-span-2">
                  <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
                    <CardTitle className="text-[12px] font-bold text-foreground">
                      Revenue Share
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-3 flex flex-col items-center">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            cursor="pointer"
                            onClick={(d) => {
                              const branch = items.find(
                                (b) => b.branch.replace(" Branch", "") === d.name,
                              );
                              if (branch) setSelectedBranch(branch);
                            }}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                            ))}
                          </Pie>
                          <ReTooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const pct =
                                totalSales > 0 ? ((d.value / totalSales) * 100).toFixed(1) : "0";
                              return (
                                <div className="rounded-xl border border-border bg-popover px-3 py-2 text-[11px] shadow-xl">
                                  <p className="font-bold text-foreground">{d.name}</p>
                                  <p className="text-muted-foreground tabular-nums">
                                    {fmtCurrency(d.value, currency)} ({pct}%)
                                  </p>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
                      {pieData.map((d, i) => {
                        const pct =
                          totalSales > 0 ? ((d.value / totalSales) * 100).toFixed(0) : "0";
                        return (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: d.fill }}
                            />
                            <span className="text-[10px] text-muted-foreground">{d.name}</span>
                            <span className="text-[10px] font-bold text-foreground tabular-nums">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <Card className="border border-border/60 bg-card shadow-sm lg:col-span-3">
                  <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[12px] font-bold text-foreground">
                        Margin vs Food Cost
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-6 rounded-full bg-success/60" />
                          <span className="text-[9px] text-muted-foreground">Margin</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-6 rounded-full bg-warning/60" />
                          <span className="text-[9px] text-muted-foreground">Food Cost</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-3">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={marginData}
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
                            fontSize={10}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            fontSize={9}
                            stroke="var(--color-muted-foreground)"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${v}%`}
                          />
                          <ReTooltip
                            cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                                  <p className="font-bold text-foreground mb-1.5">
                                    {d.name} Branch
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">Margin</span>
                                      <span className="font-bold text-success tabular-nums">
                                        {fmtPct(d.margin)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">Food Cost</span>
                                      <span className="font-bold text-warning tabular-nums">
                                        {fmtPct(d.foodCost)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey="margin"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={24}
                            fill="var(--color-success)"
                            fillOpacity={0.7}
                          />
                          <Bar
                            dataKey="foodCost"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={24}
                            fill="var(--color-warning)"
                            fillOpacity={0.7}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border/60 bg-card shadow-sm overflow-hidden lg:col-span-2">
                  <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <CardTitle className="text-[12px] font-bold text-foreground">
                        Locations
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[248px]">
                      <Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
                            Loading map...
                          </div>
                        }
                      >
                        <LazyBranchMap
                          branches={ranked}
                          coords={BRANCH_COORDS}
                          currency={currency}
                        />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Radar chart — multi-dimensional comparison */}
          {chartTab === "radar" && (
            <Card className="border border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] font-bold text-foreground">
                    {compareBranches.length >= 2 ? "Branch Comparison Radar" : "All Branches Radar"}
                  </CardTitle>
                  {compareBranches.length < 2 && (
                    <p className="text-[9px] text-muted-foreground">
                      Select 2+ branches from below to compare
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 py-3">
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarKeys}
                      margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                    >
                      <PolarGrid stroke="var(--color-border)" strokeOpacity={0.3} />
                      <PolarAngleAxis
                        dataKey="branch"
                        fontSize={9}
                        stroke="var(--color-muted-foreground)"
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        fontSize={8}
                        stroke="var(--color-border)"
                        strokeOpacity={0.3}
                        tickFormatter={(v) => `${v}%`}
                      />
                      {radarKeys.map((d) => (
                        <Radar
                          key={d.branch}
                          name={d.branch}
                          dataKey="Margin"
                          stroke={d.color}
                          fill={d.color}
                          fillOpacity={0.1}
                          strokeWidth={1.5}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
                      <ReTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-xl border border-border bg-popover px-3 py-2 text-[11px] shadow-xl">
                              <p className="font-bold text-foreground mb-1">
                                {payload[0]?.payload?.branch}
                              </p>
                              {payload.map((p) => (
                                <div key={p.name} className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">{p.name}</span>
                                  <span className="font-bold text-foreground tabular-nums">
                                    {(p.value as number).toFixed(0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scatter chart — Revenue vs Margin */}
          {chartTab === "scatter" && (
            <Card className="border border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
                <CardTitle className="text-[12px] font-bold text-foreground">
                  Revenue vs Margin
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3">
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="revenue"
                        name="Revenue"
                        fontSize={9}
                        stroke="var(--color-muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(1)}M`
                            : v >= 1000
                              ? `${(v / 1000).toFixed(0)}k`
                              : String(Math.round(v))
                        }
                        label={{
                          value: "Revenue",
                          position: "bottom",
                          fontSize: 10,
                          fill: "var(--color-muted-foreground)",
                        }}
                      />
                      <YAxis
                        dataKey="margin"
                        name="Margin %"
                        domain={[0, 100]}
                        fontSize={9}
                        stroke="var(--color-muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v}%`}
                        label={{
                          value: "Margin %",
                          angle: -90,
                          position: "insideLeft",
                          fontSize: 10,
                          fill: "var(--color-muted-foreground)",
                          dx: -5,
                        }}
                      />
                      <ReTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: d.fill }}
                                />
                                <p className="font-bold text-foreground">{d.name}</p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Revenue</span>
                                  <span className="font-bold text-foreground tabular-nums">
                                    {fmtCurrency(d.revenue, currency)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Margin</span>
                                  <span className="font-bold text-success tabular-nums">
                                    {d.margin.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Orders</span>
                                  <span className="font-bold text-foreground tabular-nums">
                                    {d.orders.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        data={scatterData}
                        cursor="pointer"
                        onClick={(d) => {
                          const branch = items.find(
                            (b) => b.branch.replace(" Branch", "") === d.name,
                          );
                          if (branch) setSelectedBranch(branch);
                        }}
                      >
                        {scatterData.map((d, i) => (
                          <Cell key={i} fill={d.fill} fillOpacity={0.8} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Branch listing: search + view toggle ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-[200px] rounded-lg border-border/60 pl-7 text-[11px]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {compareIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareIds(new Set())}
                className="text-[10px] h-7 px-2 text-muted-foreground"
              >
                Clear ({compareIds.size})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-all",
                viewMode === "grid"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-md p-1.5 transition-all",
                viewMode === "table"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Table view"
            >
              <Table2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border border-border/60 bg-card shadow-sm animate-pulse">
                <CardContent className="px-4 py-5">
                  <div className="h-4 w-24 rounded bg-muted/60 mb-3" />
                  <div className="h-6 w-32 rounded bg-muted/60 mb-2" />
                  <div className="h-3 w-full rounded bg-muted/40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          /* ── Grid View ────────────────────────────────────────────────── */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {sorted.map((b, i) => {
              const salesPct = totalSales > 0 ? (b.sales / totalSales) * 100 : 0;
              const globalIdx = ranked.findIndex((r) => r.branch === b.branch);
              const isSelected = compareIds.has(b.branch);
              return (
                <Card
                  key={b.branch}
                  className={cn(
                    "border border-border/60 bg-card shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group",
                    isSelected && "border-primary/50 shadow-md ring-1 ring-primary/20",
                  )}
                  onClick={() => {
                    if (compareIds.size > 0) {
                      toggleCompare(b.branch);
                    } else {
                      setSelectedBranch(b);
                    }
                  }}
                >
                  <CardContent className="px-4 py-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: paletteColor(globalIdx >= 0 ? globalIdx : 0) }}
                        />
                        <span className="text-[12px] font-bold text-foreground truncate">
                          {b.branch.replace(" Branch", "")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {rankBadge(globalIdx)}
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/40 text-muted-foreground/40 group-hover:text-muted-foreground",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(b.branch);
                          }}
                        >
                          {isSelected ? (
                            <Minus className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <p className="text-[20px] font-bold text-foreground tabular-nums leading-tight">
                      {fmtCurrency(b.sales, currency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {b.orders.toLocaleString()} orders
                    </p>

                    {/* Revenue share bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${salesPct}%`,
                            backgroundColor: paletteColor(globalIdx >= 0 ? globalIdx : 0),
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {salesPct.toFixed(0)}%
                      </span>
                    </div>

                    {/* Metrics row */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-muted/20 px-2 py-1.5">
                        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
                          Margin
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              b.gross_margin_pct >= 65
                                ? "bg-success"
                                : b.gross_margin_pct >= 40
                                  ? "bg-warning"
                                  : "bg-destructive",
                            )}
                          />
                          <p
                            className={cn(
                              "text-[13px] font-bold tabular-nums",
                              b.gross_margin_pct >= 65
                                ? "text-success"
                                : b.gross_margin_pct >= 40
                                  ? "text-foreground"
                                  : "text-destructive",
                            )}
                          >
                            {fmtPct(b.gross_margin_pct)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/20 px-2 py-1.5">
                        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
                          Food Cost
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              b.food_cost_pct <= 30
                                ? "bg-success"
                                : b.food_cost_pct <= 40
                                  ? "bg-warning"
                                  : "bg-destructive",
                            )}
                          />
                          <p
                            className={cn(
                              "text-[13px] font-bold tabular-nums",
                              b.food_cost_pct <= 30
                                ? "text-success"
                                : b.food_cost_pct <= 40
                                  ? "text-foreground"
                                  : "text-warning",
                            )}
                          >
                            {fmtPct(b.food_cost_pct)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {b.active_alerts > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-[10px] font-bold text-destructive">
                          {b.active_alerts} active alert{b.active_alerts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ── Table View ───────────────────────────────────────────────── */
          <Card className="border border-border/60 bg-card shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="w-8 px-3 py-3" />
                    <TableHead className="w-10 px-3 py-3" />
                    <TableHead
                      className="px-3 py-3 text-[10px] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground w-[200px]"
                      onClick={() => handleSort("branch")}
                    >
                      <div className="flex items-center gap-1">Branch {sortIcon("branch")}</div>
                    </TableHead>
                    <TableHead
                      className="px-3 py-3 text-[10px] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground text-right"
                      onClick={() => handleSort("sales")}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Revenue {sortIcon("sales")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="px-3 py-3 text-[10px] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground text-right"
                      onClick={() => handleSort("orders")}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Orders {sortIcon("orders")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="px-3 py-3 text-[10px] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground text-right"
                      onClick={() => handleSort("gross_margin_pct")}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Margin {sortIcon("gross_margin_pct")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="px-3 py-3 text-[10px] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground text-right"
                      onClick={() => handleSort("food_cost_pct")}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Food Cost {sortIcon("food_cost_pct")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="px-3 py-3 text-[10px] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground text-right"
                      onClick={() => handleSort("active_alerts")}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Alerts {sortIcon("active_alerts")}
                      </div>
                    </TableHead>
                    <TableHead className="w-[60px] px-3 py-3" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((b, i) => {
                    const globalIdx = ranked.findIndex((r) => r.branch === b.branch);
                    const salesPct = totalSales > 0 ? (b.sales / totalSales) * 100 : 0;
                    const isSelected = compareIds.has(b.branch);
                    return (
                      <TableRow
                        key={b.branch}
                        className={cn(
                          "cursor-pointer transition-colors border-border/30",
                          isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/30",
                        )}
                        onClick={() => setSelectedBranch(b)}
                      >
                        <TableCell className="px-3 py-3">
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded border transition-all",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/50 hover:border-primary/50",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompare(b.branch);
                            }}
                          >
                            {isSelected ? <Check className="h-3 w-3" /> : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: paletteColor(globalIdx >= 0 ? globalIdx : 0),
                            }}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-foreground">
                              {b.branch.replace(" Branch", "")}
                            </span>
                            <div className="flex items-center gap-1">{rankBadge(globalIdx)}</div>
                          </div>
                          {b.active_alerts > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                              <span className="text-[9px] text-destructive font-semibold">
                                {b.active_alerts} alert{b.active_alerts !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[13px] font-bold text-foreground tabular-nums">
                              {fmtCurrency(b.sales, currency)}
                            </span>
                            <div className="w-16 h-1 rounded-full bg-muted/40 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${salesPct}%`,
                                  backgroundColor: paletteColor(globalIdx >= 0 ? globalIdx : 0),
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <span className="text-[13px] font-bold text-foreground tabular-nums">
                            {b.orders.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <span
                            className={cn(
                              "text-[13px] font-bold tabular-nums",
                              b.gross_margin_pct >= 65
                                ? "text-success"
                                : b.gross_margin_pct >= 40
                                  ? "text-foreground"
                                  : "text-destructive",
                            )}
                          >
                            {fmtPct(b.gross_margin_pct)}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <span
                            className={cn(
                              "text-[13px] font-bold tabular-nums",
                              b.food_cost_pct <= 30
                                ? "text-success"
                                : b.food_cost_pct <= 40
                                  ? "text-foreground"
                                  : "text-warning",
                            )}
                          >
                            {fmtPct(b.food_cost_pct)}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          {b.active_alerts > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-destructive/30 text-destructive bg-destructive/5 font-bold px-2"
                            >
                              {b.active_alerts}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Comparison floating bar ─────────────────────────────────────── */}
      {isComparing && (
        <div className="sticky bottom-4 z-40 flex items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-lg backdrop-blur-md px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {compareBranches.slice(0, 4).map((b, i) => (
                <div
                  key={b.branch}
                  className="flex items-center gap-1.5 bg-background/60 rounded-md px-2 py-1 border border-border/30"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: paletteColor(ranked.findIndex((r) => r.branch === b.branch)),
                    }}
                  />
                  <span className="text-[10px] font-bold text-foreground">
                    {b.branch.replace(" Branch", "")}
                  </span>
                </div>
              ))}
              {compareBranches.length > 4 && (
                <span className="text-[10px] text-muted-foreground font-semibold">
                  +{compareBranches.length - 4} more
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Comparing {compareIds.size} branches
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] h-8 gap-1.5 border-border/50"
              onClick={() => {
                setChartTab("radar");
                setShowComparison(true);
              }}
            >
              <RadarIcon className="h-3.5 w-3.5" />
              Compare
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] h-8 text-muted-foreground"
              onClick={() => setCompareIds(new Set())}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── Side Sheet: Branch Detail ───────────────────────────────────── */}
      <Sheet open={!!selectedBranch} onOpenChange={() => setSelectedBranch(null)}>
        <SheetContent className="w-full sm:max-w-lg border-border bg-card p-0">
          {selectedBranch &&
            (() => {
              const b = selectedBranch;
              const salesPct = totalSales > 0 ? (b.sales / totalSales) * 100 : 0;
              const rank = ranked.findIndex((r) => r.branch === b.branch);

              return (
                <div className="flex flex-col h-full">
                  <SheetHeader className="border-b border-border/40 px-6 pt-5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <SheetTitle className="text-[16px] font-bold text-foreground">
                          {b.branch}
                        </SheetTitle>
                        <SheetDescription className="text-[11px]">
                          Rank #{rank + 1} of {ranked.length} &middot; {salesPct.toFixed(1)}%
                          revenue share
                        </SheetDescription>
                      </div>
                    </div>
                    <SheetClose />
                  </SheetHeader>

                  <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-5">
                      {/* Gauge + key metrics */}
                      <div className="flex items-center gap-5">
                        <MarginGauge value={b.gross_margin_pct} size={80} />
                        <div className="flex-1 grid grid-cols-2 gap-2.5">
                          {[
                            {
                              label: "Revenue",
                              value: fmtCurrency(b.sales, currency),
                              icon: DollarSign,
                              color: "text-primary",
                            },
                            {
                              label: "Orders",
                              value: b.orders.toLocaleString(),
                              icon: ShoppingCart,
                              color: "text-info",
                            },
                            {
                              label: "Gross Margin",
                              value: fmtPct(b.gross_margin_pct),
                              icon: Percent,
                              color: "text-success",
                            },
                            {
                              label: "Food Cost",
                              value: fmtPct(b.food_cost_pct),
                              icon: Target,
                              color: "text-warning",
                            },
                          ].map((m) => (
                            <div
                              key={m.label}
                              className="rounded-lg border border-border/30 bg-background/50 px-3 py-2.5"
                            >
                              <p className="text-[9px] text-muted-foreground flex items-center gap-1 mb-0.5">
                                <m.icon className={cn("h-3 w-3", m.color)} />
                                {m.label}
                              </p>
                              <p className="text-[15px] font-bold text-foreground tabular-nums">
                                {m.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Revenue share bar */}
                      <div className="rounded-lg border border-border/30 bg-background/50 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Revenue Share
                          </p>
                          <p className="text-[13px] font-bold text-primary tabular-nums">
                            {salesPct.toFixed(1)}%
                          </p>
                        </div>
                        <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-all duration-700"
                            style={{ width: `${salesPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Comparison metrics against averages */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          vs Average
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              label: "Revenue vs Avg",
                              value: b.sales - totalSales / items.length,
                              fmt: (v: number) => fmtCurrency(Math.abs(v), currency),
                              dir: b.sales >= totalSales / items.length ? "up" : "down",
                              tone:
                                b.sales >= totalSales / items.length ? "success" : "destructive",
                            },
                            {
                              label: "Orders vs Avg",
                              value: b.orders - totalOrders / items.length,
                              fmt: (v: number) => Math.abs(v).toLocaleString(),
                              dir: b.orders >= totalOrders / items.length ? "up" : "down",
                              tone:
                                b.orders >= totalOrders / items.length ? "success" : "destructive",
                            },
                            {
                              label: "Margin vs Avg",
                              value: b.gross_margin_pct - avgMargin,
                              fmt: (v: number) => `${Math.abs(v).toFixed(1)}pp`,
                              dir: b.gross_margin_pct >= avgMargin ? "up" : "down",
                              tone: b.gross_margin_pct >= avgMargin ? "success" : "destructive",
                            },
                            {
                              label: "Food Cost vs Avg",
                              value: avgFoodCost - b.food_cost_pct,
                              fmt: (v: number) => `${Math.abs(v).toFixed(1)}pp`,
                              dir: b.food_cost_pct <= avgFoodCost ? "up" : "down",
                              tone: b.food_cost_pct <= avgFoodCost ? "success" : "destructive",
                            },
                          ].map((m) => (
                            <div
                              key={m.label}
                              className="rounded-lg border border-border/30 bg-background/50 px-3 py-2.5"
                            >
                              <p className="text-[9px] text-muted-foreground">{m.label}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {m.dir === "up" ? (
                                  <ArrowUp
                                    className={cn(
                                      "h-3 w-3",
                                      m.tone === "success" ? "text-success" : "text-destructive",
                                    )}
                                  />
                                ) : (
                                  <ArrowDown
                                    className={cn(
                                      "h-3 w-3",
                                      m.tone === "success" ? "text-destructive" : "text-success",
                                    )}
                                  />
                                )}
                                <span
                                  className={cn(
                                    "text-[13px] font-bold tabular-nums",
                                    m.tone === "success" ? "text-success" : "text-destructive",
                                  )}
                                >
                                  {m.fmt(m.value)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Alerts */}
                      {b.active_alerts > 0 && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/[0.05] px-4 py-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-destructive">
                              {b.active_alerts} Active Alert{b.active_alerts !== 1 ? "s" : ""}
                            </p>
                            <p className="text-[10px] text-destructive/70">
                              Requires immediate attention
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] gap-1.5"
                          onClick={() => {
                            toggleCompare(b.branch);
                          }}
                        >
                          {compareIds.has(b.branch) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          {compareIds.has(b.branch) ? "Remove from compare" : "Add to compare"}
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
