import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About ArchiCareer",
    description: "Learn how ArchiCareer helps Nigeria's architecture students, architects, studios, and companies find each other through the work.",
    alternates: { canonical: "/about" },
};

export default function AboutPage() {
    return (
        <div className="bg-paper text-ink flex flex-col font-sans selection:bg-redline selection:text-paper">
            <main className="max-w-3xl mx-auto px-6 py-16">
                <div className="font-mono text-xs text-graphite tracking-widest mb-6">A-07 // ABOUT</div>
                <h1 className="font-display text-4xl uppercase tracking-tight text-ink font-normal mb-6">About ArchiCareer</h1>
                <p className="text-base text-graphite mb-6 leading-relaxed">
                    ArchiCareer is the portfolio and opportunity layer for Nigeria&apos;s architectural network. It is built to help students,
                    practicing architects, and firms find each other without the noise of generic job platforms.
                </p>
                <h2 className="font-display text-2xl uppercase tracking-tight text-ink font-normal mb-4 mt-8">Our Mission</h2>
                <p className="text-base text-graphite mb-6 leading-relaxed">
                    To make discovery, portfolio presentation, and role posting straightforward for the local architecture ecosystem.
                </p>
            </main>
        </div>
    );
}
