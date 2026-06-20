'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingFlow } from '@/components/OnboardingFlow'
import { getSetting, putSetting } from '@/lib/db'
import { ensureAnonymousAuth } from '@/lib/firebase'

/**
 * Impact level → initial XP mapping.
 * Every quiz answer contributes XP based on its environmental impact.
 */
const ANSWER_IMPACT_LEVEL = {
  // commute
  walk: 'lowest', metro: 'low', carpool: 'medium', car: 'high',
  // diet
  vegan: 'lowest', veg: 'low', omni: 'medium', beef: 'high',
  // energy
  solar: 'lowest', renew: 'low', grid: 'medium', coal: 'high',
  // shopping
  rare: 'lowest', few: 'low', monthly: 'medium', weekly: 'high',
  // waste
  zero: 'lowest', recycle: 'low', some: 'medium', bin: 'high',
}

const IMPACT_XP = { lowest: 20, low: 15, medium: 5, high: 0 }

/**
 * Onboarding page.
 * - If already onboarded → redirect to /dashboard
 * - On OnboardingFlow complete → persist ALL user data to Dexie → go to /dashboard
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getSetting('onboardingComplete')
      .then((done) => {
        if (done) router.replace('/dashboard')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  /**
   * Persists the full onboarding state to Dexie.
   * data shape from OnboardingFlow: { language, city, name, avatar, answers }
   * answers shape: { commute: 'metro', diet: 'veg', energy: 'grid', shopping: 'few', waste: 'recycle' }
   */
  async function handleComplete(data) {
    // ── Core settings ──────────────────────────────────────────────────
    if (data?.language) await putSetting('language', data.language)
    if (data?.city)     await putSetting('city', data.city)

    // ── User profile ───────────────────────────────────────────────────
    if (data?.name?.trim()) await putSetting('name', data.name.trim())
    if (data?.avatar)       await putSetting('avatar', data.avatar)

    // ── Quiz answers (persisted as-is for carbon engine use) ───────────
    if (data?.answers && Object.keys(data.answers).length > 0) {
      await putSetting('quizAnswers', data.answers)

      // Seed initial XP from quiz impact: lowest=20, low=15, medium=5, high=0
      let seedXP = 0
      for (const answerId of Object.values(data.answers)) {
        const level = ANSWER_IMPACT_LEVEL[answerId] ?? 'medium'
        seedXP += IMPACT_XP[level] ?? 5
      }
      // Don't overwrite any XP already earned — add on top (handles resets gracefully)
      const existingXP    = (await getSetting('totalXP', 0))    ?? 0
      const existingCoins = (await getSetting('totalCoins', 0)) ?? 0
      await putSetting('totalXP',    existingXP    + seedXP)
      await putSetting('totalCoins', existingCoins + Math.round(seedXP * 0.3))
    }

    // ── Mark onboarding done ───────────────────────────────────────────
    await putSetting('onboardingComplete', true)

    // Ensure anonymous Firebase auth is set up before entering dashboard
    try { await ensureAnonymousAuth() } catch { /* offline is fine */ }

    router.push('/dashboard')
  }

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-label="Checking setup status"
      >
        <span className="sr-only">Loading onboarding…</span>
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background" id="main-content">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <OnboardingFlow onComplete={handleComplete} />
    </main>
  )
}
