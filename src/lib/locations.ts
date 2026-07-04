/**
 * Location identity — one fixed color per restaurant location.
 *
 * Colors are assigned by the location's index in the branch list and NEVER
 * re-cycled or re-ranked, so "Marina Walk" keeps its hue across every chart,
 * dot, and card. Keep in sync with --chart-1..5 in styles.css and
 * CHART_PALETTE in components/dashboard/shared.tsx.
 */

export const LOCATION_COLORS = [
  "var(--color-chart-1)", // cyan   #0891B2
  "var(--color-chart-2)", // rose   #F43F5E
  "var(--color-chart-3)", // violet #8B5CF6
  "var(--color-chart-4)", // orange #D97706
  "var(--color-chart-5)", // teal   #0D9488
] as const;

/** Fallback location names when the backend has no branch data yet. */
export const MOCK_BRANCHES = [
  "Downtown",
  "Marina Walk",
  "Jumeirah",
  "Deira City",
  "Al Barsha",
] as const;

export function locationColor(index: number): string {
  return LOCATION_COLORS[index % LOCATION_COLORS.length];
}

export interface Location {
  name: string;
  color: string;
  index: number;
}

export function toLocations(branches: string[]): Location[] {
  return branches.map((name, index) => ({ name, color: locationColor(index), index }));
}
