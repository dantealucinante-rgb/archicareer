import Link from "next/link";
import BrandLogo from "./BrandLogo";
import styles from "@/app/(marketing)/landing.module.css";

export function MarketingHeader({ home = false }: { home?: boolean }) {
    const sectionHref = (section: string) => home ? `#${section}` : `/#${section}`;

    return <header className={styles.publicHeader}>
        <div className={styles.headerInner}>
            <Link href="/" className={styles.wordmark} aria-label="ArchiCareer home"><BrandLogo className={styles.logo} /></Link>
            <nav className={styles.desktopNav} aria-label="Main navigation">
                <Link href={sectionHref("projects")}>Projects</Link>
                <Link href={sectionHref("community")}>Community</Link>
                <Link href={sectionHref("opportunities")}>Opportunities</Link>
                <Link href={sectionHref("portfolios")}>Portfolios</Link>
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
    </header>;
}

export function MarketingFooter() {
    return <footer className={styles.landingFooter}>
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
    </footer>;
}
