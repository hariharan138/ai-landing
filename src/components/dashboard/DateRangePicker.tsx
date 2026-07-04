import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateRange } from "@/contexts/DateRangeContext";

const PRESETS = [
  { kind: "today", label: "Today" },
  { kind: "7d", label: "7d" },
  { kind: "30d", label: "30d" },
] as const;

/** Global date range — Today / 7d / 30d presets plus a custom calendar range. */
export function DateRangePicker() {
  const { range, setRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>();

  const customLabel =
    range.kind === "custom"
      ? `${range.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${range.to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : "Custom";

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1">
      {PRESETS.map((p) => (
        <button
          key={p.kind}
          onClick={() => setRange({ kind: p.kind })}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 ease-out",
            range.kind === p.kind
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 ease-out",
              range.kind === "custom"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {customLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-auto rounded-xl border-border bg-popover p-0">
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={draft}
            onSelect={(next) => {
              setDraft(next);
              if (next?.from && next?.to) {
                setRange({ kind: "custom", from: next.from, to: next.to });
                setOpen(false);
              }
            }}
            disabled={{ after: new Date() }}
            defaultMonth={range.kind === "custom" ? range.from : new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
