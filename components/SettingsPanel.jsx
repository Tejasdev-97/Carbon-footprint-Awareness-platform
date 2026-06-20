"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import {
  Settings,
  X,
  ChevronDown,
  Search,
  Eye,
  EyeOff,
  Bell,
  Brain,
  RefreshCw,
  Database,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Trash2,
  AlertTriangle,
  CloudOff,
  Cloud,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Data ─────────────────────────────────────────────────────────── */

const LANGUAGES = [
  { code: "en",    label: "English"    },
  { code: "hi",    label: "हिन्दी"      },
  { code: "ta",    label: "தமிழ்"       },
  { code: "te",    label: "తెలుగు"      },
  { code: "bn",    label: "বাংলা"       },
  { code: "mr",    label: "मराठी"       },
  { code: "kn",    label: "ಕನ್ನಡ"       },
  { code: "gu",    label: "ગુજરાતી"    },
  { code: "ml",    label: "മലയാളം"     },
];

const CITIES = [
  "Agra", "Ahmedabad", "Bengaluru", "Bhopal", "Chennai",
  "Delhi", "Hyderabad", "Jaipur", "Kochi", "Kolkata",
  "Lucknow", "Mumbai", "Nagpur", "Patna", "Pune",
  "Surat", "Vadodara", "Varanasi", "Visakhapatnam",
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

/* ─── Shared sub-components ─────────────────────────────────────────── */

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
      >
        <Icon className="size-4" />
      </span>
      <h3 className="text-base font-bold text-foreground">{children}</h3>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border my-6" aria-hidden="true" />;
}

function Toggle({ id, checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4">
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
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
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

/* ─── 1 · Language ──────────────────────────────────────────────────── */

function LanguageSection({ value, onChange }) {
  return (
    <section aria-labelledby="lang-heading">
      <SectionTitle icon={Globe}>
        <span id="lang-heading">Language</span>
      </SectionTitle>
      <div
        role="radiogroup"
        aria-labelledby="lang-heading"
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
                "flex items-center justify-center px-3 py-2 rounded-xl border text-sm font-medium",
                "transition-all duration-150 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-transparent",
              )}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── 2 · City ──────────────────────────────────────────────────────── */

function CitySection({ value, onChange }) {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const inputId               = useId();
  const listId                = useId();
  const containerRef          = useRef(null);

  const filtered = CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  );

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
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
    <section aria-labelledby="city-heading">
      <SectionTitle icon={MapPin}>
        <span id="city-heading">City</span>
      </SectionTitle>

      <div ref={containerRef} className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search your city
        </label>
        <div className="relative flex items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
          />
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            placeholder="Search your city…"
            value={query === "" && value ? value : query}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-autocomplete="list"
            onFocus={() => { setQuery(""); setOpen(true); }}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            className={cn(
              "w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-foreground",
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
            aria-label="Cities"
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
                  "flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer",
                  "transition-colors duration-100",
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

        {value && (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{value}</span>
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── 3 · Notifications ─────────────────────────────────────────────── */

function NotificationsSection({ enabled, onToggle, time, onTimeChange }) {
  const selectId = useId();

  return (
    <section aria-labelledby="notif-heading">
      <SectionTitle icon={Bell}>
        <span id="notif-heading">Notifications</span>
      </SectionTitle>

      <div className="flex flex-col gap-4">
        <Toggle
          id="notif-toggle"
          checked={enabled}
          onChange={onToggle}
          label="Enable Notifications"
          description="Receive daily reminders to log your eco actions."
        />

        <div
          className={cn(
            "flex flex-col gap-1.5 transition-opacity duration-200",
            !enabled && "opacity-40 pointer-events-none",
          )}
        >
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            Reminder time
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={time}
              disabled={!enabled}
              onChange={(e) => onTimeChange(Number(e.target.value))}
              aria-label="Notification reminder time"
              className={cn(
                "w-full appearance-none rounded-xl border border-border bg-card",
                "px-3 py-2.5 pr-8 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "transition-colors duration-150 cursor-pointer",
              )}
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 4 · AI Configuration ──────────────────────────────────────────── */

const CONNECTION_STATUS = {
  idle:        { icon: null,         label: "",              className: "" },
  testing:     { icon: Loader2,      label: "Testing…",      className: "text-muted-foreground" },
  connected:   { icon: CheckCircle2, label: "Connected",     className: "text-primary" },
  disconnected:{ icon: XCircle,      label: "Disconnected",  className: "text-destructive" },
};

function AIConfigSection({ apiKey, onApiKeyChange }) {
  const [showKey,  setShowKey]  = useState(false);
  const [status,   setStatus]   = useState("idle"); // idle | testing | connected | disconnected
  const inputId = useId();

  const handleTest = useCallback(() => {
    if (!apiKey.trim()) { setStatus("disconnected"); return; }
    setStatus("testing");
    setTimeout(() => {
      // Simulate: key starting with "prithvi-" is "valid"
      setStatus(apiKey.trim().startsWith("prithvi-") ? "connected" : "disconnected");
    }, 1400);
  }, [apiKey]);

  const { icon: StatusIcon, label: statusLabel, className: statusClass } = CONNECTION_STATUS[status];

  return (
    <section aria-labelledby="ai-heading">
      <SectionTitle icon={Brain}>
        <span id="ai-heading">AI Configuration</span>
      </SectionTitle>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            API Key
          </label>
          <div className="relative flex items-center">
            <input
              id={inputId}
              type={showKey ? "text" : "password"}
              autoComplete="off"
              placeholder="prithvi-••••••••••••••••"
              value={apiKey}
              onChange={(e) => { onApiKeyChange(e.target.value); setStatus("idle"); }}
              aria-label="AI API key"
              className={cn(
                "w-full rounded-xl border border-border bg-card px-3 py-2.5 pr-10 text-sm text-foreground",
                "placeholder:text-muted-foreground font-mono",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "transition-colors duration-150",
              )}
            />
            <button
              type="button"
              aria-label={showKey ? "Hide API key" : "Show API key"}
              onClick={() => setShowKey((v) => !v)}
              className={cn(
                "absolute right-3 text-muted-foreground hover:text-foreground",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
              )}
            >
              {showKey
                ? <EyeOff className="size-4" aria-hidden="true" />
                : <Eye    className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={status === "testing"}
            aria-label="Test API connection"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border border-border",
              "bg-secondary text-foreground text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {status === "testing"
              ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : <Brain   className="size-4" aria-hidden="true" />}
            Test Connection
          </button>

          {status !== "idle" && (
            <span
              aria-live="polite"
              aria-atomic="true"
              className={cn("flex items-center gap-1.5 text-sm font-medium", statusClass)}
            >
              {StatusIcon && (
                <StatusIcon
                  className={cn("size-4", status === "testing" && "animate-spin")}
                  aria-hidden="true"
                />
              )}
              {statusLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── 5 · Sync ──────────────────────────────────────────────────────── */

function SyncSection() {
  const [syncing,    setSyncing]    = useState(false);
  const [lastSynced, setLastSynced] = useState("Today, 9:41 AM");
  const [online,     setOnline]     = useState(true);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSynced("Just now");
    }, 1800);
  }

  return (
    <section aria-labelledby="sync-heading">
      <SectionTitle icon={RefreshCw}>
        <span id="sync-heading">Sync</span>
      </SectionTitle>

      <div className="flex flex-col gap-4">
        {/* Status indicator */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            {online
              ? <Cloud    className="size-4 text-primary"  aria-hidden="true" />
              : <CloudOff className="size-4 text-destructive" aria-hidden="true" />}
            <span className={online ? "text-primary font-medium" : "text-destructive font-medium"}>
              {online ? "Synced" : "Offline"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Last: {lastSynced}</span>
        </div>

        {/* Dev toggle: online / offline */}
        <Toggle
          id="sync-online-toggle"
          checked={online}
          onChange={setOnline}
          label="Online Mode"
          description="Toggle to simulate offline / online state."
        />

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || !online}
          aria-label="Manually sync data"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border border-border",
            "bg-secondary text-foreground text-sm font-medium py-2.5",
            "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <RefreshCw
            className={cn("size-4", syncing && "animate-spin")}
            aria-hidden="true"
          />
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>
    </section>
  );
}

/* ─── 6 · Data ──────────────────────────────────────────────────────── */

function DataSection() {
  const [confirming, setConfirming] = useState(false);
  const [cleared,    setCleared]    = useState(false);

  function handleClearConfirm() {
    setCleared(true);
    setConfirming(false);
    setTimeout(() => setCleared(false), 3000);
  }

  return (
    <section aria-labelledby="data-heading">
      <SectionTitle icon={Database}>
        <span id="data-heading">Data</span>
      </SectionTitle>

      <div className="flex flex-col gap-3">
        {/* Export */}
        <button
          type="button"
          aria-label="Export your data as JSON"
          onClick={() => {
            const blob = new Blob(
              [JSON.stringify({ exported: true, timestamp: new Date().toISOString() }, null, 2)],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a   = document.createElement("a");
            a.href     = url;
            a.download = "prithvi-data.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border border-border",
            "bg-secondary text-foreground text-sm font-medium py-2.5",
            "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Download className="size-4" aria-hidden="true" />
          Export as JSON
        </button>

        {/* Clear data */}
        {!confirming && !cleared && (
          <button
            type="button"
            aria-label="Clear all data"
            onClick={() => setConfirming(true)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border border-destructive/40",
              "bg-destructive/8 text-destructive text-sm font-medium py-2.5",
              "hover:bg-destructive hover:text-white hover:border-destructive",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear All Data
          </button>
        )}

        {/* Confirmation dialog */}
        {confirming && (
          <div
            role="alertdialog"
            aria-labelledby="clear-dialog-title"
            aria-describedby="clear-dialog-desc"
            className={cn(
              "rounded-2xl border border-destructive/30 bg-destructive/8 p-4",
              "animate-in fade-in slide-in-from-top-2 duration-200",
            )}
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle
                className="size-5 shrink-0 text-destructive mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p id="clear-dialog-title" className="text-sm font-bold text-foreground">
                  Clear all data?
                </p>
                <p id="clear-dialog-desc" className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  This will permanently delete all your tracking history, badges, and coins. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                autoFocus
                onClick={handleClearConfirm}
                aria-label="Confirm clear all data"
                className={cn(
                  "flex-1 rounded-xl bg-destructive text-white text-sm font-semibold py-2",
                  "hover:opacity-90 active:scale-95 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                Yes, clear
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                aria-label="Cancel clearing data"
                className={cn(
                  "flex-1 rounded-xl border border-border bg-card text-foreground text-sm font-medium py-2",
                  "hover:bg-secondary transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Post-clear confirmation */}
        {cleared && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/8 px-4 py-2.5",
              "text-sm font-medium text-primary",
              "animate-in fade-in duration-300",
            )}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            All data cleared successfully.
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── SettingsPanel ─────────────────────────────────────────────────── */

/**
 * Full-page settings panel for Prithvi.
 *
 * All state is local. Pass an `onChange` prop to receive the full settings
 * object whenever any field changes:
 *   onChange({ language, city, notifications: { enabled, time }, apiKey })
 */
export function SettingsPanel({ onChange }) {
  const [language,      setLanguage]      = useState("en");
  const [city,          setCity]          = useState("Bengaluru");
  const [notifEnabled,  setNotifEnabled]  = useState(true);
  const [notifTime,     setNotifTime]     = useState(8);
  const [apiKey,        setApiKey]        = useState("");

  // Notify parent
  useEffect(() => {
    onChange?.({
      language,
      city,
      notifications: { enabled: notifEnabled, time: notifTime },
      apiKey,
    });
  }, [language, city, notifEnabled, notifTime, apiKey, onChange]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-0 font-sans">
      <div className="mx-auto w-full max-w-lg">

        {/* Page header */}
        <header className="flex items-center gap-3 mb-8">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <Settings className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your Prithvi preferences</p>
          </div>
        </header>

        {/* Cards */}
        <div className="flex flex-col gap-4">

          {/* Language */}
          <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-5">
            <LanguageSection value={language} onChange={setLanguage} />
          </div>

          {/* City */}
          <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-5">
            <CitySection value={city} onChange={setCity} />
          </div>

          {/* Notifications */}
          <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-5">
            <NotificationsSection
              enabled={notifEnabled}
              onToggle={setNotifEnabled}
              time={notifTime}
              onTimeChange={setNotifTime}
            />
          </div>

          {/* AI Configuration */}
          <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-5">
            <AIConfigSection apiKey={apiKey} onApiKeyChange={setApiKey} />
          </div>

          {/* Sync */}
          <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-5">
            <SyncSection />
          </div>

          {/* Data */}
          <div className="rounded-2xl bg-card border border-border shadow-sm px-5 py-5 mb-8">
            <DataSection />
          </div>

        </div>
      </div>
    </div>
  );
}
