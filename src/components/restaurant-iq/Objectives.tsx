import { Eye, Recycle, ShoppingBag, FileText, Zap, Database, TrendingUp } from "lucide-react";

const objectives = [
  {
    icon: Eye,
    title: "Operational Visibility",
    desc: "See every branch, every metric, in one pane of glass.",
  },
  {
    icon: Recycle,
    title: "Cut Wastage & Shortages",
    desc: "Lower spoilage and end stock-outs with predictive par levels.",
  },
  {
    icon: ShoppingBag,
    title: "Smarter Purchasing",
    desc: "Buy what you'll actually sell — not what you guessed last week.",
  },
  {
    icon: FileText,
    title: "Less Manual Reporting",
    desc: "Auto-generated daily, weekly, and monthly reports on WhatsApp.",
  },
  {
    icon: Zap,
    title: "Faster Response",
    desc: "Real-time alerts surface issues the moment they happen.",
  },
  {
    icon: Database,
    title: "Data-Driven Decisions",
    desc: "Replace gut-feel with clean, reconciled numbers.",
  },
  {
    icon: TrendingUp,
    title: "Higher Profitability",
    desc: "Tighten margins through cost control and menu engineering.",
  },
];

export function Objectives() {
  return (
    <section id="objectives" className="bg-section-objectives py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary-dark">
            <span className="h-px w-8 bg-primary" />
            Business Objectives
            <span className="h-px w-8 bg-primary" />
          </div>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Built to move the metrics that matter
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {objectives.map((o) => (
            <div
              key={o.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-[0_18px_40px_-20px_rgba(2,6,23,0.18)]"
            >
              <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-primary-soft text-primary-dark">
                <o.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">{o.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{o.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
