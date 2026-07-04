import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardService, type Period } from "@/services/dashboardService";
import { DASHBOARD_LIVE_QUERY, CHART_PALETTE, paletteColor, fmtCurrency } from "./shared";
import { useBranchFilter } from "@/contexts/BranchFilterContext";

export function ChannelBreakdown({ period }: { period: Period }) {
  const { branch } = useBranchFilter();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "channels", period, branch],
    queryFn: () => dashboardService.getChannelBreakdown(period, branch),
    ...DASHBOARD_LIVE_QUERY,
  });

  return (
    <Card className="flex flex-col border border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/40 px-4 pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[12px] font-bold text-foreground">Sales by Channel</CardTitle>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-[9px] font-bold text-primary"
          >
            Live · POS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground py-4">
            No channel data
          </div>
        ) : (
          <>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={data.items}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={60}
                    paddingAngle={2}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    animationDuration={800}
                  >
                    {data.items.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: 10, lineHeight: "16px", paddingTop: 4 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 space-y-1">
              {data.items.map((ch, i) => (
                <div
                  key={ch.name}
                  className="flex items-center justify-between text-[10px] rounded-md px-1 py-0.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: paletteColor(i) }}
                    />
                    <span className="truncate font-medium text-foreground">{ch.name}</span>
                  </div>
                  <span className="shrink-0 font-bold tabular-nums text-foreground">
                    {fmtCurrency(ch.value, data.currency)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
