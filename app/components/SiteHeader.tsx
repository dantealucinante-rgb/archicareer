import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "./AccountMenu";
import PrimaryNav from "./PrimaryNav";
import BrandLogo from "./BrandLogo";
import MobileAppHeader from "./MobileAppHeader";
import { getCurrentProfile } from "@/lib/queries/profiles";

export default async function SiteHeader() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await getCurrentProfile() : { data: null };

    return (
        <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/88 backdrop-blur-xl">
            <div className="mx-auto hidden w-full max-w-7xl items-center gap-4 px-5 py-3.5 sm:flex sm:gap-8 sm:px-8 sm:py-4">
                <div className="flex items-center gap-5 shrink-0">
                    <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-graphite sm:inline">
                        A-00 / NETWORK
                    </span>
                    <div className="hidden h-5 w-px bg-line sm:block" />
                    <Link href="/" aria-label="ArchiCareer home" className="group flex items-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline sm:text-[1.75rem]">
                        <BrandLogo />
                    </Link>
                </div>

                <PrimaryNav />

                <div className="ml-auto flex items-center gap-3 font-sans text-xs sm:gap-5 sm:text-sm">
                    {user ? (
                        <>
                            <AccountMenu />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hidden text-ink transition-colors hover:text-graphite sm:inline">
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="interactive hidden items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline sm:inline-flex sm:px-5 sm:text-[11px]"
                            >
                                Join Now
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <MobileAppHeader authenticated={Boolean(user)} profile={profile} />
        </header>
    );
}
