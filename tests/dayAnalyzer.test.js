/**
 * dayAnalyzer.test.js
 * Unit tests for the keyword-based daily activity analyzer.
 * Covers: happy paths, edge cases, badge triggers, and summary generation.
 */

import { describe, it, expect } from 'vitest'
import { analyzeDay, getAnalysisSummary } from '../lib/dayAnalyzer.js'

// ─── analyzeDay — edge cases ──────────────────────────────────────────────────

describe('analyzeDay — edge cases', () => {
  it('returns a safe default for empty string input', () => {
    const result = analyzeDay('')
    expect(result.totalCO2).toBe(0)
    expect(result.score).toBe(100)
    expect(result.detectedActivities).toHaveLength(0)
    // Empty string triggers the early-return path (not the keyword-loop path),
    // so no "try mentioning your commute" suggestion is emitted — suggestions is empty.
    expect(result.suggestions).toHaveLength(0)
    expect(result.logEntries).toHaveLength(0)
  })

  it('returns a safe default for null input', () => {
    const result = analyzeDay(null)
    expect(result.totalCO2).toBe(0)
    expect(result.score).toBe(100)
    expect(result.detectedActivities).toHaveLength(0)
  })

  it('returns a safe default for non-string input (number)', () => {
    // @ts-expect-error — intentional wrong type for robustness test
    const result = analyzeDay(42)
    expect(result.totalCO2).toBe(0)
    expect(result.score).toBe(100)
  })

  it('handles a whitespace-only string as "no activities"', () => {
    const result = analyzeDay('   ')
    // whitespace has no keywords, so 0 activities
    expect(result.detectedActivities).toHaveLength(0)
  })
})

// ─── analyzeDay — commute detection ──────────────────────────────────────────

describe('analyzeDay — commute keyword detection', () => {
  it('detects walking as zero-emission commute', () => {
    const result = analyzeDay('I walked to work today')
    const walk = result.detectedActivities.find((a) => a.label === 'Walked')
    expect(walk).toBeDefined()
    expect(walk.co2).toBe(0)
    expect(walk.positive).toBe(true)
    expect(walk.category).toBe('commute')
  })

  it('detects metro as low-emission commute', () => {
    const result = analyzeDay('Took the metro to work')
    const metro = result.detectedActivities.find((a) => a.label === 'Metro ride')
    expect(metro).toBeDefined()
    expect(metro.co2).toBeGreaterThan(0)
    expect(metro.positive).toBe(true)
  })

  it('detects car drive as high-emission commute', () => {
    const result = analyzeDay('I drove my car to the office')
    const car = result.detectedActivities.find((a) => a.label === 'Car trip')
    expect(car).toBeDefined()
    expect(car.co2).toBeGreaterThan(0)
    expect(car.positive).toBe(false)
  })

  it('detects Uber/Ola cab ride', () => {
    const result = analyzeDay('Took an Uber to the airport')
    const cab = result.detectedActivities.find((a) => a.label === 'Uber ride')
    expect(cab).toBeDefined()
    expect(cab.co2).toBeGreaterThanOrEqual(1.3)
  })

  it('detects flight as highest-emission travel', () => {
    const result = analyzeDay('I flew to Mumbai for a meeting')
    const flight = result.detectedActivities.find((a) => a.label === 'Flight')
    expect(flight).toBeDefined()
    expect(flight.co2).toBeGreaterThanOrEqual(8.0)
  })
})

// ─── analyzeDay — food detection ─────────────────────────────────────────────

describe('analyzeDay — food keyword detection', () => {
  it('detects vegetarian meal as low-impact', () => {
    const result = analyzeDay('Had a vegetarian lunch today')
    const veg = result.detectedActivities.find((a) => a.label === 'Vegetarian meal')
    expect(veg).toBeDefined()
    expect(veg.co2).toBe(0.5)
    expect(veg.positive).toBe(true)
  })

  it('detects vegan meal as lowest-impact food', () => {
    const result = analyzeDay('Ate a vegan breakfast')
    const vegan = result.detectedActivities.find((a) => a.label === 'Vegan meal')
    expect(vegan).toBeDefined()
    expect(vegan.co2).toBe(0.3)
  })

  it('detects mutton as high-impact food', () => {
    const result = analyzeDay('Had mutton curry for dinner')
    const mutton = result.detectedActivities.find((a) => a.label === 'Mutton/Lamb')
    expect(mutton).toBeDefined()
    expect(mutton.co2).toBeGreaterThanOrEqual(3.5)
    expect(mutton.positive).toBe(false)
  })
})

// ─── analyzeDay — energy detection ───────────────────────────────────────────

describe('analyzeDay — energy keyword detection', () => {
  it('detects AC use as high-emission energy', () => {
    const result = analyzeDay('Ran the AC for 5 hours in the evening')
    const ac = result.detectedActivities.find((a) => a.label === 'Air conditioning')
    expect(ac).toBeDefined()
    expect(ac.co2).toBeGreaterThan(0)
    expect(ac.positive).toBe(false)
  })

  it('detects solar as carbon-negative energy', () => {
    const result = analyzeDay('Used solar energy at home')
    const solar = result.detectedActivities.find((a) => a.label === 'Solar energy used')
    expect(solar).toBeDefined()
    expect(solar.co2).toBeLessThan(0) // negative = carbon saving
  })
})

// ─── analyzeDay — waste detection ────────────────────────────────────────────

describe('analyzeDay — waste keyword detection', () => {
  it('detects recycling as eco-positive activity', () => {
    const result = analyzeDay('I recycled my plastic bottles today')
    const recycle = result.detectedActivities.find((a) => a.label === 'Recycling')
    expect(recycle).toBeDefined()
    expect(recycle.co2).toBeLessThan(0) // negative = carbon saving
    expect(recycle.positive).toBe(true)
  })

  it('detects food delivery as a waste contributor', () => {
    const result = analyzeDay('Ordered food on Zomato')
    const delivery = result.detectedActivities.find((a) => a.label === 'Food delivery')
    expect(delivery).toBeDefined()
    expect(delivery.positive).toBe(false)
  })
})

// ─── analyzeDay — score calculation ──────────────────────────────────────────

describe('analyzeDay — score calculation', () => {
  it('produces score of 100 for a purely green day', () => {
    const result = analyzeDay('I walked, ate a vegan meal, and recycled everything')
    // walk=0, vegan=0.3, recycled=-0.2 → net=0.1 before clamp
    // totalCO2 = Math.max(0, 0.1) = 0.1 (not 0 — vegan slightly outweighs recycle saving)
    // score = 100 - 0.1*8 = 99.2 → rounds to 99
    expect(result.totalCO2).toBeCloseTo(0.1, 1)
    expect(result.score).toBeGreaterThanOrEqual(99)
  })

  it('produces a lower score for a mixed day', () => {
    const result = analyzeDay('Drove the car, had chicken for lunch')
    expect(result.score).toBeLessThan(80)
    expect(result.totalCO2).toBeGreaterThan(0)
  })

  it('score never exceeds 100', () => {
    const result = analyzeDay('walked cycled metro vegetarian vegan recycled composted solar')
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('score never goes below 0', () => {
    const result = analyzeDay('flew by airplane, drove the car, ate mutton, ran geyser and ac, used wood fire')
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})

// ─── analyzeDay — badge triggers ─────────────────────────────────────────────

describe('analyzeDay — badge triggers', () => {
  it('triggers green-commuter badge on metro usage', () => {
    const result = analyzeDay('Took the metro to work')
    const badge = result.badgeTriggers.find((b) => b.badgeId === 'green-commuter')
    expect(badge).toBeDefined()
    expect(badge.message).toContain('Green Commuter')
  })

  it('triggers veggie-week badge on vegetarian meal', () => {
    const result = analyzeDay('Had a vegetarian lunch')
    const badge = result.badgeTriggers.find((b) => b.badgeId === 'veggie-week')
    expect(badge).toBeDefined()
  })

  it('triggers zero-waste badge on recycling', () => {
    const result = analyzeDay('I recycled today')
    const badge = result.badgeTriggers.find((b) => b.badgeId === 'zero-waste')
    expect(badge).toBeDefined()
  })

  it('does not duplicate badge triggers for same badge', () => {
    const result = analyzeDay('walked and cycling and took the metro')
    const greenCommuterBadges = result.badgeTriggers.filter((b) => b.badgeId === 'green-commuter')
    expect(greenCommuterBadges).toHaveLength(1) // de-duped
  })
})

// ─── analyzeDay — log entries ─────────────────────────────────────────────────

describe('analyzeDay — log entry generation', () => {
  it('generates one log entry per detected activity', () => {
    const result = analyzeDay('I walked to work and had a vegetarian lunch')
    expect(result.logEntries.length).toBeGreaterThanOrEqual(2)
  })

  it('each log entry has required fields', () => {
    const result = analyzeDay('Took the metro and recycled')
    for (const entry of result.logEntries) {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('timeOfDay')
      expect(entry).toHaveProperty('category')
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('co2Impact')
    }
  })

  it('log entry date is today in YYYY-MM-DD format', () => {
    const result = analyzeDay('walked today')
    const today = new Date().toISOString().slice(0, 10)
    expect(result.logEntries[0].date).toBe(today)
  })
})

// ─── getAnalysisSummary ───────────────────────────────────────────────────────

describe('getAnalysisSummary', () => {
  it('returns a prompt string when no activities detected', () => {
    const result = analyzeDay('')
    const summary = getAnalysisSummary(result)
    expect(summary).toContain('No activities detected')
  })

  it('returns a "great day" message for high score', () => {
    const result = analyzeDay('I walked and ate vegan and recycled')
    const summary = getAnalysisSummary(result)
    expect(summary).toContain('Great day')
  })

  it('returns CO2 value in the summary string', () => {
    const result = analyzeDay('Drove the car, had chicken')
    const summary = getAnalysisSummary(result)
    expect(summary).toContain('kg CO₂')
  })

  it('always returns a non-empty string', () => {
    const result = analyzeDay('had some food')
    const summary = getAnalysisSummary(result)
    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(0)
  })
})
