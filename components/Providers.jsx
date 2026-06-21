"use client"

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../lib/i18n.js'
import { AccessibilityProvider } from './AccessibilityContext.jsx'

/**
 * Providers — client-side context wrapper for the Next.js app shell.
 * Wraps children with i18n and accessibility providers.
 * Must be "use client" since providers use hooks internally.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function Providers({ children }) {
  useEffect(() => {
    // Read user's selected language from Dexie on mount
    import('../lib/db.js').then(({ getSetting }) => {
      getSetting('language', 'en').then((lang) => {
        if (lang) {
          i18n.changeLanguage(lang).catch(() => {})
        }
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </I18nextProvider>
  )
}
