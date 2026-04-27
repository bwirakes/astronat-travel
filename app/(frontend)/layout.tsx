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
import { cn } from "@/lib/utils";

const cormorantUpright = Cormorant_Upright({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-primary-alt' });
const cormorantGaramond = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-garamond' });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], style: ['normal', 'italic'], variable: '--font-dm-sans' });
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-secondary-alt' });
const monigue = localFont({ src: '../../public/MoniguedemoRegular-gwlL1.otf', variable: '--font-monigue' });
const perfectlyNineties = localFont({ src: '../../public/perfectly-nineties-regular.otf', variable: '--font-perfectly-nineties' });
const garet = localFont({
  src: [
    {
      path: '../../public/Garet Book 300.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/Garet Heavy 850.ttf',
      weight: '850',
      style: 'normal',
    },
  ],
  variable: '--font-garet'
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const pinyonScript = Pinyon_Script({ subsets: ['latin'], weight: ['400'], variable: '--font-pinyon' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-ibm' });

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
      </head>
      <body>{children}</body>
    </html>
  );
}
