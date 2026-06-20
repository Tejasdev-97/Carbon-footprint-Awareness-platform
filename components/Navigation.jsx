"use client";

import { useState, useEffect, useRef } from "react";
import {
  Home,
  Globe,
  Activity,
  Award,
  Users,
  Leaf,
  Sun,
  Moon,
  ChevronDown,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSetting, putSetting } from "@/lib/db";
import i18n from "@/lib/i18n";

// ── Data ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "City", href: "#city" },
  { label: "Track", href: "#track" },
  { label: "Badges", href: "#badges" },
  { label: "Community", href: "#community" },
];

const MOBILE_TABS = [
  { label: "Home", href: "#home", Icon: Home },
  { label: "City", href: "#city", Icon: Globe },
  { label: "Track", href: "#track", Icon: Activity },
  { label: "Badges", href: "#badges", Icon: Award },
  { label: "Community", href: "#community", Icon: Users },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

// ── Sub-components ───────────────────────────────────────────────────────

/** Leaf logo mark */
function Logo() {
  return (
    <a
      href="/"
      className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-xl"
      aria-label="Prithvi home"
    >
      <span
        className="flex items-center justify-center size-9 rounded-2xl bg-primary shadow-sm"
        aria-hidden="true"
      >
        <Sprout className="size-5 text-primary-foreground" />
      </span>
      <span className="font-heading font-semibold text-lg text-foreground tracking-tight">
        Prithvi
      </span>
    </a>
  );
}

/** Desktop centre nav links */
function DesktopLinks({ active, onboarded }) {
  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-1" role="list">
        {NAV_LINKS.map(({ label }) => {
          const href = label === "Home" ? "/" : (onboarded ? `/dashboard/${label.toLowerCase()}` : "/onboarding");
          return (
            <li key={label}>
              <a
                href={href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active === label
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
                aria-current={active === label ? "page" : undefined}
              >
                {label}
                {active === label && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Language dropdown */
function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-accent/60",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          open && "bg-accent text-foreground"
        )}
      >
        <Globe className="size-4" aria-hidden="true" />
        <span>{selected.code.toUpperCase()}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Languages"
          className={cn(
            "absolute right-0 top-full mt-2 w-36 py-1 z-50",
            "bg-popover text-popover-foreground rounded-2xl border border-border",
            "shadow-lg shadow-foreground/5 backdrop-blur-sm"
          )}
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={selected.code === lang.code}>
              <button
                type="button"
                onClick={() => {
                  setSelected(lang);
                  setOpen(false);
                  // Persist selection and switch app language immediately
                  i18n.changeLanguage(lang.code).catch(() => {})
                  putSetting('language', lang.code).catch(() => {})
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm rounded-xl mx-auto transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  selected.code === lang.code
                    ? "text-primary font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Theme toggle */
function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center justify-center size-9 rounded-xl transition-colors duration-150",
        "text-muted-foreground hover:text-foreground hover:bg-accent/60",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      )}
    >
      {dark ? (
        <Sun className="size-4.5" aria-hidden="true" />
      ) : (
        <Moon className="size-4.5" aria-hidden="true" />
      )}
    </button>
  );
}

/** CTA button */
function CTAButton() {
  return (
    <a
      href="/onboarding"
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-2xl transition-all duration-150",
        "bg-primary text-primary-foreground shadow-sm",
        "hover:opacity-90 active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      )}
    >
      <Leaf className="size-3.5" aria-hidden="true" />
      Track My Impact
    </a>
  );
}

// ── Main Navigation ──────────────────────────────────────────────────────
export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    getSetting("onboardingComplete", false)
      .then((val) => setOnboarded(!!val))
      .catch(() => {});
  }, []);

  // Frosted glass on scroll
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Detect system preference or localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("prithvi-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefersDark);
  }, []);

  const handleToggleDark = () => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem("prithvi-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <>
      {/* ── Desktop top nav ─────────────────────────────────────── */}
      <header
        role="banner"
        className={cn(
          "hidden md:flex fixed inset-x-0 top-0 z-50 justify-center",
          "transition-all duration-300"
        )}
      >
        <div
          className={cn(
            "flex w-full max-w-6xl items-center justify-between gap-4",
            "mx-4 my-3 px-5 py-2.5 rounded-2xl border transition-all duration-300",
            scrolled
              ? [
                  "border-[var(--nav-border)] shadow-lg shadow-foreground/5",
                  "backdrop-blur-md backdrop-saturate-150",
                  "bg-[var(--nav-glass)]",
                ]
              : "border-transparent bg-background/60 backdrop-blur-sm"
          )}
        >
          <Logo />
          <DesktopLinks active={activeTab} onboarded={onboarded} />
          <div className="flex items-center gap-1">
            <LanguageDropdown />
            <ThemeToggle dark={dark} onToggle={handleToggleDark} />
            <div className="ml-2">
              <CTAButton />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-50 flex items-center justify-around",
          "px-2 py-2",
          "border-t border-[var(--nav-border)] bg-[var(--nav-glass)]",
          "backdrop-blur-md backdrop-saturate-150"
        )}
      >
        {MOBILE_TABS.map(({ label, Icon }) => {
          const href = label === "Home" ? "/" : (onboarded ? `/dashboard/${label.toLowerCase()}` : "/onboarding");
          const isActive = activeTab === label;
          return (
            <a
              key={label}
              href={href}
              onClick={() => setActiveTab(label)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl",
                "transition-all duration-200 min-w-12",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </a>
          );
        })}

        {/* Inline theme toggle on mobile */}
        <button
          type="button"
          onClick={handleToggleDark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl min-w-12",
            "transition-all duration-200",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          )}
        >
          <span className="flex items-center justify-center px-3 py-1.5 rounded-2xl text-muted-foreground hover:text-foreground transition-colors duration-200">
            {dark ? (
              <Sun className="size-5" aria-hidden="true" />
            ) : (
              <Moon className="size-5" aria-hidden="true" />
            )}
          </span>
          <span className="text-[10px] font-medium leading-none text-muted-foreground">
            {dark ? "Light" : "Dark"}
          </span>
        </button>
      </nav>
    </>
  );
}
