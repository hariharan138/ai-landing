import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const T = {
  bg: "#111113",
  ink: "#080808",
  text: "#fff",
  nav: "rgba(255,255,255,0.72)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.22)",
  accent: "#38bdf8",
} as const;

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

type NavItem =
  | { label: string; href: string }
  | { label: string; dropdown: { label: string; href: string }[] };

const productDropdown = [{ label: "Restaurant IQ", href: "/restaurant-iq" }];

const defaultLinks: NavItem[] = [
  { label: "Product", dropdown: productDropdown },
  { label: "Pricing", href: "/#contact" },
  { label: "Resources", href: "/software" },
];

type AgorixNavProps = {
  links?: NavItem[];
  insetClass?: string;
  sticky?: boolean;
};

export function AgorixNav({
  links = defaultLinks,
  insetClass = "agorix-nav__inset",
  sticky = false,
}: AgorixNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
        .agorix-nav__inset {
          max-width: 1305px;
          margin-inline: auto;
          padding-inline: clamp(20px, 3vw, 40px);
          padding-left: calc(clamp(20px, 3vw, 40px) + clamp(16px, 4vw, 72px));
        }
        .agorix-hero__inset.agorix-nav__inset {
          max-width: 1305px;
          margin-inline: auto;
          padding-inline: var(--hero-pad, clamp(20px, 3vw, 40px));
          padding-left: calc(var(--hero-pad, clamp(20px, 3vw, 40px)) + var(--hero-shift, clamp(16px, 4vw, 72px)));
        }
        .agorix-nav__item {
          position: relative;
        }
        .agorix-nav__dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 180px;
          padding: 0.4rem 0;
          background: rgba(17, 17, 19, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          z-index: 70;
        }
        .agorix-nav__dropdown-item {
          display: block;
          padding: 0.65rem 1.1rem;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .agorix-nav__dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }
        @media (max-width: 900px) {
          .agorix-nav__links {
            display: none !important;
          }
        }
      `}</style>

      <header
        ref={navRef}
        className={insetClass}
        style={{
          position: sticky ? "sticky" : "relative",
          top: sticky ? 0 : undefined,
          zIndex: 50,
          paddingTop: 28,
          paddingBottom: 32,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 24,
          background: sticky ? T.bg : undefined,
          borderBottom: sticky ? `1px solid ${T.border}` : undefined,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifySelf: "start",
            textDecoration: "none",
          }}
        >
          <svg
            width="26"
            height="29"
            viewBox="0 0 26 29"
            style={{ display: "block", flexShrink: 0 }}
          >
            <path
              d="M13 1.2 24 7.5v14L13 27.8 2 21.5v-14z"
              fill="none"
              stroke={T.accent}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="13" cy="14.5" r="4.4" fill={T.accent} />
          </svg>
          <span
            style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: ".14em",
              lineHeight: 1,
              color: T.text,
            }}
          >
            AGORIX
          </span>
        </Link>

        <nav
          className="agorix-nav__links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontSize: 14.5,
            color: T.nav,
            justifySelf: "center",
          }}
        >
          {links.map((item) => {
            if ("dropdown" in item) {
              return (
                <div key={item.label} className="agorix-nav__item">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    style={{
                      cursor: "pointer",
                      lineHeight: 1,
                      background: "none",
                      border: "none",
                      color: "inherit",
                      font: "inherit",
                      padding: 0,
                    }}
                  >
                    {item.label}
                  </button>
                  {openDropdown === item.label && (
                    <div className="agorix-nav__dropdown">
                      {item.dropdown.map((dropItem) => (
                        <Link
                          key={dropItem.label}
                          to={dropItem.href}
                          className="agorix-nav__dropdown-item"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {dropItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isHash = item.href.startsWith("#");
            if (isHash) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  style={{
                    cursor: "pointer",
                    lineHeight: 1,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href}
                style={{
                  cursor: "pointer",
                  lineHeight: 1,
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "end" }}>
          <a href="/demo" style={btnOutlineSm}>
            Get Demo
          </a>
          <a href="/login" style={btnSolidSm}>
            login
          </a>
        </div>
      </header>
    </>
  );
}
