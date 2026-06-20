'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, MicOff, Send, Loader2, Leaf, Bike, Utensils, Zap, Recycle,
  ChevronDown, ChevronUp, TrendingDown, CheckCircle2, Sparkles, AlertCircle,
} from 'lucide-react'
import { analyzeDay, getAnalysisSummary } from '@/lib/dayAnalyzer'
import { writeLog, getSetting } from '@/lib/db'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { VOICE_CODES } from '@/lib/i18n'

/** Category → icon mapping */
const CATEGORY_ICONS = {
  commute: Bike,
  food: Utensils,
  energy: Zap,
  waste: Recycle,
  cooking: Leaf,
}

const EXAMPLE_PROMPTS = [
  'I walked to work, had a vegetarian lunch, and recycled my plastic bottles.',
  'Took the metro in the morning, cooked on induction, ordered food delivery at night.',
  'Drove my car to office, had chicken for lunch, ran the AC for 5 hours.',
]

/**
 * DailyAnalyzer — "Tell Me About Your Day" feature.
 *
 * Accepts free-text (or voice) input and uses a deterministic keyword engine
 * to estimate carbon impact. No AI / API key required.
 *
 * Features:
 * - Textarea input with character counter
 * - Web Speech API voice input (mic button), language-aware (uses saved app language)
 * - Example prompt chips
 * - Ctrl+Enter keyboard shortcut
 * - Detected activities list (collapsible)
 * - Per-category CO₂ suggestions
 * - Badge trigger notifications
 * - "Save to My Carbon Log" → writes to Dexie IndexedDB
 */
export default function DailyAnalyzer() {
  const { isOnline } = useOfflineSync()

  const [text, setText]             = useState('')
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [saved, setSaved]           = useState(false)
  const [expanded, setExpanded]     = useState(false)
  const [listening, setListening]   = useState(false)
  const [micError, setMicError]     = useState('')
  const [speechLang, setSpeechLang] = useState('en-IN')

  const recognitionRef = useRef(null)
  const textareaRef    = useRef(null)

  // Detect Speech API support and load saved language for voice input
  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    getSetting('language', 'en')
      .then((lang) => {
        setSpeechLang(VOICE_CODES[lang] ?? 'en-IN')
      })
      .catch(() => {})
  }, [])

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  /** Run keyword analysis on current text */
  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    setLoading(true)
    setResult(null)
    setSaved(false)

    // Minimal delay so users see the loading state
    await new Promise((resolve) => setTimeout(resolve, 350))

    const analysis = analyzeDay(trimmed)
    setResult(analysis)
    setExpanded(true)
    setLoading(false)
  }, [text])

  /** Persist detected activities to Dexie */
  const handleSaveToLog = useCallback(async () => {
    if (!result?.logEntries?.length) return
    try {
      await Promise.all(result.logEntries.map((entry) => writeLog(entry, isOnline)))
      setSaved(true)
    } catch {
      // Non-critical — user can retry
    }
  }, [result, isOnline])

  /** Toggle voice input using Web Speech API */
  const handleVoice = useCallback(() => {
    if (!speechSupported) return
    setMicError('')

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = speechLang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }

    recognition.onend = () => setListening(false)

    recognition.onerror = (event) => {
      setListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('Microphone access was denied. Please allow microphone permission in your browser.')
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Please try again.')
      } else {
        setMicError('Voice input failed. Try typing instead.')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [speechSupported, listening, speechLang])

  // ── Derived colours ──────────────────────────────────────────────────────────

  const scoreColor = result
    ? result.score >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : result.score >= 40
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'
    : ''

  const scoreBg = result
    ? result.score >= 70
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : result.score >= 40
      ? 'bg-amber-500/10 border-amber-500/20'
      : 'bg-red-500/10 border-red-500/20'
    : ''

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <section
      aria-labelledby="analyzer-heading"
      className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-0">
        <h2
          id="analyzer-heading"
          className="text-base font-semibold font-heading text-foreground flex items-center gap-2"
        >
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          Tell Me About Your Day
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Describe your day in plain language — we'll estimate your carbon impact instantly. No AI required.
        </p>
      </div>

      <div className="px-5 pt-4 pb-5 space-y-4">

        {/* ── Text + Voice Input ── */}
        <div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="day-description-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setMicError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleAnalyze()
              }}
              placeholder="e.g. I walked to work, had a vegetarian lunch, ran the AC for 3 hours in the evening…"
              rows={3}
              maxLength={500}
              aria-label="Describe your day in plain language"
              aria-describedby="analyzer-hint analyzer-char-count"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring placeholder:text-muted-foreground/60 transition-colors pr-14"
            />

            {/* Mic button — inside textarea bottom-right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              {speechSupported ? (
                <button
                  type="button"
                  onClick={handleVoice}
                  aria-label={listening ? 'Stop voice recording' : 'Start voice input'}
                  aria-pressed={listening}
                  title={listening ? 'Click to stop recording' : 'Click to speak your day'}
                  className={`flex items-center justify-center size-8 rounded-lg border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ring ${
                    listening
                      ? 'bg-red-500 border-red-500 text-white shadow-md animate-pulse'
                      : 'border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {listening ? (
                    <MicOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Mic className="size-4" aria-hidden="true" />
                  )}
                </button>
              ) : null}
            </div>
          </div>

          {/* Hints row */}
          <div className="flex items-center justify-between mt-1.5">
            <p id="analyzer-hint" className="text-xs text-muted-foreground">
              {speechSupported
                ? 'Type or click the mic to speak. Press Ctrl+Enter to analyse.'
                : 'Press Ctrl+Enter to analyse.'}
            </p>
            <span
              id="analyzer-char-count"
              aria-live="polite"
              className="text-[10px] text-muted-foreground/60 tabular-nums"
            >
              {text.length}/500
            </span>
          </div>

          {/* Voice active indicator */}
          {listening && (
            <div
              role="status"
              aria-live="polite"
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400"
            >
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
              </span>
              Listening… Speak now. Click the mic again to stop.
            </div>
          )}

          {/* Mic error */}
          {micError && (
            <div
              role="alert"
              className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-destructive/8 border border-destructive/20 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              {micError}
            </div>
          )}
        </div>

        {/* ── Example prompt chips ── */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Example day descriptions"
        >
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(prompt)}
              className="px-3 py-1.5 text-xs rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              Try: &quot;{prompt.slice(0, 38)}…&quot;
            </button>
          ))}
        </div>

        {/* ── Analyse button ── */}
        <button
          type="button"
          id="btn-analyze-day"
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          aria-label="Analyse my day"
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Analysing…</>
          ) : (
            <><Send className="size-4" aria-hidden="true" /> Analyse My Day</>
          )}
        </button>

        {/* ── Results ── */}
        {result && (
          <div
            role="region"
            aria-label="Analysis results"
            className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            {/* Score card */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${scoreBg}`}
              aria-label={`Day score: ${result.score} out of 100. CO2: ${result.totalCO2.toFixed(2)} kilograms`}
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Score</p>
                <p className={`text-2xl font-bold font-heading ${scoreColor}`}>
                  {result.score}<span className="text-base font-normal">/100</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ~{result.totalCO2.toFixed(2)} kg CO₂ detected
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-right max-w-[9rem]">
                {getAnalysisSummary(result).split('.')[0]}
              </p>
            </div>

            {/* Detected activities */}
            {result.detectedActivities.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  aria-expanded={expanded}
                  aria-controls="detected-activities"
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  {result.detectedActivities.length} activit{result.detectedActivities.length === 1 ? 'y' : 'ies'} detected
                </button>
                {expanded && (
                  <ul
                    id="detected-activities"
                    className="space-y-1.5"
                    role="list"
                    aria-label="Detected activities and their CO2 impact"
                  >
                    {result.detectedActivities.map((activity, i) => {
                      const Icon = CATEGORY_ICONS[activity.category] ?? Leaf
                      return (
                        <li
                          key={i}
                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="size-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                            <span className="text-sm text-foreground">{activity.label}</span>
                            {activity.positive && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                eco
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-mono font-semibold ${
                              activity.positive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-foreground'
                            }`}
                            aria-label={`${activity.co2 > 0 ? '+' : ''}${activity.co2.toFixed(2)} kilograms CO2`}
                          >
                            {activity.co2 > 0 ? `+${activity.co2.toFixed(2)}` : activity.co2.toFixed(2)} kg
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Suggestions
                </p>
                {result.suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10"
                  >
                    <TrendingDown className="size-3.5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-xs text-foreground leading-relaxed">{suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Badge triggers */}
            {result.badgeTriggers.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Badge progress notifications">
                {result.badgeTriggers.map((badge, i) => (
                  <div
                    key={i}
                    role="status"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium"
                  >
                    <Sparkles className="size-3" aria-hidden="true" />
                    {badge.message}
                  </div>
                ))}
              </div>
            )}

            {/* Save to log */}
            {result.logEntries.length > 0 && (
              <button
                type="button"
                id="btn-save-to-log"
                onClick={handleSaveToLog}
                disabled={saved}
                aria-label="Save detected activities to my carbon log"
                className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed ${
                  saved
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                    : 'bg-secondary hover:bg-accent border border-border text-foreground'
                }`}
              >
                {saved ? (
                  <><CheckCircle2 className="size-3.5" aria-hidden="true" /> Saved to your carbon log</>
                ) : (
                  'Save to My Carbon Log'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
