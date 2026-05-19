import type { Metadata, Viewport } from "next";
import "../globals.css";
import {
    Cormorant_Upright,
    Cormorant_Garamond,
    DM_Sans,
    Libre_Baskerville,
    Manrope,
    Pinyon_Script,
    IBM_Plex_Mono
} from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cn } from "@/lib/utils";
import { WebVitals } from "@/app/components/web-vitals";
import { AnalyticsIdentity } from "@/app/components/AnalyticsIdentity";

// Active body face — preloaded for first paint.
const garet = localFont({
  src: [
    { path: '../../public/Garet Book 300.ttf', weight: '300', style: 'normal' },
    { path: '../../public/Garet Heavy 850.ttf', weight: '850', style: 'normal' },
  ],
  variable: '--font-garet',
  display: 'swap',
  preload: true,
});

// Active primary heading face — preloaded for first paint.
const perfectlyNineties = localFont({
  src: '../../public/perfectly-nineties-regular.otf',
  variable: '--font-perfectly-nineties',
  display: 'swap',
  preload: true,
});

// Active fallback for primary/secondary serif — preloaded.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'swap',
  preload: true,
});

// Active body fallback — sans serif. Not preloaded; only fetched when Garet isn't applied.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
});

// Active mono face — sparingly used; on-demand load.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm',
  display: 'swap',
  preload: false,
});

// Decorative / display fonts — never above the fold; on-demand load.
const monigue = localFont({
  src: '../../public/MoniguedemoRegular-gwlL1.otf',
  variable: '--font-monigue',
  display: 'swap',
  preload: false,
});
const pinyonScript = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pinyon',
  display: 'swap',
  preload: false,
});

// Loaded but currently not referenced anywhere — kept for future use, no preload.
const cormorantUpright = Cormorant_Upright({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-primary-alt',
  display: 'swap',
  preload: false,
});
const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-secondary-alt',
  display: 'swap',
  preload: false,
});
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-manrope',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "AstroNat - Astrocartography, Locational Astrology & Mundane Astrology",
  description: "Plan your travel by the stars. Astrocartography and locational astrology for the modern voyager.",
  keywords: "astrokea, travel, astrology, astrocartography, natal chart, cosmic planning",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(
        "font-sans",
        cormorantUpright.variable,
        cormorantGaramond.variable,
        dmSans.variable,
        libreBaskerville.variable,
        monigue.variable,
        perfectlyNineties.variable,
        garet.variable,
        manrope.variable,
        pinyonScript.variable,
        ibmPlexMono.variable
    )}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <WebVitals />
        <AnalyticsIdentity />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
