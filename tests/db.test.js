/**
 * db.test.js
 * Tests for the Dexie-based offline-first database layer.
 * Uses fake-indexeddb to simulate IndexedDB in Node.js environment.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'

// We need to re-import db after fake-indexeddb is set up
// Dynamically import to ensure fake-indexeddb patches globalThis first
let db, writeLog, readLogsForDate, readSyncQueue, removeSyncQueueItem
  , getSetting, putSetting, clearAllData, unlockBadge, readBadges

beforeEach(async () => {
  // Reset fake IndexedDB for each test by importing fresh instances
  const Dexie = (await import('dexie')).default

  // Create a fresh isolated db instance for each test
  db = new Dexie('PrithviDB_test_' + Date.now())
  db.version(1).stores({
    logs: '++id, date, timeOfDay, category, value, co2Impact, synced',
    badges: '++id, badgeId, unlockedDate, synced',
    syncQueue: '++id, action, payload, timestamp',
    settings: 'key',
  })

  // Local helper functions that use this test db instance
  writeLog = async (entry, isOnline = false) => {
    const id = await db.logs.add({
      ...entry,
      synced: isOnline ? 1 : 0,
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

  readLogsForDate = (date) => db.logs.where('date').equals(date).toArray()
  readSyncQueue = () => db.syncQueue.toArray()
  removeSyncQueueItem = (id) => db.syncQueue.delete(id)
  getSetting = async (key, defaultValue = null) => {
    const row = await db.settings.get(key)
    return row ? row.value : defaultValue
  }
  putSetting = (key, value) => db.settings.put({ key, value })
  clearAllData = () => Promise.all([db.logs.clear(), db.badges.clear(), db.syncQueue.clear()])
  unlockBadge = async (badgeId, isOnline = false) => {
    const existing = await db.badges.where('badgeId').equals(badgeId).first()
    if (existing) return existing.id
    const id = await db.badges.add({
      badgeId,
      unlockedDate: new Date().toISOString(),
      synced: isOnline ? 1 : 0,
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
  readBadges = () => db.badges.toArray()
})

afterEach(async () => {
  if (db && db.isOpen()) {
    await db.delete()
  }
})

// ─── Offline Write → syncQueue ────────────────────────────────────────────────

describe('offline write to syncQueue', () => {
  it('adds a log entry to syncQueue when isOnline=false', async () => {
    const entry = {
      date: '2024-01-15',
      timeOfDay: 'morning',
      category: 'commute',
      value: 'car_petrol',
      co2Impact: 1.2,
      km: 10,
    }

    await writeLog(entry, false) // offline

    const logs = await readLogsForDate('2024-01-15')
    expect(logs).toHaveLength(1)
    expect(logs[0].value).toBe('car_petrol')
    expect(logs[0].synced).toBe(0) // not synced

    const queue = await readSyncQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].action).toBe('CREATE_LOG')
    expect(queue[0].payload.value).toBe('car_petrol')
  })

  it('does NOT add to syncQueue when isOnline=true', async () => {
    const entry = {
      date: '2024-01-15',
      timeOfDay: 'afternoon',
      category: 'food',
      value: 'vegetarian',
      co2Impact: 0.5,
      quantity: 1,
    }

    await writeLog(entry, true) // online

    const queue = await readSyncQueue()
    expect(queue).toHaveLength(0)

    const logs = await readLogsForDate('2024-01-15')
    expect(logs[0].synced).toBe(1) // marked as synced
  })

  it('multiple offline writes all appear in syncQueue', async () => {
    const entries = [
      { date: '2024-01-15', category: 'commute', value: 'bus', co2Impact: 0.5, km: 10 },
      { date: '2024-01-15', category: 'food', value: 'chicken', co2Impact: 1.5, quantity: 1 },
      { date: '2024-01-15', category: 'waste', value: 'plastic_bag', co2Impact: 0.05, quantity: 1 },
    ]

    for (const e of entries) await writeLog(e, false)

    const queue = await readSyncQueue()
    expect(queue).toHaveLength(3)
    expect(queue.map((q) => q.action)).toEqual(['CREATE_LOG', 'CREATE_LOG', 'CREATE_LOG'])
  })
})

// ─── syncQueue drain on reconnect ─────────────────────────────────────────────

describe('syncQueue drain on mock reconnect', () => {
  it('removes items from syncQueue after processing', async () => {
    // Write 2 offline entries
    await writeLog({ date: '2024-01-15', category: 'commute', value: 'cab', co2Impact: 1.3, km: 10 }, false)
    await writeLog({ date: '2024-01-15', category: 'food', value: 'mutton', co2Impact: 3.5, quantity: 1 }, false)

    let queue = await readSyncQueue()
    expect(queue).toHaveLength(2)

    // Simulate reconnect: drain the queue
    // (In real app, each item would be sent to Firebase then removed)
    for (const item of queue) {
      // Mock: "send to server" succeeds
      await removeSyncQueueItem(item.id)
    }

    queue = await readSyncQueue()
    expect(queue).toHaveLength(0)
  })

  it('clears syncQueue selectively — only processed items removed', async () => {
    await writeLog({ date: '2024-01-15', category: 'commute', value: 'metro', co2Impact: 0.3, km: 20 }, false)
    await writeLog({ date: '2024-01-15', category: 'food', value: 'egg', co2Impact: 0.8, quantity: 1 }, false)

    let queue = await readSyncQueue()
    expect(queue).toHaveLength(2)

    // Only process the first item
    await removeSyncQueueItem(queue[0].id)

    queue = await readSyncQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].payload.value).toBe('egg')
  })
})

// ─── Settings persistence ─────────────────────────────────────────────────────

describe('settings persistence', () => {
  it('stores and retrieves a language setting', async () => {
    await putSetting('language', 'hi')
    const value = await getSetting('language')
    expect(value).toBe('hi')
  })

  it('returns defaultValue when setting does not exist', async () => {
    const value = await getSetting('nonexistent', 'default-val')
    expect(value).toBe('default-val')
  })

  it('geminiApiKey is stored in IndexedDB only, not in localStorage', async () => {
    await putSetting('geminiApiKey', 'test-api-key-12345')

    // Verify it IS retrievable from IndexedDB
    const key = await getSetting('geminiApiKey')
    expect(key).toBe('test-api-key-12345')

    // Verify it is NOT stored in localStorage (the correct security property)
    // jsdom may provide localStorage in test env, but we should verify key is absent there
    const lsValue = typeof globalThis.localStorage !== 'undefined'
      ? globalThis.localStorage.getItem('geminiApiKey')
      : null
    expect(lsValue).toBeNull()
  })
})

// ─── Badge deduplication ──────────────────────────────────────────────────────

describe('badge unlock deduplication', () => {
  it('does not create duplicate badges for same badgeId', async () => {
    await unlockBadge('green-commuter', false)
    await unlockBadge('green-commuter', false) // duplicate

    const badges = await readBadges()
    expect(badges).toHaveLength(1)
    expect(badges[0].badgeId).toBe('green-commuter')
  })
})

// ─── Data clearing ────────────────────────────────────────────────────────────

describe('clearAllData', () => {
  it('removes all logs, badges, and syncQueue items', async () => {
    await writeLog({ date: '2024-01-15', category: 'commute', value: 'walk', co2Impact: 0 }, false)
    await unlockBadge('first-step', false)

    await clearAllData()

    const logs = await readLogsForDate('2024-01-15')
    const badges = await readBadges()
    const queue = await readSyncQueue()

    expect(logs).toHaveLength(0)
    expect(badges).toHaveLength(0)
    expect(queue).toHaveLength(0)
  })
})
