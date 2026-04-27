"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { Menu, User } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "./ui/dropdown-menu";
import styles from "./navbar.module.css";

export default function AppNavbar() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const [open, setOpen] = useState(false);

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
                <Link href="/dashboard" className={styles.logo}>
                    <Image
                        src="/logo-stacked.svg"
                        alt="Astro Nat Logo"
                        width={130}
                        height={44}
                        priority
                        className={styles.logoImg}
                    />
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4 ml-auto">
                    {/* Desktop Items */}
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeToggle />
                        
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="rounded-full h-9 w-9 bg-[var(--surface)] hover:bg-[var(--bg-raised)] transition-all border border-[var(--surface-border)] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--surface-border)] text-[var(--text-primary)]">
                                    <User size={18} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 font-body shadow-md border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-primary)] rounded-[var(--radius-md)] p-1">
                                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                                        My Account
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-[var(--surface-border)] h-px my-1 -mx-1" />
                                    <DropdownMenuItem className="cursor-pointer text-sm font-medium w-full rounded-sm hover:bg-[var(--bg-raised)] focus:bg-[var(--bg-raised)] px-2 py-1.5 outline-none transition-colors">
                                        <Link href="/profile" className="w-full block outline-none">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[var(--surface-border)] h-px my-1 -mx-1" />
                                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-sm text-red-500 font-medium w-full rounded-sm hover:bg-red-500/10 focus:bg-red-500/10 px-2 py-1.5 outline-none transition-colors">
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Universal Hamburger Menu */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger className="h-[44px] w-[44px] md:h-9 md:w-9 inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus:outline-none text-[var(--text-primary)]">
                            <Menu size={24} />
                        </SheetTrigger>
                        <SheetContent side="right" className="font-body border-l border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-primary)] w-[320px] sm:w-[400px] p-0">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <div className="flex flex-col h-full px-8 py-10 overflow-y-auto">
                                <div className="flex items-center justify-between mb-12">
                                    <span className="font-display text-4xl tracking-tight uppercase">Menu</span>
                                    <div className="md:hidden">
                                        <ThemeToggle />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-5 mt-2">
                                    <div className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">Explore</div>
                                    <Link href="/chart" onClick={() => setOpen(false)} className="text-2xl font-secondary hover:text-[var(--gold)] hover:translate-x-2 transition-all duration-300 flex items-center justify-between group">
                                        My Chart
                                        <span className="text-[var(--gold)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-mono text-sm">&rarr;</span>
                                    </Link>
                                    <div className="h-px w-full bg-[var(--surface-border)] opacity-30" />
                                    <Link href="/couples" onClick={() => setOpen(false)} className="text-2xl font-secondary hover:text-[var(--gold)] hover:translate-x-2 transition-all duration-300 flex items-center justify-between group">
                                        Couples
                                        <span className="text-[var(--gold)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-mono text-sm">&rarr;</span>
                                    </Link>
                                    <div className="h-px w-full bg-[var(--surface-border)] opacity-30" />
                                    <Link href="/mundane" onClick={() => setOpen(false)} className="text-2xl font-secondary hover:text-[var(--gold)] hover:translate-x-2 transition-all duration-300 flex items-center justify-between group">
                                        World Charts
                                        <span className="text-[var(--gold)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-mono text-sm">&rarr;</span>
                                    </Link>
                                    <div className="h-px w-full bg-[var(--surface-border)] opacity-30" />
                                    <Link href="/reading/new?type=weather" onClick={() => setOpen(false)} className="text-2xl font-secondary hover:text-[var(--gold)] hover:translate-x-2 transition-all duration-300 flex items-center justify-between group">
                                        Sky Weather
                                        <span className="text-[var(--gold)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-mono text-sm">&rarr;</span>
                                    </Link>
                                    <div className="h-px w-full bg-[var(--surface-border)] opacity-30" />
                                    <Link href="/learn" onClick={() => setOpen(false)} className="text-2xl font-secondary hover:text-[var(--gold)] hover:translate-x-2 transition-all duration-300 flex items-center justify-between group">
                                        Learn
                                        <span className="text-[var(--gold)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-mono text-sm">&rarr;</span>
                                    </Link>
                                </div>
                                
                                {user && (
                                    <div className="flex flex-col gap-6 mt-auto pt-10">
                                        <div className="h-px w-full bg-[var(--surface-border)]" />
                                        <Link 
                                            href="/profile" 
                                            onClick={() => setOpen(false)}
                                            className="text-lg font-body font-medium hover:text-[var(--gold)] transition-colors mt-2"
                                        >
                                            Account Profile
                                        </Link>
                                        <button 
                                            onClick={() => {
                                                setOpen(false);
                                                handleSignOut();
                                            }} 
                                            className="text-left text-lg font-body font-medium text-[var(--color-spiced-life)] hover:text-red-500 transition-colors"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
