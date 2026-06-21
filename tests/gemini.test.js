/**
 * gemini.test.js
 * Unit tests for the Gemini AI client helper utilities.
 * Tests sanitizeInput (XSS/injection protection) and getFallbackResponse
 * (locale-aware fallback routing) — both pure functions with no network calls.
 */

import { describe, it, expect } from 'vitest'
import { sanitizeInput, getFallbackResponse } from '../lib/gemini.js'

// ─── sanitizeInput ────────────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('returns an empty string for non-string input', () => {
    // @ts-expect-error — intentional wrong type for robustness
    expect(sanitizeInput(null)).toBe('')
    // @ts-expect-error
    expect(sanitizeInput(42)).toBe('')
    // @ts-expect-error
    expect(sanitizeInput(undefined)).toBe('')
  })

  it('strips <script> tags and their contents', () => {
    const malicious = 'Hello <script>alert("xss")</script> world'
    const result = sanitizeInput(malicious)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('Hello')
    expect(result).toContain('world')
  })

  it('strips arbitrary HTML tags', () => {
    const html = '<b>Bold</b> and <em>italic</em> text'
    const result = sanitizeInput(html)
    expect(result).not.toContain('<b>')
    expect(result).not.toContain('<em>')
    expect(result).toContain('Bold')
    expect(result).toContain('italic')
    expect(result).toContain('text')
  })

  it('removes null bytes and control characters', () => {
    const withControlChars = 'Hello\x00World\x1F!'
    const result = sanitizeInput(withControlChars)
    expect(result).not.toContain('\x00')
    expect(result).not.toContain('\x1F')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('truncates input to 500 characters maximum', () => {
    const longInput = 'a'.repeat(600)
    const result = sanitizeInput(longInput)
    expect(result.length).toBeLessThanOrEqual(500)
  })

  it('preserves normal text input unchanged', () => {
    const normal = 'I took the metro and had a vegetarian lunch today'
    const result = sanitizeInput(normal)
    expect(result).toBe(normal)
  })

  it('trims leading and trailing whitespace', () => {
    const padded = '   hello world   '
    const result = sanitizeInput(padded)
    expect(result).toBe('hello world')
  })
})

// ─── getFallbackResponse ──────────────────────────────────────────────────────

describe('getFallbackResponse', () => {
  it('returns a carbon definition when prompt contains "carbon"', () => {
    const result = getFallbackResponse('what is carbon footprint?', 'en-IN')
    expect(result.toLowerCase()).toContain('carbon')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(10)
  })

  it('returns a today/tracking response when prompt contains "today"', () => {
    const result = getFallbackResponse('what is my carbon footprint today?', 'en-IN')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(10)
  })

  it('returns a city/score response when prompt contains "city"', () => {
    const result = getFallbackResponse('how is my city score calculated?', 'en-IN')
    expect(result.toLowerCase()).toMatch(/city|score|log|activities/)
    expect(typeof result).toBe('string')
  })

  it('returns a help response when prompt contains "help"', () => {
    const result = getFallbackResponse('can you help me understand this?', 'en-IN')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(10)
  })

  it('falls back to a generic tip for unrecognized prompts', () => {
    const result = getFallbackResponse('xyz unrelated query', 'en-IN')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(10)
  })

  it('returns a non-empty string for Hindi language code', () => {
    const result = getFallbackResponse('carbon kya hai?', 'hi-IN')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })

  it('falls back to en-IN responses for unknown language codes', () => {
    const result = getFallbackResponse('what is metro?', 'xx-XX')
    // Should fall back to en-IN generic tip, still a non-empty string
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })

  it('handles empty prompt gracefully', () => {
    const result = getFallbackResponse('', 'en-IN')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })
})
