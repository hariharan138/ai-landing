import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-[13px]",
} as const;

const BG_COLORS = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-info/15 text-info",
  "bg-destructive/15 text-destructive",
  "bg-chart-4/15 text-chart-4",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function ItemAvatar({
  name,
  size = "md",
  variant = "initials",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "initials" | "photo";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const colorIdx = hashCode(name) % BG_COLORS.length;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-bold select-none",
        SIZE_MAP[size],
        BG_COLORS[colorIdx],
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
