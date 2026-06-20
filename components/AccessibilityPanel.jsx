"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Accessibility, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccessibility } from "./AccessibilityContext.jsx";

/* ─── Constants ──────────────────────────────────────────────────────── */

const COLOR_BLIND_OPTIONS = [
  { value: "none",          label: "None" },
  { value: "deuteranopia",  label: "Deuteranopia" },
  { value: "protanopia",    label: "Protanopia" },
  { value: "monochrome",    label: "Monochrome" },
];

/* ─── Toggle switch ──────────────────────────────────────────────────── */

function Toggle({ id, checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
        {description && (
          <span className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-md",
            "transform transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────────────── */

function Divider() {
  return <div className="h-px bg-border" aria-hidden="true" />;
}

/* ─── AccessibilityPanel ─────────────────────────────────────────────── */

/**
 * AccessibilityPanel — a floating FAB (bottom-left, next to sidebar on desktop) 
 * that opens a vertical settings panel synced with the global AccessibilityContext.
 */
export function AccessibilityPanel({ onChange }) {
  const [open, setOpen] = useState(false);
  const {
    fontSize,
    highContrast,
    reduceMotion,
    readAloud,
    colorBlindMode,
    setFontSize,
    setHighContrast,
    setReduceMotion,
    setReadAloud,
    setColorBlindMode,
  } = useAccessibility();

  const panelRef = useRef(null);
  const fabRef   = useRef(null);
  const selectId = useId();

  // Call onChange if provided for backwards compatibility
  useEffect(() => {
    onChange?.({
      fontSize,
      highContrast,
      reduceMotion,
      readAloud,
      colorBlind: colorBlindMode
    });
  }, [fontSize, highContrast, reduceMotion, readAloud, colorBlindMode, onChange]);

  /* ── Close on Escape ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  /* ── Focus first interactive element when panel opens ────────────── */
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        panelRef.current?.querySelector("button, select")?.focus();
      }, 50);
    }
  }, [open]);

  /* ── Font-size helpers ────────────────────────────────────────────── */
  const FONT_SIZES = ["small", "medium", "large", "xl"];
  const currentIndex = FONT_SIZES.indexOf(fontSize);

  function decreaseFontSize() {
    if (currentIndex > 0) {
      setFontSize(FONT_SIZES[currentIndex - 1]);
    }
  }

  function increaseFontSize() {
    if (currentIndex < FONT_SIZES.length - 1) {
      setFontSize(FONT_SIZES[currentIndex + 1]);
    }
  }

  const sizeLabels = {
    small: "14px",
    medium: "16px",
    large: "19px",
    xl: "22px",
  };

  return (
    <>
      {/* ── Panel ──────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Accessibility settings"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          // positioning — bottom-left, above mobile tab-bar
          "fixed z-50 bottom-24 left-4",
          "md:bottom-24 md:left-64",
          // size
          "w-72",
          // surface
          "rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-2xl",
          // animation
          open
            ? "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0 translate-y-3",
          "transition-all duration-300",
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <Accessibility className="size-3.5" />
            </span>
            <span className="text-sm font-bold text-foreground">Accessibility</span>
          </div>
          <button
            type="button"
            aria-label="Close accessibility panel"
            onClick={() => { setOpen(false); fabRef.current?.focus(); }}
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-secondary hover:text-foreground",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        {/* Controls */}
        <div className="flex flex-col gap-4 px-4 py-4">

          {/* 1 — Font Size */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground" id="font-size-label">
              Font Size
            </span>
            <div
              role="group"
              aria-labelledby="font-size-label"
              className="flex items-center gap-3"
            >
              <button
                type="button"
                aria-label="Decrease font size"
                disabled={currentIndex <= 0}
                onClick={decreaseFontSize}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  "border border-border bg-secondary text-foreground",
                  "text-base font-bold leading-none",
                  "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                A<span className="text-[10px] align-sub leading-none">−</span>
              </button>

              <div
                aria-live="polite"
                aria-atomic="true"
                className="flex-1 text-center text-sm font-semibold text-foreground tabular-nums capitalize"
              >
                {fontSize} ({sizeLabels[fontSize] || "16px"})
              </div>

              <button
                type="button"
                aria-label="Increase font size"
                disabled={currentIndex >= FONT_SIZES.length - 1}
                onClick={increaseFontSize}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  "border border-border bg-secondary text-foreground",
                  "text-base font-bold leading-none",
                  "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                A<span className="text-[10px] align-super leading-none">+</span>
              </button>
            </div>
          </div>

          <Divider />

          {/* 2 — High Contrast */}
          <Toggle
            id="toggle-high-contrast"
            checked={highContrast}
            onChange={setHighContrast}
            label="High Contrast"
            description="Increases text and border contrast."
          />

          <Divider />

          {/* 3 — Reduce Motion */}
          <Toggle
            id="toggle-reduce-motion"
            checked={reduceMotion}
            onChange={setReduceMotion}
            label="Reduce Motion"
            description="Minimises animations and transitions."
          />

          <Divider />

          {/* 4 — Read Aloud */}
          <Toggle
            id="toggle-read-aloud"
            checked={readAloud}
            onChange={setReadAloud}
            label="Read Aloud"
            description="Enables screen-reader friendly focus mode."
          />

          <Divider />

          {/* 5 — Colour Blind Mode */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={selectId}
              className="text-sm font-medium text-foreground"
            >
              Color Blind Mode
            </label>
            <div className="relative">
              <select
                id={selectId}
                value={colorBlindMode}
                onChange={(e) => setColorBlindMode(e.target.value)}
                aria-label="Color blind mode"
                className={cn(
                  "w-full appearance-none rounded-xl border border-border",
                  "bg-secondary text-foreground text-sm",
                  "px-3 py-2 pr-8 leading-relaxed",
                  "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "cursor-pointer",
                )}
              >
                {COLOR_BLIND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Custom chevron */}
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      <button
        ref={fabRef}
        type="button"
        aria-label={open ? "Close accessibility panel" : "Open accessibility panel"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // position — bottom-left, above mobile tab-bar
          "fixed bottom-20 left-4 z-50",
          "md:bottom-8 md:left-64",
          // size + shape
          "flex size-14 items-center justify-center rounded-full",
          // colour
          "bg-secondary text-foreground border border-border shadow-lg",
          // interactions
          "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
          "active:scale-90",
          "transition-all duration-200",
          // focus
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // mount animation
          "animate-in zoom-in-75 duration-300",
        )}
      >
        {open
          ? <X             className="size-5" aria-hidden="true" />
          : <Accessibility className="size-5" aria-hidden="true" />}
      </button>
    </>
  );
}
