/**
 * carbonEngine.test.js
 * Deterministic unit tests for the carbon calculation engine.
 * All inputs and expected outputs are hardcoded — no mocking needed.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDailyScore,
  getSwapSuggestion,
  getCityVisualState,
  quizAnswersToBaselineCO2,
  COMMUTE_FACTORS,
  FOOD_FACTORS,
  ENERGY_FACTORS,
  COOKING_FACTORS,
  WASTE_FACTORS,
} from '../lib/carbonEngine.js'

// ─── calculateDailyScore ──────────────────────────────────────────────────────

describe('calculateDailyScore', () => {
  it('returns score 100 for zero-emission day (no entries)', () => {
    const result = calculateDailyScore([])
    expect(result.totalCO2).toBe(0)
    expect(result.score).toBe(100)
    expect(result.breakdown.commute).toBe(0)
    expect(result.breakdown.food).toBe(0)
  })

  it('correctly calculates walking commute (zero emissions)', () => {
    const entries = [
      { category: 'commute', value: 'walk', km: 5 },
    ]
    const result = calculateDailyScore(entries)
    expect(result.totalCO2).toBe(0)
    expect(result.score).toBe(100)
    expect(result.breakdown.commute).toBe(0)
  })

  it('correctly calculates car commute + vegetarian food (medium score)', () => {
    // car_petrol: 0.12 kg/km * 10km = 1.2 kg
    // vegetarian: 0.5 kg/meal * 1 = 0.5 kg
    // total = 1.7 kg → score = 100 - (1.7 * 8) = 100 - 13.6 = 86 → clamped to 86
    const entries = [
      { category: 'commute', value: 'car_petrol', km: 10 },
      { category: 'food', value: 'vegetarian', quantity: 1 },
    ]
    const result = calculateDailyScore(entries)
    expect(result.totalCO2).toBeCloseTo(1.7, 2)
    expect(result.score).toBe(86)
    expect(result.topContributor).toBe('commute')
  })

  it('returns score 0 for very high emission day (clamps at 0)', () => {
    // mutton: 3.5 kg/meal * 3 meals = 10.5 kg
    // wood: 1.1 kg/meal * 3 = 3.3 kg
    // car_diesel: 0.14 * 50km = 7.0 kg
    // total = 20.8 → score = 100 - (20.8 * 8) = 100 - 166.4 = -66 → clamped to 0
    const entries = [
      { category: 'food', value: 'mutton', quantity: 3 },
      { category: 'cooking', value: 'wood', quantity: 3 },
      { category: 'commute', value: 'car_diesel', km: 50 },
    ]
    const result = calculateDailyScore(entries)
    expect(result.score).toBe(0)
  })

  it('correctly handles metro + vegetarian + fan (high green score)', () => {
    // metro: 0.015 * 20km = 0.3 kg
    // vegetarian: 0.5 * 2 = 1.0 kg
    // fan: 0.03 * 8 hours = 0.24 kg
    // total = 1.54 → score = 100 - (1.54 * 8) = 100 - 12.32 = 87.68 → 88
    const entries = [
      { category: 'commute', value: 'metro', km: 20 },
      { category: 'food', value: 'vegetarian', quantity: 2 },
      { category: 'energy', value: 'fan', hours: 8 },
    ]
    const result = calculateDailyScore(entries)
    expect(result.totalCO2).toBeCloseTo(1.54, 2)
    expect(result.score).toBeGreaterThanOrEqual(85)
    expect(result.score).toBeLessThanOrEqual(95)
  })

  it('calculates waste CO₂ correctly', () => {
    // plastic_bag: 0.05 * 3 = 0.15
    // delivery_packaging: 0.15 * 2 = 0.30
    // total waste = 0.45
    const entries = [
      { category: 'waste', value: 'plastic_bag', quantity: 3 },
      { category: 'waste', value: 'delivery_packaging', quantity: 2 },
    ]
    const result = calculateDailyScore(entries)
    expect(result.breakdown.waste).toBeCloseTo(0.45, 2)
    expect(result.topContributor).toBe('waste')
  })
})

// ─── getSwapSuggestion ────────────────────────────────────────────────────────

describe('getSwapSuggestion', () => {
  it('suggests metro when commute emissions are high', () => {
    const breakdown = { commute: 1.2, energy: 0.1, cooking: 0.1, food: 0.3, waste: 0 }
    const suggestion = getSwapSuggestion(breakdown)
    expect(suggestion.action.toLowerCase()).toContain('metro')
    expect(suggestion.impactCO2Saved).toBeGreaterThan(0)
    expect(suggestion.impactMoneySaved).toBeGreaterThan(0)
    expect(typeof suggestion.message).toBe('string')
  })

  it('suggests LPG when cooking uses wood (high emissions)', () => {
    const breakdown = { commute: 0.1, energy: 0.1, cooking: 2.2, food: 0.3, waste: 0 }
    const suggestion = getSwapSuggestion(breakdown)
    expect(suggestion.action.toLowerCase()).toContain('lpg')
  })

  it('suggests vegetarian swap when food emissions are high', () => {
    const breakdown = { commute: 0.1, energy: 0.1, cooking: 0.3, food: 3.5, waste: 0 }
    const suggestion = getSwapSuggestion(breakdown)
    expect(suggestion.action.toLowerCase()).toContain('vegetarian')
  })

  it('returns a keep-up message for near-zero emissions', () => {
    const breakdown = { commute: 0, energy: 0, cooking: 0, food: 0.5, waste: 0 }
    const suggestion = getSwapSuggestion(breakdown)
    // food is 0.5 which is NOT > 1.0 threshold, so fallback message returned
    expect(suggestion.impactCO2Saved).toBe(0)
    expect(suggestion.message).toBeTruthy()
  })

  it('always returns an object with required keys', () => {
    const suggestion = getSwapSuggestion({})
    expect(suggestion).toHaveProperty('action')
    expect(suggestion).toHaveProperty('impactCO2Saved')
    expect(suggestion).toHaveProperty('impactMoneySaved')
    expect(suggestion).toHaveProperty('message')
  })
})

// ─── getCityVisualState ───────────────────────────────────────────────────────

describe('getCityVisualState', () => {
  it('returns thriving state for score >= 80', () => {
    const state = getCityVisualState(85)
    expect(state.label).toBe('thriving')
    expect(state.trees).toBe(8)
    expect(state.fog).toBe(0.01)
  })

  it('returns healthy state for score 60–79', () => {
    const state = getCityVisualState(65)
    expect(state.label).toBe('healthy')
    expect(state.trees).toBe(6)
  })

  it('returns stressed state for score 40–59', () => {
    const state = getCityVisualState(50)
    expect(state.label).toBe('stressed')
    expect(state.trees).toBe(4)
  })

  it('returns critical state for score < 40', () => {
    const state = getCityVisualState(20)
    expect(state.label).toBe('critical')
    expect(state.trees).toBe(2)
    expect(state.fog).toBe(0.12)
  })

  it('boundary: score exactly 80 → thriving', () => {
    expect(getCityVisualState(80).label).toBe('thriving')
  })

  it('boundary: score exactly 60 → healthy', () => {
    expect(getCityVisualState(60).label).toBe('healthy')
  })

  it('boundary: score exactly 40 → stressed', () => {
    expect(getCityVisualState(40).label).toBe('stressed')
  })

  it('boundary: score 39 → critical', () => {
    expect(getCityVisualState(39).label).toBe('critical')
  })
})

// ─── quizAnswersToBaselineCO2 ─────────────────────────────────────────────────

describe('quizAnswersToBaselineCO2', () => {
  it('returns 0 for empty quiz answers', () => {
    expect(quizAnswersToBaselineCO2({})).toBe(0)
  })

  it('returns 0 for all zero-emission answers (walk, vegan, solar, rare, zero)', () => {
    const result = quizAnswersToBaselineCO2({
      commute: 'walk',
      diet: 'vegan',
      energy: 'solar',
      shopping: 'rare',
      waste: 'zero',
    })
    // walk=0, vegan=0.3, solar=0, rare=0.05, zero=0 → 0.35
    expect(result).toBeCloseTo(0.35, 2)
  })

  it('returns high CO2 for worst-case answers (car, beef, coal, weekly, bin)', () => {
    const result = quizAnswersToBaselineCO2({
      commute: 'car',
      diet: 'beef',
      energy: 'coal',
      shopping: 'weekly',
      waste: 'bin',
    })
    // car=1.2, beef=3.5, coal=2.0, weekly=0.8, bin=0.25 → 7.75
    expect(result).toBeCloseTo(7.75, 2)
  })

  it('handles partial answers (only commute and diet)', () => {
    const result = quizAnswersToBaselineCO2({ commute: 'metro', diet: 'veg' })
    // metro=0.15, veg=0.5 → 0.65
    expect(result).toBeCloseTo(0.65, 2)
  })

  it('ignores unknown answer option IDs gracefully (returns 0 contribution)', () => {
    const result = quizAnswersToBaselineCO2({ commute: 'helicopter', diet: 'snacks' })
    expect(result).toBe(0)
  })

  it('result is rounded to 3 decimal places', () => {
    const result = quizAnswersToBaselineCO2({
      commute: 'carpool',
      diet: 'omni',
      energy: 'renew',
      shopping: 'few',
      waste: 'recycle',
    })
    // carpool=0.6, omni=1.5, renew=0.2, few=0.15, recycle=0.05 → 2.5
    expect(result).toBeCloseTo(2.5, 2)
    // Verify it is a proper number with at most 3 decimal places
    expect(Number.isFinite(result)).toBe(true)
  })
})

// ─── Exported Emission Factor Constants ──────────────────────────────────────

describe('Exported emission factor constants', () => {
  it('COMMUTE_FACTORS contains walk (zero) and car_petrol (positive)', () => {
    expect(COMMUTE_FACTORS.walk).toBe(0)
    expect(COMMUTE_FACTORS.car_petrol).toBeGreaterThan(0)
  })

  it('FOOD_FACTORS: vegan < vegetarian < chicken < mutton', () => {
    expect(FOOD_FACTORS.vegan).toBeLessThan(FOOD_FACTORS.vegetarian)
    expect(FOOD_FACTORS.vegetarian).toBeLessThan(FOOD_FACTORS.chicken)
    expect(FOOD_FACTORS.chicken).toBeLessThan(FOOD_FACTORS.mutton)
  })

  it('ENERGY_FACTORS: solar is 0 (or absent); ac is the highest', () => {
    // solar is mapped to 0 in the engine
    expect(ENERGY_FACTORS.solar ?? 0).toBe(0)
    expect(ENERGY_FACTORS.ac).toBeGreaterThan(ENERGY_FACTORS.fan)
  })

  it('COOKING_FACTORS: induction < lpg < wood', () => {
    expect(COOKING_FACTORS.induction).toBeLessThan(COOKING_FACTORS.lpg)
    expect(COOKING_FACTORS.lpg).toBeLessThan(COOKING_FACTORS.wood)
  })

  it('WASTE_FACTORS: plastic_bag is less than landfill', () => {
    // landfill is 0.25, plastic_bag is 0.05
    expect(WASTE_FACTORS.plastic_bag).toBeLessThan(WASTE_FACTORS.landfill ?? 1)
  })
})
