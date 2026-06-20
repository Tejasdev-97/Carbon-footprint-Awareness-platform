/**
 * dayAnalyzer.js
 * Keyword-based daily activity analyzer for Prithvi.
 * No AI required — pure deterministic keyword → CO2 mapping.
 *
 * Usage:
 *   import { analyzeDay } from '@/lib/dayAnalyzer'
 *   const result = analyzeDay("I walked to work and had a vegetarian lunch")
 */

// ─── Emission Factors (kg CO2) ───────────────────────────────────────────────

/** @type {Record<string, { category: string, co2: number, label: string, positive: boolean }>} */
const KEYWORD_MAP = {
  // --- COMMUTE (positive = green, negative = high-emission) ---
  walked:       { category: 'commute', co2: 0,    label: 'Walked',              positive: true  },
  walk:         { category: 'commute', co2: 0,    label: 'Walked',              positive: true  },
  walking:      { category: 'commute', co2: 0,    label: 'Walking',             positive: true  },
  cycled:       { category: 'commute', co2: 0,    label: 'Cycled',              positive: true  },
  cycling:      { category: 'commute', co2: 0,    label: 'Cycling',             positive: true  },
  bicycle:      { category: 'commute', co2: 0,    label: 'Bicycle ride',        positive: true  },
  metro:        { category: 'commute', co2: 0.15, label: 'Metro ride',          positive: true  },
  train:        { category: 'commute', co2: 0.2,  label: 'Train journey',       positive: true  },
  bus:          { category: 'commute', co2: 0.4,  label: 'Bus ride',            positive: true  },
  auto:         { category: 'commute', co2: 0.65, label: 'Auto-rickshaw',       positive: false },
  autorickshaw: { category: 'commute', co2: 0.65, label: 'Auto-rickshaw',       positive: false },
  bike:         { category: 'commute', co2: 0.35, label: 'Two-wheeler',         positive: false },
  scooter:      { category: 'commute', co2: 0.35, label: 'Scooter',             positive: false },
  motorbike:    { category: 'commute', co2: 0.35, label: 'Motorbike',           positive: false },
  car:          { category: 'commute', co2: 1.2,  label: 'Car trip',            positive: false },
  drove:        { category: 'commute', co2: 1.2,  label: 'Car trip',            positive: false },
  driving:      { category: 'commute', co2: 1.2,  label: 'Driving',             positive: false },
  cab:          { category: 'commute', co2: 1.3,  label: 'Cab/taxi ride',       positive: false },
  ola:          { category: 'commute', co2: 1.3,  label: 'Ola/Uber ride',       positive: false },
  uber:         { category: 'commute', co2: 1.3,  label: 'Uber ride',           positive: false },
  flight:       { category: 'commute', co2: 8.0,  label: 'Flight',              positive: false },
  flew:         { category: 'commute', co2: 8.0,  label: 'Flight',              positive: false },
  airplane:     { category: 'commute', co2: 8.0,  label: 'Airplane journey',    positive: false },

  // --- ENERGY ---
  ac:           { category: 'energy',  co2: 0.6,  label: 'Air conditioning',    positive: false },
  'air conditioning': { category: 'energy', co2: 0.6, label: 'Air conditioning', positive: false },
  aircon:       { category: 'energy',  co2: 0.6,  label: 'Air conditioning',    positive: false },
  fan:          { category: 'energy',  co2: 0.03, label: 'Fan',                 positive: true  },
  heater:       { category: 'energy',  co2: 0.8,  label: 'Heater',              positive: false },
  geyser:       { category: 'energy',  co2: 1.2,  label: 'Geyser use',          positive: false },
  solar:        { category: 'energy',  co2: -0.3, label: 'Solar energy used',   positive: true  },

  // --- COOKING ---
  lpg:          { category: 'cooking', co2: 0.4,  label: 'LPG cooking',         positive: false },
  gas:          { category: 'cooking', co2: 0.4,  label: 'Gas cooking',         positive: false },
  induction:    { category: 'cooking', co2: 0.25, label: 'Induction cooking',   positive: true  },
  wood:         { category: 'cooking', co2: 1.1,  label: 'Wood fire cooking',   positive: false },
  woodfire:     { category: 'cooking', co2: 1.1,  label: 'Wood fire cooking',   positive: false },

  // --- FOOD ---
  vegetarian:   { category: 'food',    co2: 0.5,  label: 'Vegetarian meal',     positive: true  },
  vegan:        { category: 'food',    co2: 0.3,  label: 'Vegan meal',          positive: true  },
  salad:        { category: 'food',    co2: 0.3,  label: 'Salad',               positive: true  },
  fruits:       { category: 'food',    co2: 0.2,  label: 'Fruits',              positive: true  },
  eggs:         { category: 'food',    co2: 0.8,  label: 'Eggs',                positive: false },
  chicken:      { category: 'food',    co2: 1.5,  label: 'Chicken',             positive: false },
  mutton:       { category: 'food',    co2: 3.5,  label: 'Mutton/Lamb',         positive: false },
  beef:         { category: 'food',    co2: 4.0,  label: 'Beef',                positive: false },
  fish:         { category: 'food',    co2: 0.9,  label: 'Fish',                positive: false },
  delivery:     { category: 'waste',   co2: 0.15, label: 'Food delivery',       positive: false },
  swiggy:       { category: 'waste',   co2: 0.15, label: 'Food delivery',       positive: false },
  zomato:       { category: 'waste',   co2: 0.15, label: 'Food delivery',       positive: false },

  // --- WASTE ---
  recycled:     { category: 'waste',   co2: -0.2, label: 'Recycling',           positive: true  },
  recycle:      { category: 'waste',   co2: -0.2, label: 'Recycling',           positive: true  },
  recycling:    { category: 'waste',   co2: -0.2, label: 'Recycling',           positive: true  },
  composted:    { category: 'waste',   co2: -0.15,label: 'Composting',          positive: true  },
  compost:      { category: 'waste',   co2: -0.15,label: 'Composting',          positive: true  },
  plastic:      { category: 'waste',   co2: 0.05, label: 'Plastic use',         positive: false },
  'plastic bag': { category: 'waste',  co2: 0.05, label: 'Plastic bag',         positive: false },
  polythene:    { category: 'waste',   co2: 0.05, label: 'Polythene bag',       positive: false },
  shopping:     { category: 'waste',   co2: 0.1,  label: 'Shopping trip',       positive: false },
  ecommerce:    { category: 'waste',   co2: 0.15, label: 'E-commerce delivery', positive: false },
  amazon:       { category: 'waste',   co2: 0.15, label: 'Online shopping',     positive: false },
  flipkart:     { category: 'waste',   co2: 0.15, label: 'Online shopping',     positive: false },
}

// ─── Suggestion Templates ──────────────────────────────────────────────────

const SUGGESTIONS = {
  commute: {
    high:  'Consider using the metro or bus for your next commute — it can cut travel emissions by up to 80%.',
    low:   'Great job using sustainable transport today! Keep it up.',
  },
  energy: {
    high:  'Setting your AC 2°C higher saves about 10% on electricity. Using a fan instead saves even more.',
    low:   'Excellent energy choices today.',
  },
  cooking: {
    high:  'Switching from wood fire to LPG cuts cooking emissions by 60%. Induction is even cleaner.',
    low:   'Great cooking choices!',
  },
  food: {
    high:  'One vegetarian day a week reduces your food carbon footprint by roughly 15% annually.',
    low:   'Plant-forward eating is making a real difference!',
  },
  waste: {
    high:  'Carry a cloth bag to avoid plastic waste. Recycling and composting can offset 0.3 kg CO₂ per day.',
    low:   'Excellent waste reduction habits!',
  },
}

// ─── Badge Triggers ────────────────────────────────────────────────────────

const BADGE_TRIGGERS = [
  { keyword: 'walked', badgeId: 'green-commuter', message: 'Green Commuter badge progress!' },
  { keyword: 'cycling', badgeId: 'green-commuter', message: 'Green Commuter badge progress!' },
  { keyword: 'metro', badgeId: 'green-commuter', message: 'Green Commuter badge progress!' },
  { keyword: 'vegetarian', badgeId: 'veggie-week', message: 'Veggie Week badge progress!' },
  { keyword: 'vegan', badgeId: 'veggie-week', message: 'Veggie Week badge progress!' },
  { keyword: 'recycled', badgeId: 'zero-waste', message: 'Zero Waste badge progress!' },
  { keyword: 'compost', badgeId: 'zero-waste', message: 'Zero Waste badge progress!' },
]

// ─── Core Analysis Function ─────────────────────────────────────────────────

/**
 * Analyzes a free-text description of a user's day.
 * Extracts keywords and maps them to carbon impact scores.
 *
 * @param {string} text - Free-form description of the day
 * @returns {{
 *   totalCO2: number,
 *   score: number,
 *   detectedActivities: Array<{ label: string, co2: number, category: string, positive: boolean }>,
 *   suggestions: string[],
 *   badgeTriggers: Array<{ badgeId: string, message: string }>,
 *   logEntries: Array<{ category: string, value: string, co2Impact: number, timeOfDay: string }>
 * }}
 */
export function analyzeDay(text) {
  if (!text || typeof text !== 'string') {
    return {
      totalCO2: 0, score: 100,
      detectedActivities: [], suggestions: [], badgeTriggers: [], logEntries: [],
    }
  }

  const normalized = text.toLowerCase()
  const detected = []
  const triggeredBadges = []
  const seenKeywords = new Set()

  // Detect keywords (longest match first to catch multi-word phrases)
  const sortedKeys = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length)
  for (const keyword of sortedKeys) {
    if (seenKeywords.has(KEYWORD_MAP[keyword].label)) continue
    if (normalized.includes(keyword)) {
      const entry = KEYWORD_MAP[keyword]
      detected.push({ label: entry.label, co2: entry.co2, category: entry.category, positive: entry.positive })
      seenKeywords.add(entry.label)
    }
  }

  // Detect badge triggers
  for (const trigger of BADGE_TRIGGERS) {
    if (normalized.includes(trigger.keyword) && !triggeredBadges.find(b => b.badgeId === trigger.badgeId)) {
      triggeredBadges.push({ badgeId: trigger.badgeId, message: trigger.message })
    }
  }

  // Calculate total CO2
  const totalCO2 = Math.max(0, detected.reduce((sum, a) => sum + a.co2, 0))

  // Calculate score (same formula as carbonEngine: score = clamp(100 - totalCO2 * 8, 0, 100))
  const score = Math.max(0, Math.min(100, Math.round(100 - totalCO2 * 8)))

  // Build suggestions per category
  const categoryTotals = {}
  for (const a of detected) {
    if (!categoryTotals[a.category]) categoryTotals[a.category] = { co2: 0, hasPositive: false }
    categoryTotals[a.category].co2 += a.co2
    if (a.positive) categoryTotals[a.category].hasPositive = true
  }

  const suggestions = []
  for (const [category, data] of Object.entries(categoryTotals)) {
    const tips = SUGGESTIONS[category]
    if (tips) {
      suggestions.push(data.co2 > 0.5 ? tips.high : tips.low)
    }
  }

  // If nothing detected, offer a prompt
  if (detected.length === 0) {
    suggestions.push('Try describing your commute, meals, or energy use — e.g. "I took the metro and had a vegetarian lunch".')
  }

  // Build log entries to persist
  const today = new Date().toISOString().slice(0, 10)
  const logEntries = detected.map((a, i) => ({
    date: today,
    timeOfDay: i < 2 ? 'morning' : i < 4 ? 'afternoon' : 'evening',
    category: a.category,
    value: a.label,
    co2Impact: a.co2,
  }))

  return { totalCO2, score, detectedActivities: detected, suggestions, badgeTriggers: triggeredBadges, logEntries }
}

/**
 * Returns a human-readable summary of the analysis result.
 * @param {{ totalCO2: number, score: number, detectedActivities: Array }} result
 * @returns {string}
 */
export function getAnalysisSummary(result) {
  if (result.detectedActivities.length === 0) {
    return 'No activities detected. Try mentioning your commute, meals, or energy habits.'
  }
  const band = result.score >= 70 ? '🌿 Great day for the planet!' : result.score >= 40 ? 'Moderate impact day.' : 'High-impact day — small swaps can help!'
  return `${band} You generated approximately ${result.totalCO2.toFixed(2)} kg CO₂. Environmental score: ${result.score}/100.`
}
