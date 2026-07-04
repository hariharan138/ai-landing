import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { useDateRange, rangeKey } from "@/contexts/DateRangeContext";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";
import { fmtCurrency } from "@/components/dashboard/shared";
import type { Location } from "@/lib/locations";
import {
  getSnapshots,
  getAttentionItems,
  getComparisonSeries,
  type LocationSnapshot,
} from "@/services/locationData";

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 3 - ((v - min) / span) * (h - 6),
  ]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2.5} fill={color} stroke="var(--color-card)" strokeWidth={1.5} />
    </svg>
  );
}

// ── Location card ────────────────────────────────────────────────────────────

function LocationCard({
  loc,
  snap,
  onSelect,
  index,
}: {
  loc: Location;
  snap: LocationSnapshot;
  onSelect: () => void;
  index: number;
}) {
  const { count } = useCounterAnimation(snap.revenue, { duration: 1200, decimals: 0 });
  const up = snap.deltaPct >= 0;
  return (
    <button
      onClick={onSelect}
      style={{ "--loc": loc.color } as React.CSSProperties}
      className={cn(
        "location-card w-full rounded-xl border border-border/60 bg-card p-4 text-left",
        `animate-fade-in-up stagger-${Math.min(index + 1, 8)}`,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: loc.color }} />
          <span className="truncate text-[12.5px] font-bold text-foreground">{loc.name}</span>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 text-[11px] font-bold tabular-nums",
            up ? "text-success" : "text-destructive",
          )}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(snap.deltaPct).toFixed(1)}%
        </span>
      </div>

      <p className="mt-3 text-[19px] font-black tracking-tight text-foreground tabular-nums">
        {fmtCurrency(count)}
      </p>
      <p className="text-[10.5px] text-muted-foreground">
        <ShoppingCart className="mr-1 inline h-3 w-3 align-[-2px]" />
        {snap.orders.toLocaleString()} orders · AED {snap.avgOrder.toFixed(0)} avg
      </p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <Sparkline values={snap.sparkline} color={loc.color} />
        <span className="text-[9.5px] text-muted-foreground/70">14d</span>
      </div>
    </button>
  );
}

// ── Needs attention strip ────────────────────────────────────────────────────

function NeedsAttentionStrip({
  snapshots,
  locations,
  onSelect,
}: {
  snapshots: LocationSnapshot[];
  locations: Location[];
  onSelect: (branch: string) => void;
}) {
  const items = useMemo(() => getAttentionItems(snapshots), [snapshots]);
  const colorOf = (branch: string) =>
    locations.find((l) => l.name === branch)?.color ?? "var(--color-primary)";

  if (!items.length) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success-soft/40 px-4 py-2.5 animate-fade-in-up">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <p className="text-[12px] font-medium text-success">
          All locations are tracking normally against their 7-day averages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 animate-fade-in-up">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Needs attention
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
        {items.map((item, i) => (
          <button
            key={`${item.branch}-${i}`}
            onClick={() => onSelect(item.branch)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors duration-200",
              item.severity === "critical"
                ? "border-destructive/35 bg-destructive-soft/50 hover:border-destructive/60"
                : "border-warning/30 bg-warning-soft/40 hover:border-warning/60",
            )}
          >
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                item.severity === "critical" ? "text-destructive" : "text-warning",
              )}
            />
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorOf(item.branch) }}
            />
            <span className="text-[11.5px] font-semibold text-foreground">{item.branch}</span>
            <span className="text-[11px] text-muted-foreground">{item.message}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Comparison chart ─────────────────────────────────────────────────────────

function ComparisonChart({ locations }: { locations: Location[] }) {
  const { range } = useDateRange();
  const branches = locations.map((l) => l.name);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["locations", "comparison", rangeKey(range), branches],
    queryFn: () => getComparisonSeries(branches, range),
    enabled: branches.length > 0,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.labels.map((label, i) => {
      const row: Record<string, string | number> = { label };
      for (const s of data.series) row[s.branch] = s.values[i];
      return row;
    });
  }, [data]);

  const toggle = (branch: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(branch)) next.delete(branch);
      // never hide the last visible series
      else if (next.size < branches.length - 1) next.add(branch);
      return next;
    });

  return (
    <Card className="border border-border/60 bg-card shadow-sm animate-fade-in-up stagger-3">
      <CardHeader className="border-b border-border/40 px-5 pb-3 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-[13px] font-bold text-foreground">
              Revenue by location
            </CardTitle>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Daily revenue, all locations overlaid — click a name to toggle it
            </p>
          </div>
          {/* Legend doubles as series toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {locations.map((loc) => {
              const off = hidden.has(loc.name);
              return (
                <button
                  key={loc.name}
                  onClick={() => toggle(loc.name)}
                  aria-pressed={!off}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[10.5px] font-semibold transition-all duration-200",
                    off
                      ? "text-muted-foreground/50 line-through opacity-60"
                      : "text-foreground hover:border-border",
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: off ? "var(--color-muted-foreground)" : loc.color }}
                  />
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                opacity={0.35}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 8))}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const rows = [...payload].sort((a, b) => (b.value as number) - (a.value as number));
                  return (
                    <div className="rounded-xl border border-border/60 bg-popover px-3.5 py-2.5 text-[11px] shadow-lg">
                      <p className="mb-1.5 font-bold text-foreground">{label}</p>
                      {rows.map((row) => (
                        <div key={row.dataKey as string} className="flex items-center gap-2 py-0.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: row.stroke as string }}
                          />
                          <span className="min-w-[84px] text-muted-foreground">{row.dataKey as string}</span>
                          <span className="ml-auto font-bold tabular-nums text-foreground">
                            {fmtCurrency(row.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {locations.map((loc) =>
                hidden.has(loc.name) ? null : (
                  <Line
                    key={loc.name}
                    type="monotone"
                    dataKey={loc.name}
                    stroke={loc.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
                    animationDuration={500}
                  />
                ),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Composite ────────────────────────────────────────────────────────────────

export function AllLocationsOverview() {
  const { locations, setBranch, isLoadingBranches } = useBranchFilter();
  const { range } = useDateRange();
  const branches = locations.map((l) => l.name);

  const { data: snapshots } = useQuery({
    queryKey: ["locations", "snapshots", rangeKey(range), branches],
    queryFn: () => getSnapshots(branches, range),
    enabled: branches.length > 0,
  });

  if (isLoadingBranches || !snapshots) {
    return (
      <div className="space-y-4">
        <div className="h-11 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[132px] rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="h-[360px] rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NeedsAttentionStrip snapshots={snapshots} locations={locations} onSelect={setBranch} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {locations.map((loc, i) => {
          const snap = snapshots.find((s) => s.branch === loc.name);
          if (!snap) return null;
          return (
            <LocationCard
              key={loc.name}
              loc={loc}
              snap={snap}
              index={i}
              onSelect={() => setBranch(loc.name)}
            />
          );
        })}
      </div>

      <ComparisonChart locations={locations} />
    </div>
  );
}
