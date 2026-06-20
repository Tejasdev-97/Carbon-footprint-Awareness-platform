/**
 * useOfflineSync.js
 * Hook for tracking online/offline state and syncing queued actions to Firebase.
 *
 * Strategy:
 * - Writes always go to Dexie first (in useCarbon / writeLog)
 * - On reconnect, drain the syncQueue to Firebase
 * - Use Background Sync API where supported
 * - Manual sync fallback for iOS Safari which lacks Background Sync
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { readSyncQueue, removeSyncQueueItem, markLogSynced } from '../lib/db.js'

/** @typedef {'offline' | 'syncing' | 'synced'} SyncStatus */

/**
 * useOfflineSync — tracks connection state and drains syncQueue on reconnect.
 *
 * @returns {{
 *   isOnline: boolean,
 *   syncStatus: SyncStatus,
 *   manualSync: () => Promise<void>,
 *   pendingCount: number
 * }}
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [syncStatus, setSyncStatus] = useState('synced')
  const [pendingCount, setPendingCount] = useState(0)
  const isSyncingRef = useRef(false)

  /**
   * Drains the syncQueue to Firebase.
   * Items are removed from the queue only after successful sync.
   * Uses last-write-wins conflict strategy by timestamp.
   */
  const drainSyncQueue = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setSyncStatus('syncing')

    try {
      const queue = await readSyncQueue()
      if (queue.length === 0) {
        setSyncStatus('synced')
        setPendingCount(0)
        return
      }

      // Sort by timestamp ascending (oldest first) for last-write-wins
      const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp)

      // Dynamically import firebase to avoid SSR issues
      let postPledge, submitLeaderboardScore
      try {
        const fbModule = await import('../lib/firebase.js')
        postPledge = fbModule.postPledge
        submitLeaderboardScore = fbModule.submitLeaderboardScore
      } catch {
        // Firebase not available — clear queue items that can't be synced
        setSyncStatus('synced')
        return
      }

      for (const item of sorted) {
        try {
          let success = false

          switch (item.action) {
            case 'CREATE_LOG': {
              // Logs are local-only — just mark synced
              if (item.payload?.localId) {
                await markLogSynced(item.payload.localId)
              }
              success = true
              break
            }
            case 'POST_PLEDGE': {
              const result = await postPledge(item.payload)
              success = result.success || result.reason === 'already_posted_today'
              break
            }
            case 'SUBMIT_SCORE': {
              success = await submitLeaderboardScore(item.payload)
              break
            }
            default: {
              // Unknown action type — remove to avoid blocking queue
              success = true
            }
          }

          if (success) {
            await removeSyncQueueItem(item.id)
          }
        } catch {
          // Individual item failed — leave it in queue, try next
        }
      }

      const remaining = await readSyncQueue()
      setPendingCount(remaining.length)
      setSyncStatus(remaining.length === 0 ? 'synced' : 'syncing')
    } catch {
      setSyncStatus('offline')
    } finally {
      isSyncingRef.current = false
    }
  }, [])

  /**
   * Manual sync trigger — for iOS Safari and user-initiated sync.
   * Exposed as `manualSync` in the hook return value.
   */
  const manualSync = useCallback(async () => {
    if (!isOnline) return
    await drainSyncQueue()
  }, [isOnline, drainSyncQueue])

  // Track online/offline state
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      setSyncStatus('syncing')
      // Auto-drain on reconnect
      drainSyncQueue()
    }

    function handleOffline() {
      setIsOnline(false)
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [drainSyncQueue])

  // Register Background Sync if supported (not on iOS Safari)
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return

    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register('prithvi-sync').catch(() => {
        // Background Sync registration failed — fallback to manual
      })
    }).catch(() => {})
  }, [])

  // Initial pending count check
  useEffect(() => {
    readSyncQueue()
      .then((queue) => setPendingCount(queue.length))
      .catch(() => {})
  }, [])

  // Set initial status based on online state
  useEffect(() => {
    if (!isOnline) setSyncStatus('offline')
  }, [isOnline])

  return { isOnline, syncStatus, manualSync, pendingCount }
}
