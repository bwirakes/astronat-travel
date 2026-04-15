import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface FooterProps {
  variant?: 'default' | 'b2b';
}

export default function Footer({ variant = 'default' }: FooterProps) {
  const isB2b = variant === 'b2b';

  return (
    <footer className="bg-[var(--bg)] py-16 md:py-24 text-[var(--text-primary)] border-t border-[var(--surface-border)] overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto w-full px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 text-[var(--text-primary)] mb-16 relative">
          
          {/* Logo / Description */}
          <div className="flex flex-col">
            <div className="mb-6">
               <Image 
                 src="/logo-stacked.svg" 
                 alt="Astro Nat Logo" 
                 width={130} 
                 height={44} 
                 className="onboarding-logo" 
               />
            </div>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed max-w-[240px]">
              {isB2b 
                ? 'Corporate intelligence & relocation strategy for founders and global organisations. Based in Singapore.'
                : 'Locational intelligence for the analytical and the unmoored. Based in Singapore.'}
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h5 className="font-mono text-[9px] uppercase tracking-[0.2em] mb-5 font-semibold text-[var(--color-acqua)]">
              Services
            </h5>
            <ul className="space-y-4 text-xs text-[var(--text-secondary)]">
              <li><Link href="/b2b" className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2">Corporate Intelligence</Link></li>
              <li><Link href="/geodetic" className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2">Geodetic Astrology</Link></li>
              <li><Link href="/map-from-home" className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2">Map From Home</Link></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h5 className="font-mono text-[9px] uppercase tracking-[0.2em] mb-5 font-semibold text-[var(--color-acqua)]">Connect</h5>
            <div className="flex gap-5 text-[var(--text-secondary)]">
              <a href="https://www.tiktok.com/@astronatofficial" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] cursor-pointer transition-all inline-flex items-center">
                 <Image src="/icons/tiktok.svg" alt="TikTok" width={18} height={18} className="onboarding-logo opacity-80 hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://www.instagram.com/astronatofficial/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] cursor-pointer transition-all inline-flex items-center">
                 <Image src="/icons/instagram.svg" alt="Instagram" width={18} height={18} className="onboarding-logo opacity-80 hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
          
        </div>
        
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[var(--surface-border)] pt-8 font-mono text-[8px] uppercase tracking-widest text-[var(--text-tertiary)] relative z-10">
          <div>© {new Date().getFullYear()} AstroNat. All rights reserved.</div>
          <div className="flex gap-6 text-[var(--text-secondary)]">
             <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
