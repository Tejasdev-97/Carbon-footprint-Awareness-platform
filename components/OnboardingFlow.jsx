"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Globe,
  MapPin,
  User,
  ClipboardList,
  ChevronLeft,
  ChevronDown,
  Search,
  Check,
  Car,
  Bus,
  Train,
  Bike,
  Footprints,
  Beef,
  Drumstick,
  Leaf,
  Zap,
  Flame,
  Sun,
  Trash2,
  Recycle,
  ShoppingBag,
  Home,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n";

/* ─── Static data ────────────────────────────────────────────────────── */

const LANGUAGES = [
  { code: "en", label: "English"    },
  { code: "hi", label: "हिन्दी"     },
  { code: "ta", label: "தமிழ்"      },
  { code: "te", label: "తెలుగు"     },
  { code: "bn", label: "বাংলা"      },
  { code: "mr", label: "मराठी"      },
  { code: "kn", label: "ಕನ್ನಡ"      },
  { code: "gu", label: "ગુજરાતી"   },
  { code: "ml", label: "മലയാളം"    },
];

const CITIES = [
  "Agra", "Ahmedabad", "Bengaluru", "Bhopal", "Chennai",
  "Delhi", "Hyderabad", "Jaipur", "Kochi", "Kolkata",
  "Lucknow", "Mumbai", "Nagpur", "Patna", "Pune",
  "Surat", "Vadodara", "Varanasi", "Visakhapatnam",
];

const AVATARS = [
  { id: "leaf",    emoji: "🌿", label: "Leaf"    },
  { id: "sun",     emoji: "☀️", label: "Sun"     },
  { id: "drop",    emoji: "💧", label: "Drop"    },
  { id: "seedling",emoji: "🌱", label: "Seedling"},
  { id: "earth",   emoji: "🌍", label: "Earth"   },
  { id: "cloud",   emoji: "☁️", label: "Cloud"   },
];

const QUIZ = [
  {
    id: "commute",
    question: "How do you usually commute to work or school?",
    options: [
      { id: "walk",   label: "Walk or cycle",          icon: Footprints, impact: "lowest"  },
      { id: "metro",  label: "Metro / bus / train",     icon: Train,      impact: "low"     },
      { id: "carpool",label: "Carpool with others",     icon: Car,        impact: "medium"  },
      { id: "car",    label: "Drive alone",             icon: Car,        impact: "high"    },
    ],
  },
  {
    id: "diet",
    question: "Which best describes your typical diet?",
    options: [
      { id: "vegan",  label: "Vegan",                  icon: Leaf,       impact: "lowest"  },
      { id: "veg",    label: "Vegetarian",              icon: Leaf,       impact: "low"     },
      { id: "omni",   label: "Eat everything",          icon: Drumstick,  impact: "medium"  },
      { id: "beef",   label: "High red meat",           icon: Beef,       impact: "high"    },
    ],
  },
  {
    id: "energy",
    question: "How is your home primarily powered?",
    options: [
      { id: "solar",  label: "Rooftop solar",           icon: Sun,        impact: "lowest"  },
      { id: "renew",  label: "Green electricity plan",  icon: Zap,        impact: "low"     },
      { id: "grid",   label: "Standard grid power",     icon: Home,       impact: "medium"  },
      { id: "coal",   label: "Coal / diesel backup",    icon: Flame,      impact: "high"    },
    ],
  },
  {
    id: "shopping",
    question: "How often do you buy new clothes or electronics?",
    options: [
      { id: "rare",   label: "Rarely — buy second-hand", icon: Recycle,   impact: "lowest"  },
      { id: "few",    label: "A few times a year",       icon: ShoppingBag,impact: "low"    },
      { id: "monthly",label: "Once a month",             icon: ShoppingBag,impact: "medium" },
      { id: "weekly", label: "Every week",               icon: Building2,  impact: "high"   },
    ],
  },
  {
    id: "waste",
    question: "How do you handle most of your household waste?",
    options: [
      { id: "zero",   label: "Zero waste / composting", icon: Leaf,       impact: "lowest"  },
      { id: "recycle",label: "Recycle most items",      icon: Recycle,    impact: "low"     },
      { id: "some",   label: "Recycle sometimes",       icon: Trash2,     impact: "medium"  },
      { id: "bin",    label: "Mostly landfill bin",     icon: Trash2,     impact: "high"    },
    ],
  },
];

const STEP_META = [
  { id: "language", label: "Language", icon: Globe        },
  { id: "city",     label: "City",     icon: MapPin       },
  { id: "profile",  label: "Profile",  icon: User         },
  { id: "quiz",     label: "Quiz",     icon: ClipboardList},
];

/* ─── Progress dots ──────────────────────────────────────────────────── */

function ProgressDots({ total, current }) {
  return (
    <nav aria-label="Onboarding progress" className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          role="img"
          aria-label={
            i < current ? `Step ${i + 1} completed` :
            i === current ? `Step ${i + 1} current` :
            `Step ${i + 1} upcoming`
          }
          className={cn(
            "rounded-full transition-all duration-300",
            i === current
              ? "w-6 h-2.5 bg-primary"
              : i < current
                ? "size-2.5 bg-primary/50"
                : "size-2.5 bg-border",
          )}
        />
      ))}
    </nav>
  );
}

/* ─── Step header ────────────────────────────────────────────────────── */

function StepHeader({ step, subtitle }) {
  const meta = STEP_META[step];
  const Icon = meta.icon;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm"
      >
        <Icon className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─── Step 1: Language ───────────────────────────────────────────────── */

function LanguageStep({ value, onChange }) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={0} subtitle="Choose the language you are most comfortable with." />

      <div
        role="radiogroup"
        aria-label="Language selection"
        className="grid grid-cols-3 gap-2"
      >
        {LANGUAGES.map((lang) => {
          const selected = value === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(lang.code)}
              className={cn(
                "flex items-center justify-center px-2 py-3 rounded-xl border text-sm font-medium",
                "transition-all duration-150 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                selected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03]"
                  : "bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-transparent",
              )}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 2: City ───────────────────────────────────────────────────── */

function CityStep({ value, onChange }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const inputId             = useId();
  const listId              = useId();
  const containerRef        = useRef(null);

  const filtered = CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={1} subtitle="Tell us where you live so we can show your city's environmental health score." />

      <div ref={containerRef} className="relative">
        <label htmlFor={inputId} className="sr-only">Search your city</label>
        <div className="relative flex items-center">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            placeholder="Search your city…"
            value={open ? query : (value || query)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-autocomplete="list"
            onFocus={() => { setQuery(""); setOpen(true); }}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            className={cn(
              "w-full rounded-xl border border-border bg-card pl-9 pr-3 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors duration-150",
            )}
          />
        </div>

        {open && filtered.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label="City suggestions"
            className={cn(
              "absolute z-20 mt-1 w-full max-h-52 overflow-y-auto",
              "rounded-2xl border border-border bg-card shadow-xl",
              "animate-in fade-in slide-in-from-top-2 duration-150",
            )}
          >
            {filtered.map((city) => (
              <li
                key={city}
                role="option"
                aria-selected={city === value}
                onClick={() => { onChange(city); setQuery(""); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100",
                  city === value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {city}
              </li>
            ))}
          </ul>
        )}
      </div>

      {value && !open && (
        <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary font-medium">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {value}
          <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Profile ────────────────────────────────────────────────── */

function ProfileStep({ name, onNameChange, avatar, onAvatarChange }) {
  const nameId = useId();

  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={2} subtitle="Let us know your name and pick an avatar for your profile." />

      {/* Name input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium text-foreground">
          Your name <span aria-hidden="true" className="text-muted-foreground">(required)</span>
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="given-name"
          placeholder="e.g. Arjun"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-required="true"
          className={cn(
            "w-full rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors duration-150",
          )}
        />
      </div>

      {/* Avatar picker */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          Avatar <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </p>
        <div
          role="radiogroup"
          aria-label="Avatar selection"
          className="grid grid-cols-6 gap-2"
        >
          {AVATARS.map((av) => {
            const selected = avatar === av.id;
            return (
              <button
                key={av.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={av.label}
                onClick={() => onAvatarChange(selected ? null : av.id)}
                className={cn(
                  "flex items-center justify-center rounded-xl aspect-square text-2xl",
                  "border transition-all duration-150 select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  selected
                    ? "border-primary bg-primary/10 scale-110 shadow-sm"
                    : "border-border bg-card hover:bg-accent hover:border-transparent",
                )}
              >
                <span role="img" aria-hidden="true">{av.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Radio card ─────────────────────────────────────────────────────── */

const IMPACT_STYLES = {
  lowest: "bg-primary/8  text-primary    border-primary/20",
  low:    "bg-accent     text-accent-foreground border-accent/30",
  medium: "bg-amber-50  text-amber-700  border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40",
  high:   "bg-destructive/8 text-destructive border-destructive/20",
};

const IMPACT_LABELS = {
  lowest: "Low impact",
  low:    "Some impact",
  medium: "Moderate",
  high:   "High impact",
};

function RadioCard({ option, selected, onSelect }) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(option.id)}
      className={cn(
        "flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left",
        "transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        selected
          ? "border-primary bg-primary/8 shadow-sm"
          : "border-border bg-card hover:bg-secondary hover:border-transparent",
      )}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
          selected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-4.5" />
      </span>

      {/* Label */}
      <span className="flex-1 text-sm font-medium text-foreground leading-snug">
        {option.label}
      </span>

      {/* Impact badge */}
      <span
        className={cn(
          "shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold",
          IMPACT_STYLES[option.impact],
        )}
      >
        {IMPACT_LABELS[option.impact]}
      </span>

      {/* Checkmark */}
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 flex size-5 items-center justify-center rounded-full border-2 transition-all duration-150",
          selected
            ? "border-primary bg-primary text-primary-foreground scale-110"
            : "border-border",
        )}
      >
        {selected && <Check className="size-3 stroke-[3]" />}
      </span>
    </button>
  );
}

/* ─── Step 4: Quiz ───────────────────────────────────────────────────── */

function QuizStep({ answers, onAnswer }) {
  const [activeQ, setActiveQ] = useState(0);
  const question = QUIZ[activeQ];
  const totalQ   = QUIZ.length;

  function handleSelect(optionId) {
    onAnswer({ ...answers, [question.id]: optionId });
  }

  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={3} subtitle="A quick baseline to personalise your Prithvi experience." />

      {/* Mini progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {activeQ + 1} of {totalQ}</span>
          <span>{Math.round(((activeQ + (answers[question.id] ? 1 : 0)) / totalQ) * 100)}% done</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            role="progressbar"
            aria-valuenow={activeQ + (answers[question.id] ? 1 : 0)}
            aria-valuemin={0}
            aria-valuemax={totalQ}
            aria-label="Quiz progress"
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((activeQ + (answers[question.id] ? 1 : 0)) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <p className="text-sm font-semibold text-foreground leading-snug text-pretty">
        {question.question}
      </p>

      {/* Radio cards */}
      <div
        role="radiogroup"
        aria-label={question.question}
        className="flex flex-col gap-2"
      >
        {question.options.map((opt) => (
          <RadioCard
            key={opt.id}
            option={opt}
            selected={answers[question.id] === opt.id}
            onSelect={(id) => {
              handleSelect(id);
              // Auto-advance after short delay
              if (activeQ < totalQ - 1) {
                setTimeout(() => setActiveQ((q) => q + 1), 320);
              }
            }}
          />
        ))}
      </div>

      {/* Q nav dots */}
      <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
        {QUIZ.map((q, i) => (
          <button
            key={q.id}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setActiveQ(i)}
            className={cn(
              "rounded-full transition-all duration-200",
              i === activeQ
                ? "w-5 h-2 bg-primary"
                : answers[q.id]
                  ? "size-2 bg-primary/50"
                  : "size-2 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Navigation bar ─────────────────────────────────────────────────── */

function NavBar({ step, totalSteps, onBack, onNext, nextDisabled, isLast }) {
  return (
    <footer className="flex items-center justify-between pt-4 border-t border-border">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back to previous step"
          className={cn(
            "flex items-center gap-1 text-sm font-medium text-muted-foreground",
            "hover:text-foreground transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back
        </button>
      ) : (
        <span aria-hidden="true" />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={isLast ? "Complete onboarding" : "Continue to next step"}
        className={cn(
          "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold",
          "bg-primary text-primary-foreground",
          "hover:opacity-90 active:scale-[0.97]",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        )}
      >
        {isLast ? "Complete" : "Next"}
        {!isLast && <ChevronDown className="size-4 -rotate-90" aria-hidden="true" />}
        {isLast && <Check className="size-4" aria-hidden="true" />}
      </button>
    </footer>
  );
}

/* ─── Completion screen ──────────────────────────────────────────────── */

function CompletionScreen({ name, onStart, onRestart }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <span
        aria-hidden="true"
        className="flex size-20 items-center justify-center rounded-3xl bg-primary/15 text-primary shadow-sm"
      >
        <Leaf className="size-10" />
      </span>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground text-balance">
          Welcome to Prithvi{name ? `, ${name}` : ""}!
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs text-pretty">
          Your profile is set up. Start logging your daily actions and watch
          your city's health score improve alongside your own.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          onClick={onStart}
          aria-label="Start using Prithvi"
          className={cn(
            "w-full py-3 rounded-xl text-sm font-semibold",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          Start Tracking
        </button>
        <button
          type="button"
          onClick={onRestart}
          aria-label="Restart onboarding"
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground",
            "hover:text-foreground hover:bg-secondary",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          Restart setup
        </button>
      </div>
    </div>
  );
}

/* ─── OnboardingFlow ─────────────────────────────────────────────────── */

/**
 * OnboardingFlow — a 4-step wizard for Prithvi onboarding.
 *
 * Steps:
 *   0 — Language selection (9 languages)
 *   1 — City search with dropdown
 *   2 — Name + optional avatar picker
 *   3 — Baseline sustainability quiz (5 radio-card questions)
 *
 * @param {{ onComplete?: (data: object) => void }} props
 */
export function OnboardingFlow({ onComplete }) {
  const [step,     setStep]     = useState(0);
  const [done,     setDone]     = useState(false);

  // Step 0
  const [language, setLanguage] = useState("en");
  // Step 1
  const [city,     setCity]     = useState("");
  // Step 2
  const [name,     setName]     = useState("");
  const [avatar,   setAvatar]   = useState(null);
  // Step 3
  const [answers,  setAnswers]  = useState({});

  const TOTAL = 4;

  const canAdvance = [
    !!language,                   // step 0: language must be chosen
    !!city,                       // step 1: city must be chosen
    name.trim().length > 0,       // step 2: name required
    Object.keys(answers).length === QUIZ.length, // step 3: all 5 answered
  ][step];

  const lastDataRef = useRef(null);

  function handleNext() {
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
    } else {
      const data = { language, city, name, avatar, answers };
      lastDataRef.current = data;
      setDone(true);
      onComplete?.(data);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleStart() {
    // If page hasn't navigated yet (e.g. slow async), re-trigger onComplete
    onComplete?.(lastDataRef.current ?? { language, city, name, avatar, answers });
  }

  function handleRestart() {
    setStep(0);
    setDone(false);
    setLanguage("en");
    setCity("");
    setName("");
    setAvatar(null);
    setAnswers({});
  }

  return (
    <div
      role="main"
      aria-label="Prithvi onboarding"
      className={cn(
        "w-full max-w-sm mx-auto",
        "rounded-2xl border border-border bg-card text-card-foreground",
        "shadow-[0_8px_40px_-8px_oklch(0.42_0.13_145_/_18%)]",
        "dark:shadow-[0_8px_40px_-8px_oklch(0_0_0_/_40%)]",
        "p-6 flex flex-col gap-6",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
      )}
    >
      {!done ? (
        <>
          {/* Top: step label + progress dots */}
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Step {step + 1} of {TOTAL}
              </span>
              <span className="text-xs text-muted-foreground">
                {STEP_META[step].label}
              </span>
            </div>
            <ProgressDots total={TOTAL} current={step} />
          </header>

          {/* Step content */}
          <div
            key={step}
            className="flex-1 animate-in fade-in slide-in-from-right-4 duration-250"
          >
            {step === 0 && (
              <LanguageStep
                value={language}
                onChange={(code) => {
                  setLanguage(code);
                  // Immediately switch the app language so subsequent steps reflect it
                  i18n.changeLanguage(code);
                }}
              />
            )}
            {step === 1 && (
              <CityStep value={city} onChange={setCity} />
            )}
            {step === 2 && (
              <ProfileStep
                name={name}
                onNameChange={setName}
                avatar={avatar}
                onAvatarChange={setAvatar}
              />
            )}
            {step === 3 && (
              <QuizStep answers={answers} onAnswer={setAnswers} />
            )}
          </div>

          {/* Navigation */}
          <NavBar
            step={step}
            totalSteps={TOTAL}
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={!canAdvance}
            isLast={step === TOTAL - 1}
          />
        </>
      ) : (
        <CompletionScreen name={name} onStart={handleStart} onRestart={handleRestart} />
      )}
    </div>
  );
}
