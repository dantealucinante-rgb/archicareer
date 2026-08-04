"use client";

import Link from "next/link";
import { useState } from "react";
import SignOutButton from "./SignOutButton";

type Props = { authenticated: boolean };

export default function MobileNav({ authenticated }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className="sm:hidden">
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
                <nav id="mobile-navigation" className="sheet-reveal absolute inset-x-3 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-line bg-paper/95 p-4 shadow-xl backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 font-mono text-[11px] uppercase tracking-widest">
                        <Link href="/discover" onClick={() => setOpen(false)} className="interactive rounded-xl bg-sand/40 px-4 py-3 text-ink">Discover</Link>
                        <Link href="/jobs" onClick={() => setOpen(false)} className="interactive rounded-xl bg-sand/40 px-4 py-3 text-ink">Jobs</Link>
                        {authenticated ? (
                            <>
                                <Link href="/profile" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">View profile</Link>
                                <Link href="/profile/edit" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">Edit profile</Link>
                                <Link href="/settings" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-ink">Settings</Link>
                                <SignOutButton mobile />
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setOpen(false)} className="text-ink">Sign In</Link>
                        )}
                    </div>
                </nav>
            )}
        </div>
    );
}
