"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import styles from "./navbar.module.css";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/app/components/ui/navigation-menu";

interface NavbarProps {
    activeHref?: string;
    /** Extra content for the right side (e.g. progress indicator) */
    centerContent?: React.ReactNode;
    /** Logo href — defaults to "/" */
    logoHref?: string;
    /** Hide login/dashboard links for landing pages */
    hideAuth?: boolean;
}

export default function Navbar({ activeHref, centerContent, logoHref = "/", hideAuth = false }: NavbarProps) {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };



    return (
        <nav className={styles.nav}>
            <div className={styles.navInner}>
                {/* Logo */}
                <Link href={logoHref} className={styles.logo} onClick={() => setOpen(false)}>
                    <Image
                        src="/logo-stacked.svg"
                        alt="Astro Nat Logo"
                        width={200}
                        height={68}
                        priority
                        className={styles.logoImg}
                    />
                </Link>

                {/* Center slot (e.g. flow progress) */}
                {centerContent && (
                    <div className={styles.center}>{centerContent}</div>
                )}

                {/* Desktop links */}
                <div className={styles.desktopRight}>
                    {!centerContent && (
                        <div className={styles.navLinks}>
                            <NavigationMenu>
                              <NavigationMenuList>
                                <NavigationMenuItem>
                                  <NavigationMenuTrigger className="!h-auto !p-0 !bg-transparent hover:!bg-transparent hover:text-[var(--text-primary)] font-body font-normal text-[0.85rem] text-[var(--text-secondary)] focus:!bg-transparent data-[state=open]:!bg-transparent data-[state=open]:text-[var(--text-primary)] outline-none ring-0 focus-visible:ring-0">Services</NavigationMenuTrigger>
                                  <NavigationMenuContent>
                                    <div className="pt-3">
                                      <ul className="grid w-[220px] gap-1 p-2 bg-[var(--bg)] border border-[var(--surface-border)] rounded-sm shadow-sm outline-none">
                                        <li>
                                          <NavigationMenuLink render={<Link href="/b2b" />} className="block select-none space-y-1 rounded-sm px-3 py-2 leading-none outline-none transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)] focus-visible:ring-0 text-[0.85rem]">
                                            B2B Corporate Intel
                                          </NavigationMenuLink>
                                        </li>
                                        <li>
                                          <NavigationMenuLink render={<Link href="/geodetic" />} className="block select-none space-y-1 rounded-sm px-3 py-2 leading-none outline-none transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)] focus-visible:ring-0 text-[0.85rem]">
                                            Geodetic Astrology
                                          </NavigationMenuLink>
                                        </li>
                                        <li>
                                          <NavigationMenuLink render={<Link href="/map-from-home" />} className="block select-none space-y-1 rounded-sm px-3 py-2 leading-none outline-none transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)] focus-visible:ring-0 text-[0.85rem]">
                                            Map From Home
                                          </NavigationMenuLink>
                                        </li>
                                      </ul>
                                    </div>
                                  </NavigationMenuContent>
                                </NavigationMenuItem>
                              </NavigationMenuList>
                            </NavigationMenu>

                        </div>
                    )}

                    <ThemeToggle />
                    
                    {!centerContent && (
                        <a
                            href="https://calendly.com/astronat/60min-acg-reading"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap outline-none"
                            style={{ borderRadius: "var(--shape-asymmetric-md)" }}
                        >
                            Book a Reading
                        </a>
                    )}
                    {/* Hamburger — only shown when no centerContent (full nav) */}
                    {!centerContent && (
                        <button
                            className={styles.hamburger}
                            onClick={() => setOpen((v) => !v)}
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                        >
                            {open ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile drawer */}
            {open && !centerContent && (
                <div className={styles.drawer}>
                    <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 px-4 py-2 mt-2 text-[var(--text-primary)]">Services</div>

                    <Link href="/b2b" className={styles.drawerLink} onClick={() => setOpen(false)}>B2B</Link>
                    <Link href="/geodetic" className={styles.drawerLink} onClick={() => setOpen(false)}>Geodetic</Link>
                    <Link href="/map-from-home" className={styles.drawerLink} onClick={() => setOpen(false)}>Map From Home</Link>

                    <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 px-4 py-2 mt-4 text-[var(--text-primary)]">Menu</div>
                    <div className="px-4 py-3 mt-2 mb-2">
                        <a
                            href="https://calendly.com/astronat/60min-acg-reading"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.15em] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] block text-center outline-none"
                            style={{ borderRadius: "var(--shape-asymmetric-md)" }}
                            onClick={() => setOpen(false)}
                        >
                            Book a Reading
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
