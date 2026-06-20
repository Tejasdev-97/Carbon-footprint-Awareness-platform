'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccessibility } from '@/components/AccessibilityContext'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useTranslation } from 'react-i18next'
import { getSetting, putSetting, clearAllData } from '@/lib/db'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import i18n from '@/lib/i18n'
import { getAIInsight } from '@/lib/gemini'
import {
  Globe, Bell, Brain, RefreshCw, Trash2, Download, Settings2, Loader2, CheckCircle2,
} from 'lucide-react'

const INDIAN_CITIES = [
  'Agra', 'Ahmedabad', 'Bengaluru', 'Bhopal', 'Chennai',
  'Delhi', 'Hyderabad', 'Jaipur', 'Kochi', 'Kolkata',
  'Lucknow', 'Mumbai', 'Nagpur', 'Patna', 'Pune',
  'Surat', 'Vadodara', 'Varanasi', 'Visakhapatnam',
]

const AVATARS = [
  { id: 'leaf',     emoji: '🌿', label: 'Leaf'     },
  { id: 'sun',      emoji: '☀️', label: 'Sun'      },
  { id: 'drop',     emoji: '💧', label: 'Drop'     },
  { id: 'seedling', emoji: '🌱', label: 'Seedling' },
  { id: 'earth',    emoji: '🌍', label: 'Earth'    },
  { id: 'cloud',    emoji: '☁️', label: 'Cloud'    },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const { isOnline, syncStatus, manualSync, pendingCount } = useOfflineSync()
  const {
    fontSize, highContrast, reduceMotion, readAloud, colorBlindMode,
    setFontSize, setHighContrast, setReduceMotion, setReadAloud, setColorBlindMode,
  } = useAccessibility()

  const [city, setCity] = useState('')
  const [language, setLanguage] = useState('en')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationHour, setNotificationHour] = useState(20)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load persisted settings
  useEffect(() => {
    Promise.all([
      getSetting('city', ''),
      getSetting('language', 'en'),
      getSetting('geminiApiKey', ''),
      getSetting('notificationsEnabled', false),
      getSetting('notificationHour', 20),
      getSetting('name', ''),
      getSetting('avatar', null),
    ]).then(([c, l, k, n, nh, nm, av]) => {
      setCity(c ?? ''); setLanguage(l ?? 'en'); setApiKey(k || '');
      setNotificationsEnabled(n ?? false); setNotificationHour(nh ?? 20);
      setName(nm ?? ''); setAvatar(av ?? null)
    }).catch(() => {})
  }, [])

  const handleSave = useCallback(async () => {
    await Promise.all([
      putSetting('city', city),
      putSetting('language', language),
      putSetting('geminiApiKey', apiKey),
      putSetting('notificationsEnabled', notificationsEnabled),
      putSetting('notificationHour', notificationHour),
      putSetting('name', name.trim()),
      putSetting('avatar', avatar),
    ])
    i18n.changeLanguage(language)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [city, language, apiKey, notificationsEnabled, notificationHour, name, avatar])

  const handleTestGemini = useCallback(async () => {
    setTesting(true); setTestResult(null)
    await putSetting('geminiApiKey', apiKey)
    const result = await getAIInsight('What is one green action I can take today in India?', `${language}-IN`)
    setTestResult({ source: result.source, text: result.text.slice(0, 120) })
    setTesting(false)
  }, [apiKey, language])

  const handleExportJSON = useCallback(async () => {
    const { readLogsForMonth } = await import('@/lib/db')
    const now = new Date()
    const logs = await readLogsForMonth(now.getFullYear(), now.getMonth() + 1)
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), logs }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `prithvi-export.json`; a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleClearData = useCallback(async () => {
    if (!confirmClear) { setConfirmClear(true); return }
    setClearing(true)
    await clearAllData()
    setClearing(false); setConfirmClear(false)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [confirmClear])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your Prithvi preferences</p>
      </div>

      {/* Language */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4" aria-labelledby="settings-language">
        <h2 id="settings-language" className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <Globe className="size-4 text-primary" aria-hidden="true" /> Profile &amp; Language
        </h2>
        <div>
          <label htmlFor="settings-name" className="text-xs text-muted-foreground block mb-1.5">Your name</label>
          <input
            id="settings-name"
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Your display name"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Avatar</p>
          <div role="radiogroup" aria-label="Avatar selection" className="flex gap-2 flex-wrap">
            {AVATARS.map((av) => {
              const selected = avatar === av.id
              return (
                <button
                  key={av.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={av.label}
                  id={`avatar-${av.id}`}
                  onClick={() => setAvatar(selected ? null : av.id)}
                  className={`flex items-center justify-center size-11 rounded-xl border text-2xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-ring ${selected ? 'border-primary bg-primary/10 scale-110 shadow-sm' : 'border-input bg-background hover:border-primary/40'}`}
                >
                  <span role="img" aria-hidden="true">{av.emoji}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label htmlFor="lang-select" className="text-xs text-muted-foreground block mb-1.5">Select language</label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => { setLanguage(e.target.value); i18n.changeLanguage(e.target.value) }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.native} — {l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city-select" className="text-xs text-muted-foreground block mb-1.5">Your city</label>
          <select
            id="city-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4" aria-labelledby="settings-notifications">
        <h2 id="settings-notifications" className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <Bell className="size-4 text-primary" aria-hidden="true" /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Daily reminder</p>
            <p className="text-xs text-muted-foreground">Remind me to log at a set time</p>
          </div>
          <button
            id="toggle-notifications"
            role="switch"
            aria-checked={notificationsEnabled}
            aria-label={`Daily notifications ${notificationsEnabled ? 'on' : 'off'}`}
            onClick={() => setNotificationsEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${notificationsEnabled ? 'bg-primary' : 'bg-input'}`}
          >
            <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {notificationsEnabled && (
          <div>
            <label htmlFor="notification-hour" className="text-xs text-muted-foreground block mb-1.5">
              Reminder time: {notificationHour}:00
            </label>
            <input
              id="notification-hour"
              type="range" min={6} max={23} value={notificationHour}
              onChange={(e) => setNotificationHour(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label={`Set reminder time, currently ${notificationHour}:00`}
            />
          </div>
        )}
      </section>

      {/* AI (Gemini) */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4" aria-labelledby="settings-ai">
        <h2 id="settings-ai" className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <Brain className="size-4 text-primary" aria-hidden="true" /> AI Configuration
        </h2>
        <p className="text-xs text-muted-foreground">
          Your API key is stored only in this device&apos;s IndexedDB. It is never sent to any server.
        </p>
        <div>
          <label htmlFor="api-key-input" className="text-xs text-muted-foreground block mb-1.5">Gemini API Key</label>
          <input
            id="api-key-input"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza…"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground font-mono focus-visible:outline-2 focus-visible:outline-ring"
            aria-describedby="api-key-hint"
          />
          <p id="api-key-hint" className="text-xs text-muted-foreground mt-1">
            Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">aistudio.google.com</a>
          </p>
        </div>
        <button
          id="btn-test-connection"
          onClick={handleTestGemini}
          disabled={testing || !apiKey}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-accent transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Test Gemini API connection"
        >
          {testing ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-3.5" aria-hidden="true" />}
          Test Connection
        </button>
        {testResult && (
          <div role="status" aria-live="polite" className="rounded-xl bg-secondary/60 p-3 text-xs text-foreground">
            <span className={`font-semibold ${testResult.source === 'ai' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {testResult.source === 'ai' ? '✓ AI response' : '⚠ Fallback response'}
            </span>
            <p className="mt-1 text-muted-foreground">{testResult.text}…</p>
          </div>
        )}
      </section>

      {/* Accessibility */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4" aria-labelledby="settings-accessibility">
        <h2 id="settings-accessibility" className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <Settings2 className="size-4 text-primary" aria-hidden="true" /> Accessibility
        </h2>
        <div className="space-y-4">
          {/* Font size */}
          <div>
            <label htmlFor="font-size-select" className="text-xs text-muted-foreground block mb-1.5">Font Size</label>
            <select id="font-size-select" value={fontSize} onChange={(e) => setFontSize(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <option value="small">Small (14px)</option>
              <option value="medium">Medium (16px)</option>
              <option value="large">Large (19px)</option>
              <option value="xl">Extra Large (22px)</option>
            </select>
          </div>

          {/* Toggles */}
          {[
            { id: 'toggle-high-contrast', label: 'High Contrast', desc: 'Maximise text/background contrast', value: highContrast, setter: setHighContrast },
            { id: 'toggle-reduce-motion', label: 'Reduce Motion', desc: 'Disable animations and transitions', value: reduceMotion, setter: setReduceMotion },
            { id: 'toggle-read-aloud',    label: 'Read Aloud',    desc: 'Enable voice readout of key content', value: readAloud,   setter: setReadAloud   },
          ].map(({ id, label, desc, value, setter }) => (
            <div key={id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                id={id}
                role="switch"
                aria-checked={value}
                aria-label={`${label} ${value ? 'on' : 'off'}`}
                onClick={() => setter(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${value ? 'bg-primary' : 'bg-input'}`}
              >
                <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}

          {/* Color blind mode */}
          <div>
            <label htmlFor="color-blind-select" className="text-xs text-muted-foreground block mb-1.5">Colour Blind Mode</label>
            <select id="color-blind-select" value={colorBlindMode} onChange={(e) => setColorBlindMode(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <option value="none">None</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="protanopia">Protanopia</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sync + Data */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-3" aria-labelledby="settings-data">
        <h2 id="settings-data" className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" aria-hidden="true" /> Sync & Data
        </h2>
        <div className="flex flex-wrap gap-2">
          <button id="btn-sync-now" onClick={manualSync} disabled={!!((!isOnline) || syncStatus === 'syncing')}
            aria-label="Manually sync data to Firebase"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-accent transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <RefreshCw className={`size-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} aria-hidden="true" />
            {syncStatus === 'syncing' ? 'Syncing…' : `Sync Now${pendingCount ? ` (${pendingCount} pending)` : ''}`}
          </button>
          <button id="btn-export-data" onClick={handleExportJSON}
            aria-label="Export all data as JSON"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-accent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Download className="size-3.5" aria-hidden="true" /> Export JSON
          </button>
          <button
            id="btn-clear-data"
            onClick={handleClearData}
            disabled={clearing}
            aria-label={confirmClear ? 'Click again to confirm deletion of all data' : 'Clear all local data'}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              confirmClear ? 'bg-destructive text-destructive-foreground' : 'bg-secondary hover:bg-red-500/10 hover:text-red-600 text-muted-foreground'
            }`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {clearing ? 'Clearing…' : confirmClear ? 'Confirm? Click to clear' : 'Clear All Data'}
          </button>
        </div>
        {confirmClear && (
          <button onClick={() => setConfirmClear(false)} className="text-xs text-muted-foreground underline">
            Cancel
          </button>
        )}
      </section>

      {/* Save button */}
      <button
        id="btn-save-settings"
        onClick={handleSave}
        aria-label="Save all settings"
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-2xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {saved ? <CheckCircle2 className="size-4" aria-hidden="true" /> : null}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
