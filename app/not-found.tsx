import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

export const metadata = {
    title: "404 - Page not found",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <main className="flex min-h-screen bg-paper px-5 py-8 text-ink sm:px-8 sm:py-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col">
                <header className="flex items-center justify-between gap-4">
                    <Link href="/" aria-label="ArchiCareer home" className="font-display text-2xl font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline sm:text-3xl">
                        <BrandLogo />
                    </Link>
                    <Link href="/" className="font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors hover:text-ink">
                        Return home
                    </Link>
                </header>

                <section className="flex flex-1 items-center py-16 sm:py-24" aria-labelledby="not-found-title">
                    <div className="max-w-2xl">
                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-redline">Error 404</p>
                        <h1 id="not-found-title" className="mt-5 text-balance font-display text-5xl font-semibold tracking-[-0.05em] text-ink sm:text-7xl">
                            This page is not part of the plan.
                        </h1>
                        <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-graphite sm:text-lg">
                            The link may be outdated, or the page may have moved. Use one of these paths to find your way back.
                        </p>

                        <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-4" aria-label="Helpful links">
                            <Link href="/" className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-night focus:outline-none focus:ring-2 focus:ring-redline focus:ring-offset-2 focus:ring-offset-paper">
                                Go to home
                            </Link>
                            <Link href="/discover" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-redline focus:outline-none focus:ring-2 focus:ring-redline focus:ring-offset-2 focus:ring-offset-paper">
                                Discover people
                            </Link>
                            <Link href="/jobs" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-redline focus:outline-none focus:ring-2 focus:ring-redline focus:ring-offset-2 focus:ring-offset-paper">
                                Browse jobs
                            </Link>
                            <Link href="/about" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-redline focus:outline-none focus:ring-2 focus:ring-redline focus:ring-offset-2 focus:ring-offset-paper">
                                About ArchiCareer
                            </Link>
                        </nav>
                    </div>
                </section>

                <p className="font-display text-2xl font-bold tracking-[-0.055em] text-ink sm:text-3xl">ArchiCareer</p>
            </div>
        </main>
    );
}
