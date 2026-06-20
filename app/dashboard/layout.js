'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChatBubble } from '@/components/ChatBubble'
import { AccessibilityPanel } from '@/components/AccessibilityPanel'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import ProfileMenu from '@/components/ProfileMenu'
import {
  Home, Map, Activity, Award, Users, BarChart3, Settings,
  WifiOff, Loader2, CheckCircle2, Sun, Moon, Menu, X, Sprout,
} from 'lucide-react'
import { getSetting } from '@/lib/db'
import { cn } from '@/lib/utils'

/** Reads/writes the .dark class on <html> and persists to localStorage */
function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('prithvi-theme')
    const isDark = stored ? stored === 'dark' : false // Default: light
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('prithvi-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return { dark, toggle }
}

const DASHBOARD_LINKS = [
  { href: '/dashboard',           label: 'Overview',   icon: Home      },
  { href: '/dashboard/city',      label: 'City',       icon: Map       },
  { href: '/dashboard/track',     label: 'Track',      icon: Activity  },
  { href: '/dashboard/badges',    label: 'Badges',     icon: Award     },
  { href: '/dashboard/community', label: 'Community',  icon: Users     },
  { href: '/dashboard/reports',   label: 'Reports',    icon: BarChart3 },
  { href: '/dashboard/settings',  label: 'Settings',   icon: Settings  },
]

function SyncIndicator({ status }) {
  if (status === 'offline') {
    return (
      <span title="Offline" aria-label="Offline" className="flex items-center gap-1 text-xs text-amber-500">
        <WifiOff className="size-3.5" aria-hidden="true" /> Offline
      </span>
    )
  }
  if (status === 'syncing') {
    return (
      <span title="Syncing" aria-label="Syncing" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Syncing
      </span>
    )
  }
  return (
    <span title="Synced" aria-label="All changes synced" className="flex items-center gap-1 text-xs text-emerald-500">
      <CheckCircle2 className="size-3.5" aria-hidden="true" /> Synced
    </span>
  )
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { syncStatus } = useOfflineSync()
  const { dark, toggle: toggleDark } = useDarkMode()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [geminiMissing, setGeminiMissing] = useState(false)

  // Check if Gemini API key is configured
  useEffect(() => {
    getSetting('geminiApiKey', '').then((k) => {
      setGeminiMissing(!k)
    }).catch(() => {})
  }, [])

  function handleLogout() {
    getSetting('onboardingComplete', false).then(() => {
      // For anonymous auth we just clear onboarding status and return to landing
      import('@/lib/db').then(({ putSetting }) => {
        putSetting('onboardingComplete', false)
      }).finally(() => {
        router.push('/')
      })
    }).catch(() => router.push('/'))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <a href="#dashboard-content" className="skip-link">Skip to main content</a>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-56 border-r border-border bg-sidebar flex-col z-30 py-6 px-3">
        {/* Logo + controls */}
        <div className="flex items-center justify-between px-3 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ring rounded-xl">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <Sprout className="size-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-heading text-foreground">Prithvi</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring"
            >
              {dark ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}
            </button>
            <ProfileMenu dark={dark} onLogout={handleLogout} />
          </div>
        </div>

        {/* Nav links */}
        <nav aria-label="Dashboard navigation" className="flex-1">
          <ul className="space-y-0.5">
            {DASHBOARD_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="size-4 flex-shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sync status */}
        <div className="px-3 py-2">
          <SyncIndicator status={syncStatus} />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 md:pl-56">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur border-b border-border">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <Sprout className="size-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-heading text-foreground">Prithvi</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <SyncIndicator status={syncStatus} />
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
            </button>
            <ProfileMenu dark={dark} onLogout={handleLogout} />
            {/* Hamburger for mobile nav */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-dashboard-nav"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </header>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <nav
            id="mobile-dashboard-nav"
            aria-label="Mobile dashboard navigation"
            className="md:hidden fixed top-14 inset-x-0 z-20 bg-background/98 backdrop-blur-md border-b border-border shadow-lg"
          >
            <ul className="flex flex-col py-2 px-4">
              {DASHBOARD_LINKS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      id={`mobile-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 py-3 px-2 text-sm font-medium transition-colors duration-100 border-b border-border/50 last:border-0',
                        isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {/* Gemini key missing warning */}
        {geminiMissing && (
          <div
            role="alert"
            aria-live="polite"
            className="mx-4 md:mx-8 mt-4 flex items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm"
          >
            <p className="text-amber-700 dark:text-amber-300">
              <strong>Gemini API key not configured.</strong> AI-powered suggestions will use offline fallbacks.
            </p>
            <Link
              href="/dashboard/settings"
              id="btn-open-settings-from-warning"
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Open Settings
            </Link>
          </div>
        )}

        <main
          id="dashboard-content"
          className="min-h-[calc(100vh-3.5rem)] md:min-h-screen px-4 py-6 md:px-8 pb-8"
        >
          {children}
        </main>
      </div>

      {/* AI Chat Bubble */}
      <ChatBubble />

      {/* Accessibility Panel */}
      <AccessibilityPanel />
    </div>
  )
}
