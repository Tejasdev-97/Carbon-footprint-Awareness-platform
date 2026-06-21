/**
 * useCarbon.js
 * React hook that provides today's carbon score, breakdown, and log-writing.
 * All reads/writes go through Dexie (offline-first).
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { calculateDailyScore, getSwapSuggestion, quizAnswersToBaselineCO2 } from '../lib/carbonEngine.js'
import { writeLog, readLogsForDate, getSetting, putSetting } from '../lib/db.js'

/**
 * Returns today's date as YYYY-MM-DD string.
 * @returns {string}
 */
function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Updates the streak counter in Dexie.
 * If the user last logged yesterday, streak++.
 * If they last logged today already, no change.
 * Otherwise streak resets to 1.
 */
async function updateStreak(today) {
  try {
    const lastDate   = (await getSetting('streakLastDate', null)) ?? null
    const streakCount = (await getSetting('streakCount', 0))      ?? 0

    if (lastDate === today) {
      // Already updated today — do nothing
      return
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const newStreak = lastDate === yesterdayStr ? streakCount + 1 : 1
    await putSetting('streakCount', newStreak)
    await putSetting('streakLastDate', today)
  } catch {
    /* non-critical, silent failure by design */
  }
}

/**
 * Awards XP and coins for a new log entry and persists them.
 * Per-entry XP: 5 XP + 2 coins (simple flat reward; avoids re-counting existing entries).
 */
async function awardLogXP() {
  try {
    const currentXP    = (await getSetting('totalXP', 0))    ?? 0
    const currentCoins = (await getSetting('totalCoins', 0)) ?? 0
    await putSetting('totalXP',    currentXP    + 5)
    await putSetting('totalCoins', currentCoins + 2)
  } catch {
    /* non-critical, silent failure by design */
  }
}

/**
 * useCarbon — provides today's carbon data and a log-writing function.
 *
 * @param {boolean} [isOnline=false] - Current network status (from useOfflineSync)
 * @returns {{
 *   score: number,
 *   totalCO2: number,
 *   breakdown: Object,
 *   topContributor: string,
 *   suggestion: Object,
 *   logs: Array,
 *   loading: boolean,
 *   logEntry: (category: 'commute'|'energy'|'cooking'|'food'|'waste', optionId: string|null, logParams?: Object) => Promise<void>,
 *   refresh: () => Promise<void>
 * }}
 */
export function useCarbon(isOnline = false) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [totalCO2, setTotalCO2] = useState(0)
  const [breakdown, setBreakdown] = useState({
    commute: 0, energy: 0, cooking: 0, food: 0, waste: 0,
  })
  const [topContributor, setTopContributor] = useState('commute')
  const [suggestion, setSuggestion] = useState(null)

  const today = getTodayString()

  /**
   * Loads today's logs from Dexie and recomputes the score.
   */
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const todayLogs = await readLogsForDate(today)
      setLogs(todayLogs)

      let result
      if (todayLogs.length === 0) {
        // No entries yet today — use quiz-baseline so score isn't a misleading 100
        const quizAnswers = (await getSetting('quizAnswers', {})) ?? {}
        const baselineCO2 = quizAnswersToBaselineCO2(quizAnswers)
        // Build a synthetic result so all consumers get consistent shape
        result = {
          totalCO2: baselineCO2,
          score: Math.max(0, Math.round(100 - baselineCO2 * 8)),
          breakdown: { commute: 0, energy: 0, cooking: 0, food: 0, waste: 0 },
          topContributor: 'commute',
        }
      } else {
        result = calculateDailyScore(todayLogs)
      }

      setScore(result.score)
      setTotalCO2(result.totalCO2)
      setBreakdown(result.breakdown)
      setTopContributor(result.topContributor)
      setSuggestion(getSwapSuggestion(result.breakdown))
    } catch (err) {
      // Silently handle — IndexedDB may not be available in SSR
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useCarbon] Error reading logs:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [today])

  // Load on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * Writes a new activity log entry and refreshes the score.
   * If an entry for the category already exists for today, it is replaced.
   * If optionId matches the existing value, it is removed (deselected).
   *
   * @param {'commute'|'energy'|'cooking'|'food'|'waste'} category
   * @param {string|null} optionId
   * @param {Object} [logParams={}]
   */
  const logEntry = useCallback(async (category, optionId, logParams = {}) => {
    try {
      const todayLogs = await readLogsForDate(today)
      const existing = todayLogs.find((l) => l.category === category)

      const { db } = await import('../lib/db.js')
      if (existing) {
        await db.logs.delete(existing.id)
      }

      // If clicking a new option (not deselecting)
      if (optionId !== null && optionId !== existing?.value) {
        const now = new Date()
        const hour = now.getHours()
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

        await writeLog(
          {
            category,
            value: optionId,
            date: today,
            timeOfDay: timeOfDay,
            co2Impact: 0, // Recalculated by engine
            ...logParams,
          },
          isOnline
        )

        // Award XP/coins and update streak for new (non-deselect) entries
        await awardLogXP()
        await updateStreak(today)
      }
      await refresh()
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useCarbon] Error logging entry:', err)
      }
    }
  }, [today, isOnline, refresh])

  return {
    score,
    totalCO2,
    breakdown,
    topContributor,
    suggestion,
    logs,
    loading,
    logEntry,
    refresh,
  }
}
