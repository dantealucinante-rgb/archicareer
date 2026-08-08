import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Use",
    description: "The terms for using ArchiCareer, sharing architectural work, and connecting through the platform.",
    alternates: { canonical: "/terms" },
};

export default function TermsPage() {
    return (
        <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
            <div className="eyebrow font-mono text-redline">LEGAL / TERMS</div>
            <h1 className="display-balance mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.06em] sm:text-7xl">A clear agreement for a useful platform.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-graphite">These draft Terms of Use explain the basic rules for using ArchiCareer, creating profiles, sharing work, and posting opportunities.</p>
            <article className="surface mt-12 space-y-8 p-6 text-sm leading-relaxed text-graphite sm:p-10">
                <section><h2 className="font-display text-2xl font-semibold text-ink">Using ArchiCareer</h2><p className="mt-3">You agree to provide accurate information, keep your account secure, and use the platform lawfully and respectfully.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Your work and content</h2><p className="mt-3">You retain ownership of the work you upload. By sharing it, you give ArchiCareer permission to display it as part of the platform and its ordinary promotional materials.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Opportunities and introductions</h2><p className="mt-3">ArchiCareer provides a place for people and organisations to connect. We do not guarantee a role, application outcome, or relationship formed through the platform.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Respectful participation</h2><p className="mt-3">Do not upload content that is unlawful, deceptive, abusive, infringing, or unrelated to the professional community. We may remove content or restrict accounts that breach these rules.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Contact</h2><p className="mt-3">Questions about these terms can be sent to <a className="text-redline hover:underline" href="mailto:hello@archicareer.ng">hello@archicareer.ng</a>.</p></section>
            </article>
            <Link href="/" className="mt-8 inline-flex font-mono text-[11px] uppercase tracking-widest text-graphite hover:text-redline">← Back to ArchiCareer</Link>
        </main>
    );
}
