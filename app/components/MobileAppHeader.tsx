"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/types";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import ProfileAvatar from "./ProfileAvatar";
import { Plus } from "./UiIcon";

type MobileAppHeaderProps = {
    authenticated: boolean;
    profile: Profile | null;
};

const appRoutes = ["/feed", "/discover", "/jobs", "/applications", "/profile", "/settings"];

function isAppRoute(pathname: string) {
    return appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function HomeIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function NetworkIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><circle cx="9" cy="8" r="3" /><circle cx="17.5" cy="10" r="2.25" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M15 20a3.5 3.5 0 0 1 5.5-2.9" strokeLinecap="round" /></svg>;
}

function BellIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function BriefcaseIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MobileBottomNav({ pathname }: { pathname: string }) {
    const router = useRouter();
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
    const itemClass = (active: boolean) => `flex min-w-0 flex-col items-center gap-1 px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] ${active ? "text-redline" : "text-graphite"}`;

    function openComposer() {
        if (pathname === "/feed") {
            const composer = document.getElementById("post-composer");
            composer?.scrollIntoView({ behavior: "smooth", block: "start" });
            composer?.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
            return;
        }
        router.push("/feed#post-composer");
    }

    return (
        <nav aria-label="Mobile app navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/95 px-3 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-10px_30px_rgba(23,33,38,0.08)] backdrop-blur-xl sm:hidden">
            <div className="mx-auto grid max-w-md grid-cols-5 items-end">
                <Link href="/feed" aria-current={isActive("/feed") ? "page" : undefined} className={itemClass(isActive("/feed"))}><HomeIcon /><span>Home</span></Link>
                <Link href="/discover" aria-current={isActive("/discover") ? "page" : undefined} className={itemClass(isActive("/discover"))}><NetworkIcon /><span>Network</span></Link>
                <button type="button" onClick={openComposer} className="group -translate-y-3 flex min-w-0 flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink" aria-label="Create a post">
                    <span className="grid h-12 w-12 place-items-center rounded-full border-4 border-paper bg-ink text-paper shadow-lg transition-colors group-hover:bg-redline"><Plus className="h-5 w-5" /></span>
                    <span>Create</span>
                </button>
                <span aria-disabled="true" title="Notifications are not available yet" className="flex min-w-0 flex-col items-center gap-1 px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-graphite/45"><BellIcon /><span>Alerts</span></span>
                <Link href="/jobs" aria-current={isActive("/jobs") ? "page" : undefined} className={itemClass(isActive("/jobs"))}><BriefcaseIcon /><span>Jobs</span></Link>
            </div>
        </nav>
    );
}

export default function MobileAppHeader({ authenticated, profile }: MobileAppHeaderProps) {
    const pathname = usePathname();
    const showAppChrome = authenticated && isAppRoute(pathname);

    useEffect(() => {
        document.body.classList.toggle("has-mobile-app-nav", showAppChrome);
        return () => document.body.classList.remove("has-mobile-app-nav");
    }, [showAppChrome]);

    if (!showAppChrome) {
        return (
            <div className="flex w-full items-center justify-between px-5 py-3.5 sm:hidden">
                <Link href="/" aria-label="ArchiCareer home" className="group flex items-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline"><BrandLogo /></Link>
                <MobileNav authenticated={authenticated} />
            </div>
        );
    }

    return (
        <>
            <div className="grid w-full grid-cols-[2.5rem_1fr_2.5rem] items-center px-5 py-2.5 sm:hidden">
                <Link href="/profile" aria-label="Your profile" className="interactive grid h-10 w-10 place-items-center rounded-full">
                    {profile ? <ProfileAvatar profile={profile} size={40} className="h-10 w-10 rounded-full border border-line object-cover" /> : <span className="h-9 w-9 rounded-full border border-line bg-sand" />}
                </Link>
                <Link href="/feed" aria-label="ArchiCareer feed" className="group justify-self-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline"><BrandLogo /></Link>
                <span aria-hidden="true" />
            </div>
            {typeof document !== "undefined" && createPortal(<MobileBottomNav pathname={pathname} />, document.body)}
        </>
    );
}
