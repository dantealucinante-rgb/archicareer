import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import { getJobListings } from "@/lib/queries/jobs";
import type { JobListing } from "@/types";
import styles from "./landing.module.css";

export const metadata: Metadata = {
    title: "Showcase your ideas and projects",
    description: "Bring your work into view, connect with people across your industry and discover opportunities to take your ideas further. ArchiCareer gives the people who create and build things a place to showcase their work and grow professionally.",
    openGraph: {
        type: "website",
        title: "ArchiCareer — Showcase your ideas and projects",
        description: "Bring your work into view, connect with people across your industry and discover opportunities to take your ideas further.",
    },
    twitter: {
        card: "summary_large_image",
        title: "ArchiCareer — Showcase your ideas and projects",
        description: "Bring your work into view, connect with people across your industry and discover opportunities to take your ideas further.",
    },
};

const professions = [
    "Architects",
    "Interior designers",
    "Landscape architects",
    "Structural and construction engineers",
    "Builders and contractors",
    "Urban planners",
    "3D artists and visualisers",
    "Product designers",
    "Material designers and suppliers",
];

const projectImages = [
    {
        src: "/hero/jimmy-chang-ACt8ycSzpdE-unsplash.jpg",
        alt: "Curving contemporary architecture framed against a blue sky",
        caption: "Form and space",
        className: "projectFeature",
    },
    {
        src: "/hero/tobias-keller-2ecH5Lw3zSk-unsplash.jpg",
        alt: "A close view of an angular silver building facade",
        caption: "Materials and detail",
        className: "projectTop",
    },
    {
        src: "/hero/tope-a-asokere-AftbId8-N_w-unsplash.jpg",
        alt: "A traditional earthen building set among tropical trees",
        caption: "Building and place",
        className: "projectBottom",
    },
];

function OpportunityRow({ job }: { job: JobListing }) {
    return (
        <article className={styles.jobRow}>
            <div className={styles.jobTitle}>
                <h3>{job.title}</h3>
                <p>{job.firm_name}</p>
            </div>
            <p className={styles.jobMeta}>
                <span>{job.location}</span>
                <span>{job.type} · {job.pay_type === "paid" ? "Paid" : job.pay_type === "unpaid" ? "Unpaid" : "Pay not disclosed"}</span>
            </p>
            <Link href={`/jobs/${job.id}`} className={styles.jobAction}>View opportunity</Link>
        </article>
    );
}

export default async function HomePage() {
    const { data: jobs, error: jobsError } = await getJobListings({}, { limit: 2, offset: 0 });

    return (
        <div className={styles.landingPage}>
            <header className={styles.publicHeader}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.wordmark} aria-label="ArchiCareer home">
                        <BrandLogo className={styles.logo} />
                    </Link>

                    <nav className={styles.desktopNav} aria-label="Main navigation">
                        <a href="#projects">Projects</a>
                        <a href="#community">Community</a>
                        <a href="#opportunities">Opportunities</a>
                        <a href="#portfolios">Portfolios</a>
                    </nav>

                    <div className={styles.headerActions}>
                        <Link href="/login" className={styles.signIn}>Sign in</Link>
                        <Link href="/signup" className={`${styles.pillButton} ${styles.headerJoin}`}>Join</Link>
                    </div>

                    <details className={styles.mobileMenu}>
                        <summary>Menu</summary>
                        <nav aria-label="Mobile navigation">
                            <Link href="/discover">Explore projects and people</Link>
                            <Link href="/jobs">Career opportunities</Link>
                            <Link href="/about">About ArchiCareer</Link>
                            <Link href="/login">Sign in</Link>
                            <Link href="/signup">Join ArchiCareer</Link>
                        </nav>
                    </details>
                </div>
            </header>

            <main id="home">
                <section className={styles.hero} aria-labelledby="hero-title">
                    <div className={styles.heroInner}>
                        <div className={styles.heroCopy}>
                            <div className={styles.brandStatement}>
                                <span className={styles.creates}>CREATES.</span>
                                <span className={styles.connects}>CONNECTS.</span>
                                <span className={styles.builds}>BUILDS.</span>
                            </div>
                            <h1 id="hero-title" className={styles.heroTitle}>
                                <span>Showcase your <em>ideas.</em></span>
                                <span>Share your <strong>projects.</strong></span>
                                <span>Put exceptional work in view.</span>
                            </h1>
                            <p className={styles.heroDescription}>Bring your work into view, connect with people across your industry and discover opportunities to take your ideas further. ArchiCareer gives the people who create and build things a place to showcase their work and grow professionally.</p>
                            <div className={styles.heroActions}>
                                <Link href="/signup" className={`${styles.pillButton} ${styles.primaryButton}`}>Join ArchiCareer</Link>
                                <Link href="/discover" className={`${styles.pillButton} ${styles.secondaryButton}`}>Explore Projects</Link>
                            </div>
                        </div>

                        <div className={styles.heroVisual}>
                            <figure className={styles.heroImage}>
                                <Image src="/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg" alt="An angular glass and metal building beneath an open sky" fill priority sizes="(max-width: 760px) 100vw, (max-width: 1100px) 90vw, 47vw" />
                                <figcaption>Ideas take shape in many ways.</figcaption>
                            </figure>
                            <figure className={styles.heroDetail}>
                                <Image src="/hero/amir-hosseini-3cl6impBd_8-unsplash.jpg" alt="A close view of a modern building facade" fill sizes="(max-width: 760px) 72vw, 22vw" />
                                <figcaption>Work worth sharing</figcaption>
                            </figure>
                        </div>
                    </div>
                </section>

                <section className={styles.projects} id="projects" aria-labelledby="projects-title">
                    <div className={styles.sectionIntro}>
                        <h2 id="projects-title">Your work deserves to be seen.</h2>
                        <p>Bring ideas, drawings, visualisations and completed projects into view. Make room for the work that shows how you think and what you can make.</p>
                    </div>
                    <div className={styles.projectGallery}>
                        {projectImages.map((project) => (
                            <Link key={project.caption} href="/discover" className={`${styles.projectImage} ${styles[project.className]}`}>
                                <Image src={project.src} alt={project.alt} fill sizes="(max-width: 700px) 100vw, 58vw" />
                                <span>{project.caption}</span>
                            </Link>
                        ))}
                    </div>
                    <div className={styles.projectFooter}>
                        <p>Architecture, interiors, landscapes, objects and the many ideas in between.</p>
                        <Link href="/discover" className={styles.textLink}>Explore projects</Link>
                    </div>
                </section>

                <section className={styles.community} id="community" aria-labelledby="community-title">
                    <div className={styles.communityVisual}>
                        <figure className={styles.communityImage}>
                            <Image src="/hero/dapo-abideen-mqzmjt_4T1w-unsplash.jpg" alt="A golden dome and minaret against the sky" fill sizes="(max-width: 820px) 100vw, 46vw" />
                        </figure>
                        <p className={styles.communityNote}>A wider built world, connected through the work.</p>
                    </div>
                    <div className={styles.communityCopy}>
                        <h2 id="community-title">Your industry.<br />Your people.<br /><span>Your connection.</span></h2>
                        <p>Discover public profiles, explore what people are making and follow professionals whose work you want to keep up with. Build relationships across the people who design, plan and deliver the places and products around us.</p>
                        <ul className={styles.professionList} aria-label="People across the built environment">
                            {professions.map((profession, index) => <li className={styles[`profession${index % 4}`]} key={profession}>{profession}</li>)}
                        </ul>
                        <Link href="/discover" className={styles.textLink}>Meet the community</Link>
                    </div>
                </section>

                <section className={styles.opportunities} id="opportunities" aria-labelledby="opportunities-title">
                    <div className={styles.opportunityHeading}>
                        <h2 id="opportunities-title">Find your next opportunity.</h2>
                        <p>The jobs board brings roles and internships from studios and organisations into one place. Check the live listings below.</p>
                    </div>
                    <div className={styles.jobBoard}>
                        {jobsError ? (
                            <div className={styles.jobEmpty}>
                                <p>The current listings could not load.</p>
                                <span>Visit the jobs board to check available opportunities.</span>
                            </div>
                        ) : jobs?.length ? (
                            jobs.map((job) => <OpportunityRow key={job.id} job={job} />)
                        ) : (
                            <div className={styles.jobEmpty}>
                                <p>There are no open opportunities listed right now.</p>
                                <span>Visit the jobs board for updates.</span>
                            </div>
                        )}
                        <div className={styles.jobBoardFooter}>
                            <span>{jobsError ? "Check the board for current listings" : jobs?.length ? "Recently posted openings" : "No open listings are posted right now"}</span>
                            <Link href="/jobs" className={`${styles.pillButton} ${styles.jobBrowse}`}>Browse the jobs board</Link>
                        </div>
                    </div>
                </section>

                <section className={styles.portfolios} id="portfolios" aria-labelledby="portfolios-title">
                    <div className={styles.portfolioVisual}>
                        <figure className={styles.portfolioImage}>
                            <Image src="/hero/joel-filipe-RFDP7_80v5A-unsplash.jpg" alt="A bright white modern building set against a pale blue sky" fill sizes="(max-width: 820px) 100vw, 48vw" />
                        </figure>
                        <div className={styles.portfolioAccent}>A profile that puts the work first.</div>
                    </div>
                    <div className={styles.portfolioCopy}>
                        <h2 id="portfolios-title">Make your work part of your identity.</h2>
                        <p>Bring your professional profile and published projects together in a public space that reflects your practice. Share the project details, tools and ideas behind the work.</p>
                        <Link href="/discover" className={`${styles.pillButton} ${styles.portfolioButton}`}>Explore professional profiles</Link>
                    </div>
                </section>

                <section className={styles.finalCta} aria-labelledby="final-title">
                    <div>
                        <p>Creates. Connects. Builds.</p>
                        <h2 id="final-title">Put your work in view.</h2>
                    </div>
                    <Link href="/signup" className={`${styles.pillButton} ${styles.finalButton}`}>Join ArchiCareer</Link>
                </section>
            </main>

            <footer className={styles.landingFooter}>
                <div className={styles.footerMain}>
                    <div className={styles.footerBrand}>
                        <Link href="/" aria-label="ArchiCareer home"><BrandLogo /></Link>
                        <p>A professional home for people who create, connect and build.</p>
                    </div>
                    <nav aria-label="Footer navigation">
                        <Link href="/discover">Explore projects and people</Link>
                        <Link href="/jobs">Jobs and opportunities</Link>
                        <Link href="/about">About ArchiCareer</Link>
                        <Link href="/login">Sign in</Link>
                        <Link href="/signup">Join ArchiCareer</Link>
                        <a href="mailto:hello@archicareer.ng">Contact</a>
                    </nav>
                </div>
                <div className={styles.footerLegal}>
                    <span>© {new Date().getFullYear()} ArchiCareer</span>
                    <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link></div>
                </div>
            </footer>
        </div>
    );
}
