import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  DollarSign,
  AlertTriangle,
  Percent,
  RefreshCw,
  TrendingUp,
  Package,
  ShoppingCart,
  Sparkles,
  Activity,
  ChevronRight,
  Bell,
  Check,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AreaTrend,
  fmtCurrency,
  fmtPct,
  METRIC_CONFIG,
  DASHBOARD_LIVE_QUERY,
  paletteColor,
  type Delta,
  type Tone,
  type MetricKey,
} from "@/components/dashboard/shared";
import { dashboardService } from "@/services/dashboardService";
import { ChannelBreakdown } from "@/components/dashboard/ChannelBreakdown";
import { ItemAvatar } from "@/components/dashboard/ItemAvatar";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { useDateRange, rangeToPeriod } from "@/contexts/DateRangeContext";
import { AllLocationsOverview } from "@/components/dashboard/AllLocationsOverview";
import { SingleLocationView } from "@/components/dashboard/SingleLocationView";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";

export const Route = createFileRoute("/dashboard/")({
  component: OverviewPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sparkFromYear(series: number[] | undefined, n = 8): number[] {
  if (!series?.length) return [];
  const slice = series.filter((v) => v !== 0).slice(-n);
  return slice.length >= 2 ? slice : series.slice(-n);
}

function deltaPct(v: number | null | undefined, goodDir: "up" | "down" = "up"): Delta | undefined {
  if (v == null) return undefined;
  const direction = v > 0 ? "up" : v < 0 ? "down" : "neutral";
  const isGood =
    direction === "neutral"
      ? true
      : (direction === "up" && goodDir === "up") || (direction === "down" && goodDir === "down");
  return {
    value: `${Math.abs(v).toFixed(1)}%`,
    direction,
    tone: direction === "neutral" ? "neutral" : isGood ? "success" : "destructive",
  };
}

function deltaPp(v: number | null | undefined, goodDir: "up" | "down" = "up"): Delta | undefined {
  if (v == null) return undefined;
  const direction = v > 0 ? "up" : v < 0 ? "down" : "neutral";
  const isGood =
    direction === "neutral"
      ? true
      : (direction === "up" && goodDir === "up") || (direction === "down" && goodDir === "down");
  return {
    value: `${Math.abs(v).toFixed(1)}pp`,
    direction,
    tone: direction === "neutral" ? "neutral" : isGood ? "success" : "destructive",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCardWithSparkline({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  delta,
  sub,
  footnote,
  sparklineData = [],
  active,
  onClick,
  to,
  index,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: Tone;
  delta?: Delta;
  sub?: { text: string; tone?: Tone; dot?: boolean };
  footnote?: string;
  sparklineData?: number[];
  active?: boolean;
  onClick?: () => void;
  to?: string;
  index?: number;
}) {
  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
  const { count } = useCounterAnimation(numericValue, { duration: 1200, decimals: value.includes(".") ? 1 : 0 });
  
  const displayValue = value.includes("%") 
    ? `${count.toFixed(1)}%`
    : value.includes("k")
    ? `${(count / 1000).toFixed(1)}k`
    : value.includes("M")
    ? `${(count / 1000000).toFixed(2)}M`
    : count.toLocaleString();
  const toneBgs: Record<Tone, string> = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    neutral: "bg-muted text-muted-foreground",
  };

  const cardContent = (
    <Card className={cn(
      "border-border/40 bg-card card-interactive cursor-pointer",
      `animate-fade-in-up stagger-${(index || 1) + 1}`
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneBgs[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-[18px] font-black tracking-tight text-foreground tabular-nums">
            {displayValue}
          </p>
        </div>
        {sub ? (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            {sub.dot && (
              <span
                className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                  sub.tone === "success"
                    ? "bg-success"
                    : sub.tone === "destructive"
                      ? "bg-destructive"
                      : "bg-warning"
                }`}
              />
            )}
            <span
              className={
                sub.tone === "success"
                  ? "text-success"
                  : sub.tone === "destructive"
                    ? "text-destructive"
                    : sub.tone === "warning"
                      ? "text-warning"
                      : "text-muted-foreground"
              }
            >
              {sub.text}
            </span>
          </div>
        ) : footnote ? (
          <p className="text-[10px] text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (to) {
    return <Link to={to as any}>{cardContent}</Link>;
  }
  return cardContent;
}

// ── Menu Wastage Analysis ─────────────────────────────────────────────────────

const WASTAGE_DATA = [
  { name: "Chicken Biryani", waste: 18.4 },
  { name: "Veg Fried Rice", waste: 15.2 },
  { name: "Paneer Butter Masala", waste: 12.8 },
  { name: "Pizza Margherita", waste: 10.5 },
  { name: "Hakka Noodles", waste: 8.7 },
  { name: "Butter Chicken", waste: 7.9 },
  { name: "Veg Burger", waste: 6.1 },
  { name: "Pasta Alfredo", waste: 4.8 },
];

const WASTAGE_TOTAL = WASTAGE_DATA.reduce((s, d) => s + d.waste, 0);

function getWasteColor(value: number) {
  if (value >= 12) return "url(#waste-high)";
  if (value >= 8) return "url(#waste-mid)";
  return "url(#waste-low)";
}

function getWasteLevel(value: number): { label: string; color: string } {
  if (value >= 12) return { label: "High", color: "var(--color-destructive)" };
  if (value >= 8) return { label: "Medium", color: "var(--color-warning)" };
  return { label: "Low", color: "var(--color-success)" };
}

function MenuWastageChart() {
  const maxWaste = Math.max(...WASTAGE_DATA.map((d) => d.waste));

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const level = getWasteLevel(d.waste);
    return (
      <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-[11px] min-w-[140px]">
        <p className="font-bold text-foreground text-[12px] mb-1">{d.name}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Wastage</span>
          <span className="font-bold text-foreground tabular-nums">{d.waste} kg</span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <span className="text-muted-foreground">Level</span>
          <span style={{ color: level.color }} className="font-bold">
            {level.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={WASTAGE_DATA}
        layout="vertical"
        margin={{ top: 8, right: 60, bottom: 8, left: 8 }}
        barCategoryGap="18%"
      >
        <defs>
          <linearGradient id="waste-high" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-destructive-dark)" />
            <stop offset="100%" stopColor="var(--color-destructive)" />
          </linearGradient>
          <linearGradient id="waste-mid" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-warning-dark)" />
            <stop offset="100%" stopColor="var(--color-warning)" />
          </linearGradient>
          <linearGradient id="waste-low" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-success-dark)" />
            <stop offset="100%" stopColor="var(--color-success)" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-sidebar-border)"
          strokeOpacity={0.3}
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, Math.ceil(maxWaste + 2)]}
          tick={{ fontSize: 10, fill: "var(--color-sidebar-foreground)", opacity: 0.55 }}
          tickCount={5}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 10, fill: "var(--color-sidebar-foreground)", opacity: 0.7 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={renderTooltip} cursor={{ fill: "var(--color-muted)", opacity: 0.1 }} />
        <Bar
          dataKey="waste"
          radius={[0, 6, 6, 0]}
          maxBarSize={24}
          animationDuration={1000}
          animationEasing="ease-out"
          label={{
            position: "right",
            fontSize: 10,
            fill: "var(--color-sidebar-foreground)",
            fontWeight: 700,
            formatter: (v: number) => `${v} kg`,
          }}
        >
          {WASTAGE_DATA.map((d, i) => (
            <Cell key={i} fill={getWasteColor(d.waste)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function OverviewPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("sales");
  const [isReconOpen, setIsReconOpen] = useState(false);
  const queryClient = useQueryClient();
  const { branch } = useBranchFilter();
  const { range } = useDateRange();
  const period = rangeToPeriod(range);
  const reducedMotion = useReducedMotion();

  const metricsQuery = useQuery({
    queryKey: ["dashboard", "metrics", period, branch],
    queryFn: () => dashboardService.getMetrics(period, branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  const trendPeriod =
    period === "today" ? "week" : period === "year" ? "year" : (period as "week" | "month");

  const trendQuery = useQuery({
    queryKey: ["dashboard", "metrics-trend", trendPeriod, branch],
    queryFn: () => dashboardService.getMetricsTrend(trendPeriod, branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  const yearTrendQuery = useQuery({
    queryKey: ["dashboard", "metrics-trend", "year", branch],
    queryFn: () => dashboardService.getMetricsTrend("year", branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  const stockQuery = useQuery({
    queryKey: ["dashboard", "stock-summary", branch],
    queryFn: () => dashboardService.getStockSummary(branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  const channelQuery = useQuery({
    queryKey: ["dashboard", "channels", period, branch],
    queryFn: () => dashboardService.getChannelBreakdown(period, branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  const reconciliationQuery = useQuery({
    queryKey: ["dashboard", "reconciliation", period, branch],
    queryFn: () => dashboardService.getReconciliation(period, branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  const stockItemsQuery = useQuery({
    queryKey: ["dashboard", "stock-items", branch],
    queryFn: () => dashboardService.getStockItems(branch, 6),
    ...DASHBOARD_LIVE_QUERY,
  });

  const topItemsQuery = useQuery({
    queryKey: ["dashboard", "top-items", period, branch],
    queryFn: () => dashboardService.getTopItems(period, branch, 5),
    ...DASHBOARD_LIVE_QUERY,
  });

  const branchSummaryQuery = useQuery({
    queryKey: ["dashboard", "branch-summary", period],
    queryFn: () => dashboardService.getBranchSummary(period),
    ...DASHBOARD_LIVE_QUERY,
  });

  const m = metricsQuery.data;
  const yearTrend = yearTrendQuery.data;
  const trendData = trendQuery.data;
  const alertsCount = m?.active_alerts ?? 0;
  const criticalCount = m?.critical_alerts ?? 0;
  const stockAtRisk = Math.max(
    0,
    (stockQuery.data?.total_items ?? 0) - (stockQuery.data?.items_in_stock ?? 0),
  );

  const isLiveFetching = metricsQuery.isFetching || trendQuery.isFetching;
  const hasCriticalError = metricsQuery.isError || trendQuery.isError;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("Dashboard refreshed");
  };

  // Active metric series for AreaTrend (original chart)
  const METRIC_KEYS: MetricKey[] = ["sales", "orders", "food_cost", "margin"];
  const activeSeries = (() => {
    const trend = trendQuery.data;
    if (!trend?.labels.length)
      return {
        values: [] as number[],
        compareValues: [] as number[],
        label: METRIC_CONFIG[activeMetric].label,
      };
    const map = {
      sales: trend.sales,
      orders: trend.orders,
      food_cost: trend.food_cost_pct,
      margin: trend.margin_pct,
    };
    const prevMap = {
      sales: trend.prev_sales ?? [],
      orders: trend.prev_orders ?? [],
      food_cost: trend.prev_food_cost_pct ?? [],
      margin: trend.prev_margin_pct ?? [],
    };
    return {
      values: map[activeMetric],
      compareValues: prevMap[activeMetric],
      label: METRIC_CONFIG[activeMetric].label,
    };
  })();

  // Avg order value
  const avgOrder = m && m.orders > 0 ? m.total_sales / m.orders : 0;

  // KPI cards
  const kpis = m
    ? [
        {
          label: "Total Sales",
          value: fmtCurrency(m.total_sales, m.currency),
          icon: DollarSign,
          tone: "primary" as Tone,
          delta: deltaPct(m.total_sales_delta_pct, "up"),
          footnote: m.compare_label,
          sparklineData: sparkFromYear(yearTrend?.sales),
          to: "/dashboard/pos",
          index: 0,
        },
        {
          label: "Orders",
          value: m.orders.toLocaleString(),
          icon: ShoppingCart,
          tone: "info" as Tone,
          delta: deltaPct(m.orders_delta_pct, "up"),
          footnote: `this ${period}`,
          sparklineData: sparkFromYear(yearTrend?.orders),
          to: "/dashboard/pos",
          index: 1,
        },
        {
          label: "Avg Order Value",
          value: fmtCurrency(avgOrder, m.currency),
          icon: Sparkles,
          tone: "primary" as Tone,
          footnote: `per order this ${period}`,
          index: 2,
        },
        {
          label: "Food Cost %",
          value: fmtPct(m.food_cost_pct),
          icon: Percent,
          tone: "warning" as Tone,
          delta: deltaPp(m.food_cost_pp_delta, "down"),
          footnote: "vs prior period",
          sparklineData: sparkFromYear(yearTrend?.food_cost_pct),
          to: "/dashboard/tally",
          index: 3,
        },
        {
          label: "Gross Margin",
          value: fmtPct(m.gross_margin_pct),
          icon: TrendingUp,
          tone: "success" as Tone,
          delta: deltaPp(m.gross_margin_pp_delta, "up"),
          footnote: "vs prior period",
          sparklineData: sparkFromYear(yearTrend?.margin_pct),
          to: "/dashboard/reports",
          index: 4,
        },
        {
          label: "Active Alerts",
          value: alertsCount.toLocaleString(),
          icon: Bell,
          tone: (alertsCount > 0 ? "destructive" : "success") as Tone,
          sub: {
            text: `+${criticalCount} vs yesterday`,
            tone: criticalCount > 0 ? ("destructive" as Tone) : ("neutral" as Tone),
            dot: true,
          },
          to: "/dashboard/inventory",
          index: 5,
        },
        {
          label: "Stock at Risk",
          value: stockAtRisk.toLocaleString(),
          icon: Package,
          tone: "warning" as Tone,
          sub: {
            text: `${stockQuery.data?.items_in_stock ?? 0}/${stockQuery.data?.total_items ?? 0} in stock`,
            tone: "info" as Tone,
            dot: true,
          },
          to: "/dashboard/inventory",
          index: 6,
        },
      ]
    : [];

  // Reconciliation values — from real API
  const recon = reconciliationQuery.data;
  const currency = recon?.currency ?? m?.currency ?? "AED";

  return (
    <div className="space-y-5 animate-fade-in-up relative">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">Overview</h2>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-success">
              Live
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Key metrics and performance at a glance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isLiveFetching}
            className="group/refresh h-9 gap-1.5 text-[12px]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 transition-transform ${isLiveFetching ? "animate-spin" : "group-hover/refresh:rotate-45"}`}
            />{" "}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {hasCriticalError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[12px]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-bold text-destructive">Could not load dashboard data</p>
            <p className="text-muted-foreground mt-0.5">
              The server may be unavailable. Try refreshing or check that the backend is running.
            </p>
          </div>
        </div>
      )}

      {/* ── Multi-location section — crossfades when switching locations ───── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={branch}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {branch === "all" ? <AllLocationsOverview /> : <SingleLocationView />}
        </motion.div>
      </AnimatePresence>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {metricsQuery.isLoading || !m
          ? Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="border-border/40 bg-card animate-fade-in-up">
                <CardContent className="p-4 space-y-3">
                  <div className="h-8 w-8 animate-pulse rounded-xl bg-secondary" />
                  <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                  <div className="h-5 w-16 animate-pulse rounded bg-secondary" />
                  <div className="h-2 w-full animate-pulse rounded bg-secondary" />
                </CardContent>
              </Card>
            ))
          : kpis.map((k) => <KpiCardWithSparkline key={k.label} {...k} />)}
      </div>

      {/* ── Performance Row ─────────────────────────────────────────────────── */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Performance Trends — original AreaTrend with metric selector (2 cols) */}
        <Card className="lg:col-span-2 flex flex-col border border-border/60 bg-card card-interactive shadow-sm animate-fade-in-up stagger-4">
          <CardHeader className="border-b border-border/40 px-5 pb-2 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-[13px] font-bold text-foreground">
                    Performance Trends
                  </CardTitle>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Trailing metrics this {period}
                </p>
                {activeSeries.compareValues.length > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-0.5 w-4 rounded-full"
                        style={{ backgroundColor: METRIC_CONFIG[activeMetric].chartColor }}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {trendQuery.data?.current_label ?? "This Period"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-0 w-4 border-t-2 border-dashed border-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {trendQuery.data?.previous_label ?? "Last Period"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {/* Metric selector tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/70 p-0.5 text-[11px]">
                {METRIC_KEYS.map((key) => {
                  const cfg = METRIC_CONFIG[key];
                  const isActive = activeMetric === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveMetric(key)}
                      className={`rounded px-2.5 py-1 font-semibold transition-all duration-200 ${
                        isActive
                          ? `${cfg.activeTab} shadow-sm`
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {cfg.tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex-1 flex flex-col min-h-0">
            <AreaTrend
              data={activeSeries.values}
              labels={trendQuery.data?.labels ?? []}
              loading={trendQuery.isLoading}
              metricName={activeSeries.label}
              metricKey={activeMetric}
              height={300}
              period={period}
              compareData={activeSeries.compareValues}
              currentLabel={trendQuery.data?.current_label ?? "This Period"}
              previousLabel={trendQuery.data?.previous_label ?? "Last Period"}
            />
          </CardContent>
        </Card>

        {/* Menu Wastage Analysis */}
        <Card className="flex flex-col border border-sidebar-border/60 bg-sidebar text-sidebar-foreground card-interactive shadow-md relative overflow-hidden animate-fade-in-up stagger-5">
          <CardHeader className="border-b border-sidebar-border/50 px-4 pb-3 pt-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="relative h-2 w-2 rounded-full bg-sidebar-primary shadow-[0_0_6px_var(--color-sidebar-primary)]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-sidebar-primary opacity-40" />
                  </span>
                  <CardTitle className="text-[13px] font-bold text-sidebar-foreground">
                    Menu Wastage Analysis
                  </CardTitle>
                </div>
                <p className="mt-1 ml-3.5 text-[10px] text-sidebar-foreground/60">
                  Top dishes with the highest ingredient wastage
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-[9px] font-semibold">
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-destructive)" }}
                  />{" "}
                  High Waste
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-warning)" }}
                  />{" "}
                  Medium Waste
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-success)" }}
                  />{" "}
                  Low Waste
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-3">
            <div className="w-full min-h-[280px]">
              <MenuWastageChart />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-sidebar-border/50 px-3 py-2.5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-destructive/8 via-warning/5 to-success/8 opacity-60" />
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-[11px] font-medium text-sidebar-foreground/70">
                  Total Menu Waste
                </span>
                <span className="text-[13px] font-black tabular-nums text-sidebar-foreground">
                  {WASTAGE_TOTAL.toFixed(1)} kg
                </span>
              </div>
              <span className="text-[10px] text-sidebar-foreground/50 relative z-10">
                Updated: Today
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
        {/* POS vs Tally Reconciliation */}
        <Card
          className="flex flex-col cursor-pointer border border-border/60 bg-card card-interactive shadow-sm animate-fade-in-up stagger-6"
          onClick={() => {
            if (recon) setIsReconOpen(true);
          }}
        >
          <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-[12px] font-bold text-foreground">
                POS vs Tally Reconciliation
              </CardTitle>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground pl-0">
              Click to view full detail
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex-1 flex flex-col gap-3">
            {reconciliationQuery.isLoading ? (
              <div className="space-y-2 flex-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            ) : recon ? (
              <>
                {/* Revenue vs Cost ring */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0 w-[72px] h-[72px]">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <circle
                        cx="36"
                        cy="36"
                        r="28"
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="8"
                      />
                      {/* Margin arc (brand) */}
                      <circle
                        cx="36"
                        cy="36"
                        r="28"
                        fill="none"
                        stroke="var(--color-success)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(Math.max(0, recon.margin_pct) / 100) * 175.9} 175.9`}
                        transform="rotate(-90 36 36)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-black text-foreground tabular-nums">
                        {recon.margin_pct}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">POS Revenue</p>
                      <p className="text-[14px] font-black text-success tabular-nums">
                        {fmtCurrency(recon.pos_revenue, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Tally Purchases
                      </p>
                      <p className="text-[14px] font-black text-destructive tabular-nums">
                        {fmtCurrency(recon.tally_purchases, currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-success/20 bg-success-soft/20 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Gross Margin
                    </p>
                    <p
                      className={`text-[13px] font-bold tabular-nums ${recon.gross_margin >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {fmtCurrency(recon.gross_margin, currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-warning/20 bg-warning-soft/20 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Food Cost
                    </p>
                    <p
                      className={`text-[13px] font-bold tabular-nums ${recon.food_cost_pct > 35 ? "text-destructive" : recon.food_cost_pct > 30 ? "text-warning" : "text-success"}`}
                    >
                      {recon.food_cost_pct}%
                    </p>
                  </div>
                </div>

                {/* Branch coverage */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Branch Coverage
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="flex h-2 w-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">Both systems:</span>
                    <span className="font-bold text-foreground">{recon.branches_both.length}</span>
                  </div>
                  {recon.branches_only_pos.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="flex h-2 w-2 rounded-full bg-warning" />
                      <span className="text-muted-foreground">POS only:</span>
                      <span className="font-semibold text-warning">
                        {recon.branches_only_pos.join(", ")}
                      </span>
                    </div>
                  )}
                  {recon.branches_only_tally.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="flex h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">Tally only:</span>
                      <span className="font-semibold text-destructive">
                        {recon.branches_only_tally.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alert for mismatches */}
                {(recon.branches_only_pos.length > 0 || recon.branches_only_tally.length > 0) && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-warning/10 p-2 border border-warning/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                    <p className="text-[10px] text-warning font-medium">
                      {recon.branches_only_tally.length > 0
                        ? `${recon.branches_only_tally.length} branch(es) have Tally data but no POS sales`
                        : `${recon.branches_only_pos.length} branch(es) have POS sales but no Tally entries`}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                  <span>{recon.pos_orders} POS orders</span>
                  <span>{recon.tally_voucher_count} Tally vouchers</span>
                </div>
              </>
            ) : (
              <EmptyState
                icon={Activity}
                title="No data available"
                description="Reconciliation data will appear here once synced"
              />
            )}
          </CardContent>
        </Card>

        {/* Sales by Channel */}
        <div className="animate-fade-in-up stagger-7">
          <ChannelBreakdown period={period} />
        </div>

        {/* Stock at Risk — real tally_vouchers data */}
        <Card className="flex flex-col border border-border/60 bg-card card-interactive shadow-sm animate-fade-in-up stagger-8">
          <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[12px] font-bold text-foreground">
                  Stock at Risk
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-warning/30 bg-warning-soft/30 text-[9px] font-bold text-warning"
              >
                Live · Tally
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 flex flex-col">
            {stockItemsQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            ) : !stockItemsQuery.data?.items.length ? (
              <EmptyState
                icon={Package}
                title="No stock data yet"
                description="Sync your Tally inventory to see items at risk"
              />
            ) : (
              <>
                <div className="text-[10px] font-semibold text-muted-foreground grid grid-cols-2 pb-1 border-b border-border/40 mb-1">
                  <span>Item</span>
                  <span className="text-right">Qty</span>
                </div>
                <div className="flex-1 space-y-0">
                  {stockItemsQuery.data.items.map((row) => (
                    <div
                      key={row.item}
                      className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0"
                    >
                      <ItemAvatar name={row.item} size="sm" variant="photo" />
                      <span className="text-[10px] font-medium text-foreground truncate flex-1 min-w-0">
                        {row.item}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold tabular-nums ${row.status === "critical" ? "text-destructive" : row.status === "low" ? "text-warning" : "text-foreground"}`}
                        >
                          {row.current_stock.toFixed(1)}
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${row.status === "critical" ? "bg-destructive animate-pulse" : row.status === "low" ? "bg-warning" : "bg-success"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
                  <span className="text-[10px] text-warning font-bold">
                    {stockItemsQuery.data.items.filter((r) => r.status !== "ok").length} items at
                    risk
                  </span>
                  <span className="text-[10px] text-muted-foreground">sorted by stock level</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Branch Comparison — real /api/dashboard/branch-summary */}
        <Card className="flex flex-col border border-border/60 bg-card card-interactive shadow-sm animate-fade-in-up stagger-8">
          <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
            <div className="flex items-center justify-between gap-1.5">
              <CardTitle className="text-[12px] font-bold text-foreground">
                Branch Comparison
              </CardTitle>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-[9px] font-bold text-primary"
              >
                Live · POS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 flex flex-col">
            {branchSummaryQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-7 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            ) : !branchSummaryQuery.data?.items.length ? (
              <EmptyState
                icon={Building2}
                title="No branch data"
                description="Branch performance data will appear here"
              />
            ) : (
              <>
                <div className="text-[10px] font-semibold text-muted-foreground grid grid-cols-3 pb-1 border-b border-border/40 mb-1">
                  <span className="col-span-2">Branch</span>
                  <span className="text-right">Margin</span>
                </div>
                <div className="flex-1 space-y-0">
                  {branchSummaryQuery.data.items.slice(0, 5).map((b, idx) => {
                    const marginOk = b.gross_margin_pct >= 65;
                    const marginWarn = b.gross_margin_pct >= 50;
                    const marginCls = marginOk
                      ? "text-success"
                      : marginWarn
                        ? "text-warning"
                        : "text-destructive";
                    const barColor = marginOk
                      ? "var(--color-success)"
                      : marginWarn
                        ? "var(--color-warning)"
                        : "var(--color-destructive)";
                    return (
                      <div
                        key={b.branch}
                        className="grid grid-cols-3 items-center border-b border-border/20 py-1.5 last:border-0"
                      >
                        <div className="col-span-2 flex min-w-0 items-center gap-2 pr-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: paletteColor(idx) }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold text-foreground">
                              {b.branch}
                            </p>
                            <p className="text-[10px] tabular-nums text-muted-foreground">
                              {(b.sales / 1000).toFixed(0)}k · {b.orders} orders
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className={`text-[10px] font-bold tabular-nums ${marginCls}`}>
                            {b.gross_margin_pct}%
                          </span>
                          <span
                            className="h-5 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <a
                  href="/dashboard/branches"
                  className="mt-2 text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                >
                  View full comparison <ChevronRight className="h-3 w-3" />
                </a>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Menu Items — real pos_sales aggregation */}
        <Card className="flex flex-col border border-border/60 bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[12px] font-bold text-foreground">
                Top Menu Items
              </CardTitle>
              <Badge
                variant="outline"
                className="border-info/30 bg-info-soft/30 text-[9px] font-bold text-info"
              >
                Live · POS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 flex flex-col">
            {topItemsQuery.isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            ) : !topItemsQuery.data?.items.length ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center">
                <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-[11.5px] font-medium text-muted-foreground">No sales data yet</p>
                <p className="text-[10px] text-muted-foreground/70">POS data will appear here</p>
              </div>
            ) : (
              <div className="flex-1 space-y-1.5">
                {topItemsQuery.data.items.map((item, idx) => (
                  <div
                    key={item.item}
                    className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-secondary/40"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-black tabular-nums text-primary-foreground"
                      style={{ backgroundColor: paletteColor(idx) }}
                    >
                      {idx + 1}
                    </span>
                    <ItemAvatar name={item.item} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-foreground">
                          {item.item}
                        </span>
                        <span className="shrink-0 text-[10.5px] font-bold tabular-nums text-foreground">
                          AED {(item.revenue / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.pct}%`,
                              backgroundColor: paletteColor(idx),
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {item.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation detail dialog */}
      <Dialog open={isReconOpen} onOpenChange={setIsReconOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-card shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-extrabold text-foreground">
              POS vs Tally Reconciliation
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Revenue, cost of goods, margins, and cross-system alignment for the selected period
            </DialogDescription>
          </DialogHeader>

          {recon &&
            (() => {
              const dailyData = recon.daily.map((d) => ({
                date: d.date.slice(5), // "MM-DD"
                fullDate: d.date,
                revenue: Math.round(d.pos_revenue * 100) / 100,
                cost: Math.round(d.tally_cost * 100) / 100,
              }));
              const daysWithBoth = recon.daily.filter(
                (d) => d.pos_revenue !== 0 && d.tally_cost !== 0,
              ).length;
              const daysOnlyPos = recon.daily.filter(
                (d) => d.pos_revenue !== 0 && d.tally_cost === 0,
              ).length;
              const daysOnlyTally = recon.daily.filter(
                (d) => d.pos_revenue === 0 && d.tally_cost !== 0,
              ).length;

              return (
                <div className="space-y-5 mt-2">
                  {/* P&L Summary */}
                  <div className="rounded-xl border border-border bg-secondary/20 p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
                      Profit & Loss Summary
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-foreground font-medium">POS Revenue</span>
                        <span className="text-[13px] font-bold text-success tabular-nums">
                          {fmtCurrency(recon.pos_revenue, currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-foreground font-medium">
                          Tally Purchases (COGS)
                        </span>
                        <span className="text-[13px] font-bold text-destructive tabular-nums">
                          - {fmtCurrency(recon.tally_purchases, currency)}
                        </span>
                      </div>
                      {recon.purchase_returns !== 0 && (
                        <div className="flex items-center justify-between pl-4">
                          <span className="text-[11px] text-muted-foreground">
                            Purchase Returns
                          </span>
                          <span className="text-[12px] font-semibold text-success tabular-nums">
                            + {fmtCurrency(Math.abs(recon.purchase_returns), currency)}
                          </span>
                        </div>
                      )}
                      {recon.sales_returns !== 0 && (
                        <div className="flex items-center justify-between pl-4">
                          <span className="text-[11px] text-muted-foreground">Sales Returns</span>
                          <span className="text-[12px] font-semibold text-warning tabular-nums">
                            {fmtCurrency(recon.sales_returns, currency)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-border/60 pt-2 mt-1 flex items-center justify-between">
                        <span className="text-[12px] text-foreground font-medium">
                          Net Cost of Goods
                        </span>
                        <span className="text-[13px] font-bold text-foreground tabular-nums">
                          {fmtCurrency(recon.net_cost, currency)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 mt-1 flex items-center justify-between">
                        <span className="text-[13px] text-foreground font-bold">Gross Margin</span>
                        <span
                          className={`text-[14px] font-black tabular-nums ${recon.gross_margin >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {fmtCurrency(recon.gross_margin, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KPI tiles */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-xl border border-success/25 bg-success-soft/20 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Margin %
                      </p>
                      <p
                        className={`text-[18px] font-black tabular-nums mt-1 ${recon.margin_pct >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {recon.margin_pct}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-warning/25 bg-warning-soft/20 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Food Cost %
                      </p>
                      <p
                        className={`text-[18px] font-black tabular-nums mt-1 ${recon.food_cost_pct > 35 ? "text-destructive" : recon.food_cost_pct > 30 ? "text-warning" : "text-success"}`}
                      >
                        {recon.food_cost_pct}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-info/25 bg-info-soft/20 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        POS Orders
                      </p>
                      <p className="text-[18px] font-black tabular-nums text-foreground mt-1">
                        {recon.pos_orders}
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Tally Vouchers
                      </p>
                      <p className="text-[18px] font-black tabular-nums text-foreground mt-1">
                        {recon.tally_voucher_count}
                      </p>
                    </div>
                  </div>

                  {/* Daily Revenue vs Cost chart */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold text-foreground mb-1">
                      Daily Revenue vs Cost of Goods
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      POS revenue (purple) compared against Tally purchase cost (red) per day
                    </p>
                    <div className="h-[220px] w-full">
                      {dailyData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
                          No daily data
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dailyData}
                            margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="deep-revenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                                <stop offset="45%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={1} />
                              </linearGradient>
                              <linearGradient id="deep-cost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.38} />
                                <stop offset="45%" stopColor="var(--color-destructive)" stopOpacity={0.65} />
                                <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0.92} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                              opacity={0.3}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              stroke="var(--color-muted-foreground)"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              interval={Math.max(0, Math.floor(dailyData.length / 10))}
                            />
                            <YAxis
                              stroke="var(--color-muted-foreground)"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) =>
                                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v))
                              }
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]?.payload;
                                return (
                                  <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[11px] shadow-lg">
                                    <p className="font-semibold text-muted-foreground mb-1">
                                      {d.fullDate}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full bg-primary" />
                                      <span className="text-muted-foreground">Revenue:</span>
                                      <span className="font-bold text-foreground tabular-nums">
                                        {fmtCurrency(d.revenue, currency)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="h-2 w-2 rounded-full bg-destructive" />
                                      <span className="text-muted-foreground">Cost:</span>
                                      <span className="font-bold text-foreground tabular-nums">
                                        {fmtCurrency(d.cost, currency)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Legend
                              iconSize={7}
                              formatter={(value) => (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "var(--color-muted-foreground)",
                                  }}
                                >
                                  {value}
                                </span>
                              )}
                            />
                            <Bar
                              dataKey="revenue"
                              name="POS Revenue"
                              fill="url(#deep-revenue)"
                              radius={[3, 3, 0, 0]}
                            />
                            <Bar
                              dataKey="cost"
                              name="Tally Cost"
                              fill="url(#deep-cost)"
                              radius={[3, 3, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Date Coverage */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold text-foreground mb-2">Date Coverage</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        <div>
                          <p className="text-[13px] font-black text-foreground">{daysWithBoth}</p>
                          <p className="text-[10px] text-muted-foreground">Days both systems</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                        <div>
                          <p className="text-[13px] font-black text-foreground">{daysOnlyPos}</p>
                          <p className="text-[10px] text-muted-foreground">Days POS only</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                        <div>
                          <p className="text-[13px] font-black text-foreground">{daysOnlyTally}</p>
                          <p className="text-[10px] text-muted-foreground">Days Tally only</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branch Coverage */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold text-foreground mb-2">Branch Coverage</p>
                    <div className="overflow-x-auto rounded-lg border border-border bg-secondary/10">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-border bg-secondary/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="p-2.5 text-left">Branch</th>
                            <th className="p-2.5 text-center">POS</th>
                            <th className="p-2.5 text-center">Tally</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {recon.branches_both.map((b) => (
                            <tr key={b}>
                              <td className="p-2.5 font-semibold text-foreground">{b}</td>
                              <td className="p-2.5 text-center">
                                <Check className="h-3.5 w-3.5 text-success mx-auto" />
                              </td>
                              <td className="p-2.5 text-center">
                                <Check className="h-3.5 w-3.5 text-success mx-auto" />
                              </td>
                              <td className="p-2.5 text-center">
                                <Badge
                                  variant="outline"
                                  className="border-0 text-[10px] font-extrabold uppercase py-0.5 px-2 bg-success-soft text-success"
                                >
                                  Synced
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {recon.branches_only_pos.map((b) => (
                            <tr key={b}>
                              <td className="p-2.5 font-semibold text-foreground">{b}</td>
                              <td className="p-2.5 text-center">
                                <Check className="h-3.5 w-3.5 text-success mx-auto" />
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="text-[10px] text-destructive font-bold">--</span>
                              </td>
                              <td className="p-2.5 text-center">
                                <Badge
                                  variant="outline"
                                  className="border-0 text-[10px] font-extrabold uppercase py-0.5 px-2 bg-warning-soft text-warning"
                                >
                                  POS Only
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {recon.branches_only_tally.map((b) => (
                            <tr key={b}>
                              <td className="p-2.5 font-semibold text-foreground">{b}</td>
                              <td className="p-2.5 text-center">
                                <span className="text-[10px] text-destructive font-bold">--</span>
                              </td>
                              <td className="p-2.5 text-center">
                                <Check className="h-3.5 w-3.5 text-success mx-auto" />
                              </td>
                              <td className="p-2.5 text-center">
                                <Badge
                                  variant="outline"
                                  className="border-0 text-[10px] font-extrabold uppercase py-0.5 px-2 bg-destructive-soft text-destructive"
                                >
                                  Tally Only
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(recon.branches_only_pos.length > 0 ||
                      recon.branches_only_tally.length > 0) && (
                      <div className="flex items-start gap-1.5 rounded-lg bg-warning/10 p-2.5 border border-warning/20 mt-3">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                        <p className="text-[10px] text-warning font-medium">
                          Branch mismatch detected. Ensure all branches are configured in both POS
                          and Tally systems for accurate reconciliation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
