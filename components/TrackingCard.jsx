"use client";

import { Bike, Bus, Car, Train, Footprints, Zap, Leaf, Trash2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCarbon } from "@/hooks/useCarbon";

/* ─── Category definitions with parameters for the carbon engine ───── */

const CATEGORIES = {
  commute: {
    label: "Commute",
    description: "How did you travel today?",
    icon: Bike,
    options: [
      { id: "walk",   label: "Walk",   icon: Footprints, coins: 12, params: { km: 2 } },
      { id: "cycle",  label: "Cycle",  icon: Bike,       coins: 10, params: { km: 5 } },
      { id: "bus",    label: "Bus",    icon: Bus,        coins: 6,  params: { km: 10 } },
      { id: "metro",  label: "Metro",  icon: Train,      coins: 5,  params: { km: 15 } },
      { id: "car",    label: "Car",    icon: Car,        coins: 1,  params: { km: 15 } },
    ],
  },
  food: {
    label: "Food",
    description: "What did you eat today?",
    icon: UtensilsCrossed,
    options: [
      { id: "vegan",        label: "Vegan",        icon: Leaf,            coins: 12, params: { quantity: 1 } },
      { id: "vegetarian",   label: "Vegetarian",   icon: Leaf,            coins: 9,  params: { quantity: 1 } },
      { id: "local",        label: "Local Produce", icon: Leaf,           coins: 7,  params: { quantity: 1 } },
      { id: "chicken",      label: "Chicken",       icon: UtensilsCrossed, coins: 4,  params: { quantity: 1 } },
      { id: "beef",         label: "Beef",          icon: UtensilsCrossed, coins: 1,  params: { quantity: 1 } },
    ],
  },
  energy: {
    label: "Energy",
    description: "How did you power your day?",
    icon: Zap,
    options: [
      { id: "solar",   label: "Solar",    icon: Zap, coins: 12, params: { hours: 0 } },
      { id: "wind",    label: "Wind",     icon: Zap, coins: 11, params: { hours: 0 } },
      { id: "led",     label: "LED Bulbs", icon: Zap, coins: 8,  params: { hours: 2 } },
      { id: "grid",    label: "Grid",     icon: Zap, coins: 4,  params: { hours: 6 } },
      { id: "ac",      label: "High A/C", icon: Zap, coins: 1,  params: { hours: 4 } },
    ],
  },
  waste: {
    label: "Waste",
    description: "How did you handle waste today?",
    icon: Trash2,
    options: [
      { id: "zero",      label: "Zero Waste",  icon: Trash2, coins: 14, params: { quantity: 0 } },
      { id: "compost",   label: "Composted",   icon: Trash2, coins: 10, params: { quantity: 0 } },
      { id: "recycled",  label: "Recycled",    icon: Trash2, coins: 7,  params: { quantity: 1 } },
      { id: "mixed",     label: "Mixed Bin",   icon: Trash2, coins: 3,  params: { quantity: 3 } },
      { id: "landfill",  label: "Landfill",    icon: Trash2, coins: 0,  params: { quantity: 2 } },
    ],
  },
};

/* ─── Chip ───────────────────────────────────────────────────────────── */

function Chip({ option, selected, onSelect }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${option.label} — +${option.coins} coins`}
      onClick={() => onSelect(option.id)}
      className={cn(
        // base
        "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        // unselected
        "border border-border bg-secondary text-secondary-foreground",
        "hover:border-primary/50 hover:bg-accent hover:text-accent-foreground hover:scale-[1.04]",
        // selected
        selected && [
          "border-primary bg-primary/10 text-primary",
          "dark:bg-primary/20",
          "scale-[1.04]",
        ]
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0 transition-colors duration-200",
          selected ? "text-primary" : "text-muted-foreground"
        )}
      />
      {option.label}
    </button>
  );
}

/* ─── Coin Badge ─────────────────────────────────────────────────────── */

function CoinBadge({ coins, visible }) {
  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
        "bg-primary/10 text-primary dark:bg-primary/20",
        "transition-all duration-300 ease-out",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
      )}
    >
      {/* coin glyph */}
      <span aria-hidden="true" className="inline-block size-3 rounded-full bg-primary/80" />
      {`+${coins} Coins`}
    </span>
  );
}

/* ─── TrackingCard ───────────────────────────────────────────────────── */

/**
 * TrackingCard — a self-contained activity-tracking card for one
 * action category (Commute, Food, Energy, Waste).
 *
 * @param {{ category: "commute"|"food"|"energy"|"waste" }} props
 */
export function TrackingCard({ category = "commute" }) {
  const { logs, logEntry } = useCarbon();
  const config = CATEGORIES[category];
  
  if (!config) return null;

  const existingLog = logs.find((l) => l.category === category);
  const selected = existingLog ? existingLog.value : null;

  const HeaderIcon = config.icon;
  const selectedOption = config.options.find((o) => o.id === selected);
  const coins = selectedOption?.coins ?? 0;

  const handleSelect = async (optionId) => {
    const option = config.options.find((o) => o.id === optionId);
    if (!option) return;
    await logEntry(category, optionId, option.params);
  };

  return (
    <article
      aria-label={`${config.label} tracking card`}
      className={cn(
        "flex flex-col gap-4 rounded-2xl p-5",
        "bg-card text-card-foreground",
        "border border-border",
        "shadow-sm",
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      {/* Header row */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Icon badge */}
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center size-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary shrink-0"
          >
            <HeaderIcon className="size-4.5" />
          </span>

          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold leading-tight">{config.label}</h3>
            <p className="text-xs text-muted-foreground leading-tight">{config.description}</p>
          </div>
        </div>

        {/* Coin badge — fades in on selection */}
        <CoinBadge coins={coins} visible={selected !== null} />
      </header>

      {/* Chip group */}
      <div
        role="radiogroup"
        aria-label={`${config.label} options`}
        className="flex flex-wrap gap-2"
      >
        {config.options.map((option) => (
          <Chip
            key={option.id}
            option={option}
            selected={selected === option.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </article>
  );
}
