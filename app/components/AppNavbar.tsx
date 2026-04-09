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
                <Link href="/home" className={styles.logo}>
                    <Image
                        src="/logo-stacked.svg"
                        alt="Astro Nat Logo"
                        width={130}
                        height={44}
                        priority
                        className={styles.logoImg}
                    />
                </Link>

                {/* Desktop Right */}
                <div className="hidden md:flex items-center gap-4 ml-auto">
                    <ThemeToggle />
                    
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="rounded-full h-9 w-9 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/10 dark:border-white/10 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--surface-border)]">
                                <User size={18} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 font-body shadow-md border border-[var(--surface-border)] bg-[var(--surface)] rounded-[var(--radius-md)] p-1 text-[var(--text-primary)]">
                                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                                    My Account
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[var(--surface-border)] h-px my-1 -mx-1" />
                                <DropdownMenuItem className="cursor-pointer text-sm font-medium w-full rounded-sm focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)] px-2 py-1.5 outline-none transition-colors">
                                    <Link href="/profile" className="w-full block outline-none">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[var(--surface-border)] h-px my-1 -mx-1" />
                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-sm text-red-500 font-medium w-full rounded-sm focus:bg-red-500/10 focus:text-red-600 px-2 py-1.5 outline-none transition-colors">
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Mobile Right */}
                <div className="flex md:hidden items-center gap-2 ml-auto">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger className="h-[44px] w-[44px] inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
                            <Menu size={24} />
                        </SheetTrigger>
                        <SheetContent side="right" className="font-body w-[280px] sm:w-[350px]">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <div className="flex flex-col h-full mt-6 gap-6">
                                <div className="flex items-center justify-between">
                                    <span className="font-secondary text-xl">Menu</span>
                                    <ThemeToggle />
                                </div>
                                
                                {user && (
                                    <div className="flex flex-col gap-4 mt-4">
                                        <Link 
                                            href="/profile" 
                                            onClick={() => setOpen(false)}
                                            className="text-lg font-medium hover:text-black/70 dark:hover:text-white/70 transition-colors"
                                        >
                                            Profile
                                        </Link>
                                        <div className="h-[1px] w-full bg-black/10 dark:bg-white/10 my-2" />
                                        <button 
                                            onClick={() => {
                                                setOpen(false);
                                                handleSignOut();
                                            }} 
                                            className="text-left text-lg font-medium text-red-500 hover:text-red-600 transition-colors"
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
