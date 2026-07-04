import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  Building2,
  Warehouse,
  BookOpen,
  Download,
  DollarSign,
  Hash,
  LayoutGrid,
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
import { tallyApi, type TallyVoucher } from "@/lib/api";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { dashboardService } from "@/services/dashboardService";
import { DASHBOARD_LIVE_QUERY, paletteColor, fmtCurrency } from "@/components/dashboard/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/tally")({
  component: TallyPage,
});

const PAGE_SIZE = 25;

const TYPE_STYLE: Record<string, string> = {
  Purchase: "bg-success/15 text-success border-success/30",
  "Material In": "bg-info/15 text-info border-info/30",
  "Material Out": "bg-warning/15 text-warning border-warning/30",
  "Stock Journal": "bg-chart-4/15 text-chart-4 border-chart-4/30",
  "Sales Return": "bg-destructive/15 text-destructive border-destructive/30",
  Sales: "bg-primary/15 text-primary border-primary/30",
};

const TYPE_COLORS: Record<string, string> = {
  Purchase: "var(--color-success)",
  "Material In": "var(--color-info)",
  "Stock Journal": "var(--color-warning)",
  "Sales Return": "var(--color-chart-4)",
  "Material Out": "var(--color-destructive)",
  Sales: "var(--color-primary)",
};

function aed(v: unknown): string {
  const n = Number(v);
  if (isNaN(n)) return "—";
  return `AED ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

function fmtTallyDate(v: unknown): string {
  if (!v) return "—";
  const s = String(v);
  if (s.length === 8) {
    const y = s.slice(0, 4),
      m = s.slice(4, 6),
      d = s.slice(6, 8);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[parseInt(m) - 1] ?? m} ${parseInt(d)}, ${y}`;
  }
  return s;
}

function TallyPage() {
  const { branch } = useBranchFilter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [detail, setDetail] = useState<TallyVoucher | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tally-vouchers", page, branch, typeFilter],
    queryFn: () =>
      tallyApi.list({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        branch: branch && branch !== "all" ? branch : undefined,
        voucher_type: typeFilter || undefined,
      }),
    staleTime: 30_000,
  });

  // Fetch reconciliation data for richer KPIs
  const { data: reconData } = useQuery({
    queryKey: ["dashboard", "reconciliation", "month", branch],
    queryFn: () =>
      dashboardService.getReconciliation("month", branch && branch !== "all" ? branch : undefined),
    ...DASHBOARD_LIVE_QUERY,
  });

  // Fetch stock items
  const { data: stockData } = useQuery({
    queryKey: ["dashboard", "stock-items", branch],
    queryFn: () =>
      dashboardService.getStockItems(branch && branch !== "all" ? branch : undefined, 10),
    ...DASHBOARD_LIVE_QUERY,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const rows = (data?.items ?? []).filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(v.stockitem ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.ledger ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.branch ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.partyname ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.vouchernumber ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.category ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  // KPI summary from current page
  const all = data?.items ?? [];
  const totalAmount = all.reduce((s, r) => s + Math.abs(Number(r.amount ?? 0)), 0);
  const totalInventoryValue = reconData?.tally_purchases ?? totalAmount;
  const voucherCount = data?.total ?? all.length;
  const distinctBranches = new Set(all.map((r) => String(r.branch ?? "")).filter(Boolean)).size;

  // Voucher type breakdown from page data
  const typeBreakdown: Record<string, number> = {};
  all.forEach((r) => {
    const t = String(r.vouchertype ?? "Other");
    typeBreakdown[t] = (typeBreakdown[t] ?? 0) + Math.abs(Number(r.amount ?? 0));
  });
  const pieData = Object.entries(typeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value: Math.round(value * 10) / 10,
      fill: TYPE_COLORS[name] ?? paletteColor(i),
    }));
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  // Branch-wise purchase values
  const branchBreakdown: Record<string, number> = {};
  all.forEach((r) => {
    const b = String(r.branch ?? "Unknown");
    branchBreakdown[b] = (branchBreakdown[b] ?? 0) + Math.abs(Number(r.amount ?? 0));
  });
  const branchChartData = Object.entries(branchBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name.replace(" Branch", ""),
      value: Math.round(value * 10) / 10,
      branch: name,
    }));

  // Stock items
  const stockItems = stockData?.items ?? [];

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Tally Vouchers
          </h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            General ledger ERP voucher logs synchronized from Tally XML
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]">
            <Download className="h-3.5 w-3.5" />
            Export ledger
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
            label: "TOTAL PURCHASES",
            value: aed(totalAmount),
            sub: "Vendor and raw material costs",
            icon: DollarSign,
            tone: "bg-destructive/15 text-destructive",
          },
          {
            label: "INVENTORY VALUE",
            value: aed(totalInventoryValue),
            sub: "Total value of inventory transactions processed",
            icon: Package,
            tone: "bg-success/15 text-success",
          },
          {
            label: "VOUCHER ENTRIES",
            value: voucherCount.toLocaleString(),
            sub: "Total accounting records processed",
            icon: Hash,
            tone: "bg-info/15 text-info",
          },
          {
            label: "ACTIVE BRANCHES",
            value: String(distinctBranches || reconData?.tally_branches?.length || 0),
            sub: "Distinct branch locations in ledger",
            icon: LayoutGrid,
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

      {/* ── Charts Row: Branch Purchase + Voucher Type Breakdown ──────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Branch-wise Purchase Value */}
        <Card className="border border-border/60 bg-card shadow-sm lg:col-span-3">
          <CardHeader className="px-5 pb-2 pt-5">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-info" />
              <CardTitle className="text-[14px] font-bold text-foreground">
                Branch-wise Purchase Value
              </CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total voucher amount grouped by branch location
            </p>
          </CardHeader>
          <CardContent className="px-5 py-3">
            <div className="h-[280px]">
              {branchChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={branchChartData}
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
                            <p className="text-muted-foreground tabular-nums">{aed(d.value)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {branchChartData.map((_, i) => (
                        <Cell key={i} fill={paletteColor(i)} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">
                  No branch data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voucher Type Breakdown */}
        <Card className="border border-border/60 bg-card shadow-sm lg:col-span-2 bg-gradient-to-br from-card to-muted/10">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-[14px] font-bold text-foreground">
              Voucher Type Breakdown
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Amount distribution by voucher class
            </p>
          </CardHeader>
          <CardContent className="px-5 py-3 flex flex-col items-center">
            {pieData.length > 0 ? (
              <>
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
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const pct = pieTotal > 0 ? ((d.value / pieTotal) * 100).toFixed(1) : "0";
                          return (
                            <div className="rounded-xl border border-border bg-popover px-3 py-2 text-[11px] shadow-xl">
                              <p className="font-bold text-foreground">{d.name}</p>
                              <p className="text-muted-foreground tabular-nums">
                                {aed(d.value)} ({pct}%)
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 mb-3">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: d.fill }}
                      />
                      <span className="text-[10px] text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
                {/* Value list */}
                <div className="w-full border-t border-border/30 pt-3 space-y-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: d.fill }}
                        />
                        <span className="text-[11px] font-medium text-foreground">{d.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground tabular-nums">
                        {aed(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-[12px] text-muted-foreground">
                No voucher type data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Stock Items by Value ──────────────────────────────────── */}
      {stockItems.length > 0 && (
        <Card className="border border-border/60 bg-card shadow-sm">
          <CardHeader className="px-5 pb-2 pt-5">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-warning" />
              <CardTitle className="text-[14px] font-bold text-foreground">
                Stock Items Overview
              </CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Current stock levels across all voucher types
            </p>
          </CardHeader>
          <CardContent className="px-5 py-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {stockItems.slice(0, 10).map((item) => (
                <div
                  key={item.item}
                  className={cn(
                    "rounded-lg border px-3 py-2.5",
                    item.status === "critical"
                      ? "border-destructive/30 bg-destructive/[0.05]"
                      : item.status === "low"
                        ? "border-warning/30 bg-warning/[0.05]"
                        : "border-border/30 bg-background/50",
                  )}
                >
                  <p className="text-[11px] font-bold text-foreground truncate">{item.item}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Stock</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0",
                        item.status === "critical"
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : item.status === "low"
                            ? "bg-warning/15 text-warning border-warning/30"
                            : "bg-success/15 text-success border-success/30",
                      )}
                    >
                      {item.current_stock.toFixed(1)}{" "}
                      {item.status === "critical"
                        ? "CRITICAL"
                        : item.status === "low"
                          ? "LOW"
                          : "OK"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Voucher Table ────────────────────────────────────────────── */}
      <Card className="border border-border/60 bg-card shadow-sm overflow-hidden">
        <CardHeader className="px-5 pb-3 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-[14px] font-bold text-foreground">
                Voucher Ledger
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Detailed accounting entries from Tally ERP
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item, party, voucher..."
                  className="h-8 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="h-8 rounded-lg border border-border/60 bg-background px-3 text-[11px] text-foreground outline-none focus:border-primary/50 transition cursor-pointer"
              >
                <option value="">All Types</option>
                {[
                  "Purchase",
                  "Material In",
                  "Material Out",
                  "Stock Journal",
                  "Sales Return",
                  "Sales",
                ].map((s) => (
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
                  "Voucher #",
                  "Date",
                  "Type",
                  "Branch",
                  "Stock Item",
                  "Category",
                  "Party / Ledger",
                  "Qty",
                  "Rate",
                  "Amount",
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
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 w-16 animate-pulse rounded bg-muted/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground text-[12px]"
                  >
                    No voucher records found.
                  </td>
                </tr>
              ) : (
                rows.map((v) => {
                  const type = String(v.vouchertype ?? "—");
                  return (
                    <tr
                      key={v._id}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setDetail(v)}
                    >
                      <td className="px-4 py-2.5 font-mono font-semibold text-primary text-[11px]">
                        {String(v.vouchernumber ?? "—")}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {fmtTallyDate(v.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0",
                            TYPE_STYLE[type] ??
                              "bg-muted/30 text-muted-foreground border-border/40",
                          )}
                        >
                          {type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {String(v.branch ?? "—")}
                      </td>
                      <td className="px-4 py-2.5 text-foreground max-w-[160px] truncate">
                        {String(v.stockitem ?? "—")}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {String(v.category ?? "—")}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate">
                        {String(v.partyname ?? v.ledger ?? "—")}
                      </td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums text-foreground text-center">
                        {v.quantity != null
                          ? `${Number(v.quantity).toFixed(1)} ${v.unit ?? ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                        {v.rate != null ? aed(v.rate) : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-bold tabular-nums text-foreground">
                        {aed(v.amount)}
                      </td>
                    </tr>
                  );
                })
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
              <FileText className="h-4 w-4 text-primary" />
              {String(detail?.vouchernumber ?? "Voucher Detail")}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 mt-2">
              {/* Type + Date */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    TYPE_STYLE[String(detail.vouchertype)] ?? "",
                  )}
                >
                  {String(detail.vouchertype ?? "—")}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {fmtTallyDate(detail.date)}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Building2, label: "Branch", value: detail.branch },
                  { icon: Warehouse, label: "Godown", value: detail.godown },
                  { icon: BookOpen, label: "Party", value: detail.partyname },
                  { icon: BookOpen, label: "Ledger", value: detail.ledger },
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

              {/* Item Details */}
              <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Stock Item
                </p>
                <div>
                  <p className="text-[13px] font-bold text-foreground">
                    {String(detail.stockitem ?? "—")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {String(detail.category ?? "—")}
                  </p>
                </div>
                <div className="border-t border-border/30 pt-2 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="tabular-nums font-semibold text-foreground">
                      {Number(detail.quantity ?? 0).toFixed(2)} {String(detail.unit ?? "")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="tabular-nums text-foreground">{aed(detail.rate)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1.5 font-bold">
                    <span className="text-foreground">Amount</span>
                    <span className="tabular-nums text-foreground">{aed(detail.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Narration */}
              {detail.narration && (
                <div className="rounded-lg border border-border/30 bg-background/50 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Narration
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {String(detail.narration)}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
