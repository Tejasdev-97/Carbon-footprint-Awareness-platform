'use client'

import { useState, useEffect, useRef } from 'react'
import { Sprout, Sun, Moon, Menu, X, ChevronRight } from 'lucide-react'
import ProfileMenu from '@/components/ProfileMenu'
import { cn } from '@/lib/utils'

/** Smooth-scroll to a section ID */
function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const NAV_ITEMS = [
  { label: 'Home', sectionId: 'home' },
  { label: 'Features', sectionId: 'features' },
  { label: 'Get Started', sectionId: 'get-started' },
]

/** useDarkMode — reads/writes localStorage + document class */
function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('prithvi-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
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

/**
 * LandingNav — navigation bar for the landing page only.
 * Desktop: Logo | nav links (smooth scroll) | theme + profile
 * Mobile: Logo + name | theme + profile + hamburger
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dark, toggle: toggleDark } = useDarkMode()
  const mobileRef = useRef(null)

  // Frosted glass on scroll
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 12) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on outside click
  useEffect(() => {
    function handler(e) {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    // Clear session and return to landing
    import('@/lib/db').then(({ putSetting }) => {
      putSetting('onboardingComplete', false)
    }).catch(() => {}).finally(() => {
      window.location.href = '/'
    })
  }

  return (
    <>
      {/* ── Desktop nav ─────────────────────────────────────── */}
      <header
        role="banner"
        className={cn(
          'hidden md:flex fixed inset-x-0 top-0 z-50 justify-center transition-all duration-300'
        )}
      >
        <div
          className={cn(
            'flex w-full max-w-6xl items-center justify-between gap-6',
            'mx-4 my-3 px-6 py-3 rounded-2xl border transition-all duration-300',
            scrolled
              ? 'border-[var(--nav-border)] shadow-lg shadow-foreground/5 backdrop-blur-md backdrop-saturate-150 bg-[var(--nav-glass)]'
              : 'border-transparent bg-background/60 backdrop-blur-sm'
          )}
        >
          {/* Logo */}
          <button
            type="button"
            onClick={() => scrollTo('home')}
            aria-label="Scroll to top"
            className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-xl"
          >
            <span className="flex items-center justify-center size-9 rounded-2xl bg-primary shadow-sm" aria-hidden="true">
              <Sprout className="size-5 text-primary-foreground" />
            </span>
            <span className="font-heading font-bold text-lg text-foreground tracking-tight">Prithvi</span>
          </button>

          {/* Center nav links */}
          <nav aria-label="Page sections">
            <ul className="flex items-center gap-1" role="list">
              {NAV_ITEMS.map(({ label, sectionId }) => (
                <li key={sectionId}>
                  <button
                    type="button"
                    onClick={() => scrollTo(sectionId)}
                    className="px-4 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: theme + profile */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {dark ? <Sun className="size-4.5" aria-hidden="true" /> : <Moon className="size-4.5" aria-hidden="true" />}
            </button>
            <ProfileMenu dark={dark} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* ── Mobile nav ──────────────────────────────────────── */}
      <header
        role="banner"
        className={cn(
          'md:hidden fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-[var(--nav-border)] bg-[var(--nav-glass)] backdrop-blur-md backdrop-saturate-150 shadow-sm'
            : 'bg-background/80 backdrop-blur-sm'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <button
            type="button"
            onClick={() => scrollTo('home')}
            aria-label="Scroll to top"
            className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-xl"
          >
            <span className="flex items-center justify-center size-8 rounded-xl bg-primary shadow-sm" aria-hidden="true">
              <Sprout className="size-4 text-primary-foreground" />
            </span>
            <span className="font-heading font-bold text-base text-foreground">Prithvi</span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-2" ref={mobileRef}>
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <ProfileMenu dark={dark} onLogout={handleLogout} />
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              {mobileOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile page sections"
            className="border-t border-border bg-background/95 backdrop-blur-sm"
          >
            <ul className="flex flex-col py-2 px-4" role="list">
              {NAV_ITEMS.map(({ label, sectionId }) => (
                <li key={sectionId}>
                  <button
                    type="button"
                    onClick={() => {
                      scrollTo(sectionId)
                      setMobileOpen(false)
                    }}
                    className="flex items-center justify-between w-full py-3 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150"
                  >
                    {label}
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  )
}
