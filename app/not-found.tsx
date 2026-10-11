import Link from "next/link";
import NotFoundGame from "@/app/components/NotFoundGame";
import BrandLogo from "@/app/components/BrandLogo";

export const metadata = {
    title: "404 - Page not found",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <main className="min-h-screen bg-paper px-5 py-8 text-ink sm:px-8 sm:py-14">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="font-display text-2xl font-bold tracking-[-0.055em] text-ink transition-colors hover:text-redline sm:text-3xl">
                        <BrandLogo />
                    </Link>
                    <Link href="/discover" className="font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors hover:text-ink">
                        Discover
                    </Link>
                </div>

                <NotFoundGame />
            </div>
        </main>
    );
}
