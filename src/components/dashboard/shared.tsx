import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Undo2, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Period } from "@/services/dashboardService";

// ── Types ────────────────────────────────────────────────────────────────────

export type Tone = "primary" | "success" | "warning" | "destructive" | "info" | "neutral";

export type MetricKey = "sales" | "orders" | "food_cost" | "margin";

export interface Delta {
  value: string;
  direction: "up" | "down" | "neutral";
  tone: "success" | "destructive" | "neutral";
}

// ── Constants ────────────────────────────────────────────────────────────────

// One hue per restaurant location — index 0 = location 1. Keep in sync with
// --chart-1..5 in styles.css and LOCATION_COLORS in lib/locations.ts.
export const CHART_PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function paletteColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Deepening bar gradients — each palette color fades from light at the far
 * edge to a deep, saturated tone at the bar's base/tip, so bars read with
 * depth ("deeper and deeper") instead of a flat fill.
 *
 * Drop <ChartGradientDefs /> inside a chart and use deepFillY (vertical bars,
 * deepens downward) or deepFillX (horizontal bars, deepens toward the tip).
 */
export function ChartGradientDefs() {
  return (
    <defs>
      {CHART_PALETTE.map((c, i) => (
        <g key={i}>
          <linearGradient id={`bar-deep-y-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.45} />
            <stop offset="45%" stopColor={c} stopOpacity={0.75} />
            <stop offset="100%" stopColor={c} stopOpacity={1} />
          </linearGradient>
          <linearGradient id={`bar-deep-x-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c} stopOpacity={0.4} />
            <stop offset="55%" stopColor={c} stopOpacity={0.72} />
            <stop offset="100%" stopColor={c} stopOpacity={1} />
          </linearGradient>
        </g>
      ))}
    </defs>
  );
}

export const deepFillY = (index: number): string =>
  `url(#bar-deep-y-${index % CHART_PALETTE.length})`;

export const deepFillX = (index: number): string =>
  `url(#bar-deep-x-${index % CHART_PALETTE.length})`;

export const TONE_ICON_BG: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  info: "bg-info/15 text-info",
  neutral: "bg-muted text-muted-foreground",
};

export const METRIC_CONFIG: Record<
  MetricKey,
  {
    label: string;
    tabLabel: string;
    chartColor: string;
    activeTab: string;
  }
> = {
  sales: {
    label: "Total Sales",
    tabLabel: "Sales",
    chartColor: "var(--color-primary)",
    activeTab: "bg-primary text-primary-foreground",
  },
  orders: {
    label: "Orders",
    tabLabel: "Orders",
    chartColor: "var(--color-info)",
    activeTab: "bg-info text-info-foreground",
  },
  food_cost: {
    label: "Food Cost %",
    tabLabel: "Food Cost",
    chartColor: "var(--color-warning)",
    activeTab: "bg-warning text-warning-foreground",
  },
  margin: {
    label: "Gross Margin %",
    tabLabel: "Margin",
    chartColor: "var(--color-chart-3)",
    activeTab: "bg-primary text-primary-foreground",
  },
};

export const DASHBOARD_LIVE_QUERY = {
  refetchInterval: 60_000,
  staleTime: 30_000,
  refetchOnWindowFocus: true,
} as const;

// ── Formatters ───────────────────────────────────────────────────────────────

export function fmtCurrency(value: number, currency = "AED"): string {
  if (Math.abs(value) >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${currency} ${(value / 1_000).toFixed(1)}k`;
  return `${currency} ${value.toFixed(2)}`;
}

export function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ── PeriodChip ───────────────────────────────────────────────────────────────

export function PeriodChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 ease-out",
        active
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-105"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:scale-105",
      )}
    >
      {label}
    </button>
  );
}

// ── AreaTrend chart ──────────────────────────────────────────────────────────

export function AreaTrend({
  data,
  labels,
  loading,
  metricName,
  metricKey,
  height = 300,
  period,
  compareData,
  currentLabel = "This Period",
  previousLabel = "Last Period",
}: {
  data: number[];
  labels: string[];
  loading?: boolean;
  metricName: string;
  metricKey: MetricKey;
  height?: number;
  period: Period;
  compareData?: number[];
  currentLabel?: string;
  previousLabel?: string;
}) {
  const gradientId = useId();
  const color = METRIC_CONFIG[metricKey]?.chartColor ?? "var(--color-primary)";

  const chartData = useMemo(() => {
    return labels.map((label, i) => ({
      label: label.length > 5 ? label.slice(5) : label, // trim YYYY- prefix
      value: data[i] ?? 0,
      compare: compareData?.[i] ?? 0,
    }));
  }, [labels, data, compareData]);

  // ── Drag-to-zoom: each drag dives one level deeper into the selected range ──
  const [zoomStack, setZoomStack] = useState<Array<[number, number]>>([]);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);

  const offset = zoomStack.length ? zoomStack[zoomStack.length - 1][0] : 0;
  const viewData = useMemo(() => {
    if (!zoomStack.length) return chartData;
    const [s, e] = zoomStack[zoomStack.length - 1];
    return chartData.slice(s, e + 1);
  }, [chartData, zoomStack]);

  const commitZoom = () => {
    if (dragStart == null || dragEnd == null || dragStart === dragEnd) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    let a = viewData.findIndex((d) => d.label === dragStart);
    let b = viewData.findIndex((d) => d.label === dragEnd);
    if (a < 0 || b < 0) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    if (a > b) [a, b] = [b, a];
    // keep at least two points so we can keep diving deeper
    if (b - a >= 1) {
      setZoomStack((prev) => [...prev, [offset + a, offset + b]]);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  const zoomOut = () => setZoomStack((prev) => prev.slice(0, -1));
  const resetZoom = () => setZoomStack([]);
  const depth = zoomStack.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div
        className="flex items-center justify-center text-[12px] text-muted-foreground"
        style={{ height }}
      >
        No trend data available
      </div>
    );
  }

  const isCurrency = metricKey === "sales";
  const isPct = metricKey === "food_cost" || metricKey === "margin";
  const formatValue = (v: number) =>
    isCurrency
      ? v >= 1000
        ? `${(v / 1000).toFixed(0)}k`
        : v.toFixed(0)
      : isPct
        ? `${v.toFixed(1)}%`
        : String(Math.round(v));

  return (
    <div className="relative" style={{ height }}>
      {depth > 0 ? (
        <div className="absolute right-1 top-0 z-10 flex items-center gap-1">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
            Depth {depth}
          </span>
          <button
            onClick={zoomOut}
            title="Zoom out one level"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
          >
            <Undo2 className="h-3 w-3" />
          </button>
          <button
            onClick={resetZoom}
            title="Reset zoom"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="pointer-events-none absolute right-2 top-0.5 z-10 text-[9px] font-medium text-muted-foreground/60">
          Drag to zoom deeper
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={viewData}
          margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
          onMouseDown={(e?: { activeLabel?: string }) =>
            e?.activeLabel && setDragStart(e.activeLabel)
          }
          onMouseMove={(e?: { activeLabel?: string }) =>
            dragStart && e?.activeLabel && setDragEnd(e.activeLabel)
          }
          onMouseUp={commitZoom}
          style={{ cursor: "crosshair", userSelect: "none" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="30%" stopColor={color} stopOpacity={0.34} />
              <stop offset="60%" stopColor={color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            opacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="var(--color-muted-foreground)"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(viewData.length / 8))}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm px-4 py-3 text-[11px] shadow-xl animate-in fade-in zoom-in duration-200">
                  <p className="font-bold text-foreground mb-2 text-[12px]">{d.label}</p>
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground font-medium">{currentLabel}:</span>
                    <span className="font-bold text-foreground tabular-nums text-[13px]">
                      {formatValue(d.value)}
                    </span>
                  </div>
                  {compareData?.length ? (
                    <div className="flex items-center gap-2.5 mt-1.5 pt-1.5 border-t border-border/40">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                      <span className="text-muted-foreground font-medium">{previousLabel}:</span>
                      <span className="font-bold text-muted-foreground tabular-nums text-[13px]">
                        {formatValue(d.compare)}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            }}
          />
          {compareData?.length ? (
            <Area
              type="monotone"
              dataKey="compare"
              stroke="var(--color-muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
              animationDuration={500}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={false}
            animationDuration={500}
          />
          {dragStart && dragEnd ? (
            <ReferenceArea
              x1={dragStart}
              x2={dragEnd}
              strokeOpacity={0.3}
              fill={color}
              fillOpacity={0.12}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
