"use client";

import Link from "next/link";
import { useState } from "react";
import SignOutButton from "./SignOutButton";

export default function AccountMenu() {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative hidden sm:block">
            <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="interactive inline-flex items-center gap-2 rounded-full border border-line bg-warm-white px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink hover:border-ink">
                Account <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
            </button>
            {open && (
                <div className="sheet-reveal absolute right-0 top-[calc(100%+0.75rem)] z-50 w-52 rounded-2xl border border-line bg-paper p-2 shadow-xl">
                    <nav className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-widest">
                        <Link href="/profile" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">View profile</Link>
                        <Link href="/profile/edit" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">Edit profile</Link>
                        <Link href="/settings" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">Settings</Link>
                        <div className="my-1 border-t border-line" />
                        <SignOutButton mobile />
                    </nav>
                </div>
            )}
        </div>
    );
}
