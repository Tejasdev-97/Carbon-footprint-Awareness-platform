'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import { Leaf, BarChart3, MapPin, Award, Users, ArrowRight } from 'lucide-react'
import { getSetting } from '@/lib/db'

const HeroGlobe = dynamic(
  () => import('@/components/HeroGlobe'),
  { ssr: false }
)

const STATS = [
  { icon: MapPin, value: '320+', label: 'Cities tracked' },
  { icon: BarChart3, value: '1.2M', label: 'Tonnes offset' },
  { icon: Award, value: '48K', label: 'Badges earned' },
  { icon: Users, value: '92K', label: 'Active members' },
]

const FEATURES = [
  {
    title: 'Track Daily Habits',
    desc: 'Log commute, food, energy, and waste in under 60 seconds. See your CO₂ impact in real time.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'City Health Score',
    desc: 'Watch your 3D city transform — from smog-orange to clear blue — as your score improves.',
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  {
    title: 'Community Pledges',
    desc: 'Join thousands of Indians pledging greener choices. Compare your weekly score on the leaderboard.',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    title: 'AI Eco Insights',
    desc: 'Get personalised suggestions in your language powered by Gemini — or smart local fallbacks.',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
]

export default function LandingPage() {
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    getSetting('onboardingComplete', false)
      .then((val) => setOnboarded(!!val))
      .catch(() => { })
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Navigation />

      {/* Hero Section */}
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center min-h-[75vh]">
          {/* Left: Text & CTAs */}
          <div className="md:col-span-7 flex flex-col items-start text-left gap-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest">
              <Leaf className="size-3.5" aria-hidden="true" />
              Carbon Footprint Awareness
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-[1.15] text-balance text-foreground">
              Know Your Impact. <br />
              <span className="text-primary">Heal the Earth.</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
              Prithvi helps you track, understand, and reduce your carbon footprint
              — one city, one habit, one badge at a time. Designed specifically for Indian daily life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
              {onboarded ? (
                <>
                  <a
                    href="/dashboard"
                    id="cta-view-dashboard"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Go to Dashboard
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href="/onboarding"
                    id="cta-redo-setup"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Configure Onboarding
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/onboarding"
                    id="cta-start-tracking"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <BarChart3 className="size-4" aria-hidden="true" />
                    Get Started Free
                  </a>
                  <a
                    href="#features"
                    id="cta-explore-features"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Explore Features
                  </a>
                </>
              )}
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-8 mt-6" role="list" aria-label="Platform statistics">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex flex-col items-start gap-0.5" role="listitem">
                  <span className="text-xl font-bold text-foreground">{value}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Globe */}
          <div className="md:col-span-5 flex items-center justify-center w-full">
            <HeroGlobe size={520} />
          </div>
        </div>
      </main>

      {/* Features */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="px-6 py-20 bg-secondary/30 border-y border-border"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold font-heading mb-3">
              Everything you need to go green
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Built for Indian lifestyles, cities, and languages.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl bg-card border border-border p-6 shadow-sm">
                <div className={`inline-flex items-center justify-center size-10 rounded-xl mb-4 ${f.color.split(' ')[0]}`} aria-hidden="true">
                  <Leaf className={`size-5 ${f.color.split(' ').slice(1).join(' ')}`} />
                </div>
                <h3 className="text-base font-bold mb-2 font-heading">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        id="cta"
        aria-labelledby="cta-heading"
        className="px-6 py-20 text-center"
      >
        <div className="mx-auto max-w-2xl">
          <h2 id="cta-heading" className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            Start your green journey today
          </h2>
          <p className="text-muted-foreground mb-8">
            Join 92,000+ Indians tracking their carbon footprint with Prithvi.
          </p>
          <a
            href="/onboarding"
            id="cta-banner-start"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-primary text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Leaf className="size-5" aria-hidden="true" />
            Begin Tracking Now
          </a>
        </div>
      </section>
    </div>
  )
}
