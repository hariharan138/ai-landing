import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This page is being rebuilt.</p>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center backdrop-blur-xl">
        <p className="text-muted-foreground">Content coming soon.</p>
      </div>
    </div>
  );
}
