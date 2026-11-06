import type { ReactNode } from "react";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import styles from "./legal-document.module.css";

type LegalSection = readonly [string, ReactNode];

export default function LegalDocumentLayout({
    label,
    title,
    description,
    updated,
    sections,
}: {
    label: string;
    title: string;
    description: string;
    updated: string;
    sections: readonly LegalSection[];
}) {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.brand} aria-label="ArchiCareer home"><BrandLogo /></Link>
                    <nav className={styles.headerNav} aria-label="Main navigation">
                        <Link href="/discover">Explore</Link>
                        <Link href="/jobs">Opportunities</Link>
                        <Link href="/about">About</Link>
                    </nav>
                    <Link href="/signup" className={styles.join}>Join ArchiCareer</Link>
                </div>
            </header>

            <main className={styles.main}>
                <header className={styles.hero}>
                    <p className={styles.label}>{label}</p>
                    <h1>{title}</h1>
                    <p className={styles.description}>{description}</p>
                    <p className={styles.updated}>Last updated <time>{updated}</time></p>
                </header>

                <div className={styles.document}>
                    <nav className={styles.contents} aria-label={`${title} contents`}>
                        <p>On this page</p>
                        <ol>{sections.map(([heading], index) => <li key={heading}><a href={`#section-${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span>{heading.replace(/^\d+\.\s*/, "")}</a></li>)}</ol>
                    </nav>
                    <article className={styles.sections}>
                        {sections.map(([heading, body], index) => (
                            <section key={heading} id={`section-${index + 1}`} className={styles.section}>
                                <span className={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</span>
                                <div className={styles.sectionBody}>
                                    <h2>{heading}</h2>
                                    <div className={styles.copy}>{body}</div>
                                </div>
                            </section>
                        ))}
                    </article>
                </div>
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <Link href="/" className={styles.footerBrand} aria-label="ArchiCareer home"><BrandLogo /></Link>
                    <p>A professional home for people who create, connect and build.</p>
                    <nav aria-label="Legal pages"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link></nav>
                    <span className={styles.copyright}>© {new Date().getFullYear()} ArchiCareer</span>
                </div>
            </footer>
        </div>
    );
}
