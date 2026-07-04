import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { NavBar } from "@/components/NavBar";

export const Route = createFileRoute("/software")({
  head: () => ({
    meta: [
      { title: "Our Software — Agorix" },
      {
        name: "description",
        content:
          "Our software powers realtime AI-driven analysis and decision making through an AI+Human loop.",
      },
      { property: "og:title", content: "Our Software — Agorix" },
      {
        property: "og:description",
        content: "Realtime AI-driven analysis and AI+Human loop decision making.",
      },
    ],
  }),
  component: SoftwarePage,
});

/* ─── Animated counter ─────────────────────────────────────────────────── */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Platform card ────────────────────────────────────────────────────── */
function PlatformCard({
  number,
  tag,
  title,
  description,
  cta,
  accent,
}: {
  number?: string;
  tag: string;
  title: string;
  description: string;
  cta: string;
  accent: string;
}) {
  return (
    <div className="sw-card group">
      {number && <div className="sw-card-number">{number}</div>}
      <div className="sw-card-tag" style={{ color: accent }}>
        ↳ {tag}
      </div>
      <h3 className="sw-card-title">{title}</h3>
      <p className="sw-card-desc">{description}</p>
      <a href="#contact" className="sw-card-cta" style={{ color: accent }}>
        {cta} →
      </a>
      <div className="sw-card-line" style={{ background: accent }} />
    </div>
  );
}

/* ─── Loop step ────────────────────────────────────────────────────────── */
function LoopStep({
  icon,
  label,
  sub,
  delay,
}: {
  icon: string;
  label: string;
  sub: string;
  delay: string;
}) {
  return (
    <div className="loop-step" style={{ animationDelay: delay }}>
      <div className="loop-icon">{icon}</div>
      <div className="loop-label">{label}</div>
      <div className="loop-sub">{sub}</div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
function SoftwarePage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "realtime",
      label: "Realtime Analysis",
      content: {
        heading: "Sub-second intelligence at scale",
        body: "Our inference engine processes millions of data signals per second — fusing sensor feeds, market data, and operational telemetry into a unified decision surface. No batch jobs. No stale dashboards. Pure realtime.",
        bullets: [
          "< 50ms p99 latency on live data streams",
          "Petabyte-scale data federation with zero-copy reads",
          "Multi-modal fusion: structured, unstructured, time-series",
          "Continuous model serving with automatic drift detection",
        ],
      },
    },
    {
      id: "decisions",
      label: "AI Decision Engine",
      content: {
        heading: "From signal to action in milliseconds",
        body: "The decision engine doesn't just surface insights — it recommends, prioritizes, and routes actions to the right humans or automated systems. Every decision is auditable, explainable, and reversible.",
        bullets: [
          "Probabilistic scoring with calibrated confidence intervals",
          "Multi-objective optimization across competing constraints",
          "Full audit trail with causal chain visualization",
          "Human-readable rationale for every AI recommendation",
        ],
      },
    },
    {
      id: "loop",
      label: "AI+Human Loop",
      content: {
        heading: "Humans in the loop, never out of the picture",
        body: "We believe the most powerful decisions emerge when AI amplifies human judgment rather than replacing it. Our loop architecture ensures humans can inspect, override, and teach the system at every step.",
        bullets: [
          "One-click human override at any decision node",
          "Active learning from operator corrections",
          "Confidence-gated escalation to human experts",
          "Role-based decision authority with full traceability",
        ],
      },
    },
  ];

  return (
    <main className="sw-root">
      {/* ── Shared styles ──────────────────────────────────────────────── */}
      <style>{`
        .sw-root {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f0f0f0;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* HERO */
        .sw-hero {
          position: relative;
          padding: 8rem 2.5rem 6rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .sw-hero-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .sw-hero-eyebrow::before {
          content: '';
          display: block;
          width: 2rem;
          height: 1px;
          background: rgba(255,255,255,0.25);
        }
        .sw-hero-h1 {
          font-size: clamp(3rem, 7vw, 6rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.04em;
          margin-bottom: 2rem;
          max-width: 820px;
        }
        .sw-hero-h1 em {
          font-style: normal;
          background: linear-gradient(135deg, #7c6fff 0%, #5bc8ff 60%, #a8ff78 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sw-hero-sub {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.55);
          max-width: 520px;
          line-height: 1.7;
          margin-bottom: 3rem;
        }
        .sw-hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sw-btn-primary {
          background: #fff;
          color: #0b0b0d;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          padding: 0.85rem 2rem;
          border-radius: 4px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .sw-btn-primary:hover { background: #d4d4d4; transform: translateY(-2px); }
        .sw-btn-outline {
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.75);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          padding: 0.85rem 2rem;
          border-radius: 4px;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, transform 0.15s;
        }
        .sw-btn-outline:hover { border-color: rgba(255,255,255,0.5); color: #fff; transform: translateY(-2px); }

        /* DIVIDER */
        .sw-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 2.5rem;
        }

        /* STATS BAR */
        .sw-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0;
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sw-stat {
          padding: 1.5rem 2rem;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .sw-stat:last-child { border-right: none; }
        .sw-stat-num {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .sw-stat-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.12em;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* SECTION HEADING */
        .sw-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 6rem 2.5rem;
        }
        .sw-section-tag {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.35);
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }
        .sw-section-h2 {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 1.5rem;
          max-width: 700px;
        }
        .sw-section-body {
          font-size: 1rem;
          color: rgba(255,255,255,0.5);
          max-width: 560px;
          line-height: 1.75;
          margin-bottom: 3rem;
        }

        /* PLATFORM CARDS */
        .sw-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          overflow: hidden;
        }
        .sw-card {
          position: relative;
          background: #0e0e11;
          padding: 2.5rem 2rem;
          overflow: hidden;
          transition: background 0.25s;
          cursor: default;
        }
        .sw-card:hover { background: #131318; }
        .sw-card-number {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.2);
          margin-bottom: 1rem;
        }
        .sw-card-tag {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 1.25rem;
        }
        .sw-card-title {
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .sw-card-desc {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          margin-bottom: 1.75rem;
        }
        .sw-card-cta {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .sw-card-cta:hover { opacity: 0.7; }
        .sw-card-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          transition: width 0.4s ease;
        }
        .sw-card:hover .sw-card-line { width: 100%; }

        /* TABS */
        .sw-tabs-wrap {
          background: #0e0e11;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          overflow: hidden;
        }
        .sw-tabs-bar {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          overflow-x: auto;
        }
        .sw-tab-btn {
          flex: 1;
          padding: 1.1rem 1.5rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.4);
          border: none;
          background: transparent;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
          position: relative;
        }
        .sw-tab-btn.active {
          color: #fff;
          background: rgba(255,255,255,0.04);
        }
        .sw-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #7c6fff, #5bc8ff);
        }
        .sw-tab-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 768px) {
          .sw-tab-content { grid-template-columns: 1fr; }
        }
        .sw-tab-left {
          padding: 3rem 2.5rem;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        @media (max-width: 768px) {
          .sw-tab-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); }
        }
        .sw-tab-right {
          padding: 3rem 2.5rem;
        }
        .sw-tab-heading {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
          line-height: 1.15;
        }
        .sw-tab-body {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.75;
        }
        .sw-tab-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sw-tab-bullets li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.5;
        }
        .sw-tab-bullets li::before {
          content: '—';
          color: rgba(255,255,255,0.25);
          flex-shrink: 0;
          margin-top: 0.05em;
        }

        /* AI+HUMAN LOOP */
        .sw-loop-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 6rem 2.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .sw-loop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 3rem;
          position: relative;
        }
        .loop-step {
          background: #0e0e11;
          padding: 2.5rem 1.75rem;
          text-align: center;
          animation: fadeUp 0.6s both;
          transition: background 0.25s;
        }
        .loop-step:hover { background: #131318; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loop-icon {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          filter: grayscale(0.3);
        }
        .loop-label {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          color: #fff;
        }
        .loop-sub {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.55;
        }
        .sw-loop-arrow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,111,255,0.3), rgba(91,200,255,0.3), transparent);
          pointer-events: none;
        }

        /* QUOTE STRIP */
        .sw-quote-strip {
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 5rem 2.5rem;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .sw-quote {
          font-size: clamp(1.25rem, 2.5vw, 2rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.35;
          color: rgba(255,255,255,0.9);
          margin-bottom: 1.5rem;
        }
        .sw-quote-attr {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.15em;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* CTA BAND */
        .sw-cta-band {
          max-width: 1200px;
          margin: 0 auto;
          padding: 6rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .sw-cta-heading {
          font-size: clamp(1.75rem, 3.5vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          max-width: 500px;
          line-height: 1.1;
        }

        /* FOOTER */
        .sw-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 2rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.3);
          flex-wrap: wrap;
          gap: 1rem;
        }
        .sw-footer a { color: inherit; text-decoration: none; }
        .sw-footer a:hover { color: rgba(255,255,255,0.6); }
      `}</style>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <NavBar />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="sw-hero">
        <div className="sw-hero-eyebrow">OUR SOFTWARE</div>
        <h1 className="sw-hero-h1">
          Our software powers <em>realtime AI-driven</em> analysis and decision
        </h1>
        <p className="sw-hero-sub">
          From raw signal to decisive action in milliseconds. Built on an AI+Human loop that keeps
          operators in command and machines in service.
        </p>
        <div className="sw-hero-actions">
          <a href="#platforms" className="sw-btn-primary">
            EXPLORE PLATFORMS
          </a>
          <a href="#loop" className="sw-btn-outline">
            SEE THE AI+HUMAN LOOP
          </a>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      {/* <div className="sw-stats">
        {[
          { target: 50, suffix: "ms", prefix: "<", label: "P99 Latency" },
          { target: 10, suffix: "PB+", label: "Data Processed Daily" },
          { target: 99, suffix: ".99%", label: "Uptime SLA" },
          { target: 130, suffix: "+", label: "Enterprise Deployments" },
        ].map((s) => (
          <div className="sw-stat" key={s.label}>
            <div className="sw-stat-num">
              <AnimatedCounter
                target={s.target}
                suffix={s.suffix}
                prefix={s.prefix}
              />
            </div>
            <div className="sw-stat-label">{s.label}</div>
          </div>
        ))}
      </div> */}

      {/* ── Platform cards ──────────────────────────────────────────────── */}
      <section className="sw-section" id="platforms">
        <div className="sw-section-tag">↳ Platforms</div>
        <h2 className="sw-section-h2">Foundational Software of Tomorrow. Delivered Today.</h2>
        <p className="sw-section-body">
          Every platform is purpose-built for the hardest operational environments — from
          battlefield command to enterprise supply chains.
        </p>
        <div className="sw-cards-grid">
          <PlatformCard
            number="01 ——"
            tag="AIP"
            title="Get AI Into Operations"
            description="Deploy large language models and generative AI directly into your most critical workflows. From zero to use case in days, not months."
            cta="Explore AIP"
            accent="#7c6fff"
          />
          <PlatformCard
            number="02 ——"
            tag="NEXUS"
            title="Realtime Decision Intelligence"
            description="A unified command surface that fuses live sensor data, predictive models, and operator judgment into one coherent operational picture."
            cta="Explore Nexus"
            accent="#5bc8ff"
          />
          <PlatformCard
            number="03 ——"
            tag="FOUNDRY"
            title="Operating System for the Enterprise"
            description="Connect every data source, transform it into living ontologies, and build applications your teams actually use — no-code to full-code."
            cta="Explore Foundry"
            accent="#a8ff78"
          />
          <PlatformCard
            number="04 ——"
            tag="APOLLO"
            title="Continuous Delivery at Any Scale"
            description="Software orchestration that keeps AI models and applications current across every environment — cloud, on-prem, disconnected, and classified."
            cta="Explore Apollo"
            accent="#ffb347"
          />
        </div>
      </section>

      {/* ── Tabs: capabilities ──────────────────────────────────────────── */}
      <section className="sw-section" style={{ paddingTop: 0 }}>
        <div className="sw-section-tag">↳ Capabilities</div>
        <h2 className="sw-section-h2">Three capabilities. One coherent operating picture.</h2>
        <div className="sw-tabs-wrap">
          <div className="sw-tabs-bar">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                className={`sw-tab-btn${activeTab === i ? " active" : ""}`}
                onClick={() => setActiveTab(i)}
              >
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="sw-tab-content">
            <div className="sw-tab-left">
              <h3 className="sw-tab-heading">{tabs[activeTab].content.heading}</h3>
              <p className="sw-tab-body">{tabs[activeTab].content.body}</p>
            </div>
            <div className="sw-tab-right">
              <ul className="sw-tab-bullets">
                {tabs[activeTab].content.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI+Human loop ───────────────────────────────────────────────── */}
      <section className="sw-loop-section" id="loop">
        <div className="sw-section-tag">↳ AI+Human Loop Decision</div>
        <h2 className="sw-section-h2">AI+Human loop decision making</h2>
        <p className="sw-section-body">
          The loop never closes without a human checkpoint. Every AI recommendation is inspectable,
          overrideable, and teaches the system to be better next time.
        </p>
        <div className="sw-loop-grid">
          <div className="sw-loop-arrow" />
          <LoopStep
            icon="📡"
            label="Ingest"
            sub="Live streams, sensors, APIs, and unstructured feeds unified in realtime"
            delay="0ms"
          />
          <LoopStep
            icon="🧠"
            label="Analyze"
            sub="Multi-model inference fuses data into a ranked, explainable intelligence layer"
            delay="80ms"
          />
          <LoopStep
            icon="⚡"
            label="Recommend"
            sub="The AI surfaces prioritized actions with calibrated confidence and rationale"
            delay="160ms"
          />
          <LoopStep
            icon="👤"
            label="Human Review"
            sub="Operators inspect, approve, modify, or override every AI recommendation"
            delay="240ms"
          />
          <LoopStep
            icon="🎯"
            label="Act"
            sub="Approved decisions execute instantly across connected systems and workflows"
            delay="320ms"
          />
          <LoopStep
            icon="🔄"
            label="Learn"
            sub="Every human correction feeds back, continuously improving model accuracy"
            delay="400ms"
          />
        </div>
      </section>

      {/* ── Quote ───────────────────────────────────────────────────────── */}
      <div className="sw-quote-strip">
        <p className="sw-quote">
          "The most powerful decisions emerge when AI amplifies human judgment — not when it
          replaces it."
        </p>
        <div className="sw-quote-attr">— Agorix Software Design Principles</div>
      </div>

      {/* ── CTA band ────────────────────────────────────────────────────── */}
      <div className="sw-cta-band" id="contact">
        <h2 className="sw-cta-heading">Ready to get AI into your operations?</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="#schedule" className="sw-btn-primary">
            SCHEDULE A DEMO
          </a>
          <a href="#bootcamp" className="sw-btn-outline">
            RUN A BOOTCAMP
          </a>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="sw-footer">
        <span>© 2025 Agorix. All rights reserved.</span>
        <div style={{ display: "flex", gap: "2rem" }}>
          <a href="/software">Software</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#security">Security</a>
        </div>
      </footer>
    </main>
  );
}
