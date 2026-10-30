import Link from "next/link";

const socialLinks = [
    { label: "Email", href: "mailto:hello@archicareer.ng" },
    { label: "Instagram", href: "https://www.instagram.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com" },
];

export default function SiteFooter() {
    return (
        <>
            <div className="footer-fade" aria-hidden="true" />
            <footer className="bg-night text-paper">
                <div className="mx-auto w-full max-w-6xl px-6 py-12">
                    <div className="grid gap-10 lg:grid-cols-4">
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-medium text-sand">
                                    ArchiCareer
                                </p>
                                <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
                                    ArchiCareer connects emerging talent, experienced professionals, studios, and companies through meaningful work and opportunities.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                                {socialLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        target={link.href.startsWith("http") ? "_blank" : undefined}
                                        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                                        className="text-paper/60 transition-colors hover:text-sand"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-sand">Navigation</h2>
                            <ul className="mt-4 space-y-3 font-sans text-sm">
                                <li><Link href="/discover" className="text-paper/75 transition-colors hover:text-sand">Discover</Link></li>
                                <li><Link href="/jobs#post-job" className="text-paper/75 transition-colors hover:text-sand">Post an Opportunity</Link></li>
                                <li><Link href="/login" className="text-paper/75 transition-colors hover:text-sand">Sign In</Link></li>
                                <li><Link href="/signup" className="text-paper/75 transition-colors hover:text-sand">Create Profile</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-sand">For the profession</h2>
                            <ul className="mt-4 space-y-3 font-sans text-sm">
                                <li><Link href="/discover?role=student" className="text-paper/75 transition-colors hover:text-sand">Talent</Link></li>
                                <li><Link href="/discover?role=architect" className="text-paper/75 transition-colors hover:text-sand">Professionals</Link></li>
                                <li><Link href="/firms/signup" className="text-paper/75 transition-colors hover:text-sand">Studios & Companies</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-sand">Job alerts</h2>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
                                Job-alert emails are not live yet. When they are, we’ll use the preference saved in your account settings.
                            </p>
                        </div>
                    </div>

                    <div className="mt-14 border-t border-paper/20 pt-8">
                        <div className="max-w-full break-words font-display text-[clamp(2.4rem,11vw,9rem)] font-bold uppercase leading-[0.8] tracking-[-0.085em] text-paper">
                            ARCHICAREER
                        </div>
                        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-paper/50">
                            <span>© {new Date().getFullYear()} ArchiCareer</span>
                            <Link href="/terms" className="transition-colors hover:text-sand">Terms</Link>
                            <Link href="/privacy" className="transition-colors hover:text-sand">Privacy</Link>
                            <Link href="/cookies" className="transition-colors hover:text-sand">Cookies</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
