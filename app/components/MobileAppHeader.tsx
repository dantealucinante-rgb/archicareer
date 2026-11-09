"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/types";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";
import ProfileAvatar from "./ProfileAvatar";
import { Plus } from "./UiIcon";
import PostComposer from "./PostComposer";
import type { FeedPost } from "@/types";
import bottomNavStyles from "./mobile-bottom-nav.module.css";
import feedStyles from "@/app/feed/feed.module.css";

type MobileAppHeaderProps = {
    authenticated: boolean;
    profile: Profile | null;
};

const appRoutes = ["/feed", "/discover", "/jobs", "/applications", "/profile", "/settings"];

function isAppRoute(pathname: string) {
    return appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProfileRoute(pathname: string) {
    return pathname === "/profile" || pathname.startsWith("/profile/") || pathname.startsWith("/p/");
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

function MobileBottomNav({ pathname, onOpenComposer }: { pathname: string; onOpenComposer: () => void }) {
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <nav aria-label="Mobile app navigation" className={`${bottomNavStyles.dock} ${pathname === "/feed" ? feedStyles.mobileDock : ""} sm:hidden`}>
            <div className={bottomNavStyles.items}>
                <Link href="/feed" aria-current={isActive("/feed") ? "page" : undefined} className={`${bottomNavStyles.item} ${isActive("/feed") ? bottomNavStyles.active : ""}`}><HomeIcon /><span>Home</span></Link>
                <Link href="/discover" aria-current={isActive("/discover") ? "page" : undefined} className={`${bottomNavStyles.item} ${isActive("/discover") ? bottomNavStyles.active : ""}`}><NetworkIcon /><span>Discover</span></Link>
                <button type="button" onClick={onOpenComposer} className={`${bottomNavStyles.item} ${bottomNavStyles.create}`} aria-label="Create a post">
                    <Plus className="h-5 w-5" />
                    <span>Post</span>
                </button>
                <span aria-disabled="true" title="Notifications are not available yet" className={`${bottomNavStyles.item} ${bottomNavStyles.disabled}`}><BellIcon /><span>Alerts</span></span>
                <Link href="/jobs" aria-current={isActive("/jobs") ? "page" : undefined} className={`${bottomNavStyles.item} ${isActive("/jobs") ? bottomNavStyles.active : ""}`}><BriefcaseIcon /><span>Jobs</span></Link>
            </div>
        </nav>
    );
}

export default function MobileAppHeader({ authenticated, profile }: MobileAppHeaderProps) {
    const pathname = usePathname();
    const showProfileMenu = isProfileRoute(pathname);
    const showMobileMenu = showProfileMenu || pathname === "/pricing";
    const showAppChrome = authenticated && (isAppRoute(pathname) || showProfileMenu);
    const [composerOpen, setComposerOpen] = useState(false);

    const openComposer = useCallback(() => setComposerOpen(true), []);
    const closeComposer = useCallback(() => setComposerOpen(false), []);
    const addPostToFeed = useCallback((post: FeedPost, replaceId?: string) => {
        window.dispatchEvent(new CustomEvent("post-created", { detail: { post, replaceId } }));
    }, []);

    useEffect(() => {
        document.body.classList.toggle("has-mobile-app-nav", showAppChrome);
        return () => document.body.classList.remove("has-mobile-app-nav");
    }, [showAppChrome]);

    useEffect(() => {
        window.addEventListener("open-post-composer", openComposer);
        return () => window.removeEventListener("open-post-composer", openComposer);
    }, [openComposer]);

    if (!showAppChrome) {
        return (
            <div className="flex w-full items-center justify-between px-5 py-3.5 sm:hidden">
                <Link href="/" aria-label="ArchiCareer home" className="group flex items-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline"><BrandLogo /></Link>
                {showMobileMenu && <MobileNav authenticated={authenticated} profile={profile} />}
            </div>
        );
    }

    return (
        <>
            <div className={`${showProfileMenu ? "grid grid-cols-[2.5rem_1fr_2.5rem]" : "flex justify-center"} w-full items-center px-5 py-2.5 sm:hidden`}>
                {showProfileMenu && <Link href={profile ? `/p/${profile.slug}` : "/login"} aria-label="Your profile" className="interactive grid h-10 w-10 place-items-center rounded-full">
                    {profile ? <ProfileAvatar profile={profile} size={40} className="h-10 w-10 rounded-full border border-line object-cover" /> : <span className="h-9 w-9 rounded-full border border-line bg-sand" />}
                </Link>}
                <Link href="/feed" aria-label="ArchiCareer feed" className="group justify-self-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline"><BrandLogo /></Link>
                {showMobileMenu && <MobileNav authenticated={authenticated} profile={profile} />}
            </div>
            {profile && <PostComposer open={composerOpen} onClose={closeComposer} onCreated={addPostToFeed} author={{ id: profile.id, name: profile.name, slug: profile.slug, role: profile.role, location: profile.location, avatar_url: profile.avatar_url }} />}
            {typeof document !== "undefined" && createPortal(<MobileBottomNav pathname={pathname} onOpenComposer={openComposer} />, document.body)}
        </>
    );
}
