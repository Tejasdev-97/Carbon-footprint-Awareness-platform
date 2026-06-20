/**
 * db.js
 * IndexedDB wrapper using Dexie for Prithvi offline-first storage.
 *
 * Rules:
 * - All writes go to Dexie FIRST, always, before any network call.
 * - IndexedDB is the primary local store.
 * - The Gemini API key is stored here, NOT in localStorage or cookies.
 */

import Dexie from 'dexie'

// ─── Database Definition ──────────────────────────────────────────────────────

/** @type {Dexie} */
export const db = new Dexie('PrithviDB')

db.version(1).stores({
  // Activity logs: indexed by date and category for efficient querying
  logs: '++id, date, timeOfDay, category, value, co2Impact, synced',
  // Earned badges
  badges: '++id, badgeId, unlockedDate, synced',
  // Queued actions waiting for network
  syncQueue: '++id, action, payload, timestamp',
  // Key-value settings store (key is primary key)
  settings: 'key',
})

// ─── Log Helpers ──────────────────────────────────────────────────────────────

/**
 * Writes a new activity log entry to the local database.
 * Also adds it to the syncQueue if offline.
 *
 * @param {{
 *   date: string,
 *   timeOfDay: 'morning'|'afternoon'|'evening'|'night',
 *   category: 'commute'|'energy'|'cooking'|'food'|'waste',
 *   value: string,
 *   co2Impact: number,
 *   km?: number,
 *   hours?: number,
 *   quantity?: number
 * }} entry
 * @param {boolean} [isOnline=false]
 * @returns {Promise<number>} The new log id
 */
export async function writeLog(entry, isOnline = false) {
  const id = await db.logs.add({
    ...entry,
    synced: isOnline,
    createdAt: new Date().toISOString(),
  })

  if (!isOnline) {
    await db.syncQueue.add({
      action: 'CREATE_LOG',
      payload: { ...entry, localId: id },
      timestamp: Date.now(),
    })
  }

  return id
}

/**
 * Returns all log entries for a given date string (YYYY-MM-DD).
 *
 * @param {string} date - ISO date string e.g. '2024-01-15'
 * @returns {Promise<Array>}
 */
export async function readLogsForDate(date) {
  return db.logs.where('date').equals(date).toArray()
}

/**
 * Returns all log entries for the current month.
 *
 * @param {number} year - Full year e.g. 2024
 * @param {number} month - 1-indexed month e.g. 1 for January
 * @returns {Promise<Array>}
 */
export async function readLogsForMonth(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return db.logs.filter((log) => log.date && log.date.startsWith(prefix)).toArray()
}

/**
 * Returns all unsynced log entries.
 * @returns {Promise<Array>}
 */
export async function readUnsyncedLogs() {
  return db.logs.where('synced').equals(0).toArray()
}

/**
 * Marks a log entry as synced.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function markLogSynced(id) {
  await db.logs.update(id, { synced: 1 })
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────

/**
 * Unlocks a badge and writes it to the database.
 *
 * @param {string} badgeId
 * @param {boolean} [isOnline=false]
 * @returns {Promise<number>}
 */
export async function unlockBadge(badgeId, isOnline = false) {
  // Prevent duplicate unlocks
  const existing = await db.badges.where('badgeId').equals(badgeId).first()
  if (existing) return existing.id

  const id = await db.badges.add({
    badgeId,
    unlockedDate: new Date().toISOString(),
    synced: isOnline,
  })

  if (!isOnline) {
    await db.syncQueue.add({
      action: 'UNLOCK_BADGE',
      payload: { badgeId, localId: id },
      timestamp: Date.now(),
    })
  }

  return id
}

/**
 * Returns all unlocked badges.
 * @returns {Promise<Array>}
 */
export async function readBadges() {
  return db.badges.toArray()
}

// ─── Sync Queue Helpers ───────────────────────────────────────────────────────

/**
 * Returns all pending items in the sync queue.
 * @returns {Promise<Array>}
 */
export async function readSyncQueue() {
  return db.syncQueue.toArray()
}

/**
 * Removes an item from the sync queue after it has been successfully synced.
 * @param {number} id - syncQueue entry id
 * @returns {Promise<void>}
 */
export async function removeSyncQueueItem(id) {
  await db.syncQueue.delete(id)
}

/**
 * Clears all sync queue items (e.g. after a full sync).
 * @returns {Promise<void>}
 */
export async function clearSyncQueue() {
  await db.syncQueue.clear()
}

// ─── Settings Helpers ─────────────────────────────────────────────────────────

/**
 * Valid settings keys to prevent typos.
 * @type {string[]}
 */
export const SETTINGS_KEYS = [
  'language',
  'city',
  'geminiApiKey',
  'notificationsEnabled',
  'accessibilityPrefs',
  'userId',
  'onboardingComplete',
  'notificationHour',
  // User profile (saved during onboarding)
  'name',
  'avatar',
  'quizAnswers',
  // Gamification persistence
  'totalXP',
  'totalCoins',
  'streakCount',
  'streakLastDate',
]

/**
 * Reads a setting value by key.
 *
 * @param {string} key - One of the SETTINGS_KEYS
 * @param {*} [defaultValue=null] - Returned if key does not exist
 * @returns {Promise<*>}
 */
export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key)
  return row ? row.value : defaultValue
}

/**
 * Writes or updates a setting value.
 *
 * @param {string} key - One of the SETTINGS_KEYS
 * @param {*} value - Any JSON-serializable value
 * @returns {Promise<void>}
 */
export async function putSetting(key, value) {
  await db.settings.put({ key, value })
}

/**
 * Reads multiple settings at once.
 *
 * @param {string[]} keys
 * @returns {Promise<Object>} Map of key → value
 */
export async function getSettings(keys) {
  const rows = await db.settings.where('key').anyOf(keys).toArray()
  const result = {}
  for (const key of keys) {
    const row = rows.find((r) => r.key === key)
    result[key] = row ? row.value : null
  }
  return result
}

/**
 * Clears ALL data from all tables.
 * Used in Settings → "Clear all data" with confirmation.
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await Promise.all([
    db.logs.clear(),
    db.badges.clear(),
    db.syncQueue.clear(),
    // Keep the user's basic settings (language, city) but clear sensitive ones
    db.settings.where('key').noneOf(['language', 'city']).delete(),
  ])
}
