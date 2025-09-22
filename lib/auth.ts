// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from 'firebase/auth'
import { auth, googleProvider, db } from './firebase'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

export type UserProfile = {
  fullName: string
  address: string
  cityStateZip: string
  phone: string
}

async function upsertUserDoc(uid: string, data: Partial<UserProfile & { email: string }>) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
  }
  await setDoc(ref, payload, { merge: true })
}

export async function signUpWithEmail(
  email: string,
  password: string,
  profile: UserProfile
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await upsertUserDoc(cred.user.uid, { email, ...profile })
  return cred.user
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  // make sure we at least have a user doc with email
  await upsertUserDoc(cred.user.uid, { email: cred.user.email ?? email })
  return cred.user
}

export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider)
  const user = cred.user
  await upsertUserDoc(user.uid, { email: user.email ?? '' })
  return user
}
