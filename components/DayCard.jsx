"use client";

import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/ScoreRing";
import {
  Leaf,
  TrendingUp,
  TrendingDown,
  Coins,
  Share2,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as "Wednesday, 18 June 2025" */
function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ActionRow({ icon: Icon, label, text, positive }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-2.5",
        positive
          ? "bg-emerald-500/10 dark:bg-emerald-400/10"
          : "bg-red-500/10 dark:bg-red-400/10"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex-shrink-0 rounded-lg p-1.5",
          positive
            ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
            : "bg-red-500/15 text-red-600 dark:bg-red-400/15 dark:text-red-400"
        )}
        aria-hidden="true"
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            positive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {label}
        </p>
        <p className="text-xs font-medium text-foreground leading-snug text-pretty">
          {text}
        </p>
      </div>
    </div>
  );
}

function CoinsRow({ coins }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-amber-500/10 dark:bg-amber-400/10 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className="rounded-lg bg-amber-500/15 p-1.5 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400"
          aria-hidden="true"
        >
          <Coins className="size-3.5" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Coins Earned Today
        </p>
      </div>
      <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
        +{coins}
      </p>
    </div>
  );
}

function Watermark() {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      aria-hidden="true"
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Leaf className="size-3" />
      </span>
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">
        prithvi.earth
      </span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

/**
 * DayCard — a shareable 1:1 social card summarising a user's day.
 *
 * @param {Object}  props
 * @param {Date}    [props.date]          — defaults to today
 * @param {number}  [props.score]         — city health score 0–100
 * @param {string}  [props.bestAction]    — best action text
 * @param {string}  [props.worstAction]   — worst action text
 * @param {number}  [props.coinsEarned]   — coins earned today
 * @param {string}  [props.userName]      — optional user name shown in header
 * @param {string}  [props.cityName]      — city name shown beneath score ring
 * @param {Function} [props.onShare]      — called when Share button is pressed
 * @param {string}  [props.className]     — extra classes on the card root
 */
export function DayCard({
  date = new Date(),
  score = 74,
  bestAction = "Took the metro instead of driving",
  worstAction = "Left charger plugged in overnight",
  coinsEarned = 42,
  userName = "",
  cityName = "",
  onShare,
  className,
}) {
  const formattedDate = formatDate(date);

  return (
    <article
      aria-label={`Daily summary card for ${userName} on ${formattedDate}`}
      className={cn(
        // Square card
        "relative aspect-square w-full max-w-sm",
        // Shape & surface
        "rounded-2xl overflow-hidden",
        "bg-card text-card-foreground",
        // Soft layered shadow for that "premium social card" look
        "shadow-[0_2px_4px_oklch(0_0_0/0.04),0_8px_24px_oklch(0_0_0/0.08),0_24px_48px_oklch(0_0_0/0.06)]",
        // Subtle border
        "border border-border/60",
        className
      )}
    >
      {/* Subtle tinted inner glow — purely decorative */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/[0.03]"
        aria-hidden="true"
      />

      {/* ── Layout: flex column fills the square ── */}
      <div className="flex h-full flex-col justify-between p-5">

        {/* ── Header row ── */}
        <header className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {formattedDate}
            </p>
            <h2 className="mt-0.5 text-base font-bold leading-tight text-foreground">
              {userName ? `${userName}'s Day Summary` : 'Your Day Summary'}
            </h2>
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={onShare}
            aria-label="Share this day card"
            className={cn(
              "flex-shrink-0 rounded-xl p-2",
              "bg-secondary text-secondary-foreground",
              "transition-colors duration-150",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <Share2 className="size-4" aria-hidden="true" />
          </button>
        </header>

        {/* ── Score ring ── */}
        <div className="flex flex-col items-center gap-0.5">
          <ScoreRing score={score} size={112} />
          <p className="text-xs font-medium text-muted-foreground -mt-1">
            {cityName}
          </p>
        </div>

        {/* ── Action rows + coins ── */}
        <div className="flex flex-col gap-2">
          <ActionRow
            icon={TrendingUp}
            label="Best Action"
            text={bestAction}
            positive
          />
          <ActionRow
            icon={TrendingDown}
            label="Worst Action"
            text={worstAction}
            positive={false}
          />
          <CoinsRow coins={coinsEarned} />
        </div>

        {/* ── Watermark ── */}
        <footer>
          <Watermark />
        </footer>
      </div>
    </article>
  );
}
