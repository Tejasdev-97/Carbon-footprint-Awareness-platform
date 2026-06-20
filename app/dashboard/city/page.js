'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useCarbon } from '@/hooks/useCarbon'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { getCityVisualState } from '@/lib/carbonEngine'
import { ScoreRing } from '@/components/ScoreRing'
import { Loader2 } from 'lucide-react'
import { getSetting } from '@/lib/db'

// Dynamically import CityScene to avoid SSR — WebGL requires window
const CityScene = dynamic(() => import('@/components/CityScene'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full min-h-[400px] rounded-2xl bg-secondary/40 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading 3D city scene"
    >
      <Loader2 className="size-8 text-primary animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading city scene…</span>
    </div>
  ),
})

const STATE_LABELS = {
  thriving: 'Your city is thriving! Keep up the excellent green habits.',
  healthy:  'Your city is healthy. Small improvements can push it to thriving.',
  stressed: 'Your city is under stress. Try greener commute and food choices.',
  critical: 'Your city is in a critical state. Every action counts today.',
}

export default function CityPage() {
  const { isOnline } = useOfflineSync()
  const { score, totalCO2, loading } = useCarbon(isOnline)
  const visuals = getCityVisualState(score)
  const [cityName, setCityName] = useState('')

  useEffect(() => {
    getSetting('city').then((c) => {
      if (c) setCityName(c)
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">{cityName || 'Your City'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          A live 3D view of your city&apos;s environmental health
        </p>
      </div>

      {/* Score + label row */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          {loading
            ? <Loader2 className="size-6 text-primary animate-spin" aria-hidden="true" />
            : <ScoreRing score={score} size={64} />
          }
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Health Score</p>
            <p
              className="text-3xl font-bold font-heading text-foreground"
              aria-label={`City health score: ${score} out of 100`}
            >
              {score}<span className="text-lg font-normal text-muted-foreground">/100</span>
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${
            visuals.label === 'thriving' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
            visuals.label === 'healthy'  ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'            :
            visuals.label === 'stressed' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'      :
                                          'bg-red-500/15 text-red-600 dark:text-red-400'
          }`}
          aria-label={`City status: ${visuals.label}`}
        >
          {visuals.label}
        </div>

        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          {STATE_LABELS[visuals.label]}
        </p>
      </div>

      {/* 3D Scene */}
      <div
        className="w-full h-[50vh] min-h-[360px] rounded-2xl overflow-hidden border border-border shadow-sm bg-secondary/30"
        aria-label={`3D city scene: ${visuals.label} state with score ${score}`}
      >
        {!loading && <CityScene score={score} />}
      </div>

      {/* Legend */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        aria-label="City state legend"
        role="list"
      >
        {[
          { label: 'Thriving', range: '80–100', color: 'bg-emerald-500' },
          { label: 'Healthy',  range: '60–79',  color: 'bg-sky-500'     },
          { label: 'Stressed', range: '40–59',  color: 'bg-amber-500'   },
          { label: 'Critical', range: '0–39',   color: 'bg-red-500'     },
        ].map((item) => (
          <div
            key={item.label}
            role="listitem"
            className="flex items-start gap-3 rounded-xl bg-card border border-border p-3"
          >
            <div className={`size-2.5 rounded-full mt-1 flex-shrink-0 ${item.color}`} aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">Score {item.range}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today stats */}
      <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
        <h2 className="text-sm font-semibold font-heading text-foreground mb-3">Today&apos;s Impact</h2>
        <p className="text-sm text-muted-foreground">
          You have emitted{' '}
          <strong className="text-foreground font-semibold">{totalCO2.toFixed(2)} kg CO₂</strong>{' '}
          today. The Indian average is approximately{' '}
          <strong className="text-foreground font-semibold">5.0 kg CO₂</strong> per day.
        </p>
      </div>
    </div>
  )
}
