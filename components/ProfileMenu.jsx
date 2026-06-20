'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, Settings, LogOut, Sprout } from 'lucide-react'
import { getSetting } from '@/lib/db'
import Link from 'next/link'

/**
 * ProfileMenu — dropdown with My Profile / Settings / Logout
 * Works with anonymous auth (no real email/password).
 * Name is loaded from Dexie settings.
 */
export default function ProfileMenu({ dark, onLogout }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    getSetting('name', '').then((n) => setName(n || '')).catch(() => {})
    getSetting('avatar', null).then((a) => setAvatar(a)).catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const AVATAR_ICONS = {
    leaf: '🌿', sun: '☀️', drop: '💧', seedling: '🌱', earth: '🌍', cloud: '☁️',
  }

  const initials = name ? name.charAt(0).toUpperCase() : 'P'
  const avatarEmoji = avatar ? AVATAR_ICONS[avatar] : null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="profile-menu-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={name ? `Profile: ${name}` : 'Profile menu'}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center size-9 rounded-xl border border-border bg-card hover:bg-accent transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {avatarEmoji ? (
          <span className="text-sm" role="img" aria-hidden="true">{avatarEmoji}</span>
        ) : (
          <span className="text-xs font-bold text-primary">{initials}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-full mt-2 w-52 py-1.5 rounded-2xl border border-border bg-popover shadow-lg shadow-foreground/5 backdrop-blur-sm z-50"
        >
          {/* User info header */}
          {name && (
            <div className="px-4 py-2 border-b border-border mb-1">
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground">Anonymous member</p>
            </div>
          )}

          <Link
            href="/dashboard/settings"
            id="profile-menu-settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors duration-100"
          >
            <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
            Settings
          </Link>

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            id="profile-menu-logout"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              if (onLogout) onLogout()
            }}
            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-100"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
