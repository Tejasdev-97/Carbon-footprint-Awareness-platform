/**
 * i18n.js
 * i18next configuration for Prithvi — 9 Indian languages.
 * Supports Web Speech API voice input/output with BCP-47 codes.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en.json'
import hi from '../locales/hi.json'
import ta from '../locales/ta.json'
import te from '../locales/te.json'
import kn from '../locales/kn.json'
import mr from '../locales/mr.json'
import bn from '../locales/bn.json'
import gu from '../locales/gu.json'
import ml from '../locales/ml.json'

// ─── BCP-47 Voice Codes ───────────────────────────────────────────────────────

/** Maps i18n language codes to BCP-47 voice codes for Web Speech API */
export const VOICE_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  ml: 'ml-IN',
}

/**
 * Maps i18n language codes to Gemini API language codes.
 * Aliased from VOICE_CODES — both use BCP-47 IN-locale codes.
 * @type {typeof VOICE_CODES}
 */
export const GEMINI_LANG_CODES = VOICE_CODES

/** All supported languages with their native names */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English'    },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी'      },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்'       },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు'      },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ'       },
  { code: 'mr', label: 'Marathi',   native: 'मराठी'       },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা'       },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી'    },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം'     },
]

// ─── Init ─────────────────────────────────────────────────────────────────────

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        ta: { translation: ta },
        te: { translation: te },
        kn: { translation: kn },
        mr: { translation: mr },
        bn: { translation: bn },
        gu: { translation: gu },
        ml: { translation: ml },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes
      },
    })
}

export default i18n
