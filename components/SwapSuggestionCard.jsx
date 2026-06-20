"use client";

import { useState } from "react";
import { Lightbulb, Leaf, IndianRupee, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Default demo suggestion ────────────────────────────────────────── */

const DEFAULT_SUGGESTION = {
  title: "Take the Metro Instead of Driving",
  description:
    "Switching your daily commute from a private car to the metro for one month can dramatically cut your personal carbon output — and save you money on fuel and parking.",
  co2Saved: 18.4,
  moneySaved: 1260,
};

/* ─── Impact Stat ────────────────────────────────────────────────────── */

function ImpactStat({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0 rounded-xl bg-secondary px-4 py-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center size-9 shrink-0 rounded-lg",
          "bg-background",
        )}
      >
        <Icon className={cn("size-4.5", iconClass)} />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">
          {label}
        </span>
        <span className="text-base font-bold text-foreground leading-snug truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

/* ─── SwapSuggestionCard ─────────────────────────────────────────────── */

/**
 * SwapSuggestionCard — a slide-up suggestion card that presents a
 * behaviour-swap idea with impact metrics and pledge / dismiss actions.
 *
 * @param {Object}   props
 * @param {string}   [props.title]         — suggestion headline
 * @param {string}   [props.description]   — supporting copy
 * @param {number}   [props.co2Saved]      — kg CO₂ saved
 * @param {number}   [props.moneySaved]    — ₹ saved
 * @param {Function} [props.onPledge]      — called when user pledges
 * @param {Function} [props.onDismiss]     — called when user dismisses
 */
export function SwapSuggestionCard({
  title       = DEFAULT_SUGGESTION.title,
  description = DEFAULT_SUGGESTION.description,
  co2Saved    = DEFAULT_SUGGESTION.co2Saved,
  moneySaved  = DEFAULT_SUGGESTION.moneySaved,
  onPledge,
  onDismiss,
}) {
  const [pledged,   setPledged]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* ── Handlers ──────────────────────────────────────────────────────── */

  function handlePledge() {
    if (pledged) return;
    setPledged(true);
    onPledge?.();
  }

  function handleDismiss() {
    setDismissed(true);
    // Small delay so the fade-out plays before unmounting
    setTimeout(() => onDismiss?.(), 300);
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div
      role="region"
      aria-label="Swap suggestion"
      aria-live="polite"
      className={cn(
        // layout
        "relative flex flex-col gap-5 rounded-2xl p-6",
        // surface
        "bg-card text-card-foreground border border-border shadow-sm",
        // slide-up entrance
        "animate-in slide-in-from-bottom-6 fade-in duration-500 ease-out",
        // dismissed fade-out
        dismissed && "opacity-0 translate-y-2 transition-all duration-300 pointer-events-none",
      )}
    >
      {/* ── Dismiss button (top-right) ─────────────────────────────── */}
      {!pledged && (
        <button
          type="button"
          aria-label="Dismiss suggestion"
          onClick={handleDismiss}
          className={cn(
            "absolute top-4 right-4",
            "flex items-center justify-center size-7 rounded-full",
            "text-muted-foreground bg-secondary",
            "hover:bg-destructive/10 hover:text-destructive",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          )}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 pr-8">
        {/* Icon badge */}
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center size-11 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary self-start"
        >
          <Lightbulb className="size-5" />
        </span>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold leading-snug text-balance">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            {description}
          </p>
        </div>
      </header>

      {/* ── Impact stats ───────────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Impact summary"
        className="flex gap-3"
      >
        <ImpactStat
          icon={Leaf}
          label="CO₂ Saved"
          value={`${co2Saved} kg`}
          iconClass="text-primary"
        />
        <ImpactStat
          icon={IndianRupee}
          label="Money Saved"
          value={`₹${moneySaved.toLocaleString("en-IN")}`}
          iconClass="text-amber-500 dark:text-amber-400"
        />
      </div>

      {/* ── Actions ────────────────────────────────────────────────── */}
      {pledged ? (
        /* ── Pledged confirmation ─────────────────────────────────── */
        <div
          aria-live="assertive"
          className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl",
            "bg-primary/10 dark:bg-primary/20 text-primary",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
          )}
        >
          <CheckCircle2 className="size-4.5 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">Pledged for tomorrow — great choice!</span>
        </div>
      ) : (
        /* ── Button row ───────────────────────────────────────────── */
        <div className="flex gap-3">
          {/* Primary: Pledge */}
          <button
            type="button"
            aria-label="Pledge to take this action tomorrow"
            onClick={handlePledge}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "px-4 py-2.5 rounded-xl text-sm font-semibold",
              "bg-primary text-primary-foreground",
              "hover:opacity-90 active:scale-[0.98]",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            )}
          >
            <Lightbulb className="size-4" aria-hidden="true" data-icon="inline-start" />
            Pledge for Tomorrow
          </button>

          {/* Ghost: Dismiss */}
          <button
            type="button"
            aria-label="Dismiss this suggestion"
            onClick={handleDismiss}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold",
              "text-muted-foreground bg-transparent border border-border",
              "hover:bg-secondary hover:text-foreground",
              "active:scale-[0.98]",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            )}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
