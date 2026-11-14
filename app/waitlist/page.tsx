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
                <div className={styles.edition}><span aria-hidden="true" /> Early access · Nigeria</div>
            </header>

            <div className={styles.content}>
                <section className={styles.register} id="waitlist-form" aria-labelledby="waitlist-title">
                    <div className={styles.formPanel}>
                        <div className={styles.formHeading}>
                            <span className={styles.formIndex}>EARLY ACCESS REGISTRATION</span>
                            <h2 id="form-title">Save your place.</h2>
                            <p>Four quick details. We’ll take it from here.</p>
                        </div>
                        <WaitlistForm idPrefix="early-access" submitLabel="Join the Waitlist" />
                        <div className={styles.formStamp} aria-hidden="true"><span>AC</span><i>26</i></div>
                    </div>

                    <div className={styles.registerIntro}>
                        <p className={styles.kicker}><span>ARCHICAREER</span><span>OPEN CALL 001</span></p>
                        <h1 id="waitlist-title">Make room<br />for your <em>next.</em></h1>
                        <p className={styles.registerDescription}>A new professional home for the people shaping the built world. Get on the early access list.</p>
                        <div className={styles.registerAside}><span>01</span><span>YOUR PLACE STARTS HERE</span></div>
                    </div>
                </section>

                <section className={styles.world} aria-labelledby="world-title">
                    <div className={styles.worldIndex}>
                        <span>BUILT FOR</span>
                        <strong>THE<br />BUILT<br />WORLD</strong>
                        <i aria-hidden="true" />
                    </div>
                    <div className={styles.worldCopy}>
                        <p className={styles.worldKicker}>A platform with your kind of perspective.</p>
                        <h2 id="world-title">From first sketch<br />to <em>finished place.</em></h2>
                        <p>Show the work. Find your people. Discover what’s next across architecture, design and construction.</p>
                    </div>
                    <div className={styles.elevation} aria-hidden="true">
                        <span className={styles.elevationLabel}>FIG. 01 — A CONNECTED PRACTICE</span>
                        <div className={styles.building}><i /><i /><i /><i /><b /></div>
                        <div className={styles.elevationGround} />
                    </div>
                </section>
            </div>

            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} ArchiCareer</span>
                <span className={styles.footerNote}>For the people who make places matter.</span>
                <Link href="/privacy">Privacy</Link>
            </footer>
        </main>
    );
}
