"use client";

import { type CountryChart } from "../../lib/mundane-charts";

export function MundaneCard({ country, onClick }: { country: CountryChart; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        clipPath: 'var(--cut-sm)',
        background: 'var(--surface)',
        border: '1px solid var(--surface-border)',
        padding: 'var(--space-md)',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s ease',
        display: 'block'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
        <span style={{ fontSize: '1.5rem' }}>{country.flag}</span>
        <div>
          <h4 style={{ 
            fontFamily: 'var(--font-secondary)', 
            fontSize: '1rem', 
            margin: 0,
            textTransform: 'uppercase',
            color: 'var(--text-primary)'
          }}>
            {country.name}
          </h4>
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.55rem', 
            color: 'var(--text-tertiary)', 
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {country.sunSign} Sun · Est. {new Date(country.founding).getFullYear()}
          </span>
        </div>
      </div>
      <p style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '0.5rem', 
        color: 'var(--text-tertiary)', 
        margin: 0,
        opacity: 0.7
      }}>
        {country.note}
      </p>
    </button>
  );
}
