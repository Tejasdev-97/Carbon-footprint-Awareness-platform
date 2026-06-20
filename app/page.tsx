'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import LandingNav from '@/components/LandingNav'
import { getSetting } from '@/lib/db'
import {
  BarChart3, Leaf, ArrowRight, Activity, Award, Users,
  MessageCircle, Globe, Languages, MapPin, CheckCircle2,
  Zap, ShieldCheck, ExternalLink, ChevronRight, TreePine,
  Wind, Recycle, TrendingDown, Sprout,
} from 'lucide-react'
import Link from 'next/link'

// Dynamic import for 3D globe
const HeroGlobe = dynamic(() => import('@/components/HeroGlobe'), {
  ssr: false,
  loading: () => (
    <div className="size-[320px] sm:size-[380px] md:size-[420px] rounded-full bg-primary/8 flex items-center justify-center mx-auto animate-pulse">
      <div className="size-20 rounded-full border border-primary/20 flex items-center justify-center">
        <Globe className="size-8 text-primary/40" />
      </div>
    </div>
  ),
})

// ── Feature Cards ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Activity,
    title: 'Carbon Tracking',
    desc: 'Log your commute, meals, energy use, and waste in under 60 seconds. See real-time impact in kg CO₂.',
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  {
    icon: MapPin,
    title: 'City Health Score',
    desc: 'Watch your 3D city transform — from smog-orange to clear blue — as your daily score improves.',
    accent: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
  },
  {
    icon: MessageCircle,
    title: 'AI Eco Insights',
    desc: 'Gemini-powered assistant gives personalised suggestions based on your actual habits — with offline fallback.',
    accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    icon: Users,
    title: 'Community Challenges',
    desc: 'Join pledge walls, view city leaderboards, and see what other users in your city are committing to.',
    accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  {
    icon: TrendingDown,
    title: 'Daily Activity Analysis',
    desc: 'Describe your day in plain language. Our keyword engine maps it to accurate CO₂ estimates instantly.',
    accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
  },
  {
    icon: Award,
    title: 'Sustainability Badges',
    desc: 'Earn badges like "Metro Warrior", "Veggie Week", and "Zero Waste" as you build green habits over time.',
    accent: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
  },
  {
    icon: BarChart3,
    title: 'Carbon Dashboard',
    desc: 'Monthly trend charts, best/worst day breakdowns, and PDF/PNG exports to track your progress.',
    accent: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
  },
  {
    icon: Languages,
    title: 'Multi-language Support',
    desc: 'Available in 9 Indian languages: Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam, English.',
    accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
  },
]

// ── Gemini Setup Steps ────────────────────────────────────────────────────

const GEMINI_STEPS = [
  { step: '1', text: 'Visit aistudio.google.com and sign in with your Google account.' },
  { step: '2', text: 'Click "Get API key" → "Create API key in new project".' },
  { step: '3', text: 'Copy the API key (starts with "AIza…").' },
  { step: '4', text: 'Open Prithvi Settings → AI Configuration → paste the key.' },
  { step: '5', text: 'Your key is stored only on this device. Prithvi never transmits it to any server.' },
]

// ── Main Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    getSetting('onboardingComplete', false)
      .then((val) => setOnboarded(!!val))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <LandingNav />

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <main id="main-content">
        <section
          id="home"
          aria-labelledby="hero-heading"
          className="max-w-6xl mx-auto px-6 pt-28 md:pt-36 pb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center min-h-[70vh]">
            {/* Left: text */}
            <div className="md:col-span-7 flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20">
                <Sprout className="size-3.5" aria-hidden="true" />
                Carbon Footprint Awareness for India
              </span>

              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-[1.12] text-foreground text-balance"
              >
                Know Your Impact.{' '}
                <span className="text-primary">Heal the Earth.</span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                Prithvi helps you track, understand, and reduce your daily carbon footprint — 
                designed for real Indian habits, cities, and languages. Fully offline-capable.
              </p>

              {/* CTAs — logic-aware */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {onboarded ? (
                  <>
                    <Link
                      href="/dashboard"
                      id="cta-view-dashboard"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97] transition-all focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Go to Dashboard
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/onboarding"
                      id="cta-redo-setup"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Configure Onboarding
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/onboarding"
                      id="cta-start-tracking"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97] transition-all focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Leaf className="size-4" aria-hidden="true" />
                      Start Tracking
                    </Link>
                    <button
                      type="button"
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                      id="cta-explore-features"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Explore Features
                    </button>
                  </>
                )}
              </div>

              {/* Real, modest stats */}
              <div className="flex flex-wrap gap-8 mt-2" role="list" aria-label="Platform highlights">
                {[
                  { value: '9', label: 'Indian languages' },
                  { value: '100%', label: 'Offline capable' },
                  { value: 'Free', label: 'No account needed' },
                  { value: 'Open', label: 'Source available' },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-0.5" role="listitem">
                    <span className="text-xl font-bold text-foreground">{value}</span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Globe */}
            <div className="md:col-span-5 flex items-center justify-center">
              <HeroGlobe size={420} />
            </div>
          </div>
        </section>

        {/* ── FEATURES SECTION ─────────────────────────────────────────────── */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="px-6 py-20 bg-secondary/30 border-y border-border"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <h2
                id="features-heading"
                className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4"
              >
                Everything you need to go green
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Built for Indian lifestyles — auto-rickshaws, LPG cylinders, festival seasons, 
                joint families, and everything in between.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <article
                    key={f.title}
                    className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div
                      className={`inline-flex items-center justify-center size-10 rounded-xl mb-4 ${f.accent}`}
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2 font-heading">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS (brief) ──────────────────────────────────────────── */}
        <section
          aria-labelledby="how-heading"
          className="px-6 py-20"
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 id="how-heading" className="text-3xl font-bold font-heading text-foreground mb-3">
                Start in 3 steps
              </h2>
              <p className="text-muted-foreground">No account required. Works offline from day one.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sprout,
                  num: '01',
                  title: 'Set up your profile',
                  desc: 'Choose your city, language, and answer 5 quick questions about your lifestyle.',
                },
                {
                  icon: Activity,
                  num: '02',
                  title: 'Log daily activities',
                  desc: 'Track commute, meals, energy use, and waste. Takes under 60 seconds.',
                },
                {
                  icon: TreePine,
                  num: '03',
                  title: 'See your city heal',
                  desc: 'Watch your 3D city improve as your score goes up. Earn badges, make pledges.',
                },
              ].map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.num}
                    className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary/50 font-mono">{step.num}</span>
                      <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10">
                        <Icon className="size-5 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-heading text-foreground mb-1.5">{step.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── GET STARTED SECTION ───────────────────────────────────────────── */}
        <section
          id="get-started"
          aria-labelledby="cta-heading"
          className="px-6 py-20 bg-primary/5 border-y border-primary/10"
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/15 mb-6">
              <Leaf className="size-8 text-primary" aria-hidden="true" />
            </div>
            <h2
              id="cta-heading"
              className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4"
            >
              Start Your Sustainability Journey
            </h2>
            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
              No sign-up. No credit card. No subscriptions. 
              Just a commitment to understanding your environmental impact.
            </p>
            <Link
              href={onboarded ? '/dashboard' : '/onboarding'}
              id="cta-get-started-primary"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-2xl bg-primary text-primary-foreground shadow-md hover:opacity-90 active:scale-[0.97] transition-all focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Sprout className="size-5" aria-hidden="true" />
              {onboarded ? 'Continue to Dashboard' : 'Begin Tracking Now'}
            </Link>
          </div>
        </section>

        {/* ── GEMINI API EDUCATION ──────────────────────────────────────────── */}
        <section
          id="gemini-guide"
          aria-labelledby="gemini-heading"
          className="px-6 py-20"
        >
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              {/* Left: Explanation */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-5 border border-purple-500/20">
                  <Zap className="size-3" />
                  AI-Powered (Optional)
                </div>
                <h2
                  id="gemini-heading"
                  className="text-2xl sm:text-3xl font-bold font-heading text-foreground mb-4"
                >
                  Why does Prithvi ask for a Gemini API key?
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Prithvi is a <strong className="text-foreground">100% frontend application</strong>. 
                    It runs entirely in your browser with no backend server. To offer AI-powered eco-suggestions, 
                    it needs to connect directly to Google&apos;s Gemini API.
                  </p>
                  <p>
                    Rather than managing API keys on a server (which would cost money and compromise your privacy), 
                    Prithvi lets <strong className="text-foreground">you provide your own key</strong>. 
                    Google offers a free tier that is more than sufficient for daily use.
                  </p>
                  <div className="space-y-2 mt-4">
                    {[
                      { icon: ShieldCheck, text: 'Your key is stored only in your device\'s browser storage (IndexedDB)' },
                      { icon: ShieldCheck, text: 'It is never sent to any Prithvi server — only directly to Google' },
                      { icon: ShieldCheck, text: 'You can delete it anytime from Settings' },
                      { icon: CheckCircle2, text: 'Prithvi works fully without a key — AI features use offline fallbacks' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-2.5">
                        <Icon className="size-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-xs">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Steps */}
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground mb-5 uppercase tracking-wide">
                  How to get your free API key
                </h3>
                <ol className="space-y-4" aria-label="Steps to get Gemini API key">
                  {GEMINI_STEPS.map(({ step, text }) => (
                    <li key={step} className="flex gap-4">
                      <span className="flex-shrink-0 flex items-center justify-center size-7 rounded-xl bg-primary/10 text-primary text-xs font-bold">
                        {step}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{text}</p>
                    </li>
                  ))}
                </ol>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="link-get-gemini-key"
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Get Gemini API Key (Free)
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  Opens Google AI Studio in a new tab. Google account required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <footer className="border-t border-border px-6 py-10 bg-secondary/20" role="contentinfo">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-8 rounded-xl bg-primary" aria-hidden="true">
                <Sprout className="size-4 text-primary-foreground" />
              </span>
              <span className="font-heading font-bold text-foreground">Prithvi</span>
              <span className="text-xs text-muted-foreground ml-2">Carbon Footprint Awareness</span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              Built for the Google PromptWars Challenge. Data stored locally. No tracking.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
