import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { fmtCurrency } from "@/components/dashboard/shared";
import { getHourlySales, getRecentOrders, type RecentOrder } from "@/services/locationData";

// ── Hourly sales ─────────────────────────────────────────────────────────────

function HourlySalesChart({ branch, color }: { branch: string; color: string }) {
  const { data } = useQuery({
    queryKey: ["locations", "hourly", branch],
    queryFn: () => getHourlySales(branch),
  });

  const chartData = useMemo(
    () => (data ? data.labels.map((label, i) => ({ label, value: data.values[i] })) : []),
    [data],
  );

  return (
    <Card className="border border-border/60 bg-card shadow-sm animate-fade-in-up stagger-2">
      <CardHeader className="border-b border-border/40 px-5 pb-3 pt-4">
        <CardTitle className="text-[13px] font-bold text-foreground">Hourly sales — today</CardTitle>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Revenue by hour — lunch and dinner peaks
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
                interval={2}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)", opacity: 0.35 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl border border-border/60 bg-popover px-3.5 py-2 text-[11px] shadow-lg">
                      <p className="font-bold text-foreground">{label}</p>
                      <p className="mt-0.5 tabular-nums text-muted-foreground">
                        Revenue{" "}
                        <span className="font-bold text-foreground">
                          {fmtCurrency(payload[0].value as number)}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="value"
                fill={color}
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
                animationDuration={700}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent orders table ──────────────────────────────────────────────────────

type SortKey = "time" | "id" | "channel" | "amount" | "status";

const STATUS_STYLE: Record<RecentOrder["status"], string> = {
  completed: "bg-success-soft text-success border-0",
  preparing: "bg-info-soft text-info border-0",
  cancelled: "bg-destructive-soft text-destructive border-0",
};

function RecentOrdersTable({ branch }: { branch: string }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: orders = [] } = useQuery({
    queryKey: ["locations", "recent-orders", branch],
    queryFn: () => getRecentOrders(branch),
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? orders.filter((o) =>
          [o.id, o.items, o.channel, o.status].some((f) => f.toLowerCase().includes(q)),
        )
      : orders;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [orders, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "amount" || key === "time" ? "desc" : "asc");
    }
  };

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <th className={cn("p-2.5 text-left", className)}>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );

  return (
    <Card className="border border-border/60 bg-card shadow-sm animate-fade-in-up stagger-3">
      <CardHeader className="border-b border-border/40 px-5 pb-3 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-[13px] font-bold text-foreground">Recent orders</CardTitle>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {rows.length} orders today · click a column to sort
            </p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders…"
              className="h-8 rounded-full border-border/60 bg-muted/40 pl-8 text-[12px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[380px] overflow-auto">
          <table className="w-full text-[11.5px]">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border/60 text-[10px]">
                <SortHeader label="Time" k="time" />
                <SortHeader label="Order" k="id" />
                <th className="p-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Items
                </th>
                <SortHeader label="Channel" k="channel" />
                <SortHeader label="Amount" k="amount" className="text-right" />
                <SortHeader label="Status" k="status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No orders match “{query}”
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-secondary/40">
                    <td className="p-2.5 tabular-nums text-muted-foreground">{o.time}</td>
                    <td className="p-2.5 font-semibold text-foreground">{o.id}</td>
                    <td className="max-w-[260px] truncate p-2.5 text-muted-foreground">{o.items}</td>
                    <td className="p-2.5 text-muted-foreground">{o.channel}</td>
                    <td className="p-2.5 text-right font-bold tabular-nums text-foreground">
                      {fmtCurrency(o.amount)}
                    </td>
                    <td className="p-2.5">
                      <Badge
                        variant="outline"
                        className={cn("px-2 py-0.5 text-[9.5px] font-extrabold uppercase", STATUS_STYLE[o.status])}
                      >
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Composite ────────────────────────────────────────────────────────────────

export function SingleLocationView() {
  const { branch, locations } = useBranchFilter();
  const loc = locations.find((l) => l.name === branch);
  if (!loc) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <HourlySalesChart branch={loc.name} color={loc.color} />
      </div>
      <div className="lg:col-span-3">
        <RecentOrdersTable branch={loc.name} />
      </div>
    </div>
  );
}
