'use client'

import { GamePanel } from '@/components/GamePanel'
import { DayCard } from '@/components/DayCard'
import { useCarbon } from '@/hooks/useCarbon'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { readBadges, getSetting } from '@/lib/db'
import { useEffect, useState } from 'react'
import { Lock, Star, Loader2, Sprout, TreePine, Wind, Droplets, Sun, Bike, Recycle, Globe } from 'lucide-react'

const ALL_BADGES = [
  { id: 'first-log',      icon: '🌱', name: 'First Step',      desc: 'Log your first activity',          xp: 10  },
  { id: 'green-commuter', icon: '🚇', name: 'Green Commuter',  desc: 'Use metro or cycle for a week',    xp: 50  },
  { id: 'veggie-week',    icon: '🥦', name: 'Veggie Week',     desc: 'Eat vegetarian for 7 days',        xp: 75  },
  { id: 'eco-streak-7',   icon: '🔥', name: '7-Day Streak',    desc: 'Log daily for 7 consecutive days', xp: 100 },
  { id: 'pledge-maker',   icon: '🤝', name: 'Pledge Maker',    desc: 'Post your first community pledge', xp: 30  },
  { id: 'top-scorer',     icon: '🏆', name: 'Top Scorer',      desc: 'Reach a score of 90 or above',     xp: 150 },
  { id: 'zero-waste',     icon: '♻️', name: 'Zero Waste Day',  desc: 'Log a day with zero waste',        xp: 60  },
  { id: 'early-bird',     icon: '🌅', name: 'Early Bird',      desc: 'Log an activity before 9am',       xp: 20  },
  { id: 'solar-chef',     icon: '🍳', name: 'Solar Chef',      desc: 'Use induction cooking for 5 days', xp: 80  },
  { id: 'report-master',  icon: '📊', name: 'Report Master',   desc: 'Export your first monthly report', xp: 40  },
]

/**
 * Build GamePanel player from persisted Dexie values.
 * Falls back to score-derived values only when no persisted data exists yet.
 */
function buildPlayer(score, totalXP, totalCoins, streak) {
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
      { id: 'sprout',  label: 'Sprout',     icon: Sprout,   unlocked: xp > 0    },
      { id: 'tree',    label: 'Tree Hugger', icon: TreePine, unlocked: xp >= 100 },
      { id: 'wind',    label: 'Wind Rider',  icon: Wind,     unlocked: xp >= 200 },
      { id: 'drops',   label: 'Water Saver', icon: Droplets, unlocked: xp >= 300 },
      { id: 'sun',     label: 'Solar Star',  icon: Sun,      unlocked: xp >= 400 },
      { id: 'bike',    label: 'Cycle Hero',  icon: Bike,     unlocked: false     },
      { id: 'recycle', label: 'Zero Waste',  icon: Recycle,  unlocked: false     },
      { id: 'globe',   label: 'Earth First', icon: Globe,    unlocked: false     },
      { id: 'star',    label: 'Eco Legend',  icon: Star,     unlocked: false     },
    ],
  }
}

export default function BadgesPage() {
  const { isOnline } = useOfflineSync()
  const { score, loading } = useCarbon(isOnline)

  const [unlockedIds, setUnlockedIds]   = useState([])
  const [badgesLoading, setBadgesLoading] = useState(true)

  // Persisted gamification state from Dexie
  const [totalXP, setTotalXP]     = useState(null)
  const [totalCoins, setTotalCoins] = useState(null)
  const [streak, setStreak]         = useState(0)
  const [cityName, setCityName]     = useState('')

  useEffect(() => {
    Promise.all([
      readBadges(),
      getSetting('totalXP', 0),
      getSetting('totalCoins', 0),
      getSetting('streakCount', 0),
      getSetting('city', ''),
    ])
      .then(([badges, xp, coins, st, city]) => {
        setUnlockedIds(badges.map((b) => b.badgeId))
        setTotalXP(xp    ?? 0)
        setTotalCoins(coins ?? 0)
        setStreak(st   ?? 0)
        setCityName(city ?? '')
      })
      .catch(() => {})
      .finally(() => setBadgesLoading(false))
  }, [])

  // XP from unlocked badges (on top of persisted totalXP)
  const badgeXP   = ALL_BADGES.filter((b) => unlockedIds.includes(b.id)).reduce((sum, b) => sum + b.xp, 0)
  const effectiveXP = (totalXP ?? 0) + badgeXP
  const level       = Math.floor(effectiveXP / 1000) + 1
  const xpProgress  = effectiveXP % 1000

  if (loading || badgesLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <Loader2 className="size-8 text-primary animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading badges…</span>
      </div>
    )
  }

  const player = buildPlayer(score, totalXP, totalCoins, streak)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Badges &amp; Progress</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Unlock badges by building green habits</p>
      </div>

      {/* Level + XP bar — uses effectiveXP (persisted + badge XP) */}
      <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <Star className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Level</p>
              <p className="text-2xl font-bold font-heading text-foreground" aria-label={`Level ${level}`}>
                {level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{effectiveXP} XP</p>
            <p className="text-xs text-muted-foreground">{1000 - xpProgress} to next level</p>
          </div>
        </div>
        <div
          className="h-2.5 rounded-full bg-secondary overflow-hidden"
          role="progressbar"
          aria-valuenow={xpProgress}
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-label={`XP progress: ${xpProgress} out of 1000 for next level`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${(xpProgress / 1000) * 100}%` }}
          />
        </div>
      </div>

      {/* Game Panel — real persisted data */}
      <GamePanel player={player} />

      {/* Day Card — real city name */}
      <DayCard
        date={new Date()}
        score={score}
        bestAction="Keep logging to earn your next badge"
        worstAction="Check your highest CO₂ category"
        coinsEarned={player.coins}
        cityName={cityName || 'Your City'}
      />

      {/* Badge grid */}
      <section aria-labelledby="badges-grid-heading">
        <h2
          id="badges-grid-heading"
          className="text-base font-semibold font-heading text-foreground mb-4"
        >
          All Badges ({unlockedIds.length}/{ALL_BADGES.length} unlocked)
        </h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          role="list"
          aria-label="Badge collection"
        >
          {ALL_BADGES.map((badge) => {
            const unlocked = unlockedIds.includes(badge.id)
            return (
              <article
                key={badge.id}
                role="listitem"
                id={`badge-${badge.id}`}
                className={`rounded-2xl border p-4 text-center flex flex-col items-center gap-2 transition-all duration-200 ${
                  unlocked
                    ? 'bg-card border-primary/30 shadow-sm'
                    : 'bg-secondary/30 border-border opacity-50'
                }`}
                aria-label={`${badge.name}: ${badge.desc}. ${unlocked ? 'Unlocked' : 'Locked'}`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {unlocked ? badge.icon : <Lock className="size-6 text-muted-foreground mx-auto" />}
                </span>
                <p className={`text-xs font-semibold leading-tight ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {badge.name}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {badge.desc}
                </p>
                <span className={`text-[10px] font-bold ${unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                  +{badge.xp} XP
                </span>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
