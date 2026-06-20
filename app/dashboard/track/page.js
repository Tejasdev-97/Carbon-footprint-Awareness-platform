'use client'

import { useState } from 'react'
import { TrackingCard } from '@/components/TrackingCard'
import { useCarbon } from '@/hooks/useCarbon'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['commute', 'food', 'energy', 'waste']

export default function TrackPage() {
  const { isOnline } = useOfflineSync()
  const { logs, loading, totalCO2 } = useCarbon(isOnline)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <Loader2 className="size-8 text-primary animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading tracking data…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Track Today</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log your daily activities to calculate your carbon footprint
        </p>
      </div>

      {/* Running total */}
      <div
        className="flex items-center gap-4 rounded-2xl bg-primary/8 border border-primary/20 px-5 py-4"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Running total: ${totalCO2.toFixed(2)} kg CO2 today`}
      >
        <div>
          <p className="text-xs text-primary/70 uppercase tracking-wider font-semibold">Today so far</p>
          <p className="text-2xl font-bold font-heading text-primary">
            {totalCO2.toFixed(2)} <span className="text-base font-normal">kg CO₂</span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">
            {logs.length} {logs.length === 1 ? 'activity' : 'activities'} logged
          </p>
        </div>
      </div>

      {/* Tracking cards — each is self-contained and manages its own selection */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        aria-label="Activity tracking cards"
      >
        {CATEGORIES.map((cat) => (
          <TrackingCard key={cat} category={cat} />
        ))}
      </div>

      {/* Log history (read from Dexie via useCarbon) */}
      {logs.length > 0 ? (
        <section aria-labelledby="log-history-heading">
          <h2
            id="log-history-heading"
            className="text-base font-semibold font-heading text-foreground mb-3"
          >
            Today&apos;s Log
          </h2>
          <ul className="space-y-2" aria-label="List of today's logged activities">
            {[...logs].reverse().map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground capitalize">{log.category}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span className="text-muted-foreground capitalize">
                    {(log.value ?? '').replace(/_/g, ' ')}
                  </span>
                </div>
                <span
                  className="font-semibold text-foreground"
                  aria-label={`${(log.co2Impact ?? 0).toFixed(3)} kilograms CO2`}
                >
                  {(log.co2Impact ?? 0).toFixed(3)} kg
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p
          className="text-center text-muted-foreground text-sm py-8"
          role="status"
          aria-live="polite"
        >
          No activities logged yet today. Start tracking above.
        </p>
      )}
    </div>
  )
}
