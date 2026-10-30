"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountMenu from "./AccountMenu";
import PrimaryNav from "./PrimaryNav";
import BrandLogo from "./BrandLogo";
import MobileAppHeader from "./MobileAppHeader";
import type { Profile } from "@/types";

export default function SiteHeader() {
    const [account, setAccount] = useState<{ authenticated: boolean; profile: Profile | null }>({ authenticated: false, profile: null });
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/account", { credentials: "include", cache: "no-store", signal: controller.signal })
            .then((response) => response.ok ? response.json() : null)
            .then((data: { authenticated?: boolean; profile?: Profile | null } | null) => {
                if (data) setAccount({ authenticated: Boolean(data.authenticated), profile: data.profile ?? null });
            })
            .catch(() => undefined);
        return () => controller.abort();
    }, []);

    const { authenticated, profile } = account;

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let frame: number | null = null;
        const threshold = 12;
        const resetFrame = window.requestAnimationFrame(() => setHidden(false));

        const updateVisibility = () => {
            frame = null;
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;

            if (currentScrollY <= 8) {
                lastScrollY = 0;
                setHidden(false);
                return;
            }

            if (Math.abs(delta) < threshold) return;
            lastScrollY = currentScrollY;
            setHidden(delta > 0);
        };

        const onScroll = () => {
            if (frame === null) frame = window.requestAnimationFrame(updateVisibility);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.cancelAnimationFrame(resetFrame);
            window.removeEventListener("scroll", onScroll);
            if (frame !== null) window.cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <header className={`site-header fixed inset-x-0 top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-xl ${hidden ? "site-header--hidden" : ""}`}>
            <div className="mx-auto hidden w-full max-w-7xl items-center gap-4 px-5 py-3.5 sm:flex sm:gap-8 sm:px-8 sm:py-4">
                <div className="flex items-center gap-5 shrink-0">
                    <span className="hidden text-xs font-medium text-graphite sm:inline">
                        Architecture network
                    </span>
                    <div className="hidden h-5 w-px bg-line sm:block" />
                    <Link href="/" aria-label="ArchiCareer home" className="group flex items-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline sm:text-[1.75rem]">
                        <BrandLogo />
                    </Link>
                </div>

                <PrimaryNav />

                <div className="ml-auto flex items-center gap-3 font-sans text-xs sm:gap-5 sm:text-sm">
                    {authenticated ? (
                        <>
                            {profile && <AccountMenu profile={profile} />}
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hidden text-ink transition-colors hover:text-graphite sm:inline">
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="interactive hidden items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:border-redline hover:bg-redline sm:inline-flex sm:px-5"
                            >
                                Join Now
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <MobileAppHeader authenticated={authenticated} profile={profile} />
        </header>
    );
}
