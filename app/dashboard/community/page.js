'use client'

import { useState, useEffect } from 'react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useCarbon } from '@/hooks/useCarbon'
import { getSetting } from '@/lib/db'
import {
  getPledges, postPledge, incrementSupportCount, getLeaderboard, submitLeaderboardScore,
} from '@/lib/firebase'
import { Loader2, Heart, Trophy, Users, Megaphone } from 'lucide-react'

const TABS = [
  { id: 'city',     label: 'My City',   icon: Users    },
  { id: 'national', label: 'National',  icon: Trophy   },
  { id: 'pledges',  label: 'Pledges',   icon: Megaphone},
]

function PledgeItem({ pledge, onSupport }) {
  const [supported, setSupported] = useState(false)
  const [count, setCount] = useState(pledge.supportCount || 0)

  async function handleSupport() {
    if (supported) return
    setSupported(true)
    setCount((c) => c + 1)
    await incrementSupportCount(pledge.id)
  }

  return (
    <article
      className="rounded-2xl bg-card border border-border p-4 space-y-2"
      aria-label={`Pledge by ${pledge.displayName} from ${pledge.city}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">&ldquo;{pledge.action}&rdquo;</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-1">
            <span>{pledge.displayName} · {pledge.city}</span>
            {pledge.isDemo && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                Demo
              </span>
            )}
          </p>
        </div>
        <button
          id={`support-${pledge.id}`}
          onClick={handleSupport}
          disabled={supported}
          aria-label={supported ? `You supported this pledge. ${count} total supports.` : `Support this pledge. Currently ${count} supports.`}
          aria-pressed={supported}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            supported
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              : 'bg-secondary hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500'
          }`}
        >
          <Heart className={`size-3.5 ${supported ? 'fill-current' : ''}`} aria-hidden="true" />
          {count}
        </button>
      </div>
    </article>
  )
}

function LeaderboardTable({ entries }) {
  if (!entries.length) return (
    <p className="text-sm text-center text-muted-foreground py-8">
      No leaderboard data. Connect to sync scores.
    </p>
  )
  return (
    <ol aria-label="Weekly leaderboard" className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.rank}
          className="flex items-center gap-4 rounded-xl bg-card border border-border px-4 py-3"
          aria-label={`Rank ${entry.rank}: ${entry.displayName} from ${entry.city}, score ${entry.weeklyScore}`}
        >
          <span
            className={`text-sm font-bold w-6 text-center ${
              entry.rank === 1 ? 'text-amber-500' : entry.rank === 2 ? 'text-slate-400' : entry.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'
            }`}
            aria-hidden="true"
          >
            {entry.rank}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
              <span>{entry.displayName}</span>
              {entry.isDemo && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                  Demo
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{entry.city}</p>
          </div>
          <span className="text-sm font-bold text-primary">{entry.weeklyScore}</span>
        </li>
      ))}
    </ol>
  )
}

export default function CommunityPage() {
  const [tab, setTab] = useState('city')
  const { isOnline } = useOfflineSync()
  const { score } = useCarbon(isOnline)
  const [pledges, setPledges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [city, setCity] = useState('')
  const [displayName, setDisplayName] = useState('You')
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [pledgeText, setPledgeText] = useState('')
  const [posting, setPosting] = useState(false)
  const [postMsg, setPostMsg] = useState('')

  useEffect(() => {
    Promise.all([
      getSetting('city', ''),
      getSetting('name', 'You')
    ])
      .then(([c, n]) => {
        if (c) setCity(c)
        if (n) setDisplayName(n)
        setProfileLoaded(true)
      })
      .catch(() => {
        setProfileLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (!profileLoaded) return
    setLoading(true)
    const activeCity = tab === 'city' ? (city || undefined) : undefined
    Promise.all([
      getPledges({ city: activeCity }),
      getLeaderboard({ city: activeCity }),
    ])
      .then(([p, l]) => { setPledges(p); setLeaderboard(l) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab, city, profileLoaded])

  useEffect(() => {
    if (isOnline && score > 0 && city) {
      submitLeaderboardScore({ city, weeklyScore: score }).catch(() => {})
    }
  }, [isOnline, score, city])

  async function handlePostPledge(e) {
    e.preventDefault()
    if (!pledgeText.trim() || pledgeText.length > 280) return
    setPosting(true)
    const result = await postPledge({ city: city || 'Unknown City', action: pledgeText, displayName })
    if (result.success) {
      setPostMsg('Pledge posted! It will appear after syncing.')
      setPledgeText('')
    } else if (result.reason === 'already_posted_today') {
      setPostMsg('You have already made a pledge today. Come back tomorrow!')
    } else {
      setPostMsg('Could not post. Check your connection and try again.')
    }
    setPosting(false)
    setTimeout(() => setPostMsg(''), 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          See what your community is pledging and how you rank
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Community sections" className="flex gap-1 bg-secondary/60 rounded-2xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="size-6 text-primary animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading community data…</span>
        </div>
      ) : (
        <div
          id={`tabpanel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="space-y-6"
        >
          {tab === 'city' && !city ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <p className="text-muted-foreground text-sm">Please set your city in Settings to view your city's leaderboard and community feed.</p>
            </div>
          ) : (
            <>
              {tab !== 'pledges' && (
                <section aria-labelledby="leaderboard-heading">
                  <h2 id="leaderboard-heading" className="text-base font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
                    <Trophy className="size-4 text-primary" aria-hidden="true" />
                    Weekly Leaderboard
                  </h2>
                  <LeaderboardTable entries={leaderboard} />
                </section>
              )}

              {(tab === 'pledges' || tab === 'city') && (
                <section aria-labelledby="pledge-wall-heading">
                  <h2 id="pledge-wall-heading" className="text-base font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
                    <Megaphone className="size-4 text-primary" aria-hidden="true" />
                    Pledge Wall
                  </h2>

                  {/* Post pledge form */}
                  <form onSubmit={handlePostPledge} className="rounded-2xl bg-card border border-border p-4 mb-4" aria-label="Make a pledge">
                    <label htmlFor="pledge-input" className="text-xs font-semibold text-foreground block mb-2">
                      Your pledge for tomorrow
                    </label>
                    <textarea
                      id="pledge-input"
                      value={pledgeText}
                      onChange={(e) => setPledgeText(e.target.value)}
                      placeholder="I will take the metro this week…"
                      maxLength={280}
                      rows={2}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring mb-2"
                      aria-describedby="pledge-char-count"
                    />
                    <div className="flex items-center justify-between">
                      <span id="pledge-char-count" className="text-xs text-muted-foreground" aria-live="polite">
                        {pledgeText.length}/280 characters
                      </span>
                      <button
                        id="btn-post-pledge"
                        type="submit"
                        disabled={posting || !pledgeText.trim()}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        aria-label="Post your pledge to the community"
                      >
                        {posting ? 'Posting…' : 'Post Pledge'}
                      </button>
                    </div>
                    {postMsg && (
                      <p className="text-xs text-muted-foreground mt-2" role="status" aria-live="polite">{postMsg}</p>
                    )}
                  </form>

                  <div className="space-y-3" role="feed" aria-label="Community pledges">
                    {pledges.length === 0 ? (
                      <p className="text-sm text-center text-muted-foreground py-8">
                        No pledges yet. Be the first!
                      </p>
                    ) : pledges.map((p) => (
                      <PledgeItem key={p.id} pledge={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
