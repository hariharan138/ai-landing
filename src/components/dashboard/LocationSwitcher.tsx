import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranchFilter } from "@/contexts/BranchFilterContext";

/**
 * Restaurant switcher — "All Locations" plus one chip per location, each with
 * its fixed identity dot. Scrolls horizontally on narrow screens.
 */
export function LocationSwitcher() {
  const { branch, setBranch, locations, isLoadingBranches } = useBranchFilter();

  if (isLoadingBranches) {
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 shrink-0 rounded-full skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Switch location"
      className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1"
    >
      <button
        role="tab"
        aria-selected={branch === "all"}
        onClick={() => setBranch("all")}
        className={cn(
          "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold",
          "transition-all duration-200 ease-out",
          branch === "all"
            ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_12px_var(--color-primary-soft)]"
            : "border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground",
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        All Locations
      </button>

      {locations.map((loc) => {
        const active = branch === loc.name;
        return (
          <button
            key={loc.name}
            role="tab"
            aria-selected={active}
            onClick={() => setBranch(loc.name)}
            style={{ "--loc": loc.color } as React.CSSProperties}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold",
              "transition-all duration-200 ease-out",
              active
                ? "text-foreground border-[color-mix(in_oklch,var(--loc)_60%,transparent)] bg-[color-mix(in_oklch,var(--loc)_14%,transparent)]"
                : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-[color-mix(in_oklch,var(--loc)_45%,var(--color-border))]",
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: loc.color }}
            />
            {loc.name}
          </button>
        );
      })}
    </div>
  );
}
