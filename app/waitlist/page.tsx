import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import WaitlistForm from "./WaitlistForm";
import styles from "./waitlist.module.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Join the Waitlist",
    description: "Get early access to ArchiCareer, where built-environment professionals showcase their work, connect and discover opportunities.",
    path: "/waitlist",
    image: "/hero/archicareer-modern-facade.jpg",
    imageAlt: "A contemporary building with a patterned facade beneath a blue sky",
});

export default function WaitlistPage() {
    return (
        <main className={styles.page}>
            <a href="#waitlist-form" className={styles.skipLink}>Skip to the form</a>
            <header className={styles.header}>
                <Link href="/" className={styles.wordmark} aria-label="ArchiCareer home">
                    <BrandLogo className={styles.logo} />
                </Link>
                <a className={styles.headerCta} href="#waitlist-form">Join the waitlist</a>
            </header>

            <div className={styles.content}>
                <section className={styles.hero} aria-labelledby="waitlist-title">
                    <div className={styles.heroCopy}>
                        <p className={styles.eyebrow}><span aria-hidden="true" /> For the people who shape our world</p>
                        <h1 id="waitlist-title">Good work<br />deserves to be <em>seen.</em></h1>
                        <p className={styles.description}>A place for the built environment to showcase work, connect and discover what’s next.</p>
                        <div className={styles.audience} aria-label="Architecture, design and construction">
                            <span>Architecture</span><span>Design</span><span>Construction</span>
                        </div>
                    </div>

                    <section className={styles.formPanel} id="waitlist-form" aria-labelledby="form-title">
                        <div className={styles.formHeading}>
                            <span className={styles.formIndex}>01 <i aria-hidden="true" /></span>
                            <h2 id="form-title">Get early access.</h2>
                            <p>Be among the first to join ArchiCareer.</p>
                        </div>
                        <WaitlistForm idPrefix="early-access" submitLabel="Join the Waitlist" />
                    </section>
                </section>
            </div>

            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} ArchiCareer</span>
                <span className={styles.footerNote}>Creates. Connects. Builds.</span>
                <Link href="/privacy">Privacy</Link>
            </footer>
        </main>
    );
}
