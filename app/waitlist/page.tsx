import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";
import WaitlistForm from "./WaitlistForm";
import WaitlistReveal from "./WaitlistReveal";
import styles from "./waitlist.module.css";

export const metadata: Metadata = {
    title: "A new space for architecture",
    description: "Join the ArchiCareer waitlist and be among the first to experience a new professional ecosystem for architecture and the built environment.",
    alternates: { canonical: "/waitlist" },
    openGraph: {
        title: "ArchiCareer — A new space for architecture",
        description: "An emerging professional ecosystem for architects, designers, creatives and the people shaping the built environment.",
        images: [{ url: "/hero/jimmy-chang-ACt8ycSzpdE-unsplash.jpg", alt: "Sculptural modern towers rise around a narrow opening of sky" }],
    },
};

const disciplines = [
    { name: "Architects", image: "/hero/amir-hosseini-3cl6impBd_8-unsplash.jpg", alt: "A contemporary facade composed of fine vertical fins", credit: "Amir Hosseini" },
    { name: "Interior designers", image: "/hero/dapo-abideen-mqzmjt_4T1w-unsplash.jpg", alt: "A golden dome and minaret framed against a pale sky", credit: "Dapo Abideen" },
    { name: "Architectural visualisers", image: "/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg", alt: "Angular glass volumes meet above a reflecting pool", credit: "Lance Anderson" },
    { name: "Students", image: "/hero/tope-a-asokere-AftbId8-N_w-unsplash.jpg", alt: "An earthen dwelling sits beneath trees in a green landscape", credit: "Tope A. Asokere" },
    { name: "Landscape architects", image: "/hero/joel-filipe-RFDP7_80v5A-unsplash.jpg", alt: "A quiet white residential facade with deep balconies", credit: "Joel Filipe" },
    { name: "Architecture firms", image: "/hero/tobias-keller-2ecH5Lw3zSk-unsplash.jpg", alt: "A sculptural metallic building curves into the sky", credit: "Tobias Keller" },
    { name: "Construction & design professionals", image: "/hero/jimmy-chang-ACt8ycSzpdE-unsplash.jpg", alt: "A view upward between two sweeping blue and white towers", credit: "Jimmy Chang" },
];

const disciplinePositions = [
    styles.discipline1,
    styles.discipline2,
    styles.discipline3,
    styles.discipline4,
    styles.discipline5,
    styles.discipline6,
    styles.discipline7,
];

export default function WaitlistPage() {
    return (
        <main className={styles.page}>
            <div className={styles.topRule} aria-hidden="true" />
            <div className={styles.siteFrame}>
                <header className={styles.navigation}>
                    <Link href="/waitlist" className={styles.wordmark} aria-label="ArchiCareer waitlist home">
                        <BrandMark fill="#20211F" className={styles.brandMark} />
                        <span>ARCHICAREER</span>
                    </Link>
                    <p className={styles.navNote}>A new space for the built environment</p>
                    <a className={styles.navLink} href="#join">Join the waitlist</a>
                </header>

                <section className={styles.hero} aria-labelledby="hero-title">
                    <div className={styles.heroCopy}>
                        <p className={styles.kicker}><span>01</span> An emerging professional ecosystem</p>
                        <h1 id="hero-title">The future of architecture deserves a <em>new space.</em></h1>
                        <p className={styles.heroDescription}>An emerging professional ecosystem for architects, designers, creatives and the people shaping the built environment.</p>
                        <div className={styles.heroAction}>
                            <a className={styles.textAction} href="#hero-form">Join the Waitlist</a>
                            <span>Be among the first to experience ArchiCareer.</span>
                        </div>
                        <p className={styles.heroIndex}>A professional home for ideas, people and what comes next.</p>
                    </div>

                    <figure className={styles.heroImage}>
                        <Image
                            src="/hero/jimmy-chang-ACt8ycSzpdE-unsplash.jpg"
                            alt="A view upward between sculptural blue and white modern towers"
                            fill
                            priority
                            sizes="(max-width: 760px) 100vw, 52vw"
                            className={styles.image}
                        />
                        <figcaption><span>Space, shape, possibility</span><span>01 / 07&nbsp;&nbsp; J. Chang · Unsplash</span></figcaption>
                    </figure>

                    <div id="hero-form" className={styles.heroForm}>
                        <div className={styles.formHeading}>
                            <p className={styles.kicker}><span>OPEN CALL</span></p>
                            <h2>Make room for what’s next.</h2>
                        </div>
                        <WaitlistForm idPrefix="hero" submitLabel="Join the Waitlist" />
                    </div>
                </section>

                <section className={styles.introduction} aria-labelledby="intro-title">
                    <WaitlistReveal direction="left" className={styles.editorialReveal}>
                    <div className={styles.introImages}>
                        <figure className={styles.introMainImage}>
                            <Image src="/hero/dapo-abideen-mqzmjt_4T1w-unsplash.jpg" alt="A mosque's golden dome and minaret against an open sky" fill sizes="(max-width: 760px) 100vw, 46vw" className={styles.image} />
                            <figcaption>Dapo Abideen / Unsplash</figcaption>
                        </figure>
                        <figure className={styles.introInsetImage}>
                            <Image src="/hero/tope-a-asokere-AftbId8-N_w-unsplash.jpg" alt="An earthen home among trees, grounded in its landscape" fill sizes="(max-width: 760px) 42vw, 18vw" className={styles.image} />
                            <figcaption>Tope A. Asokere / Unsplash</figcaption>
                        </figure>
                        <span className={styles.introFigureNote}>Places carry the imprint of many hands.</span>
                    </div>
                    </WaitlistReveal>
                    <WaitlistReveal direction="right" className={styles.editorialReveal}>
                    <div className={styles.introCopy}>
                        <p className={styles.kicker}><span>02</span> A broader view</p>
                        <h2 id="intro-title">Architecture is more than buildings. <em>It’s a community.</em></h2>
                        <p>Behind every remarkable space is a network of people, ideas and creative possibilities. ArchiCareer is being built to bring that industry closer together.</p>
                        <span className={styles.sideNote}>From the first sketch to the city beyond it.</span>
                    </div>
                    </WaitlistReveal>
                </section>

                <section className={styles.industry} aria-labelledby="industry-title">
                    <WaitlistReveal direction="up" className={styles.industryReveal}>
                    <div className={styles.industryHeading}>
                        <div>
                            <p className={styles.kicker}><span>03</span> A shared discipline</p>
                            <h2 id="industry-title">Built for everyone shaping the <em>built environment.</em></h2>
                        </div>
                        <p>Different practices. Different scales. One connected professional world.</p>
                    </div>
                    </WaitlistReveal>
                    <div className={styles.disciplineGrid}>
                        {disciplines.map((discipline, index) => (
                            <figure className={`${styles.discipline} ${disciplinePositions[index]}`} key={discipline.name}>
                                <div className={styles.disciplineImage}>
                                    <Image src={discipline.image} alt={discipline.alt} fill sizes="(max-width: 600px) 48vw, (max-width: 1020px) 32vw, 24vw" className={styles.image} />
                                    <span className={styles.disciplineNumber}>{String(index + 1).padStart(2, "0")}</span>
                                </div>
                                <figcaption><span>{discipline.name}</span><span>{discipline.credit} / Unsplash</span></figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                <section className={styles.features} aria-labelledby="features-title">
                    <WaitlistReveal direction="up" className={styles.featuresReveal}>
                    <div className={styles.featuresHeading}>
                        <p className={styles.kicker}><span>04</span> What is coming</p>
                        <h2 id="features-title">A place to make your next move.</h2>
                    </div>
                    </WaitlistReveal>
                    <article className={`${styles.feature} ${styles.featureWork}`}>
                        <WaitlistReveal direction="left" className={styles.featureReveal}>
                        <div className={styles.featureRevealGrid}>
                        <figure className={styles.featureImage}>
                            <Image src="/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg" alt="A precise, geometric museum form reflected in water" fill sizes="(max-width: 760px) 100vw, 54vw" className={styles.image} />
                            <figcaption>Lance Anderson / Unsplash</figcaption>
                        </figure>
                        <div className={styles.featureCopy}>
                            <p className={styles.featureNumber}>01 <span>YOUR WORK</span></p>
                            <h3>Give your projects a <em>professional home.</em></h3>
                            <p>Bring your portfolio into focus. Give each project room for its images, ideas and the part you played in making it.</p>
                            <span className={styles.featureFoot}>A considered home for the work you make.</span>
                        </div>
                        </div>
                        </WaitlistReveal>
                    </article>
                    <article className={`${styles.feature} ${styles.featureNetwork}`}>
                        <WaitlistReveal direction="right" className={styles.featureReveal}>
                        <div className={`${styles.featureRevealGrid} ${styles.featureRevealNetwork}`}>
                        <div className={styles.featureCopy}>
                            <p className={styles.featureNumber}>02 <span>YOUR NETWORK</span></p>
                            <h3>Connect with the people shaping the <em>industry.</em></h3>
                            <p>Meet peers, discover practices and find the people whose perspectives can move a project — or a career — forward.</p>
                            <span className={styles.featureFoot}>The built environment is built together.</span>
                        </div>
                        <figure className={styles.featureImage}>
                            <Image src="/hero/amir-hosseini-3cl6impBd_8-unsplash.jpg" alt="The layered rhythm of a contemporary building facade" fill sizes="(max-width: 760px) 100vw, 54vw" className={styles.image} />
                            <figcaption>Amir Hosseini / Unsplash</figcaption>
                        </figure>
                        </div>
                        </WaitlistReveal>
                    </article>
                    <article className={`${styles.feature} ${styles.featureOpportunities}`}>
                        <WaitlistReveal direction="up" className={styles.featureReveal}>
                        <div className={styles.featureRevealGrid}>
                        <figure className={styles.featureImage}>
                            <Image src="/hero/joel-filipe-RFDP7_80v5A-unsplash.jpg" alt="Light falls across the deep balconies of a white residential building" fill sizes="(max-width: 760px) 100vw, 54vw" className={styles.image} />
                            <figcaption>Joel Filipe / Unsplash</figcaption>
                        </figure>
                        <div className={styles.featureCopy}>
                            <p className={styles.featureNumber}>03 <span>YOUR OPPORTUNITIES</span></p>
                            <h3>Discover what <em>comes next.</em></h3>
                            <p>Find opportunities shared by architecture studios and built-environment teams, and take the next step in your professional story.</p>
                            <span className={styles.featureFoot}>A clearer path from discovery to possibility.</span>
                        </div>
                        </div>
                        </WaitlistReveal>
                    </article>
                </section>

                <section id="join" className={styles.joinSection} aria-labelledby="join-title">
                    <WaitlistReveal direction="left" className={styles.joinReveal}>
                    <figure className={styles.joinImage}>
                        <Image src="/hero/tobias-keller-2ecH5Lw3zSk-unsplash.jpg" alt="Sculptural metal cladding wraps around a contemporary building" fill sizes="(max-width: 760px) 100vw, 45vw" className={styles.image} />
                        <figcaption>Tobias Keller / Unsplash</figcaption>
                    </figure>
                    </WaitlistReveal>
                    <WaitlistReveal direction="right" className={styles.joinReveal}>
                    <div className={styles.joinCopy}>
                        <p className={styles.kicker}><span>05</span> The first chapter</p>
                        <h2 id="join-title">Be part of what <em>comes next.</em></h2>
                        <p>Join the growing community of people who believe architecture deserves a stronger professional ecosystem.</p>
                        <WaitlistForm idPrefix="early-access" submitLabel="Get Early Access" />
                    </div>
                    </WaitlistReveal>
                </section>
            </div>

            <section className={styles.closing} aria-labelledby="closing-title">
                <Image src="/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg" alt="A modern museum's intersecting glass and stone forms at dusk" fill sizes="100vw" className={styles.image} />
                <div className={styles.closingShade} aria-hidden="true" />
                <WaitlistReveal direction="up" className={styles.closingReveal}>
                <div className={styles.closingText}>
                    <p className={styles.kicker}><span>ARCHICAREER / 2026</span></p>
                    <h2 id="closing-title">Every great project starts <em>somewhere.</em></h2>
                </div>
                </WaitlistReveal>
                <footer className={styles.footer}>
                    <div className={styles.footerBrand}>
                        <Link href="/waitlist" className={styles.wordmark} aria-label="ArchiCareer waitlist home">
                            <BrandMark fill="#F5F3EE" className={styles.brandMark} />
                            <span>ARCHICAREER</span>
                        </Link>
                        <p>An emerging professional ecosystem for the people shaping the built environment.</p>
                    </div>
                    <nav className={styles.footerLinks} aria-label="Footer links">
                        <a href="https://www.linkedin.com/company/archicareer/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
                        <a href="mailto:hello@archicareer.ng">Email ↗</a>
                        <Link href="/privacy">Privacy</Link>
                    </nav>
                    <p className={styles.copyright}>© {new Date().getFullYear()} ArchiCareer</p>
                </footer>
            </section>
        </main>
    );
}
