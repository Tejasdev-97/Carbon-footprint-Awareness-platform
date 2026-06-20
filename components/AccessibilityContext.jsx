"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSetting, putSetting } from '../lib/db.js'

// ─── Context ──────────────────────────────────────────────────────────────────

const AccessibilityContext = createContext({
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  readAloud: false,
  colorBlindMode: 'none',
  setFontSize: () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
  setReadAloud: () => {},
  setColorBlindMode: () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * AccessibilityProvider — loads prefs from Dexie, applies them as data
 * attributes on <html> so pure-CSS overrides work without re-render.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSizeState] = useState('medium')
  const [highContrast, setHighContrastState] = useState(false)
  const [reduceMotion, setReduceMotionState] = useState(false)
  const [readAloud, setReadAloudState] = useState(false)
  const [colorBlindMode, setColorBlindModeState] = useState('none')

  // Load from Dexie on mount
  useEffect(() => {
    getSetting('accessibilityPrefs').then((prefs) => {
      if (!prefs) return
      if (prefs.fontSize)      setFontSizeState(prefs.fontSize)
      if (prefs.highContrast !== undefined) setHighContrastState(prefs.highContrast)
      if (prefs.reduceMotion !== undefined) setReduceMotionState(prefs.reduceMotion)
      if (prefs.readAloud !== undefined)    setReadAloudState(prefs.readAloud)
      if (prefs.colorBlindMode) setColorBlindModeState(prefs.colorBlindMode)
    }).catch(() => {})
  }, [])

  // Apply to <html> data attributes whenever prefs change
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-font-size', fontSize)
    html.setAttribute('data-high-contrast', String(highContrast))
    html.setAttribute('data-reduce-motion', String(reduceMotion))
    html.setAttribute('data-color-blind', colorBlindMode)
  }, [fontSize, highContrast, reduceMotion, colorBlindMode])

  const persist = useCallback(async (patch) => {
    const current = await getSetting('accessibilityPrefs') || {}
    await putSetting('accessibilityPrefs', { ...current, ...patch })
  }, [])

  const setFontSize = useCallback((v) => { setFontSizeState(v); persist({ fontSize: v }) }, [persist])
  const setHighContrast = useCallback((v) => { setHighContrastState(v); persist({ highContrast: v }) }, [persist])
  const setReduceMotion = useCallback((v) => { setReduceMotionState(v); persist({ reduceMotion: v }) }, [persist])
  const setReadAloud = useCallback((v) => { setReadAloudState(v); persist({ readAloud: v }) }, [persist])
  const setColorBlindMode = useCallback((v) => { setColorBlindModeState(v); persist({ colorBlindMode: v }) }, [persist])

  return (
    <AccessibilityContext.Provider value={{
      fontSize, highContrast, reduceMotion, readAloud, colorBlindMode,
      setFontSize, setHighContrast, setReduceMotion, setReadAloud, setColorBlindMode,
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

/**
 * Hook to consume accessibility preferences.
 * @returns {typeof AccessibilityContext._currentValue}
 */
export function useAccessibility() {
  return useContext(AccessibilityContext)
}

export default AccessibilityContext
