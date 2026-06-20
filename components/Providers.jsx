"use client"

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
  return (
    <I18nextProvider i18n={i18n}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </I18nextProvider>
  )
}
