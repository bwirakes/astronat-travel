'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function DesignSystemPage() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
      <header style={{ marginBottom: 'var(--space-2xl)', borderBottom: '1px solid var(--surface-border)', paddingBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ filter: theme === 'dark' ? 'invert(1)' : 'none', marginBottom: 'var(--space-md)' }}>
            <Image src="/logo-stacked.svg" alt="Astro-Brand Logo" width={200} height={100} priority />
          </div>
          <button onClick={toggleTheme} className="btn btn-secondary" style={{ fontFamily: 'var(--font-mono)', borderRadius: '30px' }}>
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
        <h1>Astro-Brand Design System</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>Vibe Check: Elevated Editorial / 90s Aquarian</p>
      </header>

      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2>Color Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
          <ColorSwatch name="Charcoal" varName="--color-charcoal" hex="#1B1B1B" />
          <ColorSwatch name="Y2K Blue" varName="--color-y2k-blue" hex="#0456fb" />
          <ColorSwatch name="Acqua" varName="--color-acqua" hex="#CAF1F0" textColor="var(--color-charcoal)" />
          <ColorSwatch name="Black" varName="--color-black" hex="#000000" />
          <ColorSwatch name="Eggshell" varName="--color-eggshell" hex="#F8F5EC" textColor="var(--color-charcoal)" />
          <ColorSwatch name="Spiced Life" varName="--color-spiced-life" hex="#E67A7A" textColor="var(--color-charcoal)" />
          <ColorSwatch name="Neon Green" varName="--sage" hex="#00FD00" textColor="var(--color-charcoal)" />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '2px dotted var(--color-y2k-blue)', margin: 'var(--space-xl) 0' }} />

      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2>Typography Engines</h2>
        
        {/* Font Families */}
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ color: 'var(--y2k-blue)' }}>Primary / Display (--font-primary)</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>Asset: BETTER DAYS</p>
            <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: '4rem', textTransform: 'uppercase' }}>BETTER DAYS</h1>
          </div>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ color: 'var(--accent)' }}>Secondary / Serif (--font-secondary)</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>Asset: PERFECTLY NINETIES</p>
            <h2 style={{ fontFamily: 'var(--font-secondary)', fontSize: '3rem' }}>Perfectly Nineties</h2>
          </div>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ color: 'var(--sage)' }}>Body (--font-body)</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>Asset: GARET</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', maxWidth: '600px' }}>
              I'm baby tattooed humblebrag mustache vinyl la croix keytar 90's ascot vexillologist 8-bit dreamcatcher. Poutine VHS yr quinoa direct trade, live-edge fit tilde hexagon asymmetrical hashtag banh mi vibecession.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Display Alt 1 (--font-display-alt-1)</h4>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>Asset: MONIGUE</p>
              <p style={{ fontFamily: 'var(--font-display-alt-1)', fontSize: '2.5rem' }}>Monigue Typeface</p>
            </div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Display Alt 2 (--font-display-alt-2)</h4>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>Asset: SLOOP SCRIPT</p>
              <p style={{ fontFamily: 'var(--font-display-alt-2)', fontSize: '3.5rem' }}>Sloop Script</p>
            </div>
          </div>
        </div>

        {/* Semantic Hierarchy with Color Emphasis */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: 'var(--space-xl) 0' }} />
        
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Semantic Hierarchy & Emphasis</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
           <h1>H1 Heading Large <span style={{ color: 'var(--color-y2k-blue)' }}>Emphasis</span></h1>
           <h2>H2 Heading Medium <span style={{ color: 'var(--color-spiced-life)' }}>Emphasis</span></h2>
           <h3>H3 Heading Small <span style={{ color: 'var(--sage)' }}>Emphasis</span></h3>
           <h4 style={{ fontSize: '1.1rem' }}>H4 UPPERCASE KICKER <span style={{ color: 'var(--color-acqua)' }}>EMPHASIS</span></h4>
           <h5 style={{ fontSize: '0.9rem' }}>H5 SMALL KICKER <span style={{ color: 'var(--gold)' }}>EMPHASIS</span></h5>
           <h6 style={{ fontSize: '0.75rem' }}>H6 MICRO TEXT</h6>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '4px double var(--color-spiced-life)', margin: 'var(--space-xl) 0' }} />

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>Identity SVG Avatars</h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>Vector assets extracted from public/brand/EXPORTS/SVG/AVATAR</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-black)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
            <Image src="/avatar/logo-stacked.svg" alt="Stacked Logo" width={80} height={80} style={{ filter: theme === 'dark' ? 'invert(1)' : 'invert(1)' }}/>
          </div>
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-black)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
            <Image src="/avatar/saturn-monogram.svg" alt="Saturn Monogram" width={80} height={80} style={{ filter: theme === 'dark' ? 'invert(1)' : 'invert(1)' }}/>
          </div>
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-black)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
            <Image src="/avatar/saturn-o-stars.svg" alt="Saturn O Stars" width={80} height={80} style={{ filter: theme === 'dark' ? 'invert(1)' : 'invert(1)' }}/>
          </div>
          <div style={{ padding: 'var(--space-md)', background: 'var(--color-black)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
            <Image src="/avatar/saturn-o.svg" alt="Saturn O" width={80} height={80} style={{ filter: theme === 'dark' ? 'invert(1)' : 'invert(1)' }}/>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: 'var(--space-xl) 0' }} />

      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '4.5rem', marginBottom: 'var(--space-lg)' }}>PHOTO VISUALS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
          <div style={{ position: 'relative', height: '400px' }}>
             <Image src="/pastel_suits.png" alt="Editorial Fashion" fill style={{ objectFit: 'cover' }} />
             <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '1rem', background: 'var(--color-black)', color: 'var(--color-eggshell)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Community | Aquarian</div>
          </div>
          <div style={{ position: 'relative', height: '400px' }}>
             <Image src="/girl_sunglasses.png" alt="Zebra Print" fill style={{ objectFit: 'cover' }} />
             <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '1rem', background: 'var(--color-y2k-blue)', color: 'var(--color-eggshell)', fontFamily: 'var(--font-primary)', fontSize: '1rem' }}>Creative Authority</div>
          </div>
          <div style={{ position: 'relative', height: '400px' }}>
             <Image src="/green_phone.png" alt="Neon Phone" fill style={{ objectFit: 'cover' }} />
             <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '1rem', background: 'var(--color-eggshell)', color: 'var(--color-black)', fontFamily: 'var(--font-display-alt-1)', fontSize: '1.2rem' }}>Calling The Future</div>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '5rem', letterSpacing: '4px', textAlign: 'center', marginBottom: 'var(--space-md)' }}>EBOOK</h2>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Demonstrating color differentiation across strategic assets
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <EbookConcept 
             title="ASTRO EBOOK" 
             imageSrc="/girl_sunglasses.png" 
             themeMode="eggshell" 
             scriptLetter="A"
          />
          <EbookConcept 
             title="SUBHEAD" 
             imageSrc="/green_phone.png" 
             themeMode="black" 
             scriptLetter="S"
          />
          <EbookConcept 
             title="EBOOK" 
             imageSrc="/pastel_suits.png" 
             themeMode="charcoal" 
             scriptLetter="E"
          />
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({ name, varName, hex, textColor = 'var(--color-eggshell)' }: { name: string, varName: string, hex: string, textColor?: string }) {
  return (
    <div style={{ 
      background: `var(${varName})`, 
      padding: 'var(--space-md)', 
      height: '140px', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'flex-end',
      color: textColor,
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
      border: `1px solid var(--surface-border)`
    }}>
      <strong style={{ marginBottom: '0.2rem' }}>{name}</strong>
      <span>{varName}</span>
      <span style={{ opacity: 0.7, marginTop: '0.2rem' }}>{hex}</span>
    </div>
  );
}

function EbookConcept({ title, imageSrc, themeMode, scriptLetter }: { title: string, imageSrc: string, themeMode: 'eggshell' | 'black' | 'charcoal', scriptLetter: string }) {
  const bg = themeMode === 'eggshell' ? 'var(--color-eggshell)' : themeMode === 'charcoal' ? 'var(--color-charcoal)' : 'var(--color-black)';
  const color = themeMode === 'eggshell' ? 'var(--color-charcoal)' : 'var(--color-eggshell)';
  
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '320px', height: '520px', backgroundColor: bg, color: color, padding: 'var(--space-lg)', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', textTransform: 'uppercase', marginBottom: 'var(--space-md)', opacity: 0.7, color: 'inherit' }}>ebook for<br/>career astrologer</p>
      
      {/* Blob/Organic image shape seen in the screenshot */}
      <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', overflow: 'hidden', marginBottom: 'var(--space-md)', flexShrink: 0 }}>
        <Image src={imageSrc} alt="Editorial Concept" fill style={{ objectFit: 'cover' }} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display-alt-1)', fontSize: '2.5rem', lineHeight: '1', position: 'relative', zIndex: 2, color: 'inherit' }}>
        {title}
      </h3>
      
      {/* Decorative overlapping script element */}
      <div style={{ position: 'absolute', top: '55%', right: '-10%', fontFamily: 'var(--font-display-alt-2)', fontSize: '10rem', color: 'var(--color-y2k-blue)', opacity: 0.9, zIndex: 1, lineHeight: '0.5' }}>
        {scriptLetter}
      </div>
      
      {/* Bottom Content Container pushed safely to the bottom */}
      <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.8, color: 'inherit', margin: 0 }}>
          Midheaven outlook guide
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ border: `1px solid ${color}`, borderRadius: '20px', padding: '0.3rem 0.8rem', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'inherit' }}>1ST</span>
          <span style={{ backgroundColor: 'var(--color-y2k-blue)', color: 'white', border: 'none', borderRadius: '20px', padding: '0.3rem 0.8rem', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>MC RULER</span>
          <span style={{ border: `1px solid ${color}`, borderRadius: '20px', padding: '0.3rem 0.8rem', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'inherit' }}>SUN</span>
        </div>
      </div>
    </div>
  );
}
