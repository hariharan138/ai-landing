import { Store, Building2, Coffee, CloudCog, Users } from "lucide-react";

const users = [
  {
    icon: Store,
    title: "Restaurant Owners",
    desc: "Single-outlet operators who want clarity without hiring an analyst.",
  },
  {
    icon: Building2,
    title: "Multi-Branch Operators",
    desc: "Groups running 3+ outlets needing one unified view of performance.",
  },
  {
    icon: Coffee,
    title: "Cafe Owners",
    desc: "Specialty cafes optimising ingredient costs and daily prep.",
  },
  {
    icon: CloudCog,
    title: "Cloud Kitchen Operators",
    desc: "Delivery-first brands juggling Swiggy, Zomato, and direct orders.",
  },
  {
    icon: Users,
    title: "Small Food Business Managers",
    desc: "QSRs, bakeries, and tiffin services scaling without losing control.",
  },
];

export function TargetUsers() {
  return (
    <section id="users" className="bg-section-users py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary-dark">
            <span className="h-px w-8 bg-primary" />
            Who It's For
            <span className="h-px w-8 bg-primary" />
          </div>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Built for food businesses of every shape
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <div
              key={u.title}
              className="group rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_50px_-20px_rgba(2,6,23,0.18)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_25px_-10px_rgba(20,184,166,0.25)]">
                <u.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-foreground">{u.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
