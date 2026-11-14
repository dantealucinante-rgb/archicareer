import type { Metadata } from "next";
import Image from "next/image";
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

const work = [
    { src: "/hero/render-pavilion-study.svg", alt: "An isometric render of a pavilion with a broad roof and a courtyard", caption: "Pavilion study" },
    { src: "/hero/archicareer-cultural-pavilion.jpg", alt: "A contemporary public pavilion with a broad timber roof", caption: "Cultural pavilion" },
    { src: "/hero/render-studio-interior.svg", alt: "An isometric render of a studio interior with a mezzanine", caption: "Studio interior" },
];

export default function WaitlistPage() {
    return <main className={styles.page}>
        <a href="#waitlist-form" className={styles.skipLink}>Skip to the form</a>

        <header className={styles.header}>
            <Link href="/" className={styles.wordmark} aria-label="ArchiCareer home">
                <BrandLogo className={styles.logo} />
            </Link>
            <p className={styles.edition}><span aria-hidden="true" />Early access</p>
        </header>

        <div className={styles.content}>
            <section className={styles.hero} aria-labelledby="waitlist-title">
                <div className={styles.heroCopy}>
                    <h1 id="waitlist-title">Put your work in view.</h1>
                    <p className={styles.lede}>ArchiCareer opens soon. Join the early access list to publish your projects and be found by studios, practices and the people you want to work with.</p>

                    <div className={styles.formBlock} id="waitlist-form">
                        <p className={styles.formLabel}>Early access list</p>
                        <WaitlistForm idPrefix="early-access" submitLabel="Join the list" />
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <figure className={styles.heroImage}>
                        <Image src="/hero/render-courtyard-housing.svg" alt="An isometric render of a courtyard housing scheme" fill priority sizes="(max-width: 900px) 100vw, 44vw" />
                        <figcaption>Courtyard housing</figcaption>
                    </figure>
                    <figure className={styles.heroDetail}>
                        <Image src="/hero/archicareer-modern-facade.jpg" alt="A contemporary building with a textured facade beneath a blue sky" fill sizes="(max-width: 900px) 40vw, 18vw" />
                        <figcaption>Form and detail</figcaption>
                    </figure>
                </div>
            </section>

            <section className={styles.work} aria-label="Work made on ArchiCareer">
                {work.map((item) => <figure key={item.caption} className={styles.workItem}>
                    <div className={styles.workImage}><Image src={item.src} alt={item.alt} fill sizes="(max-width: 700px) 100vw, 30vw" /></div>
                    <figcaption>{item.caption}</figcaption>
                </figure>)}
            </section>
        </div>

        <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} ArchiCareer</span>
            <Link href="/privacy">Privacy</Link>
        </footer>
    </main>;
}
