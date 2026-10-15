"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SignOutButton from "./SignOutButton";
import type { Profile } from "@/types";

type Props = { authenticated: boolean; profile: Profile | null };

const navigationLinks = [
    { href: "/discover", label: "Discover" },
    { href: "/jobs", label: "Jobs" },
    { href: "/feed", label: "Feed" },
];

const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export default function MobileNav({ authenticated, profile }: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const pathname = usePathname();

    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const openNavigation = useCallback(() => {
        clearCloseTimer();
        setMounted(true);
        animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = null;
            setOpen(true);
        });
    }, [clearCloseTimer]);

    const closeNavigation = useCallback(() => {
        clearCloseTimer();
        if (animationFrameRef.current) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setOpen(false);
        closeTimerRef.current = setTimeout(() => setMounted(false), 250);
    }, [clearCloseTimer]);

    useEffect(() => () => {
        clearCloseTimer();
        if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
    }, [clearCloseTimer]);

    useEffect(() => {
        if (!mounted) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function focusPanel() {
            panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeNavigation();
                triggerRef.current?.focus();
                return;
            }

            if (event.key !== "Tab" || !panelRef.current) return;
            const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        const focusFrame = window.requestAnimationFrame(focusPanel);
        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [closeNavigation, mounted]);

    const linkClass = (href: string) => `interactive rounded-xl px-4 py-3 text-base ${pathname === href || pathname.startsWith(`${href}/`) ? "bg-sand/60 text-ink" : "text-ink hover:bg-sand/40"}`;

    return (
        <div className="sm:hidden">
            <button
                ref={triggerRef}
                type="button"
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={open}
                aria-controls="mobile-navigation"
                onClick={open ? closeNavigation : openNavigation}
                className="interactive grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-sand/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline"
            >
                <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                {open ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
                ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
                )}
            </button>

            {mounted && (
                <>
                    <button type="button" aria-label="Close navigation menu" onClick={closeNavigation} className={`mobile-nav-overlay ${open ? "is-open" : ""}`} />
                    <aside ref={panelRef} id="mobile-navigation" aria-label="Primary navigation" aria-hidden={!open} className={`mobile-nav-panel ${open ? "is-open" : ""}`}>
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Navigation</p>
                            <button type="button" aria-label="Close navigation menu" onClick={closeNavigation} className="interactive grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-sand/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline">
                                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                        <nav className="flex flex-col gap-2 p-4 font-sans" aria-label="Primary navigation links">
                            {navigationLinks.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={closeNavigation} className={linkClass(link.href)}>{link.label}</Link>)}
                            {authenticated ? (
                                <>
                                    {profile && <Link href={`/p/${profile.slug}`} onClick={closeNavigation} className="interactive rounded-xl px-4 py-3 text-base text-ink hover:bg-sand/40">View profile</Link>}
                                    <Link href="/profile/edit" onClick={closeNavigation} className="interactive rounded-xl px-4 py-3 text-base text-ink hover:bg-sand/40">Edit profile</Link>
                                    <Link href="/applications" onClick={closeNavigation} className="interactive rounded-xl px-4 py-3 text-base text-ink hover:bg-sand/40">Applications</Link>
                                    <Link href="/settings" onClick={closeNavigation} className="interactive rounded-xl px-4 py-3 text-base text-ink hover:bg-sand/40">Settings</Link>
                                    <div className="my-2 border-t border-line" />
                                    <SignOutButton mobile />
                                </>
                            ) : (
                                <>
                                    <div className="my-2 border-t border-line" />
                                    <Link href="/signup" onClick={closeNavigation} className="interactive rounded-xl bg-ink px-4 py-3 text-base text-paper hover:bg-redline">Join Now</Link>
                                    <Link href="/login" onClick={closeNavigation} className="interactive rounded-xl px-4 py-3 text-base text-ink hover:bg-sand/40">Sign In</Link>
                                </>
                            )}
                        </nav>
                    </aside>
                </>
            )}
        </div>
    );
}
