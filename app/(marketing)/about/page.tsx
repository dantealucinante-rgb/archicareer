import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import { pageMetadata } from "@/lib/seo";
import landing from "../landing.module.css";
import styles from "./about.module.css";

export const metadata: Metadata = pageMetadata({
    title: "About Archicareer",
    description: "ArchiCareer gives architecture, design and built-environment professionals a place to showcase work, connect and discover opportunities.",
    path: "/about",
});

const disciplines = [
    "Architecture", "Interiors", "Landscape", "Construction", "Urban design", "Engineering", "Visualisation", "Materials",
];

const waysToUse = [
    { number: "01", title: "Put your work in view.", body: "Create a professional profile, publish projects and give people a clearer picture of how you think and what you make.", href: "/discover", action: "Explore profiles and projects" },
    { number: "02", title: "Find your people.", body: "Discover professionals, studios and businesses working across the many disciplines that shape the built environment.", href: "/discover", action: "Meet the community" },
    { number: "03", title: "See what comes next.", body: "Explore roles, internships and other opportunities shared by organisations in the industry.", href: "/jobs", action: "Browse opportunities" },
];

export default function AboutPage() {
    return <div className={styles.aboutPage}>
        <MarketingHeader />
        <main id="about-main">
            <section className={styles.hero} aria-labelledby="about-title">
                <div className={styles.heroInner}>
                    <div className={styles.heroCopy}>
                        <div className={`${landing.brandStatement} ${styles.brandStatement}`}>
                            <span className={landing.creates}>CREATES.</span>
                            <span className={landing.connects}>CONNECTS.</span>
                            <span className={landing.builds}>BUILDS.</span>
                        </div>
                        <p className={styles.eyebrow}>ArchiCareer / About</p>
                        <h1 id="about-title">Good work deserves to be <span>seen.</span></h1>
                        <p className={styles.heroDescription}>A professional home for the people who design, make and build our world. Showcase your work, find your community and discover what comes next.</p>
                        <div className={styles.heroActions}>
                            <Link href="/discover" className={`${landing.pillButton} ${landing.primaryButton}`}>Explore ArchiCareer</Link>
                            <Link href="/signup" className={`${landing.pillButton} ${landing.secondaryButton}`}>Join the community</Link>
                        </div>
                    </div>
                    <div className={styles.heroVisual}>
                        <figure className={styles.heroImage}>
                            <Image src="/hero/archicareer-public-plaza.jpg" alt="A landscaped public plaza with a circular reflecting pool and places to gather" fill priority sizes="(max-width: 760px) 100vw, 48vw" />
                            <figcaption>Places are shaped by many hands.</figcaption>
                        </figure>
                        <figure className={styles.detailImage}>
                            <Image src="/hero/archicareer-material-samples.jpg" alt="A collection of stone, timber and other building material samples" fill sizes="(max-width: 760px) 45vw, 20vw" />
                            <figcaption>Ideas / Materials / Practice</figcaption>
                        </figure>
                        <p className={styles.visualIndex}>A-07 <span>Architecture · Design · Construction</span></p>
                    </div>
                </div>
            </section>

            <section className={styles.mission} aria-labelledby="mission-title">
                <div className={styles.missionLabel}><span>OUR MISSION</span><span>01 / 03</span></div>
                <div className={styles.missionContent}>
                    <h2 id="mission-title">Make good work easier to <em>discover.</em></h2>
                    <div>
                        <p>Architecture and the built environment depend on people with different skills, perspectives and ways of working. ArchiCareer brings professional profiles, project portfolios, community and opportunities into one place.</p>
                        <p>We are building for the students, professionals, practices and businesses whose work shapes the places and spaces around us.</p>
                    </div>
                </div>
                <div className={styles.disciplines} aria-label="Disciplines across the built environment">
                    {disciplines.map((discipline, index) => <span key={discipline} className={styles[`discipline${index % 4}`]}>{discipline}</span>)}
                </div>
            </section>

            <section className={styles.platform} aria-labelledby="platform-title">
                <div className={styles.platformHeading}>
                    <p className={styles.eyebrow}>A place for the work</p>
                    <h2 id="platform-title">Built around what <span>you do.</span></h2>
                    <p>From your first portfolio project to the next role, ArchiCareer helps bring the parts of professional life closer together.</p>
                </div>
                <div className={styles.waysList}>
                    {waysToUse.map((item) => <article className={styles.way} key={item.number}>
                        <span className={styles.wayNumber}>{item.number}</span>
                        <div className={styles.wayCopy}><h3>{item.title}</h3><p>{item.body}</p></div>
                        <Link href={item.href}>{item.action}<span aria-hidden="true"> ↗</span></Link>
                    </article>)}
                </div>
            </section>

            <section className={styles.closing} aria-labelledby="closing-title">
                <div><p>ArchiCareer / Creates. Connects. Builds.</p><h2 id="closing-title">Your work belongs in the conversation.</h2></div>
                <Link href="/signup" className={`${landing.pillButton} ${landing.finalButton}`}>Join ArchiCareer <span aria-hidden="true">↗</span></Link>
            </section>
        </main>
        <MarketingFooter />
    </div>;
}
