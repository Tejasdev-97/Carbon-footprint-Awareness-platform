/**
 * carbonEngine.js
 * Pure deterministic carbon footprint calculation engine for Prithvi.
 * No AI calls, no side effects, no network requests.
 * All functions are exported and fully unit-testable.
 */

// ─── Emission Factors (kg CO₂ equivalent) ────────────────────────────────────

/** Per-km emission factors for commute modes */
const COMMUTE_FACTORS = {
  walk: 0,
  cycle: 0,
  metro: 0.015,
  bus: 0.05,
  auto_cng: 0.065,
  bike_2wheeler: 0.035,
  car_petrol: 0.12,
  car_diesel: 0.14,
  cab: 0.13,
  car: 0.12, // Mapped from UI
}

/** Per-hour energy emission factors */
const ENERGY_FACTORS = {
  ac: 0.6,
  fan: 0.03,
  geyser_per_use: 1.2,
  solar: 0, // Mapped from UI
  wind: 0,  // Mapped from UI
  led: 0.03, // Mapped from UI
  grid: 0.15, // Mapped from UI
}

/** Per-meal cooking emission factors */
const COOKING_FACTORS = {
  lpg: 0.4,
  induction: 0.25,
  wood: 1.1,
}

/** Per-meal food emission factors */
const FOOD_FACTORS = {
  vegetarian: 0.5,
  egg: 0.8,
  chicken: 1.5,
  mutton: 3.5,
  vegan: 0.3, // Mapped from UI
  local: 0.4, // Mapped from UI
  beef: 3.5,  // Mapped from UI
}

/** Per-unit waste emission factors */
const WASTE_FACTORS = {
  plastic_bag: 0.05,         // per bag
  delivery_packaging: 0.15,  // per delivery order
  zero: 0,      // Mapped from UI
  compost: 0,   // Mapped from UI
  recycled: 0.05, // Mapped from UI
  mixed: 0.15,   // Mapped from UI
  landfill: 0.25, // Mapped from UI
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Clamps a number between min and max (inclusive).
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Computes the CO₂ from a single log entry based on its category.
 * Returns 0 for unknown entries to be safe.
 * @param {{ category: string, value: string|number, quantity?: number }} entry
 * @returns {number} kg CO₂
 */
function entryToCO2(entry) {
  const { category, value, quantity = 1 } = entry

  switch (category) {
    case 'commute': {
      const factor = COMMUTE_FACTORS[value] ?? 0
      const km = Number(entry.km) || 10 // default 10km if not specified
      return factor * km
    }
    case 'energy': {
      if (value === 'geyser_per_use') return ENERGY_FACTORS.geyser_per_use * quantity
      const factor = ENERGY_FACTORS[value] ?? 0
      const hours = Number(entry.hours) || 1
      return factor * hours
    }
    case 'cooking': {
      const factor = COOKING_FACTORS[value] ?? 0
      return factor * quantity
    }
    case 'food': {
      const factor = FOOD_FACTORS[value] ?? 0
      return factor * quantity
    }
    case 'waste': {
      const factor = WASTE_FACTORS[value] ?? 0
      return factor * quantity
    }
    default:
      return 0
  }
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Calculates a daily carbon score and breakdown from an array of log entries.
 *
 * @param {Array<{
 *   category: 'commute'|'energy'|'cooking'|'food'|'waste',
 *   value: string,
 *   quantity?: number,
 *   km?: number,
 *   hours?: number
 * }>} logEntries - Array of activity log entries for the day
 *
 * @returns {{
 *   totalCO2: number,
 *   score: number,
 *   breakdown: { commute: number, energy: number, cooking: number, food: number, waste: number },
 *   topContributor: string
 * }}
 */
export function calculateDailyScore(logEntries = []) {
  const breakdown = {
    commute: 0,
    energy: 0,
    cooking: 0,
    food: 0,
    waste: 0,
  }

  for (const entry of logEntries) {
    const co2 = entryToCO2(entry)
    const category = entry.category
    if (category in breakdown) {
      breakdown[category] += co2
    }
  }

  const totalCO2 = Object.values(breakdown).reduce((sum, v) => sum + v, 0)

  // score = clamp(100 - (totalCO2 * 8), 0, 100)
  const score = clamp(Math.round(100 - totalCO2 * 8), 0, 100)

  // Find the top contributor
  const topContributor = Object.entries(breakdown).sort(([, a], [, b]) => b - a)[0][0]

  return {
    totalCO2: Math.round(totalCO2 * 1000) / 1000, // round to 3 decimal places
    score,
    breakdown: {
      commute: Math.round(breakdown.commute * 1000) / 1000,
      energy: Math.round(breakdown.energy * 1000) / 1000,
      cooking: Math.round(breakdown.cooking * 1000) / 1000,
      food: Math.round(breakdown.food * 1000) / 1000,
      waste: Math.round(breakdown.waste * 1000) / 1000,
    },
    topContributor,
  }
}

/**
 * Returns the single highest-impact behaviour swap suggestion based on the
 * current breakdown. Uses a hardcoded decision tree — no AI call.
 *
 * @param {{ commute: number, energy: number, cooking: number, food: number, waste: number }} breakdown
 * @returns {{
 *   action: string,
 *   impactCO2Saved: number,
 *   impactMoneySaved: number,
 *   message: string
 * }}
 */
export function getSwapSuggestion(breakdown = {}) {
  const { commute = 0, energy = 0, cooking = 0, food = 0, waste = 0 } = breakdown

  // Decision tree: largest impact first
  const suggestions = []

  // Commute swap: if using car/cab (high factor), suggest metro
  if (commute > 0.5) {
    suggestions.push({
      action: 'Switch to metro for your daily commute',
      impactCO2Saved: commute * 0.75,
      impactMoneySaved: Math.round(commute * 150),
      message: 'Taking the metro instead of your car can cut commute emissions by up to 75% and save fuel costs.',
    })
  }

  // Cooking swap: if using wood, suggest LPG
  if (cooking > 0.8) {
    suggestions.push({
      action: 'Switch from wood/biomass cooking to LPG',
      impactCO2Saved: cooking * 0.65,
      impactMoneySaved: Math.round(cooking * 80),
      message: 'LPG produces 65% less CO₂ than wood fire cooking and reduces indoor air pollution significantly.',
    })
  }

  // Food swap: if eating mutton/chicken frequently, suggest vegetarian
  if (food > 1.0) {
    suggestions.push({
      action: 'Replace one meat meal with a vegetarian option',
      impactCO2Saved: food * 0.67,
      impactMoneySaved: Math.round(food * 60),
      message: 'Swapping one meat meal for vegetarian daily can cut your food-related emissions by over 60%.',
    })
  }

  // Energy swap: if AC usage is high, suggest fan + natural ventilation
  if (energy > 1.0) {
    suggestions.push({
      action: 'Reduce AC use by 2 hours and switch to fans',
      impactCO2Saved: energy * 0.5,
      impactMoneySaved: Math.round(energy * 120),
      message: 'Cutting AC usage by 2 hours and using fans instead saves significant electricity and money.',
    })
  }

  // Waste swap
  if (waste > 0.1) {
    suggestions.push({
      action: 'Carry reusable bags and avoid single-use packaging',
      impactCO2Saved: waste * 0.8,
      impactMoneySaved: Math.round(waste * 40),
      message: 'Eliminating single-use plastic bags and packaging dramatically lowers your waste footprint.',
    })
  }

  // Return highest-impact suggestion, or a default
  if (suggestions.length === 0) {
    return {
      action: 'Keep up your green habits',
      impactCO2Saved: 0,
      impactMoneySaved: 0,
      message: 'Your carbon footprint is already low today. Maintain this streak to level up your score.',
    }
  }

  return suggestions.sort((a, b) => b.impactCO2Saved - a.impactCO2Saved)[0]
}

/**
 * Maps a score (0–100) to the visual state used by CityScene.
 * Matches the exact thresholds in the CityScene spec.
 *
 * @param {number} score - 0 to 100
 * @returns {{
 *   sky: string,
 *   fog: number,
 *   trees: number,
 *   river: string,
 *   label: string
 * }}
 */
export function getCityVisualState(score) {
  if (score >= 80) {
    return { sky: '#7DD3FC', fog: 0.01, trees: 8, river: '#0EA5E9', label: 'thriving' }
  }
  if (score >= 60) {
    return { sky: '#A5B4C9', fog: 0.03, trees: 6, river: '#5B7A8C', label: 'healthy' }
  }
  if (score >= 40) {
    return { sky: '#9CA3AF', fog: 0.06, trees: 4, river: '#8B7355', label: 'stressed' }
  }
  return { sky: '#D97706', fog: 0.12, trees: 2, river: '#6B5B3D', label: 'critical' }
}

// Re-export factors for use in tests and UI
export { COMMUTE_FACTORS, ENERGY_FACTORS, COOKING_FACTORS, FOOD_FACTORS, WASTE_FACTORS }

// ─── Quiz Baseline ────────────────────────────────────────────────────────────

/**
 * Converts onboarding quiz answers into an estimated baseline daily CO₂ (kg).
 * Used when a user has no log entries yet so the score doesn't default to 100.
 *
 * @param {{
 *   commute?: 'walk'|'metro'|'carpool'|'car',
 *   diet?:    'vegan'|'veg'|'omni'|'beef',
 *   energy?:  'solar'|'renew'|'grid'|'coal',
 *   shopping?:'rare'|'few'|'monthly'|'weekly',
 *   waste?:   'zero'|'recycle'|'some'|'bin',
 * }} answers - Quiz answers object from Dexie 'quizAnswers' setting
 *
 * @returns {number} Estimated baseline CO₂ in kg per day
 */
export function quizAnswersToBaselineCO2(answers = {}) {
  // Per-answer baseline CO₂ contributions (kg/day equivalent)
  const CO2_MAP = {
    // commute (assume 10km commute each way)
    commute: { walk: 0, metro: 0.15, carpool: 0.6, car: 1.2 },
    // diet (per day average)
    diet:    { vegan: 0.3, veg: 0.5, omni: 1.5, beef: 3.5 },
    // energy (assume 8h usage/day)
    energy:  { solar: 0, renew: 0.2, grid: 1.2, coal: 2.0 },
    // shopping (amortised daily, assume monthly purchase cycle)
    shopping:{ rare: 0.05, few: 0.15, monthly: 0.4, weekly: 0.8 },
    // waste
    waste:   { zero: 0, recycle: 0.05, some: 0.15, bin: 0.25 },
  }

  let total = 0
  for (const [category, optionId] of Object.entries(answers)) {
    total += CO2_MAP[category]?.[optionId] ?? 0
  }

  return Math.round(total * 1000) / 1000 // round to 3dp
}
