"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SignOutButton from "./SignOutButton";

type Props = { authenticated: boolean };

export default function MobileNav({ authenticated }: Props) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const linkClass = (href: string) => `interactive rounded-xl px-4 py-3 ${pathname === href || pathname.startsWith(`${href}/`) ? "bg-sand/60 text-ink" : "bg-sand/40 text-ink"}`;

    useEffect(() => {
        if (!open) return;
        function handlePointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="sm:hidden">
            <button
                type="button"
                aria-expanded={open}
                aria-controls="mobile-navigation"
                onClick={() => setOpen((current) => !current)}
                className="interactive rounded-full border border-line bg-warm-white px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink hover:border-ink hover:bg-ink hover:text-paper"
            >
                {open ? "Close" : "Menu"}
            </button>
            {open && (
                <nav id="mobile-navigation" aria-label="Primary navigation" className="sheet-reveal absolute inset-x-3 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-line bg-paper/95 p-4 shadow-xl backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 font-mono text-[11px] uppercase tracking-widest">
                        <Link href="/discover" aria-current={pathname === "/discover" ? "page" : undefined} onClick={() => setOpen(false)} className={linkClass("/discover")}>Discover</Link>
                        <Link href="/jobs" aria-current={pathname === "/jobs" ? "page" : undefined} onClick={() => setOpen(false)} className={linkClass("/jobs")}>Jobs</Link>
                        <Link href="/feed" aria-current={pathname === "/feed" ? "page" : undefined} onClick={() => setOpen(false)} className={linkClass("/feed")}>Feed</Link>
                        {authenticated ? (
                            <>
                                <Link href="/profile" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">View profile</Link>
                                <Link href="/profile/edit" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">Edit profile</Link>
                                <Link href="/applications" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">Applications</Link>
                                <Link href="/settings" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">Settings</Link>
                                <SignOutButton mobile />
                            </>
                        ) : (
                            <>
                                <Link href="/signup" onClick={() => setOpen(false)} className="interactive rounded-xl bg-ink px-4 py-3 text-paper">Join Now</Link>
                                <Link href="/login" onClick={() => setOpen(false)} className="interactive rounded-xl px-4 py-3 text-ink">Sign In</Link>
                            </>
                        )}
                    </div>
                </nav>
            )}
        </div>
    );
}
