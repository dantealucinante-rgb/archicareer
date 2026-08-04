import Link from "next/link";

export default function PrivacyPage() {
    return (
        <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
            <div className="eyebrow font-mono text-redline">LEGAL / PRIVACY</div>
            <h1 className="display-balance mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Your information should stay understandable.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-graphite">This draft Privacy Policy describes the information ArchiCareer may collect, why we use it, and the choices available to you.</p>
            <article className="surface mt-12 space-y-8 p-6 text-sm leading-relaxed text-graphite sm:p-10">
                <section><h2 className="font-display text-2xl font-semibold text-ink">Information you provide</h2><p className="mt-3">This may include your name, email address, role, location, biography, portfolio work, profile links, and information included in job or company listings.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">How we use it</h2><p className="mt-3">We use information to provide profiles, discovery, authentication, opportunity listings, account support, security, and improvements to the service.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">What is visible</h2><p className="mt-3">Information you choose to add to a public profile or listing may be visible to other visitors. Do not publish anything you want to keep private.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Your choices</h2><p className="mt-3">You may ask us to correct or remove information associated with your account by contacting <a className="text-redline hover:underline" href="mailto:hello@archicareer.ng">hello@archicareer.ng</a>.</p></section>
                <section><h2 className="font-display text-2xl font-semibold text-ink">Contact</h2><p className="mt-3">We will update this policy as the platform develops and will identify the effective date on the final published version.</p></section>
            </article>
            <Link href="/" className="mt-8 inline-flex font-mono text-[11px] uppercase tracking-widest text-graphite hover:text-redline">← Back to ArchiCareer</Link>
        </main>
    );
}
