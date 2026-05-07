"use client"

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

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
  // Reject "/" — that's the marketing root; authenticated users belong on
  // /dashboard, not the public landing page.
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw === "/") return "/dashboard"
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
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_date')
        .eq('id', user.id)
        .maybeSingle()
      if (!profile?.birth_date) {
        window.location.href = '/flow?step=1'
        return
      }
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
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row w-full bg-[var(--bg)]">
      {/* Left Section - Branding/Visuals */}
      <div className="relative hidden lg:flex flex-1 lg:w-1/2 flex-col justify-between items-center overflow-hidden bg-[var(--bg)] p-12 xl:p-16 border-r border-[var(--surface-border)]">
        
        {/* Centerpiece: Logo and Quote */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center w-full max-w-md px-6">
           <Image src="/logo-stacked.svg" alt="AstroNat" width={200} height={100} className="app-brand-logo opacity-90 w-36 md:w-48 h-auto mb-10" />
           
           <blockquote className="font-secondary italic text-[1.1rem] md:text-[1.25rem] leading-snug text-[var(--text-primary)] mb-5 text-center">
             &ldquo;The location strategies allow me to work on an area of my life that I have struggled with. I found the exact city where my Venus line is active.&rdquo;
           </blockquote>
           <div className="flex flex-col items-center justify-center text-center">
             <div className="font-body font-semibold text-xs text-[var(--text-primary)]">M.C.</div>
             <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mt-1">
               Los Angeles via AstroNat
             </div>
           </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,700px)] h-[min(90vw,700px)] opacity-[0.04] pointer-events-none animate-[spin_120s_linear_infinite] z-0">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
            <circle cx="100" cy="100" r="96" stroke="var(--text-primary)" strokeWidth=".5"/>
            <ellipse cx="100" cy="100" rx="56" ry="96" stroke="var(--text-primary)" strokeWidth=".4"/>
            <ellipse cx="100" cy="100" rx="96" ry="28" stroke="var(--text-primary)" strokeWidth=".3"/>
            <line x1="4" y1="100" x2="196" y2="100" stroke="var(--text-primary)" strokeWidth=".3"/>
            <line x1="100" y1="4" x2="100" y2="196" stroke="var(--text-primary)" strokeWidth=".3"/>
          </svg>
        </div>

        <style>{`
          @keyframes auth-float { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-15px) rotate(4deg)} }
          @keyframes auth-float-slow { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-10px) rotate(-3deg)} }
          .auth-float { animation: auth-float 5s ease-in-out infinite; }
          .auth-float-slow { animation: auth-float-slow 7s ease-in-out infinite; }
        `}</style>

        {/* Saturn — top left */}
        <div className="absolute top-[20%] left-[15%] w-24 h-24 auth-float opacity-80 z-20 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="var(--color-y2k-blue)" strokeWidth="1.5"/>
            <ellipse cx="50" cy="50" rx="34" ry="9" transform="rotate(-18 50 50)" stroke="var(--color-y2k-blue)" strokeWidth="1" strokeDasharray="4 2"/>
            <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--color-y2k-blue)" textAnchor="middle">♄</text>
          </svg>
        </div>

        {/* Jupiter - bottom right */}
        <div className="absolute bottom-[25%] right-[20%] w-20 h-20 auth-float-slow opacity-80 z-20 pointer-events-none" style={{animationDelay:"-2s"}}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="var(--color-spiced-life)" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="38" stroke="var(--color-spiced-life)" strokeWidth="1" strokeDasharray="2 4"/>
            <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--color-spiced-life)" textAnchor="middle">♃</text>
          </svg>
        </div>

        {/* Moon - top right */}
        <div className="absolute top-[30%] right-[15%] w-20 h-20 auth-float opacity-75 z-20 pointer-events-none" style={{animationDelay:"-1.5s"}}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="var(--color-acqua)" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="38" fill="var(--color-acqua)" opacity="0.1"/>
            <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--color-acqua)" textAnchor="middle">☽</text>
          </svg>
        </div>
        
        {/* Sun - bottom left */}
        <div className="absolute bottom-[20%] left-[20%] w-16 h-16 auth-float-slow z-20 pointer-events-none" style={{animationDelay:"-1s"}}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="var(--text-primary)" strokeWidth="1.5"/>
            <path d="M50 10 L50 90 M10 50 L90 50" stroke="var(--text-primary)" strokeWidth="1" strokeDasharray="2 6"/>
            <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--text-primary)" textAnchor="middle">☉</text>
            </svg>
        </div>

        {/* 4-point star decorations */}
        <div className="absolute top-[40%] left-[10%] text-[var(--gold)] text-3xl auth-float pointer-events-none z-20" style={{animationDelay:"-0.8s"}}>✦</div>
        <div className="absolute bottom-[35%] right-[15%] text-[var(--color-spiced-life)] text-xl auth-float-slow pointer-events-none z-20" style={{animationDelay:"-3s"}}>✦</div>



      </div>

      {/* Right Section - Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-[var(--surface)] overflow-y-auto">
        <div className="w-full max-w-[360px] flex flex-col relative z-10 py-6">
          
          <div className="mb-10 block">
            <Link href="/">
              <Image 
                src="/saturn-o-stars.svg" 
                alt="Saturn Monogram" 
                width={48} 
                height={48} 
                className="onboarding-logo hover:opacity-80 transition-opacity" 
              />
            </Link>
          </div>

          <h1 
            className="uppercase mb-8" 
            style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2.5rem, 4vw, 3rem)', lineHeight: 0.9, color: 'var(--text-primary)' }}
          >
            Welcome<br />back.
          </h1>

          <button 
            onClick={handleGoogleLogin} 
            className="w-full flex items-center justify-center gap-3 bg-[var(--text-primary)] text-[var(--bg)] px-4 py-4 font-body text-[14px] font-medium transition-all hover:opacity-90 mb-6"
          >
            <GoogleIcon className="w-5 h-5 bg-white rounded-full p-0.5 shrink-0" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
            <span className="uppercase text-[10px] tracking-[0.15em] text-[#AAAAAA]" style={{ fontFamily: 'var(--font-mono)' }}>or</span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
          </div>

          <form onSubmit={handlePasswordLogin} className="flex flex-col">
            <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nat@astronat.com"
              autoComplete="email"
              className="w-full bg-[var(--bg)] border border-[var(--surface-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-y2k-blue)] transition-colors mb-4 placeholder:opacity-40"
              style={{ color: 'var(--text-primary)' }}
            />
            <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-[var(--bg)] border border-[var(--surface-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-y2k-blue)] transition-colors mb-8 placeholder:opacity-40"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="w-full bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-4 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)] disabled:opacity-50 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={handleMagicLink}
              className="w-full border border-[var(--surface-border)] bg-transparent text-[var(--text-primary)] px-4 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--bg-raised)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !email}
            >
              {loading ? 'Sending…' : 'Send magic link instead'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
            <span className="uppercase text-[10px] tracking-[0.15em] text-[#AAAAAA]" style={{ fontFamily: 'var(--font-mono)' }}>dev</span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
          </div>

          <button 
            onClick={handleDemoLogin} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 transition-colors hover:bg-[var(--color-y2k-blue)] hover:text-white"
            style={{ 
              background: 'transparent', 
              border: '1px dashed var(--color-y2k-blue)',
              color: 'var(--color-y2k-blue)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}
            disabled={loading}
          >
            ⚡ Login as Test User
          </button>

          {message && (
            <div className="mt-4 p-4 text-sm text-center border bg-[var(--bg)]" style={{ borderColor: 'var(--surface-border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              {message}
            </div>
          )}

          <div className="mt-8 text-center pt-6 border-t border-[var(--surface-border)]">
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link href="/flow" className="underline hover:text-[var(--text-primary)] transition-colors" style={{ color: 'var(--color-y2k-blue)', textUnderlineOffset: '4px' }}>
                Sign up
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

