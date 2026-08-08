import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MobileNav from "./MobileNav";
import AccountMenu from "./AccountMenu";

export default async function SiteHeader() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/88 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-5 py-3.5 sm:gap-8 sm:px-8 sm:py-4">
                <div className="flex items-center gap-5 shrink-0">
                    <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-graphite sm:inline">
                        A-00 / NETWORK
                    </span>
                    <div className="hidden h-5 w-px bg-line sm:block" />
                    <Link href="/" className="group flex items-center font-display text-[1.3rem] font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline sm:text-[1.75rem]">
                        <span>ArchiCareer</span>
                    </Link>
                </div>

                <nav className="hidden flex-1 items-center justify-center gap-2 font-sans text-sm sm:flex">
                    <Link href="/discover" className="rounded-full px-3 py-2 text-graphite transition-colors hover:bg-sand/40 hover:text-ink">
                        Discover
                    </Link>
                    <Link href="/jobs" className="rounded-full px-3 py-2 text-graphite transition-colors hover:bg-sand/40 hover:text-ink">
                        Jobs
                    </Link>
                </nav>

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
                                className="interactive inline-flex items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline sm:px-5 sm:text-[11px]"
                            >
                                Join Now
                            </Link>
                        </>
                    )}
                    <MobileNav authenticated={Boolean(user)} />
                </div>
            </div>
        </header>
    );
}
