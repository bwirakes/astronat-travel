'use client';

import { useState } from 'react';
import { Heart, Briefcase, Users, Clock, Sprout, Home, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const GOALS = [
  {
    key: 'love',
    icon: Heart,
    color: 'var(--color-spiced-life)',
    label: 'Love & Relationships',
    description: 'Venus lines + aspects, 5th/7th house cusp rulers',
    explainer: 'Focuses your reading on Venus and the 7th/5th houses. Activates specific travel windows for relationships.'
  },
  {
    key: 'career',
    icon: Briefcase,
    color: 'var(--color-y2k-blue)',
    label: 'Career & Ambition',
    description: 'MC lines, Saturn/Jupiter, 10th/6th house rulers',
    explainer: 'Weights your 10th and 6th houses higher. We look for Saturn/Jupiter structure and MC interactions.'
  },
  {
    key: 'community',
    icon: Users,
    color: 'var(--color-acqua)',
    label: 'Community & Friendships',
    description: 'Social planet transits, 11th/3rd house',
    explainer: 'Emphasizes social houses (11th and 3rd) and tracks transits that expand your social circle.'
  },
  {
    key: 'timing',
    icon: Clock,
    color: 'var(--gold)',
    label: 'Timing & Life Transitions',
    description: 'Active personal transits, profections, travel windows',
    explainer: 'Brings active personal transits to the forefront, focusing on *when* to travel rather than just *where*.'
  },
  {
    key: 'growth',
    icon: Sprout,
    color: 'var(--sage)',
    label: 'Personal Growth',
    description: 'Neptune/Jupiter, 9th/12th house',
    explainer: 'Highlights 9th and 12th house rulers, prioritizing internal evolution, spirituality, and distant journeys.'
  },
  {
    key: 'relocation',
    icon: Home,
    color: 'var(--gold)',
    label: 'Relocation / Living',
    description: 'IC lines, 4th house ruler, long-term patterns',
    explainer: 'Focuses heavily on the 4th house and IC lines for finding a permanent home or deep roots.'
  }
];

export default function GoalsClient({ userId, initialGoals }: { userId: string, initialGoals: string[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<string[]>(initialGoals);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const toggleGoal = (key: string) => {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, key]);
      }
    }
  };

  const saveGoals = async () => {
    setIsSaving(true);
    setToastMessage('');
    
    const { error } = await supabase
      .from('profiles')
      .update({ life_goals: selected })
      .eq('id', userId);
      
    setIsSaving(false);
    
    if (error) {
      setToastMessage('Error saving goals.');
    } else {
      setToastMessage('Goals saved');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <>
      <button onClick={() => router.push("/home")} style={{
        background: "none", border: "none", color: "var(--text-tertiary)",
        fontFamily: "var(--font-mono)", fontSize: "0.6rem", cursor: "pointer",
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "var(--space-md)",
        display: "flex", alignItems: "center", gap: "0.3rem",
      }}>
        <ArrowLeft size={12} /> Home
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-sm)'
      }}>
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.key);
          const Icon = goal.icon;
          return (
            <button
              key={goal.key}
              onClick={() => toggleGoal(goal.key)}
              style={{
                background: isSelected ? `color-mix(in srgb, ${goal.color} 12%, transparent)` : 'var(--surface)',
                border: `1px solid ${isSelected ? goal.color : 'var(--surface-border)'}`,
                borderRadius: isSelected ? 'var(--shape-asymmetric-md)' : 'var(--radius-sm)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '0.65rem 0.75rem',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                opacity: (!isSelected && selected.length >= 3) ? 0.3 : 1,
              }}
            >
              <Icon size={15} color={isSelected ? goal.color : 'var(--text-tertiary)'} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  marginBottom: '0.1rem'
                }}>
                  {goal.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.48rem',
                  color: isSelected ? goal.color : 'var(--text-tertiary)',
                  letterSpacing: '0.05em'
                }}>
                  {goal.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--space-md)', minHeight: '20px' }}>
        {selected.length === 3 && (
          <span style={{ color: 'var(--color-spiced-life)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            Max 3 goals selected. Deselect one to change your focus.
          </span>
        )}
      </div>

      {selected.length > 0 && (
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-md)',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <h4 style={{ marginBottom: 'var(--space-md)', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>How your goals shape your reading</h4>
          {selected.map((key) => {
            const goal = GOALS.find((g) => g.key === key);
            return goal ? (
              <div key={key} style={{ marginTop: 'var(--space-sm)' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: goal.color,
                  textTransform: 'uppercase'
                }}>
                  {goal.label}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0, lineHeight: 1.5 }}>
                  {goal.explainer}
                </p>
              </div>
            ) : null;
          })}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button
          className="btn btn-primary"
          style={{ borderRadius: 'var(--shape-asymmetric-md)' }}
          onClick={saveGoals}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save goals \u2192'}
        </button>
        {toastMessage && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--sage)' }}>
            {toastMessage}
          </span>
        )}
      </div>
    </>
  );
}
