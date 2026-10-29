"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AccountMenu from "./AccountMenu";
import PrimaryNav from "./PrimaryNav";
import BrandLogo from "./BrandLogo";
import MobileAppHeader from "./MobileAppHeader";
import type { Profile } from "@/types";

export default function SiteHeader() {
    const [account, setAccount] = useState<{ authenticated: boolean; profile: Profile | null }>({ authenticated: false, profile: null });
    const [hidden, setHidden] = useState(false);
    const pathname = usePathname();

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
        const resetFrame = window.requestAnimationFrame(() => setHidden(false));
        if (!authenticated) return;

        let lastY = window.scrollY;
        let frame: number | null = null;
        const threshold = 12;

        const updateVisibility = () => {
            frame = null;
            const currentY = window.scrollY;
            const distance = currentY - lastY;

            if (currentY < 64) {
                setHidden(false);
            } else if (Math.abs(distance) >= threshold) {
                setHidden(distance > 0);
                lastY = currentY;
            }
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
    }, [authenticated, pathname]);

    return (
        <header className={`site-header fixed inset-x-0 top-0 z-40 border-b border-line bg-warm-white ${authenticated ? "site-header--authenticated" : ""} ${hidden ? "site-header--hidden" : ""}`}>
            <div className="mx-auto hidden w-full max-w-7xl items-center gap-4 px-5 py-3.5 sm:flex sm:gap-8 sm:px-8 sm:py-4">
                <div className="flex items-center gap-5 shrink-0">
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
                                className="ui-button-primary interactive hidden sm:inline-flex"
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
