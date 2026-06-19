import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore'

// Firebase configuration - these values are automatically populated by Firebase Console
// when deploying to Firebase Hosting
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Firestore helper functions
export async function saveRecordsToFirestore(userKey, recordsByDay) {
  try {
    const docRef = doc(db, 'users', userKey, 'records', 'data')
    await setDoc(docRef, {
      records: recordsByDay,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving to Firestore:', error)
    throw error
  }
}

export async function loadRecordsFromFirestore(userKey) {
  try {
    const docRef = doc(db, 'users', userKey, 'records', 'data')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().records || []
    }
    return []
  } catch (error) {
    console.error('Error loading from Firestore:', error)
    throw error
  }
}

export async function saveSessionToFirestore(userKey, session) {
  try {
    if (!session) {
      const docRef = doc(db, 'users', userKey, 'session', 'current')
      await setDoc(docRef, { session: null, lastUpdated: new Date().toISOString() })
      return
    }
    const docRef = doc(db, 'users', userKey, 'session', 'current')
    await setDoc(docRef, {
      session: {
        id: session.id,
        username: session.username,
        date: session.date,
        start: session.start
      },
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving session to Firestore:', error)
    throw error
  }
}

export async function loadSessionFromFirestore(userKey) {
  try {
    const docRef = doc(db, 'users', userKey, 'session', 'current')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists() && docSnap.data().session) {
      return docSnap.data().session
    }
    return null
  } catch (error) {
    console.error('Error loading session from Firestore:', error)
    throw error
  }
}

export async function clearSessionFromFirestore(userKey) {
  try {
    const docRef = doc(db, 'users', userKey, 'session', 'current')
    await setDoc(docRef, { session: null, lastUpdated: new Date().toISOString() })
  } catch (error) {
    console.error('Error clearing session from Firestore:', error)
    throw error
  }
}
