import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
    title: "404 — Page not found",
    description: "This page could not be found. Find your way back to ArchiCareer.",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return <main className={styles.notFound}>
        <section className={styles.layout} aria-labelledby="not-found-title">
            <div className={styles.copy}>
                <span className={styles.label}>ArchiCareer · 404</span>
                <p className={styles.code} aria-hidden="true">404<span>.</span></p>
                <h1 id="not-found-title">THIS PAGE<br />ISN’T ON THE PLAN.</h1>
                <p className={styles.description}>The page may have moved or the link may be out of date. Let’s get you back to the work, people, and opportunities.</p>
                <nav className={styles.actions} aria-label="Helpful links">
                    <Link href="/" className={styles.homeAction}>Go to homepage <span aria-hidden="true">↗</span></Link>
                    <Link href="/discover" className={styles.discoverAction}>Explore Discover</Link>
                    <Link href="/jobs" className={styles.jobsAction}>Browse jobs <span aria-hidden="true">→</span></Link>
                </nav>
            </div>

            <div className={styles.planPanel} aria-hidden="true">
                <div className={styles.planHeader}><span>ARCHICAREER</span><span>PLAN REF. 404</span></div>
                <svg className={styles.floorPlan} viewBox="0 0 420 340" fill="none">
                    <path d="M42 42H218V116H376V298H236V232H42V42Z" />
                    <path d="M218 42V116M294 116V190M294 190H376M236 232V298M42 142H116V232M116 142H166" />
                    <path d="M166 142H218V190H260" className={styles.routeLine} />
                    <circle cx="278" cy="190" r="30" className={styles.marker} />
                    <path d="m268 180 20 20m0-20-20 20" className={styles.markerCross} />
                    <path d="M42 324H116M124 324h20" className={styles.scale} />
                </svg>
                <span className={styles.planCaption}>LOCATION / UNKNOWN</span>
                <span className={styles.planSticker}>FIND YOUR WAY BACK</span>
            </div>
        </section>
    </main>;
}
