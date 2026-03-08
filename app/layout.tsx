import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syncopate:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
