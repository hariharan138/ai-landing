import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  User,
  Tag,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Download,
  ChevronRight as ChevronRightIcon,
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
} from "recharts";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { posSalesApi, type PosSale } from "@/lib/api";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { dashboardService } from "@/services/dashboardService";
import { DASHBOARD_LIVE_QUERY, paletteColor, fmtCurrency } from "@/components/dashboard/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/pos")({
  component: PosSalesPage,
});

const PAGE_SIZE = 25;

const STATUS_STYLE: Record<string, string> = {
  Completed: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  Refunded: "bg-info/15 text-info border-info/30",
};

const CHANNEL_STYLE: Record<string, string> = {
  "Dine-in": "bg-primary/15 text-primary border-primary/30",
  Delivery: "bg-info/15 text-info border-info/30",
  Takeaway: "bg-warning/15 text-warning border-warning/30",
  Aggregator: "bg-success/15 text-success border-success/30",
  Drive: "bg-chart-4/15 text-chart-4 border-chart-4/30",
};

const CHANNEL_COLORS: Record<string, string> = {
  "Dine-in": "var(--color-success)",
  Aggregator: "var(--color-info)",
  Delivery: "var(--color-warning)",
  Takeaway: "var(--color-chart-4)",
  Drive: "var(--color-chart-5)",
};

function aed(v: unknown): string {
  const n = Number(v);
  if (isNaN(n)) return "—";
  return `AED ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(v: unknown): string {
  if (!v || typeof v !== "string") return "—";
  try {
    return new Date(v).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(v);
  }
}

function fmtTime(v: unknown): string {
  if (!v || typeof v !== "string") return "";
  try {
    return new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function PosSalesPage() {
  const { branch } = useBranchFilter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [detail, setDetail] = useState<PosSale | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["pos-sales", page, branch, statusFilter],
    queryFn: () =>
      posSalesApi.list({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        branch: branch && branch !== "all" ? branch : undefined,
        status: statusFilter || undefined,
      }),
    staleTime: 30_000,
  });

  // Fetch aggregated data for charts
  const { data: channelData } = useQuery({
    queryKey: ["dashboard", "channel-breakdown", "month", branch],
    queryFn: () =>
      dashboardService.getChannelBreakdown(
        "month",
        branch && branch !== "all" ? branch : undefined,
      ),
    ...DASHBOARD_LIVE_QUERY,
  });

  const { data: topItemsData } = useQuery({
    queryKey: ["dashboard", "top-items", "month", branch],
    queryFn: () =>
      dashboardService.getTopItems("month", branch && branch !== "all" ? branch : undefined, 5),
    ...DASHBOARD_LIVE_QUERY,
  });

  // Fetch all-branches sales for location chart
  const { data: branchData } = useQuery({
    queryKey: ["dashboard", "branch-summary", "month"],
    queryFn: () => dashboardService.getBranchSummary("month"),
    ...DASHBOARD_LIVE_QUERY,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const rows = (data?.items ?? []).filter((s) => {
    if (!search && !channelFilter) return true;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      String(s.invoice_no ?? "")
        .toLowerCase()
        .includes(q) ||
      String(s.item_name ?? "")
        .toLowerCase()
        .includes(q) ||
      String(s.branch_name ?? "")
        .toLowerCase()
        .includes(q) ||
      String(s.cashier ?? "")
        .toLowerCase()
        .includes(q) ||
      String(s.category ?? "")
        .toLowerCase()
        .includes(q);
    const matchChannel = !channelFilter || String(s.order_channel) === channelFilter;
    return matchSearch && matchChannel;
  });

  // KPI summary
  const all = data?.items ?? [];
  const totalRev = all.reduce((s, r) => s + Number(r.total_amount_aed ?? 0), 0);
  const completedCount = all.filter((r) => r.order_status === "Completed").length;
  const avgTicket = completedCount > 0 ? totalRev / completedCount : 0;
  const totalDiscount = all.reduce((s, r) => s + Math.abs(Number(r.discount_aed ?? 0)), 0);
  const totalTax = all.reduce((s, r) => s + Number(r.tax_aed ?? 0), 0);

  // Channel breakdown
  const channels = channelData?.items ?? [];
  const channelTotal = channelData?.total ?? channels.reduce((s, c) => s + c.value, 0);

  // Branch location chart data
  const branchItems = branchData?.items ?? [];
  const locationChartData = branchItems
    .filter((b) => b.sales > 0)
    .sort((a, b) => a.sales - b.sales)
    .map((b) => ({
      name: b.branch.replace(" Branch", ""),
      sales: b.sales,
      branch: b.branch,
    }));

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            POS Sales
          </h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Transaction logs and branch sales aggregates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]">
            <Download className="h-3.5 w-3.5" />
            Export logs
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "TOTAL POS VOLUME",
            value: aed(totalRev),
            sub: `Based on ${all.length} invoices`,
            icon: DollarSign,
            tone: "bg-primary/15 text-primary",
          },
          {
            label: "AVERAGE BASKET (AOV)",
            value: aed(avgTicket),
            sub: "Per receipt average",
            icon: TrendingUp,
            tone: "bg-info/15 text-info",
          },
          {
            label: "DISCOUNTS DISTRIBUTED",
            value: aed(totalDiscount),
            sub: "Promo and campaign codes",
            icon: Percent,
            tone: "bg-warning/15 text-warning",
          },
          {
            label: "TOTAL VAT COLLECTED",
            value: aed(totalTax),
            sub: "VAT 5% standard ledger output",
            icon: Clock,
            tone: "bg-success/15 text-success",
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
                {isLoading ? "..." : c.value}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row: Sales by Location + Channels Summary ─────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Sales Revenue by Location */}
        <Card className="border border-border/60 bg-card shadow-sm lg:col-span-3">
          <CardHeader className="px-5 pb-2 pt-5">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <CardTitle className="text-[14px] font-bold text-foreground">
                Sales Revenue by Location
              </CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total POS receipts generated at individual branch sites
            </p>
          </CardHeader>
          <CardContent className="px-5 py-3">
            <div className="h-[280px]">
              {locationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={locationChartData}
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
                      tickFormatter={(v: number) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}M`
                          : v >= 1000
                            ? `${(v / 1000).toFixed(0)}k`
                            : String(Math.round(v))
                      }
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)", opacity: 0.15 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[11px] shadow-xl">
                            <p className="font-bold text-foreground mb-1">{d.name} Branch</p>
                            <p className="text-muted-foreground tabular-nums">{aed(d.sales)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="sales" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {locationChartData.map((_, i) => (
                        <Cell key={i} fill={paletteColor(i)} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">
                  No location data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Channels Summary */}
        <Card className="border border-border/60 bg-card shadow-sm lg:col-span-2 bg-gradient-to-br from-card to-muted/10">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-[14px] font-bold text-foreground">
              Channels Summary
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Aggregate sales volume per order channel
            </p>
          </CardHeader>
          <CardContent className="px-5 py-3">
            <div className="space-y-4">
              {channels.length > 0 ? (
                channels.map((ch, i) => {
                  const pct = channelTotal > 0 ? (ch.value / channelTotal) * 100 : 0;
                  const color = CHANNEL_COLORS[ch.name] ?? paletteColor(i);
                  return (
                    <div key={ch.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[12px] font-bold text-foreground">{ch.name}</span>
                        </div>
                        <span className="text-[12px] font-bold text-foreground tabular-nums">
                          {aed(ch.value)}{" "}
                          <span className="text-muted-foreground font-medium">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[12px] text-muted-foreground">
                  No channel data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sales Logs Table ─────────────────────────────────────────── */}
      <Card className="border border-border/60 bg-card shadow-sm overflow-hidden">
        <CardHeader className="px-5 pb-3 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-[14px] font-bold text-foreground">Sales Logs</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Detailed lists of transactions pulled from the database
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Invoice No..."
                  className="h-8 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>
              {/* Channel filter */}
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-8 rounded-lg border border-border/60 bg-background px-3 text-[11px] text-foreground outline-none focus:border-primary/50 transition cursor-pointer"
              >
                <option value="">All Channels</option>
                {["Dine-in", "Delivery", "Takeaway", "Aggregator"].map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="h-8 rounded-lg border border-border/60 bg-background px-3 text-[11px] text-foreground outline-none focus:border-primary/50 transition cursor-pointer"
              >
                <option value="">All Status</option>
                {["Completed", "Pending", "Cancelled", "Refunded"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                {[
                  "INVOICE NO",
                  "DATETIME",
                  "BRANCH",
                  "CHANNEL",
                  "TAX",
                  "DISCOUNT",
                  "GRAND TOTAL",
                  "STATUS",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 w-16 animate-pulse rounded bg-muted/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground text-[12px]"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setDetail(s)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-primary text-[11px]">
                      {String(s.invoice_no ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[11px]">
                      {String(s.sale_datetime ?? "—")}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground text-[11px]">
                      {String(s.branch_name ?? "—")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0 uppercase",
                          CHANNEL_STYLE[String(s.order_channel)] ??
                            "bg-muted/30 text-muted-foreground border-border/40",
                        )}
                      >
                        {String(s.order_channel ?? "—")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground text-[11px]">
                      {Number(s.tax_aed ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[11px]">
                      <span
                        className={
                          Number(s.discount_aed ?? 0) < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {Number(s.discount_aed ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground text-[11px]">
                      {aed(s.total_amount_aed)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0 uppercase",
                          STATUS_STYLE[String(s.order_status)] ??
                            "bg-muted/30 text-muted-foreground border-border/40",
                        )}
                      >
                        {String(s.order_status ?? "—")}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Page {page + 1} of {totalPages} &middot; {data?.total} records
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Detail Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {String(detail?.invoice_no ?? "Sale Detail")}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 mt-2">
              {/* Status + Channel badges */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    STATUS_STYLE[String(detail.order_status)] ?? "",
                  )}
                >
                  {String(detail.order_status ?? "—")}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    CHANNEL_STYLE[String(detail.order_channel)] ?? "",
                  )}
                >
                  {String(detail.order_channel ?? "—")}
                </Badge>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Tag, label: "Sale ID", value: detail.sale_id },
                  {
                    icon: MapPin,
                    label: "Branch",
                    value: `${detail.branch_name} (${detail.location})`,
                  },
                  { icon: User, label: "Cashier", value: detail.cashier },
                  { icon: CreditCard, label: "Payment", value: detail.payment_method },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-start gap-2 rounded-lg border border-border/30 bg-background/50 px-3 py-2"
                  >
                    <f.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{f.label}</p>
                      <p className="text-[12px] font-semibold text-foreground">
                        {String(f.value ?? "—")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Item Details
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">
                      {String(detail.item_name ?? "—")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {String(detail.category ?? "—")} &middot; {String(detail.item_id ?? "")}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Terminal: {String(detail.pos_terminal ?? "—")}
                  </p>
                </div>
                <div className="border-t border-border/30 pt-2 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qty × Unit Price</span>
                    <span className="tabular-nums text-foreground">
                      {String(detail.quantity)} × {aed(detail.unit_price_aed)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums text-destructive">
                      -{aed(detail.discount_aed)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (VAT)</span>
                    <span className="tabular-nums text-foreground">+{aed(detail.tax_aed)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1.5 font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="tabular-nums text-foreground">
                      {aed(detail.total_amount_aed)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Customer: {String(detail.customer_type ?? "—")}</span>
                <span>
                  {fmtDate(detail.sale_datetime)} at {fmtTime(detail.sale_datetime)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
