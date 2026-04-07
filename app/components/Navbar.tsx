"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import styles from "./navbar.module.css";
import { Menu, X } from "lucide-react";

interface NavbarProps {
    activeHref?: string;
    /** Extra content for the right side (e.g. progress indicator) */
    centerContent?: React.ReactNode;
    /** Logo href — defaults to "/" */
    logoHref?: string;
}

export default function Navbar({ activeHref, centerContent, logoHref = "/" }: NavbarProps) {
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

    const links = [
        { href: "/about", label: "About" },
        { href: "https://calendly.com/astronat/60min-acg-reading", label: "Book a reading", external: true },
        user && { href: "/home", label: "Dashboard" },
        !user && { href: "/auth/login", label: "Log in" },
    ].filter(Boolean) as any[];

    return (
        <nav className={styles.nav}>
            <div className={styles.navInner}>
                {/* Logo */}
                <Link href={logoHref} className={styles.logo} onClick={() => setOpen(false)}>
                    <Image
                        src="/logo-stacked.svg"
                        alt="Astro Nat Logo"
                        width={130}
                        height={44}
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
                            {links.map((l) =>
                                l.external ? (
                                    <a
                                        key={l.href}
                                        href={l.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={activeHref === l.href ? styles.active : ""}
                                    >
                                        {l.label}
                                    </a>
                                ) : (
                                    <Link
                                        key={l.href}
                                        href={l.href}
                                        className={activeHref === l.href ? styles.active : ""}
                                    >
                                        {l.label}
                                    </Link>
                                )
                            )}
                        </div>
                    )}
                    {user && (
                        <button onClick={handleSignOut} className={styles.signOutBtn}>
                            Sign out
                        </button>
                    )}
                    <ThemeToggle />
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
                    {links.map((l) =>
                        l.external ? (
                            <a
                                key={l.href}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.drawerLink}
                                onClick={() => setOpen(false)}
                            >
                                {l.label}
                            </a>
                        ) : (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`${styles.drawerLink} ${activeHref === l.href ? styles.drawerActive : ""}`}
                                onClick={() => setOpen(false)}
                            >
                                {l.label}
                            </Link>
                        )
                    )}
                </div>
            )}
        </nav>
    );
}
