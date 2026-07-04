import { LayoutDashboard, BarChart3, Bell } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-20px_rgba(2,6,23,0.18)]">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
          <span className="h-3 w-3 rounded-full bg-muted-foreground/50" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">
            Agorix · Operations Dashboard
          </span>
        </div>

        <div className="grid grid-cols-[140px_1fr]">
          <aside className="border-r border-border bg-secondary/30 p-3">
            <div className="space-y-1">
              {[
                { icon: LayoutDashboard, label: "Overview", active: true },
                { icon: BarChart3, label: "Analytics" },
                { icon: Bell, label: "Alerts" },
              ].map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-3">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-secondary" />
                  <div className="mt-3 h-5 w-20 animate-pulse rounded bg-secondary/80" />
                  <div className="mt-2 h-2 w-24 animate-pulse rounded bg-secondary/60" />
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 h-3 w-32 animate-pulse rounded bg-secondary" />
              <div className="flex h-28 items-end justify-between gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full animate-pulse rounded-t bg-secondary/70"
                      style={{ height: `${35 + (i % 4) * 12}%` }}
                    />
                    <div className="h-2 w-6 animate-pulse rounded bg-secondary/50" />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Connect POS &amp; Tally to populate live metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
