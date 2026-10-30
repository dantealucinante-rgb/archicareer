"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SignOutButton from "./SignOutButton";
import { ChevronDown } from "./UiIcon";
import type { Profile } from "@/types";

export default function AccountMenu({ profile }: { profile: Profile }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!open) return;
        function handlePointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        }
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        const focusFrame = window.requestAnimationFrame(() => {
            panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
        });
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.cancelAnimationFrame(focusFrame);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative hidden sm:block">
            <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="account-menu" onClick={() => setOpen((current) => !current)} className="interactive inline-flex items-center gap-2 rounded-full border border-line bg-warm-white px-4 py-2 text-sm font-medium text-ink hover:border-ink">
                Account <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div id="account-menu" ref={panelRef} className="sheet-reveal absolute right-0 top-[calc(100%+0.75rem)] z-50 w-52 rounded-2xl border border-line bg-paper p-2 shadow-xl">
                    <nav aria-label="Account navigation" className="flex flex-col gap-1 text-sm">
                        <Link href={`/p/${profile.slug}`} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">View profile</Link>
                        <Link href="/profile/edit" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">Edit profile</Link>
                        <Link href="/applications" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">Applications</Link>
                        <Link href="/settings" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-ink hover:bg-sand/40">Settings</Link>
                        <div className="my-1 border-t border-line" />
                        <SignOutButton mobile />
                    </nav>
                </div>
            )}
        </div>
    );
}
