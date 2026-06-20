/**
 * firebase.js
 * Firebase Anonymous Auth + Firestore sync for Prithvi community features.
 *
 * Security rules:
 * - Anonymous auth only (no email/password, no Google)
 * - Config read only from NEXT_PUBLIC_FIREBASE_* env vars — never hardcoded
 * - Write-rate limited: one pledge per user per day (enforced in Dexie)
 * - No PII stored beyond anonymous UID and user-chosen display name
 *
 * If env vars are missing, all functions return mock/empty data gracefully.
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  increment,
  serverTimestamp,
  doc,
} from 'firebase/firestore'
import { getSetting, putSetting } from './db.js'

// ─── Config & Init ────────────────────────────────────────────────────────────

/**
 * Checks whether Firebase env vars are present.
 * Returns false if any required variable is missing.
 * @returns {boolean}
 */
function isFirebaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  )
}

/**
 * Lazily initializes Firebase app and returns { app, auth, db }.
 * Returns null if config is not present.
 * @returns {{ app: import('firebase/app').FirebaseApp, auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore } | null}
 */
function getFirebaseServices() {
  if (!isFirebaseConfigured()) return null

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  const auth = getAuth(app)
  const db = getFirestore(app)

  return { app, auth, db }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Signs in the user anonymously and persists the UID in Dexie.
 * If Firebase is not configured, returns a local mock user ID.
 *
 * @returns {Promise<string>} The user's anonymous UID
 */
export async function ensureAnonymousAuth() {
  // Check if we already have a local userId
  const storedUserId = await getSetting('userId')

  const services = getFirebaseServices()
  if (!services) {
    // Firebase not configured — use stored local ID or generate one
    if (storedUserId) return storedUserId
    const localId = 'local_' + Math.random().toString(36).slice(2, 11)
    await putSetting('userId', localId)
    return localId
  }

  const { auth } = services

  // Return existing auth user if signed in
  if (auth.currentUser) {
    await putSetting('userId', auth.currentUser.uid)
    return auth.currentUser.uid
  }

  try {
    const credential = await signInAnonymously(auth)
    const uid = credential.user.uid
    await putSetting('userId', uid)
    return uid
  } catch {
    // Fall back to stored or generated ID
    if (storedUserId) return storedUserId
    const fallbackId = 'local_' + Math.random().toString(36).slice(2, 11)
    await putSetting('userId', fallbackId)
    return fallbackId
  }
}

// ─── Pledge Wall ──────────────────────────────────────────────────────────────

/**
 * Rate-limit key for pledges — one per user per day.
 * @param {string} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {string}
 */
function pledgeRateLimitKey(userId, date) {
  return `pledge_posted_${userId}_${date}`
}

/**
 * Posts a pledge to Firestore for the community pledge wall.
 * Enforces write-once per user per day via Dexie rate-limit tracking.
 *
 * @param {{
 *   city: string,
 *   action: string,
 *   displayName?: string
 * }} pledgeData
 * @returns {Promise<{ success: boolean, reason?: string, pledgeId?: string }>}
 */
export async function postPledge({ city, action, displayName = 'Anonymous' }) {
  const userId = await ensureAnonymousAuth()
  const today = new Date().toISOString().slice(0, 10)
  const rateLimitKey = pledgeRateLimitKey(userId, today)

  // Check daily rate limit in Dexie
  const alreadyPosted = await getSetting(rateLimitKey)
  if (alreadyPosted) {
    return { success: false, reason: 'already_posted_today' }
  }

  const services = getFirebaseServices()
  if (!services) {
    // Offline mode: store pledge locally and return mock
    await putSetting(rateLimitKey, true)
    return { success: true, pledgeId: 'local_' + Date.now() }
  }

  const { db } = services

  try {
    const docRef = await addDoc(collection(db, 'pledges'), {
      userId,
      city,
      action: action.slice(0, 280), // limit action length
      displayName: displayName.slice(0, 40), // limit display name length
      supportCount: 0,
      timestamp: serverTimestamp(),
    })

    // Record rate limit
    await putSetting(rateLimitKey, true)

    return { success: true, pledgeId: docRef.id }
  } catch {
    return { success: false, reason: 'network_error' }
  }
}

/**
 * Fetches recent pledges, optionally filtered by city.
 *
 * @param {{ city?: string, limitCount?: number }} options
 * @returns {Promise<Array<{ id: string, city: string, action: string, displayName: string, supportCount: number, timestamp: string }>>}
 */
export async function getPledges({ city, limitCount = 20 } = {}) {
  const services = getFirebaseServices()
  if (!services) {
    return getMockPledges(city)
  }

  const { db } = services

  try {
    let q = query(
      collection(db, 'pledges'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    if (city) {
      q = query(
        collection(db, 'pledges'),
        where('city', '==', city),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }))
  } catch {
    return getMockPledges(city)
  }
}

/**
 * Increments support count for a pledge.
 * @param {string} pledgeId
 * @returns {Promise<boolean>}
 */
export async function incrementSupportCount(pledgeId) {
  const services = getFirebaseServices()
  if (!services) return true

  try {
    const pledgeRef = doc(services.db, 'pledges', pledgeId)
    await updateDoc(pledgeRef, { supportCount: increment(1) })
    return true
  } catch {
    return false
  }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

/**
 * Returns the ISO week ID string for the current week.
 * Format: YYYY-WNN (e.g. 2024-W03)
 * @returns {string}
 */
function getCurrentWeekId() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Submits or updates the user's weekly score to the leaderboard.
 * @param {{ city: string, weeklyScore: number }} data
 * @returns {Promise<boolean>}
 */
export async function submitLeaderboardScore({ city, weeklyScore }) {
  const userId = await ensureAnonymousAuth()
  const weekId = getCurrentWeekId()

  const services = getFirebaseServices()
  if (!services) return true

  const { db } = services

  try {
    // Use userId+weekId as document ID for write-once per week deduplication
    const docRef = doc(db, 'leaderboard', `${userId}_${weekId}`)
    await updateDoc(docRef, { weeklyScore, city, userId, weekId, updatedAt: serverTimestamp() })
      .catch(async () => {
        // Document doesn't exist yet — create it
        await addDoc(collection(db, 'leaderboard'), {
          userId,
          city,
          weeklyScore,
          weekId,
          updatedAt: serverTimestamp(),
        })
      })
    return true
  } catch {
    return false
  }
}

/**
 * Fetches leaderboard entries for the current week.
 * Returns anonymized entries (userId is hashed, no raw UID shown).
 *
 * @param {{ city?: string, limitCount?: number }} options
 * @returns {Promise<Array<{ rank: number, displayName: string, city: string, weeklyScore: number }>>}
 */
export async function getLeaderboard({ city, limitCount = 10 } = {}) {
  const services = getFirebaseServices()
  if (!services) return getMockLeaderboard()

  const { db } = services
  const weekId = getCurrentWeekId()

  try {
    let q = query(
      collection(db, 'leaderboard'),
      where('weekId', '==', weekId),
      orderBy('weeklyScore', 'desc'),
      limit(limitCount)
    )
    if (city) {
      q = query(
        collection(db, 'leaderboard'),
        where('weekId', '==', weekId),
        where('city', '==', city),
        orderBy('weeklyScore', 'desc'),
        limit(limitCount)
      )
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d, index) => ({
      rank: index + 1,
      // Anonymize: show only first 6 chars of userId hash
      displayName: anonymizeUserId(d.data().userId),
      city: d.data().city,
      weeklyScore: d.data().weeklyScore,
    }))
  } catch {
    return getMockLeaderboard()
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates an anonymous display name from a user ID.
 * @param {string} userId
 * @returns {string}
 */
function anonymizeUserId(userId) {
  const adjectives = ['Green', 'Eco', 'Solar', 'Clean', 'Leaf', 'Sky', 'River']
  const nouns = ['Sparrow', 'Lotus', 'Banyan', 'Mango', 'Tiger', 'Peacock', 'Neem']
  // Deterministic from userId hash
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return `${adjectives[hash % adjectives.length]} ${nouns[(hash >> 3) % nouns.length]}`
}

/**
 * Returns mock pledge data when Firebase is not configured.
 * @param {string} [city]
 * @returns {Array}
 */
function getMockPledges(city) {
  const pledges = [
    { id: '1', city: 'Bengaluru', action: 'I will take the metro for my daily commute this week', displayName: 'Green Sparrow', supportCount: 24, timestamp: new Date().toISOString(), isDemo: true },
    { id: '2', city: 'Mumbai', action: 'I will carry a reusable bag and avoid plastic packaging', displayName: 'Eco Lotus', supportCount: 18, timestamp: new Date().toISOString(), isDemo: true },
    { id: '3', city: 'Delhi', action: 'I will switch to LPG for cooking this month', displayName: 'Solar Banyan', supportCount: 12, timestamp: new Date().toISOString(), isDemo: true },
    { id: '4', city: 'Chennai', action: 'I will have one vegetarian day every week', displayName: 'Clean Peacock', supportCount: 31, timestamp: new Date().toISOString(), isDemo: true },
    { id: '5', city: 'Hyderabad', action: 'I will reduce AC usage by 2 hours daily', displayName: 'Leaf Tiger', supportCount: 9, timestamp: new Date().toISOString(), isDemo: true },
  ]
  return city ? pledges.filter((p) => p.city === city) : pledges
}

/**
 * Returns mock leaderboard data when Firebase is not configured.
 * @returns {Array}
 */
function getMockLeaderboard() {
  return [
    { rank: 1, displayName: 'Green Sparrow', city: 'Bengaluru', weeklyScore: 94, isDemo: true },
    { rank: 2, displayName: 'Eco Lotus', city: 'Mumbai', weeklyScore: 88, isDemo: true },
    { rank: 3, displayName: 'Solar Banyan', city: 'Chennai', weeklyScore: 82, isDemo: true },
    { rank: 4, displayName: 'Clean Peacock', city: 'Hyderabad', weeklyScore: 77, isDemo: true },
    { rank: 5, displayName: 'Leaf Tiger', city: 'Pune', weeklyScore: 71, isDemo: true },
    { rank: 6, displayName: 'Sky Neem', city: 'Jaipur', weeklyScore: 68, isDemo: true },
    { rank: 7, displayName: 'River Mango', city: 'Kolkata', weeklyScore: 63, isDemo: true },
  ]
}
