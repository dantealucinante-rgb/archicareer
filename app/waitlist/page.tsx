import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";
import WaitlistForm from "./WaitlistForm";
import WaitlistParallax from "./WaitlistParallax";
import styles from "./waitlist.module.css";

export const metadata: Metadata = {
    title: "Join the ArchiCareer waitlist",
    description: "A new place for the people, practices and businesses shaping architecture and the built environment. Join ArchiCareer’s early access list.",
    alternates: { canonical: "/waitlist" },
    openGraph: {
        title: "ArchiCareer — Creates. Connects. Builds.",
        description: "Show your work, meet your industry and find what comes next.",
        images: [{ url: "/hero/archicareer-modern-facade.jpg", alt: "A contemporary building with a patterned facade against a blue sky" }],
    },
};

const people = [
    "Architects", "Interior designers", "Landscape architects", "Engineers", "Students", "Contractors", "Builders", "Urban planners", "3D visualisers", "Material suppliers", "Manufacturers", "Design firms", "Construction businesses",
];

function MediaFigure({ src, alt, caption, speed, className = "", priority = false }: { src: string; alt: string; caption: string; speed: number; className?: string; priority?: boolean }) {
    return <figure className={`${styles.mediaFigure} ${className}`}>
        <div className={styles.mediaViewport}>
            <div className={styles.parallaxLayer} data-parallax data-parallax-speed={speed}>
                <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 62vw, 50vw" className={styles.image} />
            </div>
        </div>
        <figcaption>{caption}</figcaption>
    </figure>;
}

export default function WaitlistPage() {
    return <main className={styles.page}>
        <WaitlistParallax />
        <a href="#hero-title" className={styles.skipLink}>Skip to content</a>
        <header className={styles.navigation}>
            <Link href="/waitlist" className={styles.wordmark} aria-label="ArchiCareer waitlist home">
                <BrandMark fill="#FFFFFF" className={styles.brandMark} />
                <span>ARCHICAREER</span>
            </Link>
            <nav className={styles.desktopNav} aria-label="Waitlist page navigation">
                <a href="#platform">About</a><a href="#projects">Projects</a><a href="#community">Community</a><a href="#opportunities">Opportunities</a>
            </nav>
            <a className={styles.navCta} href="#join">Join the waitlist</a>
            <details className={styles.mobileMenu}>
                <summary aria-label="Open navigation menu">Menu</summary>
                <nav aria-label="Mobile navigation">
                    <a href="#platform">About</a><a href="#projects">Projects</a><a href="#community">Community</a><a href="#opportunities">Opportunities</a><a href="#join">Join the waitlist</a>
                </nav>
            </details>
        </header>

        <section className={styles.hero} id="top" aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
                <p className={styles.brandStatement}>A new professional home for the built environment</p>
                <h1 id="hero-title"><span>CREATES.</span><span>CONNECTS.</span><span>BUILDS.</span></h1>
                <div className={styles.heroMessage}>
                    <h2>Where the people shaping the built environment come together.</h2>
                    <p>Showcase your work, discover exceptional projects, connect with industry professionals and find opportunities to take your ideas further.</p>
                </div>
                <div className={styles.heroActions}>
                    <a href="#join" className={styles.primaryButton}>Join the Waitlist</a>
                    <a href="#platform" className={styles.secondaryLink}>Discover ArchiCareer <span aria-hidden="true">↓</span></a>
                </div>
            </div>
            <MediaFigure src="/hero/archicareer-modern-facade.jpg" alt="A contemporary building with a precise patterned facade rising into a broad blue sky" caption="Built form / Facade study" speed={0.12} className={styles.heroImage} priority />
            <div className={styles.heroIndex} aria-hidden="true"><span>AC / 01</span><span>Architecture · Design · Construction</span></div>
        </section>

        <section className={styles.platform} id="platform" aria-labelledby="platform-title">
            <div className={styles.platformHeading}>
                <p className={styles.sectionMark}>A wider professional world</p>
                <h2 id="platform-title">One industry.<br /><span>Countless ways</span><br />to create.</h2>
            </div>
            <div className={styles.platformAside}>
                <p>From the first sketch to the finished structure, ArchiCareer brings together the people, ideas and businesses shaping the places we live, work and experience.</p>
                <p className={styles.platformNote}>Many disciplines. Shared ground.</p>
            </div>
            <div className={styles.peopleList} aria-label="The people ArchiCareer brings together">
                {people.map((person, index) => <span key={person} className={styles[`personTone${index % 4}`]}>{person}</span>)}
            </div>
            <MediaFigure src="/hero/render-urban-campus.svg" alt="Architectural study of a mixed-use campus set within a landscaped urban block" caption="Urban study / Shared ground" speed={-0.06} className={styles.platformImage} />
        </section>

        <section className={styles.projects} id="projects" aria-labelledby="projects-title">
            <div className={styles.sectionHeading}>
                <div><p className={styles.sectionMark}>01 / Projects</p><h2 id="projects-title">Good work deserves <span>to be seen.</span></h2></div>
                <p>Discover projects, explore ideas and put your work in front of people who understand its value.</p>
            </div>
            <div className={styles.projectMosaic}>
                <MediaFigure src="/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg" alt="A monumental angular museum building reflected in a still pool" caption="Architecture / Public life" speed={0.1} className={styles.projectA} />
                <MediaFigure src="/hero/render-pavilion-study.svg" alt="Architectural study of a long-roofed cultural pavilion beside water and tropical planting" caption="Pavilion study / Shade and gathering" speed={-0.08} className={styles.projectB} />
                <MediaFigure src="/hero/archicareer-material-samples.jpg" alt="A curated selection of stone, timber, concrete, brick and textured finish samples" caption="Material study / Tactile ideas" speed={0.07} className={styles.projectC} />
                <MediaFigure src="/hero/render-courtyard-housing.svg" alt="Architectural study of an apartment building arranged around a planted courtyard" caption="Housing study / Courtyard living" speed={-0.09} className={styles.projectD} />
            </div>
            <a className={styles.sectionLink} href="#join">Explore ArchiCareer <span aria-hidden="true">↗</span></a>
        </section>

        <section className={styles.community} id="community" aria-labelledby="community-title">
            <div className={styles.communityIntro}>
                <p className={styles.sectionMark}>02 / Community</p>
                <h2 id="community-title">Your industry.<br /><span>Your people.</span></h2>
                <p>Meet professionals, discover firms, build meaningful connections and find people who can help bring your ideas to life.</p>
            </div>
            <div className={styles.communityImages}>
                <MediaFigure src="/hero/archicareer-public-plaza.jpg" alt="People gathering around a circular reflecting pool in a landscaped public plaza" caption="Public space / Everyday connection" speed={0.08} className={styles.communityPhoto} />
                <MediaFigure src="/hero/render-studio-interior.svg" alt="Architectural interior study with a long shared worktable, timber details and full-height glazing" caption="Studio study / Work in progress" speed={-0.07} className={styles.communityRender} />
                <p className={styles.imageNote}>Good places are made by many hands.</p>
            </div>
        </section>

        <section className={styles.opportunities} id="opportunities" aria-labelledby="opportunities-title">
            <div className={styles.opportunityCopy}>
                <p className={styles.sectionMark}>03 / Opportunities</p>
                <h2 id="opportunities-title">Make room for <span>what’s next.</span></h2>
                <p>Discover opportunities, find collaborators, explore professional roles and take the next step in your career.</p>
                <ul><li>Professional opportunities</li><li>Industry roles and internships</li><li>Visibility for your work</li></ul>
                <a href="#join" className={styles.darkButton}>Get early access</a>
            </div>
            <MediaFigure src="/hero/render-structure-study.svg" alt="Architectural study showing a layered building frame, structure and construction sequence" caption="Structure study / From idea to build" speed={0.09} className={styles.opportunityImage} />
        </section>

        <section className={styles.join} id="join" aria-labelledby="join-title">
            <div className={styles.joinIntro}>
                <p className={styles.sectionMark}>Early access / 2026</p>
                <h2 id="join-title">Be part of what <span>comes next.</span></h2>
                <p>ArchiCareer is bringing the built environment community into one place. Get early access and be among the first to experience it.</p>
            </div>
            <div className={styles.formShell}><WaitlistForm idPrefix="early-access" submitLabel="Join the Waitlist" /></div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
            <MediaFigure src="/hero/archicareer-cultural-pavilion.jpg" alt="A contemporary cultural pavilion with a wide timber canopy and transparent ground floor" caption="A new space for ideas" speed={0.08} className={styles.closingImage} />
            <div className={styles.closingCopy}>
                <p className={styles.sectionMark}>ArchiCareer / The next chapter</p>
                <h2 id="closing-title">The future of the built environment is connected.</h2>
                <p>Your work belongs here. Your next opportunity might be closer than you think.</p>
                <a href="#join" className={styles.primaryButton}>Get Early Access</a>
            </div>
        </section>

        <footer className={styles.footer}>
            <div className={styles.footerBrand}><Link href="/waitlist" className={styles.wordmark} aria-label="ArchiCareer waitlist home"><BrandMark fill="#FFFFFF" className={styles.brandMark} /><span>ARCHICAREER</span></Link><p>A professional home for people who create, connect and build.</p></div>
            <nav className={styles.footerLinks} aria-label="Footer links"><a href="https://www.linkedin.com/company/archicareer/" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="mailto:hello@archicareer.ng">Email ↗</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
            <p className={styles.copyright}>© {new Date().getFullYear()} ArchiCareer</p>
        </footer>
    </main>;
}
