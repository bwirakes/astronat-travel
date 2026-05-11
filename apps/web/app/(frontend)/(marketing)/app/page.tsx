"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { X, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AnnouncementBar from "@/app/components/marketing/AnnouncementBar";
import {
  HeroSection,
  PressStrip,
  StatsStrip,
  SplitContent,
  ProcessTimeline,
  InstagramReels,
  StatementBand,
  CardGrid,
  CtaBand,
  FeatureCarousel,
  FounderSection,
} from "@/app/components/marketing/shared/blocks/UniversalBlocks";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AppLanding() {
  const container = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: "#pricing-section",
      start: "top center",
      once: true,
      onEnter: () => {
        setShowPopup(true);
      },
    });

    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);
  }, { scope: container });

  useEffect(() => {
    if (showPopup && popupRef.current) {
      gsap.fromTo(popupRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)" }
      );
    }
  }, [showPopup]);

  // ── 1. Hero — Full Bleed ────────────────────────────────────────────────
  const heroBlock = {
    layout: "fullbleed",
    kicker: "ASTROCARTOGRAPHY APP · 700+ TRAVELERS GUIDED",
    kickerColor: "y2k-blue",
    titleHtml: "WHERE IN THE WORLD<br/><em style=\"font-family: var(--font-display-alt-2); font-style:italic; text-transform:none; color: var(--color-y2k-blue); font-size:0.82em\">are you</em><br/>MEANT TO BE?",
    subtitle: "Stop guessing your next move. Turn your birth chart into a precision travel map in seconds.",
    primaryCta: {
      label: user ? "Open the App →" : "Get My Free Reading →",
      href: user ? "/dashboard" : "/flow",
    },
    secondaryCta: { label: "See How It Works", href: "#how-it-works" },
    heroImage: { url: "/mobile-chart.png", alt: "AstroNat Chart Mobile" },
  };

  const pressBlock = {
    kicker: "The methodology that went viral — as seen in",
    viralNote: "AstroNat's geopolitical prediction called the Iran–Israel conflict 3 weeks early. 2.1M people watched.",
    publications: [
      {
        name: "The Economic Times",
        href: "https://economictimes.indiatimes.com/magazines/panache/iran-israel-war-astrologers-video-on-middle-east-being-a-hotbed-goes-viral/articleshow/128914429.cms",
        blurb: "Astrologer's video on the Middle East goes viral",
        logoUrl: "/press/economic_times.svg",
      },
      {
        name: "News18",
        href: "https://www.news18.com/viral/could-india-pakistan-be-next-travel-astrologer-who-predicted-iran-israel-war-issues-new-warnings-in-viral-video-9944607.html",
        blurb: "Travel astrologer issues new geopolitical warnings",
        logoUrl: "/press/news18.svg",
      },
      {
        name: "TripZilla",
        href: "https://www.tripzilla.com/singaporean-travel-astrologer-predicts-middle-east-conflict/26484",
        blurb: "Singaporean astrologer predicts Middle East conflict",
        logoUrl: "/press/tripzilla.svg",
      },
    ],
  };

  // ── 3. How the App Works (Feature Carousel) ────────────────────────────
  const howItWorksBlock = {
    kicker: "How the App Works",
    anchorId: "how-it-works",
    headingHtml: "THE SCIENCE<br/><em style=\"font-family:var(--font-display-alt-2);font-style:italic;text-transform:none;color:var(--color-spiced-life);font-size:0.85em\">behind</em><br/>THE MAGIC",
    tabs: [
      {
        id: "natal",
        label: "Cosmic Blueprint",
        title: "Your Cosmic DNA",
        desc: "Your birth data computed to the minute. The app maps your exact planetary blueprint before any city is analyzed.",
        ctaLabel: "Explore the Science",
        ctaHref: "/learn"
      },
      {
        id: "acg",
        label: "Astrocartography",
        title: "Lines That Find You",
        desc: "Every city on Earth scored against your natal chart. The app reveals exactly where your planetary energy is most active.",
        ctaLabel: "See The Map",
        ctaHref: "/flow"
      },
      {
        id: "geodetic",
        label: "Geodetic Zones",
        title: "Foundational Energy",
        desc: "Discover the permanent zodiacal energies anchoring your chosen locations based on the world's longitudinal bands.",
        ctaLabel: "Learn Geodetics",
        ctaHref: "/learn"
      },
      {
        id: "transit",
        label: "Transit Windows",
        title: "Your Optimal Window",
        desc: "Not just where — but when. Understand your 12-month transit forecast to know the best time to make your move.",
        ctaLabel: "Check Timing",
        ctaHref: "/flow"
      }
    ]
  };

  const statsStripBlock = {
    columns: "4",
    stats: [
      { n: "700+", label: "Cities mapped" },
      { n: "847", label: "calcs / reading" },
      { n: "26", label: "Countries covered" },
      { n: "4.3M+", label: "Content views" },
    ]
  };

  // ── 5. Instagram Reels ─────────────────────────────────────────────
  const instagramBlock = {
    kicker: "4.3M+ combined views · Follow The Journey",
    heading: "THE OFFICIAL FEED",
    profileHref: "https://www.instagram.com/astronatofficial/",
    reels: [
      {
        caption: "The Middle East predicted — watch what astrocartography actually reveals about geopolitical hotbeds.",
        href: "https://www.instagram.com/astronatofficial/",
        image: "/reels/reel1.gif",
        views: "2.1M views",
      },
      {
        caption: "Your Jupiter line is the upgrade you didn't know you needed. Here's what moving to it actually does.",
        href: "https://www.instagram.com/astronatofficial/",
        image: "/reels/reel2.gif",
        views: "890K views",
      },
      {
        caption: "Venus line vs. Sun line — tested both. Honest results after 6 months living the data.",
        href: "https://www.instagram.com/astronatofficial/",
        image: "/reels/reel3.gif",
        views: "1.3M views",
      },
    ],
  };

  // ── 6. Testimonials — Headspace Style ────────────────────────────────
  const testimonialBlock = {
    variant: "testimonial-floating",
    heading: "Travelers are enjoying more aligned and fulfilling lives",
    quotes: [
      {
        body: "I appreciate the consistent reminders that my chart supports specific energetic shifts. AstroNat helped me find a daily space where I feel calmer.",
        author: "Priya S.",
        meta: "Dubai → Lisbon via AstroNat",
        signs: "Leo Sun · Taurus Moon · Capricorn Rising",
      },
      {
        body: "AstroNat helped me begin the process of stepping back from toxic thinking by showing me where my energy was being drained. It changed the relationship I have with myself.",
        author: "James T.",
        meta: "Sydney → Barcelona via AstroNat",
        signs: "Scorpio Sun · Aquarius Moon · Virgo Rising",
      },
      {
        body: "The location strategies allow me to work on an area of my life that I have struggled with. I found the exact city where my Venus line is active.",
        author: "M.C.",
        meta: "Los Angeles via AstroNat",
        signs: "Pisces Sun · Aries Moon · Gemini Rising",
      },
    ],
  };

  // ── 7. Scarcity Band ──────────────────────────────────────────────
  const scarcityBlock = {
    variant: "scarcity-hero",
    spotsLeft: 13,
    totalSpots: 100,
    heading: "FOUNDER'S CLUB",
    subheading: "One payment. Every feature. Forever.",
    body: "100 lifetime spots — ever. Lock in today's price and get access to every feature the app builds from here. 87 founders are already in.",
    ctaLabel: "Secure My Lifetime Spot →",
    ctaHref: "/flow",
    guarantee: "30-day guarantee — love your reading or get a full refund. No questions.",
  };

  // ── 8. Pricing Grid ────────────────────────────────────────────────
  const pricingBlock = {
    variant: "pricing",
    sectionBg: "eggshell",
    anchorId: "pricing-section",
    kicker: "App Plans",
    heading: "YOUR ACCESS",
    columns: "3",
    cards: [
      {
        tier: "START HERE",
        title: "Single Reading",
        tagline: "Try it risk-free. One full city breakdown, right now.",
        price: "$9.97",
        includes: [
          "1 Full City Report",
          "Planetary line analysis",
          "Geodetic alignments",
          "Dominant planetary themes",
        ],
        ctaLabel: "Start My Reading",
        ctaHref: "/flow",
        primary: false,
        badge: "Risk-free entry",
      },
      {
        tier: "MOST POPULAR",
        title: "Explorer Pass",
        tagline: "Unlimited cities. Always on. Built for travelers who never stop moving.",
        price: "$19.97/mo",
        includes: [
          "Unlimited City Reports",
          "12-Month Transit Forecasts",
          "Save Favourite Locations",
          "Mundane Astrology Hub",
          "Chosen by 63% of members",
        ],
        ctaLabel: "Start Exploring",
        ctaHref: "/flow",
        primary: true,
        glyph: "☾",
      },
      {
        tier: "LIFETIME — 13 SPOTS LEFT",
        title: "Founder's Club",
        tagline: "One payment. Every feature the app ever builds. You're in forever.",
        price: "$397.97",
        includes: [
          "Lifetime Unlimited Cities",
          "All future features — included",
          "Private Notion Resource Hub",
          "Priority Support",
          "Price locked in forever",
        ],
        ctaLabel: "Secure My Spot",
        ctaHref: "/flow",
        primary: false,
        glyph: "♄",
        urgencyNote: "Only 13 of 100 spots left",
      },
    ],
  };

  // ── 9. Founder Section ───────────────────────────────────────────────
  const founderBlock = {
    founderImage: "/nat-1.jpg",
    founderName: "NATALIA H.",
    founderTitle: "Astrocartographer & Traveler",
    bio: "Natalia built AstroNat after years of consulting clients on location-based astrology. Her viral geopolitical predictions—watched by 2.1M people—are the result of one core belief: the stars don't lie about geography.",
    bio2: "The app runs the same methodology she uses with private clients — 847 calculations, every city on Earth, built for the traveler who wants to stop guessing and start living aligned.",
  };

  // ── 10. Bottom CTA Band ─────────────────────────────────────────────
  const ctaBlock = {
    layout: "cta-cards",
    kicker: "READY TO READ YOUR MAP?",
    headingHtml: "THE WORLD<br/><span style=\"font-family:var(--font-display-alt-2);font-style:italic;text-transform:none;color:var(--color-spiced-life)\">is waiting</span><br/>FOR YOU",
    body: "Join 700+ travelers who used the app to find the exact locations where their energy comes alive.",
    primaryCard: {
      kicker: "Start for free",
      titleHtml: "Get My Free<br/>City Reading",
      href: user ? "/dashboard" : "/flow",
    },
    secondaryCards: [
      { kicker: "Learn the science", titleHtml: "Astro 101", href: "/learn" },
      { kicker: "Explore the map", titleHtml: "The Guide", href: "/learn/houses" },
    ],
  };

  return (
    <div ref={container} className="bg-[var(--bg)] min-h-screen">
      {/* ── Sticky Urgency Banner ──────────────────────────────────── */}
      <AnnouncementBar />

      <Navbar />

      <main>
        <HeroSection block={heroBlock} />
        <PressStrip block={pressBlock} />
        <FeatureCarousel block={howItWorksBlock} />
        <StatsStrip block={statsStripBlock} />
        <InstagramReels block={instagramBlock} />
        <StatementBand block={testimonialBlock} />
        <StatementBand block={scarcityBlock} />
        <CardGrid block={pricingBlock} />
        <FounderSection block={founderBlock} />
        <CtaBand block={ctaBlock} />
      </main>

      <Footer />

      {/* Scroll-Triggered Lead Capture Popup */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-50 p-1" ref={popupRef}>
          <div className="bg-[var(--color-charcoal)] text-[var(--color-eggshell)] p-6 md:p-8 shadow-2xl relative max-w-sm border border-white/10">
            <button
              onClick={() => {
                gsap.to(popupRef.current, { y: 20, opacity: 0, duration: 0.3, onComplete: () => setShowPopup(false) });
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              aria-label="Close popup"
            >
              <X size={16} />
            </button>

            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill="var(--color-acqua)" strokeWidth={0} />
              ))}
              <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-acqua)] ml-2 opacity-70">
                700+ travelers guided
              </span>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-acqua)] mb-2 opacity-70">
              Before you go...
            </div>
            <h4 className="font-primary uppercase text-2xl leading-tight mb-3 text-[var(--color-eggshell)]">
              YOUR FIRST<br/>READING IS FREE.
            </h4>
            <p className="text-sm opacity-70 mb-6 font-body leading-relaxed">
              Enter any city. Get your full planetary breakdown — no credit card, no commitment.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-acqua)] transition-colors"
              />
              <button className="w-full bg-[var(--color-y2k-blue)] text-white px-4 py-3 font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Claim My Free Reading <ArrowRight size={12} />
              </button>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-widest opacity-30 mt-4 text-center">
              Unsubscribe anytime. No spam, ever.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
