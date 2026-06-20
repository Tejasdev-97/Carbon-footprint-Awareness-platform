"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Returns the stroke color class based on score thresholds.
 * Green: 70–100 | Amber: 40–69 | Red: 0–39
 */
function getColorClass(score) {
  if (score >= 70) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 40) return "text-amber-500 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

/**
 * Returns the raw hex value used as the SVG stroke (currentColor won't
 * work directly on <circle stroke>).
 */
function getStrokeColor(score) {
  if (score >= 70) return "var(--score-green)";
  if (score >= 40) return "var(--score-amber)";
  return "var(--score-red)";
}

/**
 * Returns a human-readable label describing the score band.
 */
function getScoreLabel(score) {
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

/**
 * ScoreRing — a circular SVG progress ring showing a city health score.
 *
 * @param {Object}  props
 * @param {number}  props.score  — 0 to 100
 * @param {number}  [props.size] — diameter in px (default 160)
 */
export function ScoreRing({ score = 0, size = 160 }) {
  const clampedScore = Math.min(100, Math.max(0, score));

  const strokeWidth = size * 0.075;           // proportional ring thickness
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Animate dashoffset from 0 (empty) → target on mount
  const [animatedScore, setAnimatedScore] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 900; // ms

  useEffect(() => {
    const from = 0;
    const to = clampedScore;

    function step(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(from + (to - from) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startRef.current = null;
    };
  }, [clampedScore]);

  const offset = circumference - (animatedScore / 100) * circumference;
  const colorClass = getColorClass(clampedScore);
  const strokeColor = getStrokeColor(clampedScore);
  const scoreLabel = getScoreLabel(clampedScore);

  const fontSize = size * 0.22;
  const subFontSize = size * 0.1;
  const labelFontSize = size * 0.09;

  return (
    <>
      {/* Inject CSS custom properties for the ring colors once */}
      <style>{`
        :root {
          --score-green: oklch(0.62 0.18 145);
          --score-amber: oklch(0.72 0.18 70);
          --score-red:   oklch(0.58 0.22 27);
        }
        .dark {
          --score-green: oklch(0.7 0.18 145);
          --score-amber: oklch(0.78 0.18 70);
          --score-red:   oklch(0.66 0.22 27);
        }
      `}</style>

      <figure
        role="img"
        aria-label={`City Health score: ${clampedScore} out of 100 — ${scoreLabel}`}
        className="inline-flex flex-col items-center gap-0 select-none"
        style={{ width: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          aria-hidden="true"
          className="overflow-visible"
        >
          {/* Track (background ring) */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              filter: `drop-shadow(0 0 ${size * 0.025}px ${strokeColor})`,
            }}
          />

          {/* Score number */}
          <text
            x={cx}
            y={cy - size * 0.03}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="inherit"
            className={cn("fill-current transition-colors duration-300", colorClass)}
          >
            {Math.round(animatedScore)}
          </text>

          {/* "City Health" sub-label */}
          <text
            x={cx}
            y={cy + size * 0.2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={subFontSize}
            fontWeight="500"
            fontFamily="inherit"
            className="fill-current text-muted-foreground"
          >
            City Health
          </text>
        </svg>

        {/* Score-band badge beneath the ring */}
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
            "transition-colors duration-300",
            clampedScore >= 70
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : clampedScore >= 40
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          )}
        >
          {/* Coloured dot */}
          <span
            className={cn(
              "inline-block size-1.5 rounded-full",
              clampedScore >= 70
                ? "bg-emerald-500 dark:bg-emerald-400"
                : clampedScore >= 40
                ? "bg-amber-500 dark:bg-amber-400"
                : "bg-red-500 dark:bg-red-400"
            )}
            aria-hidden="true"
          />
          {scoreLabel}
        </span>
      </figure>
    </>
  );
}
