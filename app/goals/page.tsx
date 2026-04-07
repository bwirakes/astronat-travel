import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GoalsClient from './GoalsClient';
import Image from 'next/image';
import ThemeToggle from '../components/ThemeToggle';
import DashboardLayout from '../components/DashboardLayout';


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
    <DashboardLayout title="What are you seeking?" kicker="PERSONALIZATION" backLabel="Home">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Your goals shape every reading. Select up to 3.
        </p>


      <GoalsClient userId={userId} initialGoals={initialGoals} />
      </div>
    </DashboardLayout>
  );
}
