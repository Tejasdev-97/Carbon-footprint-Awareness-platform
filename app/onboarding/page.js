'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingFlow } from '@/components/OnboardingFlow'
import { getSetting, putSetting } from '@/lib/db'
import { ensureAnonymousAuth, signInWithGoogle, restoreUserDataFromFirestore } from '@/lib/firebase'
import { LogIn, UserCheck, Loader2 } from 'lucide-react'

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
 * - Shows Sign-In screen (Google / Guest) if not authenticated.
 * - Restores data from Firestore for returning Google users.
 * - Otherwise, opens the OnboardingFlow 4-step wizard.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authNeeded, setAuthNeeded] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    Promise.all([
      getSetting('onboardingComplete', false),
      getSetting('firebaseUser', null),
      getSetting('userId', null)
    ]).then(([done, fbUser, uId]) => {
      if (done) {
        router.replace('/dashboard')
      } else if (fbUser || uId) {
        // Already authenticated, proceed straight to onboarding
        setAuthNeeded(false)
        setChecking(false)
      } else {
        // Not authenticated, show login options
        setAuthNeeded(true)
        setChecking(false)
      }
    }).catch(() => {
      setChecking(false)
    })
  }, [router])

  /**
   * Google Sign-In handler.
   * Attempts to restore previous data from Firestore.
   */
  async function handleGoogleSignIn() {
    setErrorMsg('')
    setRestoring(true)
    try {
      const user = await signInWithGoogle()
      if (!user) {
        setErrorMsg('Sign-in cancelled or failed. Please try again.')
        setRestoring(false)
        return
      }

      // Try to restore user data from Firestore
      const restored = await restoreUserDataFromFirestore(user.uid)
      if (restored) {
        // Setting onboardingComplete is handled during restore, but let's be sure
        await putSetting('onboardingComplete', true)
        router.replace('/dashboard')
      } else {
        // New Google user, show the onboarding wizard
        setAuthNeeded(false)
        setRestoring(false)
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
      setRestoring(false)
    }
  }

  /**
   * Anonymous guest sign-in handler.
   */
  async function handleAnonymousSignIn() {
    setErrorMsg('')
    setRestoring(true)
    try {
      const uid = await ensureAnonymousAuth()
      if (uid) {
        setAuthNeeded(false)
      } else {
        setErrorMsg('Guest sign-in failed. Please try again.')
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setRestoring(false)
    }
  }

  /**
   * Persists the full onboarding state to Dexie and syncs to Firestore if Google user.
   * data shape from OnboardingFlow: { language, city, name, avatar, answers }
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
      // Don't overwrite any XP already earned — add on top
      const existingXP    = (await getSetting('totalXP', 0))    ?? 0
      const existingCoins = (await getSetting('totalCoins', 0)) ?? 0
      await putSetting('totalXP',    existingXP    + seedXP)
      await putSetting('totalCoins', existingCoins + Math.round(seedXP * 0.3))
    }

    // ── Mark onboarding done ───────────────────────────────────────────
    await putSetting('onboardingComplete', true)

    // Trigger Firestore backup sync if Google Sign-In was used
    try {
      const { syncUserDataToFirestore } = await import('@/lib/firebase')
      await syncUserDataToFirestore()
    } catch { /* ignore sync failure */ }

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

  if (authNeeded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden" id="main-content">
        {/* Abstract decorative ambient glow background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-[12000ms]" />

        <div
          role="region"
          aria-label="Prithvi Sign In"
          className="w-full max-w-md rounded-2xl border border-border bg-card/85 backdrop-blur-md text-card-foreground p-8 flex flex-col gap-6 shadow-2xl transition-all duration-300"
        >
          <div className="text-center space-y-2">
            <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary/15 text-primary mb-2 shadow-inner">
              <LogIn className="size-6" />
            </span>
            <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">
              Sign In to Prithvi
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track, understand, and heal the Earth. Connect your account to get started.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3.5 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {restoring ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Setting up your secure session...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Google Sign In Button */}
              <button
                type="button"
                id="btn-google-signin"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 text-sm font-semibold rounded-2xl border border-border bg-card hover:bg-accent/80 hover:text-accent-foreground active:scale-98 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
              >
                {/* SVG for Google Logo */}
                <svg className="size-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Anonymous Sign In Button */}
              <button
                type="button"
                id="btn-guest-signin"
                onClick={handleAnonymousSignIn}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 text-sm font-semibold rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent/80 hover:text-accent-foreground active:scale-98 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
              >
                <UserCheck className="size-4" />
                Continue as Guest
              </button>
            </div>
          )}

          <div className="border-t border-border/50 pt-5 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Google Sign-In lets you sync badges and progress across devices. Guest mode saves data locally in this browser.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background" id="main-content">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <OnboardingFlow onComplete={handleComplete} />
    </main>
  )
}
