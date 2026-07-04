import { LayoutDashboard, AlertTriangle, ChefHat, Calendar, Truck, Sparkles } from "lucide-react";

const sidebar = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: AlertTriangle, label: "Leakage" },
  { icon: ChefHat, label: "Menu Eng." },
  { icon: Calendar, label: "Calendar" },
  { icon: Truck, label: "Suppliers" },
  { icon: Sparkles, label: "Ask AI" },
];

const kpis = [
  { label: "Revenue", value: "$1,450", tone: "text-white", sub: "+12% vs yesterday" },
  { label: "Food Cost %", value: "34.1%", tone: "text-white/80", sub: "Target 30%" },
  { label: "Gross Margin", value: "65.9%", tone: "text-foreground", sub: "Healthy" },
  { label: "Alerts", value: "2 Critical", tone: "text-destructive", sub: "Needs review" },
];

const bars = [
  { d: "Mon", r: 60, c: 38 },
  { d: "Tue", r: 72, c: 34 },
  { d: "Wed", r: 55, c: 40 },
  { d: "Thu", r: 80, c: 32 },
  { d: "Fri", r: 92, c: 36 },
  { d: "Sat", r: 100, c: 33 },
  { d: "Sun", r: 78, c: 35 },
];

const alerts = [
  { dot: "bg-destructive", text: "Cheese variance +30%" },
  { dot: "bg-white/40", text: "Olive oil below par" },
  { dot: "bg-white/30", text: "Friday event: prep now" },
  { dot: "bg-primary", text: "WhatsApp report sent" },
];

export function MockDashboard() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-white/5 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-20px_rgba(2,6,23,0.25)]">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-destructive/80" />
          <span className="h-3 w-3 rounded-full bg-white/30" />
          <span className="h-3 w-3 rounded-full bg-white/50" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">
            RestaurantIQ · Spice Garden Main
          </span>
        </div>

        <div className="grid grid-cols-[160px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-border bg-secondary/40 p-3">
            <div className="space-y-1">
              {sidebar.map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                    s.active ? "bg-primary-soft text-primary-dark" : "text-muted-foreground"
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
              ))}
            </div>
          </aside>

          {/* Main */}
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-background p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </div>
                  <div className={`mt-1 font-display text-lg font-bold ${k.tone}`}>{k.value}</div>
                  <div className="text-[10px] text-muted-foreground">{k.sub}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold">Revenue vs Food Cost</div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-white" /> Revenue
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-white/50" /> Cost %
                  </span>
                </div>
              </div>
              <div className="flex h-28 items-end justify-between gap-2">
                {bars.map((b) => (
                  <div key={b.d} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-24 w-full items-end justify-center gap-0.5">
                      <div className="w-1/2 rounded-t bg-white/80" style={{ height: `${b.r}%` }} />
                      <div className="w-1/2 rounded-t bg-white/40" style={{ height: `${b.c}%` }} />
                    </div>
                    <div className="text-[9px] text-muted-foreground">{b.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="mb-2 text-xs font-semibold">Live Alerts</div>
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li key={a.text} className="flex items-center gap-2 text-xs text-foreground/80">
                    <span className={`h-2 w-2 rounded-full ${a.dot}`} />
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
