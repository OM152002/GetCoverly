// components/AuthForm.tsx
'use client'

import { useState } from 'react'
import { loginWithEmail, loginWithGoogle, signUpWithEmail } from '../lib/auth'

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Extra profile fields (signup only)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [cityStateZip, setCityStateZip] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        // basic soft validation
        if (!fullName || !address || !cityStateZip || !phone) {
          throw new Error('Please fill all profile fields.')
        }
        await signUpWithEmail(email, password, { fullName, address, cityStateZip, phone })
      } else {
        await loginWithEmail(email, password)
      }
      // success — you can redirect if you want
      // router.push('/') or close modal etc.
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const onGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle()
      // redirect if you want
    } catch (err: any) {
      setError(err.message ?? 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black rounded-xl p-6 shadow">
      <h2 className="text-2xl font-bold mb-4">
        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                className="w-full border rounded-md p-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                className="w-full border rounded-md p-2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City, State, ZIP</label>
              <input
                className="w-full border rounded-md p-2"
                value={cityStateZip}
                onChange={(e) => setCityStateZip(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                className="w-full border rounded-md p-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-md py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px bg-gray-300 flex-1" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px bg-gray-300 flex-1" />
      </div>

      <button
        onClick={onGoogle}
        disabled={loading}
        className="w-full border rounded-md py-2 font-semibold disabled:opacity-60"
      >
        Continue with Google
      </button>

      <p className="text-sm text-gray-600 mt-4">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          className="text-blue-600 underline"
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        >
          {mode === 'signup' ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  )
}
