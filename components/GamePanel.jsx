"use client";

import { useEffect, useRef, useState } from "react";
import {
  Flame,
  Leaf,
  Lock,
  Coins,
  Sprout,
  TreePine,
  Wind,
  Droplets,
  Sun,
  Bike,
  Recycle,
  Globe,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Sample data ────────────────────────────────────────────────────── */

const DEFAULT_PLAYER = {
  streak: 14,
  level: 7,
  coins: 1340,
  xp: 680,
  xpNextLevel: 1000,
  badges: [
    { id: "sprout",   label: "Sprout",      icon: Sprout,   unlocked: true  },
    { id: "tree",     label: "Tree Hugger", icon: TreePine, unlocked: true  },
    { id: "wind",     label: "Wind Rider",  icon: Wind,     unlocked: true  },
    { id: "drops",    label: "Water Saver", icon: Droplets, unlocked: true  },
    { id: "sun",      label: "Solar Star",  icon: Sun,      unlocked: true  },
    { id: "bike",     label: "Cycle Hero",  icon: Bike,     unlocked: false },
    { id: "recycle",  label: "Zero Waste",  icon: Recycle,  unlocked: false },
    { id: "globe",    label: "Earth First", icon: Globe,    unlocked: false },
    { id: "star",     label: "Eco Legend",  icon: Star,     unlocked: false },
  ],
};

/* ─── Animated XP Bar ────────────────────────────────────────────────── */

function XPBar({ xp, xpNextLevel }) {
  const pct = Math.min(100, Math.round((xp / xpNextLevel) * 100));
  const [width, setWidth] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 900;

  useEffect(() => {
    const target = pct;
    function step(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setWidth(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startRef.current = null;
    };
  }, [pct]);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span>XP Progress</span>
        <span aria-live="polite" aria-atomic="true">
          <span className="text-foreground font-semibold">{xp.toLocaleString()}</span>
          {" / "}
          {xpNextLevel.toLocaleString()} XP
        </span>
      </div>

      {/* Track */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={xpNextLevel}
        aria-valuenow={xp}
        aria-label={`XP progress: ${xp} of ${xpNextLevel}`}
        className="relative h-3 w-full overflow-hidden rounded-full bg-secondary"
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-none"
          style={{ width: `${width}%` }}
        />
        {/* Subtle shimmer stripe */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{
            width: `${width}%`,
            background:
              "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 40%) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      </div>

      {/* Percentage */}
      <p className="text-right text-xs text-muted-foreground">{pct}% to next level</p>
    </div>
  );
}

/* ─── Stat Pill ──────────────────────────────────────────────────────── */

function StatPill({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary flex-1 min-w-0">
      <Icon
        aria-hidden="true"
        className={cn("size-4 shrink-0", iconClass)}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground leading-snug truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

/* ─── Badge Item ─────────────────────────────────────────────────────── */

function BadgeItem({ badge }) {
  const Icon = badge.icon;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "relative flex items-center justify-center",
          "size-14 rounded-full border-2 transition-all duration-200",
          badge.unlocked
            ? [
                "border-primary/40 bg-primary/10 dark:bg-primary/20",
                "shadow-sm hover:shadow-md hover:scale-105",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              ]
            : [
                "border-border bg-secondary opacity-50 grayscale",
              ]
        )}
        tabIndex={0}
        role="img"
        aria-label={
          badge.unlocked
            ? `${badge.label} badge — unlocked`
            : `${badge.label} badge — locked`
        }
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-6",
            badge.unlocked ? "text-primary" : "text-muted-foreground"
          )}
        />

        {/* Lock overlay */}
        {!badge.unlocked && (
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 flex items-center justify-center size-5 rounded-full bg-background border border-border"
          >
            <Lock className="size-2.5 text-muted-foreground" />
          </span>
        )}
      </div>

      <span
        className={cn(
          "text-[10px] font-medium text-center leading-tight max-w-[56px] truncate",
          badge.unlocked ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {badge.label}
      </span>
    </div>
  );
}

/* ─── GamePanel ──────────────────────────────────────────────────────── */

/**
 * GamePanel — displays a player's gamification status:
 * streak / level / coins, animated XP bar, and a 3-col badge grid.
 *
 * @param {Object}  props
 * @param {Object}  [props.player] — override default player data for demo/testing
 */
export function GamePanel({ player = DEFAULT_PLAYER }) {
  const unlockedCount = player.badges.filter((b) => b.unlocked).length;

  return (
    <>
      {/* Shimmer keyframe — injected once */}
      <style>{`
        @keyframes shimmer {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }
      `}</style>

      <section
        aria-label="Gamification panel"
        className={cn(
          "flex flex-col gap-5 rounded-2xl p-5",
          "bg-card text-card-foreground",
          "border border-border",
          "shadow-sm"
        )}
      >
        {/* ── Top: Stats bar ─────────────────────────────────────────── */}
        <div
          role="group"
          aria-label="Player stats"
          className="flex gap-2"
        >
          <StatPill
            icon={Flame}
            label="Streak"
            value={`${player.streak}d`}
            iconClass="text-orange-500 dark:text-orange-400"
          />
          <StatPill
            icon={Leaf}
            label="Level"
            value={`Lv. ${player.level}`}
            iconClass="text-primary"
          />
          <StatPill
            icon={Coins}
            label="Coins"
            value={player.coins.toLocaleString()}
            iconClass="text-amber-500 dark:text-amber-400"
          />
        </div>

        {/* ── Middle: XP progress ────────────────────────────────────── */}
        <XPBar xp={player.xp} xpNextLevel={player.xpNextLevel} />

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Badges ({unlockedCount}/{player.badges.length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Bottom: Badge grid ─────────────────────────────────────── */}
        <div
          role="list"
          aria-label="Achievement badges"
          className="grid grid-cols-3 gap-y-4 gap-x-2 justify-items-center"
        >
          {player.badges.map((badge) => (
            <div key={badge.id} role="listitem">
              <BadgeItem badge={badge} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
