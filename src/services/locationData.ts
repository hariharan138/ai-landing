/**
 * Mock data layer for the multi-location dashboard.
 *
 * The backend has real branch-aware endpoints (see dashboardService), but not
 * every deployment has five locations with dense history. This module generates
 * deterministic, realistic-looking data keyed by branch NAME, so the UI is
 * fully demonstrable with whatever branches exist (or the MOCK_BRANCHES
 * fallback). Same name → same numbers on every render and refresh.
 */

export type DateRange =
  | { kind: "today" }
  | { kind: "7d" }
  | { kind: "30d" }
  | { kind: "custom"; from: Date; to: Date };

export interface LocationSnapshot {
  branch: string;
  revenue: number;
  orders: number;
  avgOrder: number;
  /** % vs the previous equivalent period (yesterday for "today") */
  deltaPct: number;
  /** % vs the location's own 7-day daily average */
  vsSevenDayPct: number;
  sparkline: number[]; // last 14 days of revenue
  pendingIssues: number;
}

export interface AttentionItem {
  branch: string;
  severity: "critical" | "warning";
  message: string;
}

export interface ComparisonSeries {
  labels: string[];
  series: { branch: string; values: number[] }[];
}

export interface RecentOrder {
  id: string;
  time: string; // HH:MM
  items: string;
  channel: "Dine-in" | "Takeaway" | "Delivery" | "Online";
  amount: number;
  status: "completed" | "preparing" | "cancelled";
}

// ── Deterministic PRNG ────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(...keys: (string | number)[]) {
  return mulberry32(hashString(keys.join("|")));
}

// ── Generators ────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Base daily revenue for a branch — stable per name, between ~18k and ~52k. */
function baseDaily(branch: string): number {
  return 18_000 + rng(branch, "base")() * 34_000;
}

/** Revenue for one specific calendar day. Weekends run higher; occasional dips. */
function dailyRevenue(branch: string, date: Date): number {
  const base = baseDaily(branch);
  const r = rng(branch, dayKey(date));
  const dow = date.getDay();
  const weekend = dow === 5 || dow === 6 ? 1.25 : dow === 0 ? 1.1 : 1;
  const noise = 0.82 + r() * 0.36;
  // A rare bad day (~7% of days) to make "needs attention" demonstrable
  const slump = r() < 0.07 ? 0.55 : 1;
  return Math.round(base * weekend * noise * slump);
}

function dailyOrders(branch: string, date: Date): number {
  const aov = 38 + rng(branch, "aov")() * 34; // AED 38–72 per order
  return Math.max(1, Math.round(dailyRevenue(branch, date) / aov));
}

/** Hourly demand curve — lunch + dinner peaks, light late-night delivery tail. */
const HOURLY_CURVE = [
  2, 1, 0.5, 0, 0, 0, 0.5, 1, 1.5, 2, 3, 6, 10, 9, 5, 3, 3, 4, 7, 11, 13, 10, 7, 4,
];
const HOURLY_TOTAL = HOURLY_CURVE.reduce((s, v) => s + v, 0);

/** Fraction of a day's business completed by the current hour. */
function intradayFraction(hour: number): number {
  let done = 0;
  for (let h = 0; h <= Math.min(hour, 23); h++) done += HOURLY_CURVE[h];
  return done / HOURLY_TOTAL;
}

function rangeDays(range: DateRange, now = new Date()): Date[] {
  const days: Date[] = [];
  let from: Date;
  let to: Date;
  if (range.kind === "today") {
    from = to = now;
  } else if (range.kind === "7d") {
    from = new Date(now.getTime() - 6 * DAY_MS);
    to = now;
  } else if (range.kind === "30d") {
    from = new Date(now.getTime() - 29 * DAY_MS);
    to = now;
  } else {
    from = range.from;
    to = range.to;
  }
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
    days.push(new Date(t));
  }
  return days.length ? days : [now];
}

/**
 * Sum a range of days. When `partialLastDay` is set, the final day only counts
 * business up to the current hour — apply it to BOTH the current range and its
 * previous-period twin so "vs yesterday" compares the same time-of-day.
 */
function sumRange(
  branch: string,
  days: Date[],
  now: Date,
  partialLastDay: boolean,
): { revenue: number; orders: number } {
  let revenue = 0;
  let orders = 0;
  const frac = intradayFraction(now.getHours());
  const last = days.length - 1;
  for (let i = 0; i < days.length; i++) {
    const partial = partialLastDay && i === last ? frac : 1;
    revenue += dailyRevenue(branch, days[i]) * partial;
    orders += dailyOrders(branch, days[i]) * partial;
  }
  return { revenue: Math.round(revenue), orders: Math.round(orders) };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getLocationSnapshot(branch: string, range: DateRange, now = new Date()): LocationSnapshot {
  const days = rangeDays(range, now);
  const endsToday = dayKey(days[days.length - 1]) === dayKey(now);
  const { revenue, orders } = sumRange(branch, days, now, endsToday);

  // Previous equivalent period, truncated at the same time-of-day
  const spanMs = days.length * DAY_MS;
  const prevDays = days.map((d) => new Date(d.getTime() - spanMs));
  const prev = sumRange(branch, prevDays, now, endsToday);
  const deltaPct = prev.revenue > 0 ? ((revenue - prev.revenue) / prev.revenue) * 100 : 0;

  // 7-day daily average (full days, excluding today)
  let sevenDaySum = 0;
  for (let i = 1; i <= 7; i++) {
    sevenDaySum += dailyRevenue(branch, new Date(now.getTime() - i * DAY_MS));
  }
  const sevenDayAvg = sevenDaySum / 7;
  const frac = intradayFraction(now.getHours());
  // Project the partial last day to a full-day rate; too early in the day
  // there's no signal, so don't flag anomalies before ~10% of business is done.
  const effectiveDays = days.length - (endsToday ? 1 - frac : 0);
  const perDay = effectiveDays > 0 ? revenue / effectiveDays : 0;
  const tooEarly = days.length === 1 && endsToday && frac < 0.1;
  const vsSevenDayPct =
    !tooEarly && sevenDayAvg > 0 ? ((perDay - sevenDayAvg) / sevenDayAvg) * 100 : 0;

  const sparkline: number[] = [];
  for (let i = 13; i >= 0; i--) {
    sparkline.push(dailyRevenue(branch, new Date(now.getTime() - i * DAY_MS)));
  }

  const pendingIssues = Math.floor(rng(branch, "issues", dayKey(now))() * 3.4);

  return {
    branch,
    revenue,
    orders,
    avgOrder: orders > 0 ? revenue / orders : 0,
    deltaPct,
    vsSevenDayPct,
    sparkline,
    pendingIssues,
  };
}

export function getSnapshots(branches: string[], range: DateRange, now = new Date()): LocationSnapshot[] {
  return branches.map((b) => getLocationSnapshot(b, range, now));
}

/** Anomalies worth the owner's attention, worst first. */
export function getAttentionItems(snapshots: LocationSnapshot[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const s of snapshots) {
    if (s.vsSevenDayPct <= -25) {
      items.push({
        branch: s.branch,
        severity: "critical",
        message: `Revenue down ${Math.abs(s.vsSevenDayPct).toFixed(0)}% vs its 7-day average`,
      });
    } else if (s.vsSevenDayPct <= -12) {
      items.push({
        branch: s.branch,
        severity: "warning",
        message: `Trailing its 7-day average by ${Math.abs(s.vsSevenDayPct).toFixed(0)}%`,
      });
    }
    if (s.pendingIssues >= 2) {
      items.push({
        branch: s.branch,
        severity: "warning",
        message: `${s.pendingIssues} pending issues need review`,
      });
    }
  }
  const rank = { critical: 0, warning: 1 } as const;
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Revenue per day for every branch — the overlaid comparison chart. */
export function getComparisonSeries(branches: string[], range: DateRange, now = new Date()): ComparisonSeries {
  const days = rangeDays(range.kind === "today" ? { kind: "7d" } : range, now);
  const labels = days.map((d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );
  return {
    labels,
    series: branches.map((branch) => ({
      branch,
      values: days.map((d) => dailyRevenue(branch, d)),
    })),
  };
}

/** Hourly revenue curve for one branch (today). */
export function getHourlySales(branch: string, now = new Date()): { labels: string[]; values: number[] } {
  const total = dailyRevenue(branch, now);
  const r = rng(branch, "hourly", dayKey(now));
  const currentHour = now.getHours();
  const labels: string[] = [];
  const values: number[] = [];
  for (let h = 0; h < 24; h++) {
    labels.push(`${String(h).padStart(2, "0")}:00`);
    const jitter = 0.75 + r() * 0.5;
    values.push(
      h <= currentHour ? Math.round((total * HOURLY_CURVE[h] * jitter) / HOURLY_TOTAL) : 0,
    );
  }
  return { labels, values };
}

const MENU = [
  "Chicken Biryani",
  "Butter Chicken",
  "Paneer Butter Masala",
  "Pizza Margherita",
  "Hakka Noodles",
  "Veg Fried Rice",
  "Pasta Alfredo",
  "Veg Burger",
  "Grilled Salmon",
  "Caesar Salad",
];

const CHANNELS: RecentOrder["channel"][] = ["Dine-in", "Takeaway", "Delivery", "Online"];

export function getRecentOrders(branch: string, count = 25, now = new Date()): RecentOrder[] {
  const r = rng(branch, "orders", dayKey(now));
  const orders: RecentOrder[] = [];
  let minutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < count; i++) {
    minutes -= Math.round(r() * 22 + 3);
    if (minutes < 6 * 60) break;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const itemCount = 1 + Math.floor(r() * 3);
    const names = Array.from(
      { length: itemCount },
      () => MENU[Math.floor(r() * MENU.length)],
    );
    const status: RecentOrder["status"] =
      i < 2 && r() < 0.5 ? "preparing" : r() < 0.04 ? "cancelled" : "completed";
    orders.push({
      id: `#${(hashString(`${branch}${dayKey(now)}${i}`) % 90000) + 10000}`,
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      items: names.join(", "),
      channel: CHANNELS[Math.floor(r() * CHANNELS.length)],
      amount: Math.round((22 + r() * 160) * 100) / 100,
      status,
    });
  }
  return orders;
}

export function getTopItems(branch: string, now = new Date()): { item: string; revenue: number; pct: number }[] {
  const r = rng(branch, "top", dayKey(now));
  const picks = [...MENU].sort(() => r() - 0.5).slice(0, 5);
  const revenues = picks.map(() => 800 + r() * 4200);
  const total = revenues.reduce((s, v) => s + v, 0);
  return picks
    .map((item, i) => ({
      item,
      revenue: Math.round(revenues[i]),
      pct: (revenues[i] / total) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
