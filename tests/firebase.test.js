import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

// Mock Firebase SDK
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'test-uid', isAnonymous: false },
  })),
  signInAnonymously: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(() => ({
    exists: () => true,
    data: () => ({
      settings: { language: 'ta', city: 'Chennai', name: 'Aaditya' }
    })
  })),
  getDocs: vi.fn(() => ({
    docs: [
      { data: () => ({ id: 101, category: 'commute', value: 'metro', co2Impact: 0.2 }) }
    ]
  })),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(),
  })),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn(),
  serverTimestamp: vi.fn(),
}))

describe('Firebase data sync and restore tests', () => {
  beforeEach(() => {
    // Set up required env vars for Firebase config check
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-key'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project'
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-sender'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'mock-app'
  })

  it('syncUserDataToFirestore reads from Dexie and calls Firestore setDoc', async () => {
    const { syncUserDataToFirestore } = await import('../lib/firebase')
    const { putSetting } = await import('../lib/db')

    await putSetting('language', 'hi')
    await putSetting('city', 'Delhi')

    const success = await syncUserDataToFirestore()
    expect(success).toBe(true)
  })

  it('restoreUserDataFromFirestore fetches from Firestore and writes to Dexie', async () => {
    const { restoreUserDataFromFirestore } = await import('../lib/firebase')
    const { getSetting } = await import('../lib/db')

    const restored = await restoreUserDataFromFirestore('test-uid')
    expect(restored).toBe(true)

    const lang = await getSetting('language')
    const city = await getSetting('city')
    const name = await getSetting('name')

    expect(lang).toBe('ta')
    expect(city).toBe('Chennai')
    expect(name).toBe('Aaditya')
  })
})
