"use client"

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function sanitizeNext(raw: string | null): string {
  // Only allow same-origin relative paths to avoid open-redirect.
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard"
  return raw
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = sanitizeNext(searchParams.get('next'))

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
        }
      },
    })
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoading(false)
      return
    }
    window.location.href = next
  }

  const handleMagicLink = async () => {
    if (!email) {
      setMessage('Enter your email first to get a magic link.')
      return
    }
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Check your email ✨')
    }
    setLoading(false)
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@astronat.local',
      password: 'astronat-test-2026'
    })

    if (error) {
      setMessage(`Demo Error: ${error.message}. Run: bun run scripts/create-test-user.ts`)
      setLoading(false)
      return
    }
    window.location.href = next
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--color-charcoal)' }}>
      <div className="card w-full max-w-[420px] flex flex-col relative" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
        
        <div className="mb-10 block">
          <Image 
            src="/saturn-o-stars.svg" 
            alt="Saturn Monogram" 
            width={48} 
            height={48} 
            className="onboarding-logo" 
          />
        </div>

        <h1 
          className="uppercase mb-8" 
          style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(3rem, 5vw, 3.5rem)', lineHeight: 0.9, color: 'var(--text-primary)' }}
        >
          Welcome<br />back.
        </h1>

        <button 
          onClick={handleGoogleLogin} 
          className="btn btn-primary w-full justify-center mb-6"
          style={{ height: '54px' }}
        >
          <GoogleIcon className="w-5 h-5 mr-2 bg-white rounded-full p-0.5" />
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
          <span className="uppercase text-[10px] tracking-[0.15em] text-[#AAAAAA]" style={{ fontFamily: 'var(--font-mono)' }}>or</span>
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
        </div>

        <form onSubmit={handlePasswordLogin} className="input-group">
          <label htmlFor="email" className="input-label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nat@astronat.com"
            autoComplete="email"
            className="input-field w-full mb-3"
          />
          <label htmlFor="password" className="input-label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="input-field w-full mb-3"
          />
          <button
            type="submit"
            className="btn btn-primary w-full justify-center mb-2"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={handleMagicLink}
            className="btn btn-secondary w-full justify-center"
            disabled={loading || !email}
          >
            {loading ? 'Sending…' : 'Send magic link instead'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
          <span className="uppercase text-[10px] tracking-[0.15em] text-[#AAAAAA]" style={{ fontFamily: 'var(--font-mono)' }}>dev</span>
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
        </div>

        <button 
          onClick={handleDemoLogin} 
          className="btn w-full justify-center"
          style={{ 
            height: '48px', 
            background: 'transparent', 
            border: '1px dashed var(--color-y2k-blue)',
            color: 'var(--color-y2k-blue)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.1em'
          }}
          disabled={loading}
        >
          ⚡ ENTER DEMO MODE (BYPASS)
        </button>

        {message && (
          <div className="mt-4 p-3 rounded-md text-sm text-center border" style={{ borderColor: 'var(--surface-border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
            {message}
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--surface-border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link href="/signup" className="underline hover:text-white transition-colors" style={{ color: 'var(--color-y2k-blue)' }}>
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
