import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Antenna, Brain, Crosshair, RefreshCw, User, Zap } from "lucide-react";
import { AgorixHero } from "@/components/AgorixHero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agorix — The Superintelligence AI-Automation" },
      {
        name: "description",
        content: "AI-Powered Operating system. Launch a GPU instance or talk to our team.",
      },
      { property: "og:title", content: "Agorix — The Superintelligence AI-Automation" },
      { property: "og:description", content: "AI-Powered Operating system." },
    ],
  }),
  component: Index,
});

/* ─── Glitch heading ─────────────────────────────────────────────────────── */
function GlitchHeading({ text }: { text: string }) {
  const [glitchSet, setGlitchSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const indices = text
      .split("")
      .map((c, i) => ({ c, i }))
      .filter((x) => /[A-Za-z]/.test(x.c))
      .map((x) => x.i);

    const pickRandom = () => {
      const count = Math.max(2, Math.floor(Math.random() * 4) + 2);
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      setGlitchSet(new Set(shuffled.slice(0, count)));
    };

    pickRandom();
    const id = window.setInterval(pickRandom, 1600);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <h1 className="max-w-5xl text-6xl font-bold leading-[0.95] tracking-tight md:text-8xl">
      {text.split("").map((char, i) => {
        if (char === "\n") return <br key={i} />;
        if (char === " ") return <span key={i}>&nbsp;</span>;
        return (
          <span key={i} className={glitchSet.has(i) ? "glitch-letter" : "inline-block"}>
            {char}
          </span>
        );
      })}
    </h1>
  );
}

/* ─── Particle field ─────────────────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: P[] = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.floor((width * height) / 14000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2 + 1.2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (14000 - d2) / 14000;
          p.x += (dx / Math.sqrt(d2 || 1)) * f * 1.2;
          p.y += (dy / Math.sqrt(d2 || 1)) * f * 1.2;
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const alpha = (1 - d2 / 16000) * 0.7;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.shadowColor = "rgba(180,220,255,0.9)";
      ctx.shadowBlur = 8;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
    />
  );
}

/* ─── Scroll reveal hook ─────────────────────────────────────────────────── */
function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Animated counter ───────────────────────────────────────────────────── */
function Counter({
  to,
  suffix = "",
  prefix = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const dur = 1600;
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Typing text ────────────────────────────────────────────────────────── */
function TypeWriter({ lines }: { lines: string[] }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = lines[lineIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), 55);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), 28);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setLineIdx((i) => (i + 1) % lines.length);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, lineIdx, lines]);

  return (
    <span>
      {lines[lineIdx].slice(0, charIdx)}
      <span className="sw-cursor">|</span>
    </span>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
function Index() {
  const [activeTab, setActiveTab] = useState(0);

  const sec1 = useReveal();
  const sec2 = useReveal();
  const sec3 = useReveal();
  const sec4 = useReveal();
  const sec5 = useReveal();
  const sec6 = useReveal();

  const platforms = [
    {
      num: "01",
      arrow: "↳ AIP",
      title: "Get AI Into Operations",
      desc: "Deploy large language models directly into your most critical workflows. Zero to use-case in days — not months.",
      accent: "#a78bfa",
    },
    {
      num: "02",
      arrow: "↳ NEXUS",
      title: "Realtime Decision Intelligence",
      desc: "A unified command surface that fuses live sensor feeds, predictive models, and human judgment into one coherent picture.",
      accent: "#38bdf8",
    },
    {
      num: "03",
      arrow: "↳ SYNAPSE",
      title: "Operating System for the Enterprise",
      desc: "Connect every data source, transform it into living ontologies, and build applications your teams actually use.",
      accent: "#4ade80",
    },
    {
      num: "04",
      arrow: "↳ BOSON",
      title: "Continuous Delivery at Any Scale",
      desc: "Software orchestration that keeps AI models current across cloud, on-prem, disconnected, and classified environments.",
      accent: "#fb923c",
    },
  ];

  const tabs = [
    {
      label: "REALTIME ANALYSIS",
      heading: "Sub-second intelligence at scale",
      body: "Our inference engine processes millions of data signals per second — fusing sensor feeds, market data, and operational telemetry into a unified decision surface. No batch jobs. No stale dashboards.",
      bullets: [
        "< 50ms p99 latency on live data streams",
        "Petabyte-scale federation with zero-copy reads",
        "Multi-modal fusion: structured, unstructured, time-series",
        "Continuous model serving with drift detection",
      ],
    },
    {
      label: "AI DECISION ENGINE",
      heading: "From signal to action in milliseconds",
      body: "The decision engine doesn't just surface insights — it recommends, prioritizes, and routes actions to the right humans or automated systems. Every decision is auditable, explainable, and reversible.",
      bullets: [
        "Probabilistic scoring with calibrated confidence intervals",
        "Multi-objective optimization across competing constraints",
        "Full audit trail with causal chain visualization",
        "Human-readable rationale for every AI recommendation",
      ],
    },
    {
      label: "AI+HUMAN LOOP",
      heading: "Humans in command, machines in service",
      body: "We believe the most powerful decisions emerge when AI amplifies human judgment. Our loop architecture ensures humans can inspect, override, and teach the system at every step.",
      bullets: [
        "One-click human override at any decision node",
        "Active learning from every operator correction",
        "Confidence-gated escalation to human experts",
        "Role-based decision authority with full traceability",
      ],
    },
  ];

  const loopSteps = [
    {
      icon: Antenna,
      step: "Ingest",
      desc: "Live streams, sensors, APIs, and unstructured feeds unified in realtime",
    },
    {
      icon: Brain,
      step: "Analyze",
      desc: "Multi-model inference fuses data into a ranked, explainable intelligence layer",
    },
    {
      icon: Zap,
      step: "Recommend",
      desc: "The AI surfaces prioritized actions with calibrated confidence and rationale",
    },
    {
      icon: User,
      step: "Human Review",
      desc: "Operators inspect, approve, modify, or override every AI recommendation",
    },
    {
      icon: Crosshair,
      step: "Act",
      desc: "Approved decisions execute instantly across connected systems and workflows",
    },
    {
      icon: RefreshCw,
      step: "Learn",
      desc: "Every human correction feeds back, continuously improving model accuracy",
    },
  ];

  return (
    <main
      style={{
        background: "#111113",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: "clip",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        /* ── Shared resets ── */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        main a { text-decoration: none; }

        /* ── Hero shell ── */
        .hero-shell {
          position: relative;
          isolation: isolate;
          display: grid;
          grid-template-areas: "hero";
          min-height: 100vh;
        }

        .hero-shell > .sw-nav-shell {
          grid-area: hero;
          align-self: start;
        }

        .hero-shell > .relative.min-h-screen {
          grid-area: hero;
          min-height: 100vh;
          width: 100%;
        }

        .hero-copy {
          gap: clamp(1.75rem, 4vw, 2.5rem);
        }

        .hero-copy h1,
        .hero-copy p {
          text-align: center;
        }

        .hero-description {
          max-width: 36rem;
          margin-inline: auto;
          font-size: clamp(1rem, 2.2vw, 1.25rem);
          line-height: 1.65;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.45);
          hyphens: none;
          text-wrap: balance;
        }

        .hero-description-line {
          display: block;
        }

        .hero-description-line + .hero-description-line {
          margin-top: 0.2em;
        }

        /* ── Hero CTA row ── */
        .hero-cta-row {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        /* ── Cursor blink ── */
        .sw-cursor { animation: blink 1s step-end infinite; opacity: 1; }
        @keyframes blink { 50% { opacity: 0; } }

        /* ── Reveal animation ── */
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.75s ease, transform 0.75s ease; }
        .reveal.show { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.35s; }
        .reveal-delay-4 { transition-delay: 0.5s; }

        /* ── Hero ── */
        .hero-wrap {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: #111113;
        }

        /* ── Section shared ── */
        .sw-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .sw-rule {
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        /* ── Eyebrow label ── */
        .sw-eyebrow {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.32);
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3rem;
        }
        .sw-eyebrow::before {
          content: '';
          width: 2.5rem;
          height: 1px;
          background: rgba(255,255,255,0.18);
          flex-shrink: 0;
        }

        /* ── Intro band ── */
        .intro-band {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding: 7rem 0;
          align-items: start;
        }
        .intro-h2 {
          font-size: clamp(2.25rem, 4.5vw, 4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          color: #fff;
          max-width: 900px;
        }
        .intro-body {
          font-size: 1rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.8;
        }
        .intro-body strong { color: rgba(255,255,255,0.75); font-weight: 600; }
        .intro-ctas { margin-top: 2.5rem; display: flex; gap: 1rem; flex-wrap: wrap; }
        .btn-white {
          background: #fff;
          color: #080808 !important;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          padding: 0.85rem 1.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          line-height: 1;
        }
        .btn-white:hover { background: #e8e8e8; transform: translateY(-1px); }
        .btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.72) !important;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          padding: 0.85rem 1.75rem;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 9999px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, transform 0.15s, background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          line-height: 1;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.45); color: #fff !important; background: rgba(255,255,255,0.04); transform: translateY(-1px); }

        /* ── Ticker / typewriter strip ── */
        .ticker-strip {
          border-top: 1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 1.75rem 2.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          overflow: hidden;
        }
        .ticker-label {
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.28);
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 700;
          text-transform: uppercase;
          border-right: 1px solid rgba(255,255,255,0.1);
          padding-right: 1.5rem;
        }
        .ticker-text {
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
        }

        /* ── Stats row ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 5rem 0;
        }
        @media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .stats-row { grid-template-columns: 1fr; } }
        .stat-cell {
          padding: 2rem 2.5rem;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .stat-cell:last-child { border-right: none; }
        .stat-num {
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .stat-lbl {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.3);
          font-weight: 700;
          text-transform: uppercase;
        }

        /* ── Numbered platform rows (Palantir-style) ── */
        .platforms-section { padding: 6rem 0; }
        .platforms-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          margin-bottom: 4rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        @media (max-width: 768px) { .platforms-header { grid-template-columns: 1fr; gap: 1.5rem; } }
        .platforms-h2 {
          font-size: clamp(2rem, 3.5vw, 3.2rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .platforms-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.75;
          align-self: end;
        }

        .platform-row {
          display: grid;
          grid-template-columns: 5rem 1fr 1fr auto;
          gap: 2rem;
          align-items: center;
          padding: 2.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: default;
          transition: background 0.2s;
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 900px) { .platform-row { grid-template-columns: 3rem 1fr; gap: 1.25rem; } }
        .platform-row::before {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 1px;
          transition: width 0.5s ease;
        }
        .platform-row:hover::before { width: 100%; }
        .platform-row:hover { background: rgba(255,255,255,0.018); }
        .pr-num {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.18);
          font-variant-numeric: tabular-nums;
        }
        .pr-tag {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
        }
        .pr-title {
          font-size: clamp(1rem, 2vw, 1.5rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .pr-desc {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.65;
          max-width: 340px;
        }
        @media (max-width: 900px) { .pr-desc { display: none; } }
        .pr-cta {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          white-space: nowrap;
          padding: 0.55rem 1.2rem;
          border: 1px solid rgba(255,255,255,0.12);
          transition: border-color 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pr-cta:hover { border-color: rgba(255,255,255,0.4); }
        @media (max-width: 900px) { .pr-cta { display: none; } }

        /* ── Capabilities tabs ── */
        .caps-section { padding: 6rem 0; }
        .caps-tabs-bar {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          overflow-x: auto;
          margin-bottom: 0;
        }
        .caps-tab {
          padding: 1.1rem 2rem;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.28);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
          position: relative;
        }
        .caps-tab.on { color: #fff; }
        .caps-tab.on::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 1px;
          background: #fff;
        }
        .caps-tab-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid rgba(255,255,255,0.07);
          border-top: none;
        }
        @media (max-width: 768px) { .caps-tab-content { grid-template-columns: 1fr; } }
        .caps-left {
          padding: 3.5rem;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        @media (max-width: 768px) { .caps-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); } }
        .caps-right { padding: 3.5rem; }
        .caps-h3 {
          font-size: clamp(1.5rem, 2.5vw, 2.2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 1.25rem;
        }
        .caps-body {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.42);
          line-height: 1.8;
        }
        .caps-bullets { list-style: none; display: flex; flex-direction: column; gap: 1.1rem; }
        .caps-bullets li {
          display: flex;
          gap: 1rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.5;
          padding-bottom: 1.1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .caps-bullets li:last-child { border-bottom: none; padding-bottom: 0; }
        .caps-bullets li::before { content: '——'; color: rgba(255,255,255,0.15); flex-shrink: 0; font-size: 0.7rem; margin-top: 0.15em; }

        /* ── AI+Human Loop (card-style) ── */
        .loop-steps {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 2.5rem;
        }
        @media (max-width: 1100px) { .loop-steps { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .loop-steps { grid-template-columns: repeat(2, 1fr); } }
        .loop-step {
          padding: 2.5rem 1.75rem;
          border-right: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          transition: background 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .loop-step:hover { background: rgba(255,255,255,0.02); }
        .loop-step:nth-child(6n) { border-right: none; }
        @media (max-width: 1100px) { .loop-step:nth-child(3n) { border-right: none; } }
        @media (max-width: 600px) { .loop-step:nth-child(2n) { border-right: none; } }
        .loop-ico { 
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          margin-bottom: 1.25rem;
          color: rgba(255,255,255,0.85);
        }
        .loop-lbl {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.75rem;
        }
        .loop-desc {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
        }

        /* ── Quote strip ── */
        .quote-strip {
          padding: 7rem 2.5rem;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .quote-mark {
          font-size: 4rem;
          line-height: 0.5;
          color: rgba(255,255,255,0.08);
          font-family: Georgia, serif;
          margin-bottom: 1.5rem;
          display: block;
        }
        .quote-text {
          font-size: clamp(1.3rem, 2.5vw, 2rem);
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.35;
          color: rgba(255,255,255,0.85);
          margin-bottom: 2rem;
        }
        .quote-attr {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
        }

        /* ── Recognition row (Palantir awards section) ── */
        .recog-section { padding: 6rem 0; }
        .recog-header {
          font-size: clamp(1.75rem, 3vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .recog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid rgba(255,255,255,0.07);
        }
        @media (max-width: 768px) { .recog-grid { grid-template-columns: 1fr; } }
        .recog-cell {
          padding: 2.75rem 2.25rem;
          border-right: 1px solid rgba(255,255,255,0.07);
          transition: background 0.2s;
        }
        .recog-cell:last-child { border-right: none; }
        .recog-cell:hover { background: rgba(255,255,255,0.02); }
        .recog-rank {
          font-size: 2.8rem;
          font-weight: 900;
          letter-spacing: -0.06em;
          line-height: 1;
          color: #fff;
          margin-bottom: 0.75rem;
        }
        .recog-title {
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.35;
          color: rgba(255,255,255,0.8);
          margin-bottom: 0.75rem;
        }
        .recog-sub {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
          line-height: 1.6;
        }

        /* ── CTA Band ── */
        .cta-band {
          padding: 7rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 3rem;
          flex-wrap: wrap;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .cta-heading {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          max-width: 520px;
        }
        .cta-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

        /* ── Footer ── */
        .sw-footer {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 2rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.22);
          flex-wrap: wrap;
          gap: 1rem;
        }
        .sw-footer a { color: inherit; transition: color 0.2s; }
        .sw-footer a:hover { color: rgba(255,255,255,0.55); }
        .sw-footer-links { display: flex; gap: 2rem; }

        /* ── Sections padding and layout ── */
        .caps-section, .platforms-section, .loop-section {
          padding: 5rem 0;
        }

        /* ── New platform section styles (exact match to reference) ── */
        .sw-section-tag {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.32);
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .sw-section-h2 {
          font-size: clamp(2.25rem, 4vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 1rem;
          max-width: 700px;
        }
        .sw-section-body {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.75;
          max-width: 560px;
          margin-bottom: 3.5rem;
        }
        .sw-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        @media (max-width: 1100px) { .sw-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .sw-cards-grid { grid-template-columns: 1fr; } }
        .sw-card {
          padding: 3.5rem 2.25rem;
          border-right: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          transition: background 0.2s ease;
          position: relative;
        }
        .sw-card:nth-child(4n) { border-right: none; }
        .sw-card:nth-child(n+5) { border-bottom: none; }
        @media (max-width: 1100px) {
          .sw-card:nth-child(2n) { border-right: none; }
          .sw-card:nth-child(3), .sw-card:nth-child(4) { border-bottom: none; }
        }
        @media (max-width: 600px) {
          .sw-card { border-right: none; }
          .sw-card:nth-child(4) { border-bottom: none; }
        }
        .sw-card:hover {
          background: rgba(255,255,255,0.02);
        }
        .sw-card-number {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.18);
          font-variant-numeric: tabular-nums;
          margin-bottom: 1.5rem;
        }
        .sw-card-tag {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .sw-card-title {
          font-size: clamp(1rem, 1.8vw, 1.25rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-bottom: 1rem;
        }
        .sw-card-desc {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.65;
          margin-bottom: 1.75rem;
        }
        .sw-card-cta {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: color 0.2s;
        }
        .sw-card-cta:hover { color: #fff !important; }

        /* ── Capabilities section (exact match to reference) ── */
        .sw-tabs-wrap {
          margin-top: 2.5rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        .sw-tabs-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        @media (max-width: 768px) {
          .sw-tabs-bar { grid-template-columns: 1fr; }
        }
        .sw-tab-btn {
          padding: 1.25rem 1.5rem;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.45);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s ease;
          position: relative;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .sw-tab-btn:nth-child(3) { border-right: none; }
        @media (max-width: 768px) {
          .sw-tab-btn { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .sw-tab-btn:nth-child(3) { border-bottom: none; }
        }
        .sw-tab-btn:hover {
          color: rgba(255,255,255,0.8);
        }
        .sw-tab-btn.active {
          color: #fff;
          background: rgba(255,255,255,0.03);
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
          padding: 3rem 2.5rem;
        }
        @media (max-width: 768px) {
          .sw-tab-content { grid-template-columns: 1fr; gap: 2rem; padding: 2.5rem 1.75rem; }
        }
        .sw-tab-left {
          padding-right: 3rem;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        @media (max-width: 768px) {
          .sw-tab-left {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding-bottom: 2rem;
          }
        }
        .sw-tab-heading {
          font-size: clamp(1.25rem, 2.2vw, 1.75rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-bottom: 1rem;
        }
        .sw-tab-body {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.7;
        }
        .sw-tab-right {
          padding-left: 3rem;
        }
        @media (max-width: 768px) {
          .sw-tab-right { padding-left: 0; padding-top: 2rem; }
        }
        .sw-tab-bullets {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sw-tab-bullets li {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
        }
        .sw-tab-bullets li::before {
          content: '—';
          color: rgba(255,255,255,0.25);
          flex-shrink: 0;
          font-size: 0.8rem;
          margin-top: 0.1em;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AgorixHero />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TYPEWRITER TICKER                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <div className="ticker-strip">
        <span className="ticker-label">LIVE SYSTEM</span>
        <span className="ticker-text">
          <TypeWriter lines={[
            "Realtime AI-driven analysis powering mission-critical decisions",
            "AI+Human loop decision making — humans always in command",
            "Our software processes 10PB+ of operational data daily",
            "< 50ms p99 latency from signal to decision",
          ]} />
        </span>
      </div> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* INTRO BAND — "Our software powers…"                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div id="software-section" />
      <div className="sw-rule" />
      <div className="sw-section">
        <div
          ref={sec1.ref}
          className={`intro-band reveal${sec1.visible ? " show" : ""} flex flex-col gap-6`}
        >
          <div>
            <div className="sw-eyebrow">Our Software</div>
            <h2 className="intro-h2">
              Our software powers <span className="gradient-text-a">realtime</span>{" "}
              <span className="gradient-text-b">AI&#8209;driven</span> analysis and decision
            </h2>
          </div>
          <div>
            <p className="intro-body">
              We build the foundational software that empowers organizations to effectively
              integrate their <strong>data</strong>, <strong>decisions</strong>, and{" "}
              <strong>operations</strong> — in real time, at any scale, with humans always in the
              loop.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STATS ROW                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-rule" />
      {/* <div className="sw-section">
        <div
          ref={sec2.ref}
          className={`stats-row reveal${sec2.visible ? " show" : ""}`}
        >
          {[
            { to: 50, prefix: "<", suffix: "ms", label: "P99 Decision Latency" },
            { to: 10, suffix: "PB+", label: "Data Processed Daily" },
            { to: 99, suffix: ".99%", label: "Platform Uptime SLA" },
            { to: 130, suffix: "+", label: "Enterprise Deployments" },
          ].map((s, i) => (
            <div className="stat-cell" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="stat-num">
                <Counter to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PLATFORMS (Palantir numbered rows)                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-rule" id="platforms" />
      <div className="sw-section">
        <div ref={sec3.ref} className={`platforms-section reveal${sec3.visible ? " show" : ""}`}>
          {/* <div className="platforms-header">
            <div>
              <div className="sw-eyebrow">Platforms</div>
              <h2 className="platforms-h2">
                Foundational Software of Tomorrow. Delivered Today.
              </h2>
            </div>
            <p className="platforms-sub">
              Every platform is purpose-built for the hardest operational
              environments — from battlefield command to enterprise supply chains
              and financial markets.
            </p>
          </div> */}

          {/* {platforms.map((p, i) => (
            <div
              key={i}
              className="platform-row"
              style={{
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <style>{`.platform-row:nth-child(${i + 2})::before { background: ${p.accent}; }`}</style>
              <div className="pr-num">{p.num} ——</div>
              <div>
                <div className="pr-tag" style={{ color: p.accent, marginBottom: "0.4rem" }}>{p.arrow}</div>
                <div className="pr-title">{p.title}</div>
              </div>
              <div className="pr-desc">{p.desc}</div>
              <a href="#contact" className="pr-cta" style={{ color: p.accent, borderColor: `${p.accent}30` }}>
                EXPLORE →
              </a>
            </div>
          ))} */}
          <div className="sw-section-tag">↳ Platforms</div>
          <h2 className="sw-section-h2">Foundational Software of Tomorrow. Delivered Today.</h2>
          <p className="sw-section-body">
            Every platform is purpose-built for the hardest operational environments.
          </p>
          <div className="sw-cards-grid">
            <PlatformCard
              number="01 "
              tag="AIP"
              title="Get AI Into Operations"
              description="Deploy large language models and generative AI directly into your most critical workflows. From zero to use case in days, not months."
              cta="Explore AIP"
              accent="#7c6fff"
            />
            <PlatformCard
              number="02 "
              tag="NEXUS"
              title="Realtime Decision Intelligence"
              description="A unified command surface that fuses live sensor data, predictive models, and operator judgment into one coherent operational picture."
              cta="Explore Nexus"
              accent="#5bc8ff"
            />
            <PlatformCard
              number="03 "
              tag="BOSON"
              title="Operating System for the Enterprise"
              description="Connect every data source, transform it into living ontologies, and build applications your teams actually use — no-code to full-code."
              cta="Explore BOSON"
              accent="#a8ff78"
            />
            <PlatformCard
              number="04 "
              tag="SYNAPSE"
              title="Continuous Delivery at Any Scale"
              description="Software orchestration that keeps AI models and applications current across every environment — cloud, on-prem, disconnected, and classified."
              cta="Explore SYNAPSE"
              accent="#ffb347"
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CAPABILITIES TABS                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-rule" />
      <div className="sw-section">
        <div ref={sec4.ref} className={`caps-section reveal${sec4.visible ? " show" : ""}`}>
          <div className="sw-section-tag">↳ Capabilities</div>
          <h2 className="sw-section-h2">Three capabilities. One coherent operating picture.</h2>
          <div className="sw-tabs-wrap">
            <div className="sw-tabs-bar">
              {tabs.map((t, i) => (
                <button
                  key={t.label}
                  className={`sw-tab-btn${activeTab === i ? " active" : ""}`}
                  onClick={() => setActiveTab(i)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="sw-tab-content">
              <div className="sw-tab-left">
                <h3 className="sw-tab-heading">{tabs[activeTab].heading}</h3>
                <p className="sw-tab-body">{tabs[activeTab].body}</p>
              </div>
              <div className="sw-tab-right">
                <ul className="sw-tab-bullets">
                  {tabs[activeTab].bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* AI+HUMAN LOOP                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-rule" id="loop" />
      <div className="sw-section">
        <div ref={sec5.ref} className={`loop-section reveal${sec5.visible ? " show" : ""}`}>
          <div className="sw-section-tag">↳ AI+Human Loop Decision</div>
          <h2 className="sw-section-h2">AI+Human loop decision making</h2>
          <p className="sw-section-body">
            The loop never closes without a human checkpoint. Every AI recommendation is
            inspectable, overrideable, and teaches the system to be better next time.
          </p>
          <div className="loop-steps">
            {loopSteps.map((s, i) => (
              <div key={i} className="loop-step" style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="loop-ico">
                  <s.icon size={28} strokeWidth={1.5} />
                </div>
                <div className="loop-lbl">{s.step}</div>
                <div className="loop-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* QUOTE                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-rule" />
      <div className="quote-strip">
        <span className="quote-mark">"</span>
        <p className="quote-text">
          The most powerful decisions emerge when AI amplifies human judgment — not when it replaces
          it.
        </p>
        <div className="quote-attr">— Agorix Software Design Principles</div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* RECOGNITION (Palantir-style awards)                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-rule" />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CTA BAND                                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sw-section" id="contact">
        <div className="cta-band">
          <h2 className="cta-heading">Ready to get AI into your operations?</h2>
          <div className="cta-actions">
            <a href="/demo" className="btn-white">
              SCHEDULE A DEMO
            </a>
            {/* <a href="#bootcamp" className="btn-ghost">RUN A BOOTCAMP</a> */}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <footer className="sw-footer">
        <span>© 2025 Agorix. All rights reserved.</span>
        <div className="sw-footer-links">
          <a href="/software">Software</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#security">Security</a>
        </div>
      </footer>
    </main>
  );
}

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
