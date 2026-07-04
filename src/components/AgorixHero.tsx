import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AgorixNav } from "@/components/AgorixNav";

/** Matches landing page (`index.tsx`) palette */
const T = {
  bg: "#111113",
  ink: "#080808",
  text: "#fff",
  soft: "rgba(255,255,255,0.75)",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.38)",
  faint2: "rgba(255,255,255,0.32)",
  nav: "rgba(255,255,255,0.72)",
  border: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.22)",
  surface: "rgba(255,255,255,0.02)",
  inset: "rgba(255,255,255,0.04)",
  accent: "#38bdf8",
  accentSoft: "rgba(56,189,248,0.12)",
  accentBorder: "rgba(56,189,248,0.28)",
  accentGlow: "rgba(56,189,248,0.5)",
  purple: "#a78bfa",
  warn: "#fb923c",
  lime: "#C8F135",
  limeDark: "#1c2200",
  gradient: "linear-gradient(135deg, #5b7cfa 0%, #a78bfa 50%, #38bdf8 100%)",
  gradientA: "linear-gradient(90deg, #9499ff 0%, #59c2ff 100%)",
  gradientB: "linear-gradient(90deg, #59c2ff 0%, #77ffaf 100%)",
} as const;

const gradientClip = (gradient: string) =>
  ({
    background: gradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }) as const;

const cardShell = {
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  background: T.surface,
} as const;

const LAYOUT = { max: 1305, pad: 40, stage: 1225, shift: 72 } as const;
const STAGE_H = 640;
const HALF = LAYOUT.stage / 2;
const COPY_LEFT = 32;
const COPY_WIDTH = HALF - COPY_LEFT - 24;
const ANIM_INSET = 14;
const LIST_W = 162;
const LIST_LEFT = HALF + ANIM_INSET;
const LIST_RIGHT = LIST_LEFT + LIST_W;
const SPINE_GAP = 28;
const SPINE_X = LIST_RIGHT + SPINE_GAP;
const DASH_LEFT = SPINE_X + 8;
const DASH_WIDTH = LAYOUT.stage - DASH_LEFT;
const DASH_TOP = 36;
const DASH_GAP = 10;
const STAT_H = 90;
const DASH_BOTTOM = STAGE_H - 36;
const SPINE_BOTTOM = DASH_BOTTOM - 76; // trim ~7 dash segments below bottom stat row
const LIST_H = 320;
const LIST_TOP = (DASH_TOP + DASH_BOTTOM - LIST_H) / 2;
const CONNECT_Y = LIST_TOP + LIST_H / 2;

const btnBase = {
  display: "inline-flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
  textDecoration: "none",
  lineHeight: 1,
  whiteSpace: "nowrap" as const,
};
const btnOutlineSm = {
  ...btnBase,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.06em",
  height: 40,
  padding: "0 18px",
  color: T.nav,
  border: `1px solid ${T.borderStrong}`,
  borderRadius: 9999,
  background: "transparent",
};
const btnSolidSm = {
  ...btnOutlineSm,
  color: T.ink,
  border: `1px solid ${T.border}`,
  background: "#fff",
};
const btnOutlineLg = { ...btnOutlineSm, fontSize: 16, height: 48, padding: "0 24px" };
const btnSolidLg = { ...btnSolidSm, fontSize: 16, height: 48, padding: "0 26px" };

// ── Alert card data ──────────────────────────────────────────────────────────
type AlertCard = {
  score: string;
  risk: string;
  date: string;
  title: string;
  subtitle: string;
  message: string;
  status: string;
  statusColor: string;
  badgeBg: string;
  badgeFg: string;
};

const ALERT_CARDS: AlertCard[] = [
  {
    score: "92",
    risk: "Reconciliation Risk",
    date: "Tue, Sep 30",
    title: "Payment",
    subtitle: "Anna Nagar Outlet",
    message: "POS settlement unmatched in Tally — ₹84,200",
    status: "Unreconciled",
    statusColor: T.warn,
    badgeBg: "#FF5757", // red — highest risk
    badgeFg: "#fff",
  },
  {
    score: "67",
    risk: "Inventory Risk",
    date: "30 minutes ago",
    title: "Stock Variance",
    subtitle: "Velachery Branch",
    message: "Inventory shrinkage gap of ₹18,400 detected",
    status: "Variance Alert",
    statusColor: "#f87171",
    badgeBg: "#C8F135", // lime — lowest risk
    badgeFg: T.limeDark,
  },
  {
    score: "88",
    risk: "GST Risk",
    date: "Tue, Sep 30",
    title: "GST Filing",
    subtitle: "Head Office",
    message: "GSTR-1 mismatch — ₹2,10,000 in unlinked invoices",
    status: "Filing Pending",
    statusColor: T.warn,
    badgeBg: "#FF9B3E", // amber — mid risk
    badgeFg: "#2D1200",
  },
];

// ── Stat values per card ─────────────────────────────────────────────────────
type CardStat = { label: string; value: number };
const CARD_STATS: CardStat[][] = [
  [
    { label: "Receivables", value: 14 },
    { label: "Bills Today", value: 847 },
    { label: "Alerts", value: 3 },
  ],
  [
    { label: "Receivables", value: 5 },
    { label: "Bills Today", value: 212 },
    { label: "Alerts", value: 7 },
  ],
  [
    { label: "Receivables", value: 22 },
    { label: "Bills Today", value: 1200 },
    { label: "Alerts", value: 3 },
  ],
];

// ── Scrolling source list ────────────────────────────────────────────────────
type IconKey = "file" | "pos" | "tag" | "zap";

const ICON_PATHS: Record<IconKey, string> = {
  file: "M3 2h7l4 4v11H3V2zm7 0v4h4",
  pos: "M2 3h12v2H2zM3 5l1 9h8l1-9",
  tag: "M2 2h6l6 6-6 6-6-6V2zm3.5 3.5a1 1 0 102 0 1 1 0 00-2 0",
  zap: "M11 1L7 9h5l-3 6",
};

const BASE_ITEMS: { name: string; sub: string; icon: IconKey }[] = [
  { name: "Invoice #INV-8821", sub: "Tally ERP", icon: "file" },
  { name: "Sale #POS-2249", sub: "Anna Nagar", icon: "pos" },
  { name: "Receipt #RCP-0344", sub: "Velachery", icon: "file" },
  { name: "Purchase #PO-1192", sub: "Head Office", icon: "tag" },
  { name: "Ledger #LED-7701", sub: "GST Module", icon: "file" },
  { name: "Bill #BILL-4432", sub: "Nungambakkam", icon: "pos" },
  { name: "Journal #JV-5521", sub: "Accounts", icon: "tag" },
  { name: "Transfer #TRF-9901", sub: "Bank Sync", icon: "zap" },
  { name: "Sale #POS-3301", sub: "T. Nagar", icon: "pos" },
];

const SCROLL_ITEMS = [...BASE_ITEMS, ...BASE_ITEMS];
const ROW_H = 50;
const SCROLL_DISTANCE = BASE_ITEMS.length * ROW_H;

// ── AI ticker ────────────────────────────────────────────────────────────────
// 5 continuous paragraphs — each streams as one flowing block of text
const AI_LINE_SETS = [
  "GST reconciliation gap detected at Anna Nagar outlet. ₹84,200 POS mismatch flagged in Tally books. Priority: High — immediate review recommended.",
  "POS settlement unmatched across 2 outlets. Anna Nagar variance of ₹84,200 remains unresolved. Manual voucher reconciliation suggested.",
  "Food cost variance +3.2% above weekly threshold. Velachery branch exceeding budget on 4 items. Adjust procurement to recover margin gap.",
  "Inventory shrinkage alert: ₹18,400 gap at Velachery. Three SKUs affected over the past 7 days. Escalated to branch operations manager.",
  "Accounts receivable overdue across 14 entries. Oldest outstanding for 47 days. Follow-up queue updated — action required today.",
];

const SMALL_STATS = [
  { val: "₹2.4L", label: "Sales Today", color: T.text, delay: "1.02s" },
  { val: "847", label: "Bills Today", color: T.text, delay: "1.07s" },
  { val: "92%", label: "GST Filed", color: T.accent, delay: "1.12s" },
];

// ── Count-up component ───────────────────────────────────────────────────────
function CountUp({ target, trigger }: { target: number; trigger: number }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    const duration = 600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(target * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, target]);

  if (target >= 1000) {
    const s = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val);
    return <>{s}</>;
  }
  return <>{val}</>;
}

// ── Streaming text component ─────────────────────────────────────────────────
function StreamingText({
  text,
  trigger,
  startDelay = 0,
  onComplete,
}: {
  text: string;
  trigger: number;
  startDelay?: number;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(intervalId);
          onComplete?.();
        }
      }, 22); // 22ms/char — fast enough to finish before cycling
    }, startDelay);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [trigger, text, startDelay]);

  return <>{displayed}</>;
}

// ── Component ────────────────────────────────────────────────────────────────
export function AgorixHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [aiIdx, setAiIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);

  // Scale fixed-pixel stage to viewport
  useEffect(() => {
    const resize = () => {
      const wrap = wrapRef.current;
      const stage = stageRef.current;
      if (!wrap || !stage) return;
      const ratio = Math.min(1, wrap.clientWidth / LAYOUT.stage);
      stage.style.transform = `scale(${ratio})`;
      wrap.style.height = `${STAGE_H * ratio}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // AI cycle: advance only after streaming finishes + 800ms pause
  const aiPauseRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleAiComplete = () => {
    aiPauseRef.current = setTimeout(() => setAiIdx((i) => (i + 1) % AI_LINE_SETS.length), 800);
  };
  useEffect(() => () => clearTimeout(aiPauseRef.current), []);

  // Alert card auto-rotate
  useEffect(() => {
    const id = setInterval(() => setCardIdx((i) => (i + 1) % ALERT_CARDS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const card = ALERT_CARDS[cardIdx];
  const stats = CARD_STATS[cardIdx];

  return (
    <section
      className="agorix-hero"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: T.text,
        background: `radial-gradient(900px 520px at 72% 28%, rgba(56,189,248,0.06), transparent 58%),
                     radial-gradient(700px 400px at 18% 80%, rgba(167,139,250,0.04), transparent 55%),
                     ${T.bg}`,
        borderBottom: `1px solid ${T.border}`,
        ["--hero-pad" as string]: `clamp(20px, 3vw, ${LAYOUT.pad}px)`,
        ["--hero-shift" as string]: `clamp(16px, 4vw, ${LAYOUT.shift}px)`,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .agorix-hero__inset {
          max-width: ${LAYOUT.max}px;
          margin-inline: auto;
          padding-inline: var(--hero-pad) var(--hero-pad);
          padding-left: calc(var(--hero-pad) + var(--hero-shift));
        }
        .agorix-hero__stage {
          position: absolute; left: 0; top: 0;
          width: ${LAYOUT.stage}px; height: ${STAGE_H}px;
          transform-origin: top left;
        }
        .agorix-hero__copy {
          position: absolute;
          left: ${COPY_LEFT}px; top: 88px;
          width: ${COPY_WIDTH}px;
          max-width: calc(50% - ${COPY_LEFT + 12}px);
        }
        .agorix-hero__anim {
          position: absolute;
          left: 50%; top: 0; width: 50%; height: 100%;
        }

        @keyframes ag-up      { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes ag-pop     { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes ag-fadein  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ag-float   { from{transform:translateY(0)} to{transform:translateY(-8px)} }
        @keyframes ag-node    { 0%,100%{box-shadow:0 0 0 5px rgba(0,0,0,0),0 0 14px ${T.accentGlow}} 50%{box-shadow:0 0 0 9px rgba(56,189,248,.14),0 0 28px ${T.accentGlow}} }
        @keyframes ag-scroll { from{transform:translate3d(0,0,0)} to{transform:translate3d(0,-${SCROLL_DISTANCE}px,0)} }
        @keyframes ag-shimmer { 0%{background-position:-200px 0} 100%{background-position:220px 0} }
        @keyframes ag-dots    { 0%,20%{opacity:.2} 50%{opacity:1} 80%,100%{opacity:.2} }
        @keyframes ag-bell    { 0%,88%,100%{transform:rotate(0)} 90%{transform:rotate(12deg)} 92%{transform:rotate(-9deg)} 94%{transform:rotate(5deg)} }
        @keyframes ag-blink   { 0%,49%{opacity:1} 50%,100%{opacity:0} }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration:.001s!important; animation-iteration-count:1!important; }
        }
      `}</style>

      {/* Dot-grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.25) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.012,
          pointerEvents: "none",
        }}
      />

      {/* ── NAV ── */}
      <AgorixNav insetClass="agorix-hero__inset agorix-nav__inset" />

      {/* ── STAGE WRAPPER ── */}
      <div
        ref={wrapRef}
        className="agorix-hero__inset"
        style={{ position: "relative", width: "100%", height: STAGE_H }}
      >
        <div ref={stageRef} className="agorix-hero__stage">
          {/* ── LEFT HALF: COPY ── */}
          <section className="agorix-hero__copy">
            <h1
              style={{
                fontWeight: 800,
                fontSize: 52,
                lineHeight: 1.08,
                letterSpacing: "-.04em",
                margin: 0,
                color: T.text,
                animation: "ag-up .7s .1s both",
              }}
            >
              Business Management That Turns
              <br />
              Your <span style={gradientClip(T.gradientA)}>Tally &amp; POS Data</span> into
              <br />
              <span style={gradientClip(T.gradientB)}>Intelligence</span>
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: T.muted,
                margin: "20px 0 0",
                maxWidth: 460,
                animation: "ag-up .7s .22s both",
              }}
            >
              Agorix unifies your Tally books, POS sales, and inventory across every outlet and
              connected tool — so you predict risk earlier, act faster, and grow margin.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 32,
                animation: "ag-up .7s .32s both",
              }}
            >
              <a href="/login" style={btnSolidLg}>
                Get Started
              </a>
              <a href="#features" style={btnOutlineLg}>
                Explore Features
              </a>
            </div>
          </section>

          {/* ── RIGHT HALF: ANIMATED DASHBOARD ── */}

          {/* Page-load fade-in (CSS — no JS animation loop) */}
          <div
            className="agorix-hero__anim"
            style={{ animation: "ag-fadein 0.6s 0.2s ease-out both" }}
          >
            {/* Gentle float (CSS alternate — compositor thread, no re-renders) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                animation: "ag-float 3.5s 0.9s ease-in-out infinite alternate",
              }}
            >
              {/* ── SCROLLING SOURCE LIST ── */}
              <div
                style={{
                  position: "absolute",
                  left: ANIM_INSET,
                  top: LIST_TOP,
                  width: LIST_W,
                  height: LIST_H,
                  overflow: "hidden",
                  ...cardShell,
                  borderRadius: 8,
                }}
              >
                {/* Active-row highlight */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: LIST_H / 2 - ROW_H / 2,
                    height: ROW_H,
                    background: `linear-gradient(90deg,${T.accentSoft},rgba(56,189,248,0.04))`,
                    borderTop: `1px solid ${T.accentBorder}`,
                    borderBottom: `1px solid ${T.accentBorder}`,
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                />
                <div
                  style={{
                    willChange: "transform",
                    animation: "ag-scroll 22s linear infinite",
                  }}
                >
                  {SCROLL_ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: ROW_H,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "0 12px 0 13px",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      <span
                        style={{
                          color: T.accent,
                          flexShrink: 0,
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={ICON_PATHS[item.icon]} />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: T.soft,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: T.faint,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginTop: 1,
                          }}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SVG CONNECTOR ── */}
              <svg
                viewBox={`0 0 ${LAYOUT.stage / 2} ${STAGE_H}`}
                width="100%"
                height={STAGE_H}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  overflow: "visible",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <path
                  d={`M${LIST_RIGHT - HALF},${CONNECT_Y - 22} C${LIST_RIGHT - HALF + 12},${CONNECT_Y - 22} ${LIST_RIGHT - HALF + 22},${CONNECT_Y} ${SPINE_X - HALF},${CONNECT_Y}`}
                  fill="none"
                  stroke="rgba(56,189,248,0.22)"
                  strokeWidth="1.3"
                  strokeDasharray="3 5"
                />
                <path
                  d={`M${LIST_RIGHT - HALF},${CONNECT_Y} L${SPINE_X - HALF},${CONNECT_Y}`}
                  fill="none"
                  stroke="rgba(56,189,248,0.35)"
                  strokeWidth="1.3"
                  strokeDasharray="3 5"
                />
                <path
                  d={`M${LIST_RIGHT - HALF},${CONNECT_Y + 22} C${LIST_RIGHT - HALF + 12},${CONNECT_Y + 22} ${LIST_RIGHT - HALF + 22},${CONNECT_Y} ${SPINE_X - HALF},${CONNECT_Y}`}
                  fill="none"
                  stroke="rgba(56,189,248,0.22)"
                  strokeWidth="1.3"
                  strokeDasharray="3 5"
                />
                <path
                  d={`M${SPINE_X - HALF},${DASH_TOP + 10} L${SPINE_X - HALF},${SPINE_BOTTOM}`}
                  fill="none"
                  stroke="rgba(255,255,255,.1)"
                  strokeWidth="1.3"
                  strokeDasharray="3 5"
                />
              </svg>

              {/* ── CONNECTOR NODE (centered on spine) ── */}
              <div
                style={{
                  position: "absolute",
                  left: SPINE_X - HALF - 8,
                  top: CONNECT_Y - 8,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: T.accent,
                  zIndex: 4,
                  animation: "ag-node 2.8s ease-in-out infinite",
                }}
              />

              {/* ── DASHBOARD COLUMN ── */}
              <div
                style={{
                  position: "absolute",
                  left: DASH_LEFT - HALF,
                  top: DASH_TOP,
                  width: DASH_WIDTH,
                  display: "flex",
                  flexDirection: "column",
                  gap: DASH_GAP,
                  zIndex: 2,
                }}
              >
                {/* ── ANIMATION 1: ROTATING ALERT CARD ── */}
                {/* Fixed height + clip prevents layout jump during card swap */}
                <div style={{ position: "relative", height: 188, overflow: "hidden" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cardIdx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: -30,
                        transition: { duration: 0.3, ease: "easeIn" },
                      }}
                      transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                      style={{
                        position: "absolute",
                        width: "100%",
                        borderRadius: 12,
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
                        padding: "14px 16px",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Badge + Date */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          minHeight: 28,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: card.badgeFg,
                            background: card.badgeBg,
                            padding: "5px 9px",
                            borderRadius: 9999,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 800 }}>{card.score}</span>
                          {card.risk}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: 11,
                            lineHeight: 1,
                            color: "#9CA3AF",
                            background: "rgba(0,0,0,0.04)",
                            border: "1px solid rgba(0,0,0,0.06)",
                            padding: "5px 8px",
                            borderRadius: 7,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {card.date}
                        </span>
                      </div>

                      {/* Title + Bell */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15.5, fontWeight: 600, color: "#111827" }}>
                            {card.title}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>
                            {card.subtitle}
                          </div>
                        </div>
                        <span
                          style={{
                            color: "#9CA3AF",
                            animation: "ag-bell 5s ease infinite",
                            transformOrigin: "top center",
                          }}
                        >
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                          </svg>
                        </span>
                      </div>

                      {/* Message */}
                      <div
                        style={{
                          fontSize: 12,
                          color: "#374151",
                          background: "rgba(0,0,0,0.03)",
                          border: "1px solid rgba(0,0,0,0.06)",
                          borderRadius: 8,
                          padding: "8px 11px",
                          marginTop: 11,
                        }}
                      >
                        {card.message}
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: card.statusColor,
                            fontWeight: 600,
                            lineHeight: 1,
                          }}
                        >
                          {card.status}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            color: "#9CA3AF",
                            fontWeight: 500,
                            cursor: "pointer",
                            lineHeight: 1,
                          }}
                        >
                          Review
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M7 17 17 7M9 7h8v8" />
                          </svg>
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── ANIMATION 3: COUNT-UP STAT GRID ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: DASH_GAP,
                  }}
                >
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        ...cardShell,
                        padding: "12px 13px",
                        height: STAT_H,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ fontSize: 11, color: T.faint, lineHeight: 1.2 }}>{s.label}</div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          color: T.text,
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <CountUp target={s.value} trigger={cardIdx} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── AI ANALYSIS CARD ── */}
                <div
                  style={{ ...cardShell, padding: "13px 14px", animation: "ag-pop .6s .93s both" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      minHeight: 18,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          color: T.purple,
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 14l-1.5-4.5L2 7l4.5-1.5z" />
                        </svg>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1 }}>
                        Agorix AI · Analysis
                      </span>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        flexShrink: 0,
                      }}
                    >
                      {[0, 0.22, 0.44].map((d, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            width: 3,
                            height: 3,
                            borderRadius: "50%",
                            background: T.faint,
                            animation: `ag-dots 1.4s ${d}s infinite`,
                          }}
                        />
                      ))}
                    </span>
                  </div>

                  {/* Continuous paragraph streaming — wraps naturally into ~3 lines */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 10 }}>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 12.5,
                        color: T.muted,
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                        overflow: "hidden",
                        height: 60,
                      }}
                    >
                      <StreamingText
                        text={AI_LINE_SETS[aiIdx]}
                        trigger={aiIdx}
                        onComplete={handleAiComplete}
                      />
                      <span
                        style={{
                          display: "inline-block",
                          width: 1.5,
                          height: 10,
                          background: T.accent,
                          marginLeft: 1,
                          verticalAlign: "middle",
                          animation: "ag-blink 1s steps(1) infinite",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── SMALL STAT ROW ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: DASH_GAP,
                  }}
                >
                  {SMALL_STATS.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        ...cardShell,
                        padding: "11px 12px",
                        minHeight: 58,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        animation: `ag-pop .6s ${s.delay} both`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: s.color,
                          letterSpacing: "-.01em",
                          lineHeight: 1.1,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {s.val}
                      </div>
                      <div
                        style={{ fontSize: 10.5, color: T.faint2, marginTop: 3, lineHeight: 1.2 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* end dashboard column */}
            </div>
            {/* end float wrapper */}
          </div>
          {/* end page-load wrapper */}
        </div>
      </div>
    </section>
  );
}
