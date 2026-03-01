'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: 'github' | 'google') => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <span className="text-2xl font-bold text-white">AffiliateKit</span>
      </div>

      {/* Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm">
            Sign in to manage your affiliate programs
          </p>
        </div>

        <div className="space-y-3">
          {/* GitHub */}
          <button
            onClick={() => handleSignIn('github')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'github' ? (
              <Spinner />
            ) : (
              <GitHubIcon />
            )}
            Continue with GitHub
          </button>

          {/* Google */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <Spinner />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[
          { icon: '🎯', label: 'Track clicks' },
          { icon: '💰', label: 'Manage payouts' },
          { icon: '📊', label: 'Analytics' },
        ].map((f) => (
          <div key={f.label} className="text-sm">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-gray-500">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
