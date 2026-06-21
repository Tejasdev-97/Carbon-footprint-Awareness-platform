import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useCarbon } from '../hooks/useCarbon'

global.IS_REACT_ACT_ENVIRONMENT = true
import { useOfflineSync } from '../hooks/useOfflineSync'
import { db } from '../lib/db'

// Mock Firebase SDK
vi.mock('../lib/firebase', () => ({
  isFirebaseAvailable: vi.fn(() => true),
  ensureAnonymousAuth: vi.fn(() => Promise.resolve('test-uid')),
  postPledge: vi.fn(() => Promise.resolve({ success: true, pledgeId: 'mock-p-id' })),
  submitLeaderboardScore: vi.fn(() => Promise.resolve(true)),
  getStoredFirebaseUser: vi.fn(() => Promise.resolve(null)),
  signOutUser: vi.fn(() => Promise.resolve()),
}))

describe('Custom hooks unit tests', () => {
  beforeEach(async () => {
    await db.logs.clear()
    await db.badges.clear()
    await db.settings.clear()
    await db.syncQueue.clear()
  })

  describe('useCarbon', () => {
    it('initializes with default state', async () => {
      let hookVal = null
      const container = document.createElement('div')
      document.body.appendChild(container)

      function TestComponent() {
        hookVal = useCarbon(false)
        return null
      }

      const root = createRoot(container)
      await act(async () => {
        root.render(<TestComponent />)
      })

      // Wait a tick for useEffect in hook to resolve Dexie read
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(hookVal).not.toBeNull()
      expect(hookVal.score).toBe(100)
      expect(hookVal.totalCO2).toBe(0)
      expect(hookVal.loading).toBe(false)
      expect(hookVal.logs).toEqual([])

      await act(async () => {
        root.unmount()
      })
      document.body.removeChild(container)
    })

    it('logEntry successfully stores an entry and updates the hook state', async () => {
      let hookVal = null
      const container = document.createElement('div')
      document.body.appendChild(container)

      function TestComponent() {
        hookVal = useCarbon(false)
        return null
      }

      const root = createRoot(container)
      await act(async () => {
        root.render(<TestComponent />)
      })

      // Wait for initial load
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Call logEntry
      await act(async () => {
        await hookVal.logEntry('commute', 'metro', { km: 20 })
      })

      // Wait for re-render and re-calculation
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(hookVal.logs.length).toBe(1)
      expect(hookVal.logs[0].category).toBe('commute')
      expect(hookVal.logs[0].value).toBe('metro')
      expect(hookVal.totalCO2).toBeGreaterThan(0)
      expect(hookVal.score).toBeLessThan(100)

      await act(async () => {
        root.unmount()
      })
      document.body.removeChild(container)
    })
  })

  describe('useOfflineSync', () => {
    it('returns network states and offline queue counts', async () => {
      let hookVal = null
      const container = document.createElement('div')
      document.body.appendChild(container)

      function TestComponent() {
        hookVal = useOfflineSync()
        return null
      }

      const root = createRoot(container)
      await act(async () => {
        root.render(<TestComponent />)
      })

      // Wait a tick for initial queue read
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(hookVal).not.toBeNull()
      expect(hookVal.isOnline).toBe(true)
      expect(hookVal.syncStatus).toBe('synced')
      expect(hookVal.pendingCount).toBe(0)

      await act(async () => {
        root.unmount()
      })
      document.body.removeChild(container)
    })
  })
})
