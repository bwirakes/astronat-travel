import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GoalsClient from './GoalsClient';
import Image from 'next/image';
import ThemeToggle from '../components/ThemeToggle';

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const params = await searchParams;
  const isDemo = params.demo === 'true';

  let userId = 'demo-user';
  let initialGoals: string[] = [];

  if (!isDemo) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/flow');
    }

    userId = user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('life_goals')
      .eq('id', user.id)
      .single();

    initialGoals = profile?.life_goals || [];
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem clamp(1.25rem, 3vw, 3rem)",
        borderBottom: "1px solid var(--surface-border)",
        maxWidth: "1400px", width: "100%", margin: "0 auto",
      }}>
        <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority className="onboarding-logo" />
        <ThemeToggle />
      </header>

      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-2xl)' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0.3rem 0.8rem',
          border: '1px solid currentColor',
          borderRadius: '20px',
          marginBottom: 'var(--space-sm)'
        }}>
          PERSONALIZATION
        </div>
        <h1 style={{ fontFamily: 'var(--font-primary)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>
          What are you seeking?
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Your goals shape every reading. Select up to 3.
        </p>
      </div>

      <GoalsClient userId={userId} initialGoals={initialGoals} />
      </div>
    </div>
  );
}
