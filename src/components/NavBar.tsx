import { Link, useLocation } from "@tanstack/react-router";
import "./NavBar.css";
import { useState, useEffect, useRef } from "react";

export function NavBar() {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close if the clicked element is not inside any sw-nav-item
      if (openDropdown && !(event.target as HTMLElement).closest(".sw-nav-item")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const navItems = [
    {
      label: "AI factories",
      href: "/#ai-section",
      dropdown: [{ label: "Restaurant IQ", href: "/restaurant-iq" }],
    },
    { label: "company", href: "/#company" },
  ];

  return (
    <div className="sw-nav-shell">
      <nav className="sw-nav">
        <Link to="/" className="sw-logo">
          <span className="font-bold">λgorix</span>
        </Link>
        <div className="sw-nav-links">
          {navItems.map((item) => {
            if (item.dropdown) {
              return (
                <div key={item.label} className="sw-nav-item">
                  <Link
                    to={item.href.startsWith("/") ? item.href.split("#")[0] : "/"}
                    className={location.pathname === item.href.split("#")[0] ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenDropdown(openDropdown === item.label ? null : item.label);
                    }}
                  >
                    {item.label}
                  </Link>
                  {openDropdown === item.label && (
                    <div className="sw-nav-dropdown">
                      {item.dropdown.map((dropItem) => (
                        <Link
                          key={dropItem.label}
                          to={dropItem.href}
                          className="sw-nav-dropdown-item"
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
            return (
              <Link
                key={item.label}
                to={item.href.startsWith("/") ? item.href.split("#")[0] : "/"}
                className={location.pathname === item.href.split("#")[0] ? "active" : ""}
                onClick={(e) => {
                  if (item.href.includes("#")) {
                    e.preventDefault();
                    const hash = item.href.split("#")[1];
                    const element = document.getElementById(hash);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link to="/login" className="sw-nav-cta">
          Get started
        </Link>
      </nav>
    </div>
  );
}
