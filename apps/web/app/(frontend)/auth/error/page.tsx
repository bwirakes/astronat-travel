import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Sign-in link expired — Astronat',
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--color-charcoal)' }}>
      <div className="card w-full max-w-[420px] flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
        <div className="mb-8 block">
          <Image src="/saturn-o-stars.svg" alt="Saturn Monogram" width={48} height={48} className="onboarding-logo" />
        </div>

        <h1
          className="uppercase mb-4"
          style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.9, color: 'var(--text-primary)' }}
        >
          Link<br />expired.
        </h1>

        <p className="mb-8" style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          That sign-in link couldn't be used. Magic links expire quickly, and some
          email scanners consume them before you click. Try again, or use Google
          for instant access.
        </p>

        <Link href="/login" className="btn btn-primary w-full justify-center mb-3" style={{ height: '54px' }}>
          Back to sign in
        </Link>

        <Link href="/flow" className="btn btn-secondary w-full justify-center">
          Start a new account
        </Link>
      </div>
    </div>
  )
}
