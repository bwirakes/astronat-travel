import type { Metadata } from "next";
import "./globals.css";
import { 
    Cormorant_Upright, 
    Libre_Baskerville, 
    Manrope, 
    Pinyon_Script, 
    IBM_Plex_Mono 
} from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const cormorantUpright = Cormorant_Upright({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-primary-alt' });
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-secondary-alt' });
const monigue = localFont({ src: '../public/MoniguedemoRegular-gwlL1.otf', variable: '--font-monigue' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const pinyonScript = Pinyon_Script({ subsets: ['latin'], weight: ['400'], variable: '--font-pinyon' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-ibm' });

export const metadata: Metadata = {
  title: "Astro Nat — Starman Odyssey",
  description: "Plan your travel by the stars. Astrocartography and locational astrology for the modern voyager.",
  keywords: "astrokea, travel, astrology, astrocartography, natal chart, cosmic planning",
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
        libreBaskerville.variable,
        monigue.variable,
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
