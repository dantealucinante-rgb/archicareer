import Link from "next/link";

export default function CookiesPage() {
    return (
        <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
            <div className="eyebrow font-mono text-redline">LEGAL / COOKIES</div>
            <h1 className="display-balance mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Small files, clearly explained.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-graphite">This draft Cookie Policy explains how ArchiCareer may use cookies and similar technologies as the service grows.</p>
            <article className="surface mt-12 space-y-8 p-6 text-sm leading-relaxed text-graphite sm:p-10">
                <section><h2 className="font-display text-2xl font-semibold text-ink">What cookies do</h2><p className="mt-3">Cookies are small files stored by your browser. They can help a site remember a session, understand basic usage, and keep features working.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">How ArchiCareer may use them</h2><p className="mt-3">We may use essential cookies for authentication and security. If we add analytics or optional marketing cookies, this policy will be updated and the relevant choices will be provided.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Your controls</h2><p className="mt-3">Most browsers let you delete or block cookies through their settings. Blocking essential cookies may affect sign-in and other platform features.</p></section>
            </article>
            <Link href="/" className="mt-8 inline-flex font-mono text-[11px] uppercase tracking-widest text-graphite hover:text-redline">← Back to ArchiCareer</Link>
        </main>
    );
}
