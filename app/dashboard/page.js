'use client'

import { ScoreRing } from '@/components/ScoreRing'
import { TrackingCard } from '@/components/TrackingCard'
import { SwapSuggestionCard } from '@/components/SwapSuggestionCard'
import { GamePanel } from '@/components/GamePanel'
import { DayCard } from '@/components/DayCard'
import DailyAnalyzer from '@/components/DailyAnalyzer'
import { useCarbon } from '@/hooks/useCarbon'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { getSetting } from '@/lib/db'
import { useEffect, useState } from 'react'
import {
  Sprout, TreePine, Wind, Droplets, Sun, Bike, Recycle,
  Globe, Star, Flame, Users, Leaf as LeafIcon, ArrowRight, Loader2,
} from 'lucide-react'
import Link from 'next/link'

/**
 * Build a GamePanel player object from persisted Dexie data + live carbon score.
 * Falls back to score-derived values only when no persisted data exists yet.
 */
function buildPlayer(score, totalXP, totalCoins, streak, unlockedIds = []) {
  const xp      = totalXP    ?? score * 7
  const coins   = totalCoins ?? Math.round(score * 13.4)
  const level   = Math.floor(xp / 1000) + 1
  const xpInLevel = xp % 1000

  return {
    streak,
    level,
    coins,
    xp: xpInLevel,
    xpNextLevel: 1000,
    badges: [
      { id: 'first-log',      label: 'First Step',      icon: Sprout,     unlocked: unlockedIds.includes('first-log') || xp > 0 },
      { id: 'green-commuter', label: 'Green Commuter',  icon: Bike,       unlocked: unlockedIds.includes('green-commuter') || xp >= 100 },
      { id: 'veggie-week',    label: 'Veggie Week',     icon: LeafIcon,   unlocked: unlockedIds.includes('veggie-week') || xp >= 200 },
      { id: 'eco-streak-7',   label: '7-Day Streak',    icon: Flame,      unlocked: unlockedIds.includes('eco-streak-7') || xp >= 300 },
      { id: 'pledge-maker',   label: 'Pledge Maker',    icon: Users,      unlocked: unlockedIds.includes('pledge-maker') || xp >= 400 },
      { id: 'top-scorer',     label: 'Top Scorer',      icon: Star,       unlocked: unlockedIds.includes('top-scorer') },
      { id: 'zero-waste',     label: 'Zero Waste',      icon: Recycle,    unlocked: unlockedIds.includes('zero-waste') },
      { id: 'early-bird',     label: 'Early Bird',      icon: Sun,        unlocked: unlockedIds.includes('early-bird') },
      { id: 'solar-chef',     label: 'Solar Chef',      icon: Wind,       unlocked: unlockedIds.includes('solar-chef') },
    ],
  }
}

export default function DashboardPage() {
  const { isOnline } = useOfflineSync()
  const { score, totalCO2, breakdown, suggestion, loading, logs } = useCarbon(isOnline)

  // User profile + gamification from Dexie
  const [userName, setUserName]       = useState('')
  const [cityName, setCityName]       = useState('')
  const [totalXP, setTotalXP]         = useState(null)
  const [totalCoins, setTotalCoins]   = useState(null)
  const [streak, setStreak]           = useState(0)
  const [unlockedIds, setUnlockedIds] = useState([])
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSetting('name', ''),
      getSetting('city', ''),
      getSetting('totalXP', 0),
      getSetting('totalCoins', 0),
      getSetting('streakCount', 0),
      import('@/lib/db').then((mod) => mod.readBadges()),
    ])
      .then(([n, c, xp, coins, st, bList]) => {
        setUserName(n ?? '')
        setCityName(c ?? '')
        setTotalXP(xp ?? 0)
        setTotalCoins(coins ?? 0)
        setStreak(st ?? 0)
        setUnlockedIds((bList ?? []).map((b) => b.badgeId))
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [])

  if (loading || profileLoading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-live="polite"
        aria-label="Loading dashboard"
      >
        <Loader2 className="size-8 text-primary animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading your carbon data…</span>
      </div>
    )
  }

  const player = buildPlayer(score, totalXP, totalCoins, streak, unlockedIds)

  // Dynamic greeting using saved name — no hardcoded fallback names
  const greeting = userName
    ? `Welcome back, ${userName}`
    : 'Your Dashboard'

  return (
    <div className="space-y-6" id="dashboard-overview">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          {cityName && ` · ${cityName}`}
        </p>
      </div>

      {/* Primary row: score + day card + quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Score ring */}
        <div className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center gap-4 shadow-sm">
          <ScoreRing score={score} />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total CO₂ today</p>
            <p className="text-2xl font-bold font-heading text-foreground">
              {totalCO2.toFixed(2)} <span className="text-base font-normal text-muted-foreground">kg</span>
            </p>
          </div>
        </div>

        {/* Day card — city name from Dexie */}
        <div className="sm:col-span-1 lg:col-span-1">
          <DayCard
            date={new Date()}
            score={score}
            bestAction={suggestion?.action ?? 'Log an activity to see your best action'}
            worstAction={breakdown.commute > 1.5 ? 'High commute emissions today' : 'Check your energy usage'}
            coinsEarned={player.coins}
            userName={userName || ''}
            cityName={cityName || 'Your City'}
          />
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-foreground font-heading">Quick Links</h2>
          {[
            { href: '/dashboard/track',     label: "Log today's activities", desc: 'Track commute, food, energy' },
            { href: '/dashboard/city',      label: 'View your city',          desc: 'See 3D city health'          },
            { href: '/dashboard/badges',    label: 'Earn badges',             desc: 'View your progress'          },
            { href: '/dashboard/community', label: 'Community',               desc: 'Pledge wall & leaderboard'   },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              id={`quicklink-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-accent group transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div>
                <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">{label}</span>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>

      {/* Swap suggestion */}
      {suggestion && (
        <SwapSuggestionCard
          title={suggestion.action}
          description={suggestion.message}
          co2Saved={suggestion.impactCO2Saved ?? 0.5}
          moneySaved={suggestion.impactMoneySaved ?? 20}
        />
      )}

      {/* Daily Life Analyzer */}
      <DailyAnalyzer />

      {/* Tracking preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold font-heading text-foreground">Track Today</h2>
          <Link
            href="/dashboard/track"
            id="link-track-all"
            className="text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TrackingCard category="commute" />
          <TrackingCard category="food" />
        </div>
      </div>

      {/* Game panel — real persisted data */}
      <GamePanel player={player} />
    </div>
  )
}
