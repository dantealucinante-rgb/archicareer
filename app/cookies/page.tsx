import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import brand from "@/app/(marketing)/landing.module.css";
import styles from "./cookies.module.css";

const sections = [
    {
        number: "01",
        title: "What cookies do",
        body: "Cookies are small files stored by your browser. They can help a site remember a session, understand basic usage, and keep features working.",
        tone: "blue",
    },
    {
        number: "02",
        title: "How ArchiCareer may use them",
        body: "We may use essential cookies for authentication and security. If we add analytics or optional marketing cookies, this policy will be updated and the relevant choices will be provided.",
        tone: "orange",
    },
    {
        number: "03",
        title: "Your controls",
        body: "Most browsers let you delete or block cookies through their settings. Blocking essential cookies may affect sign-in and other platform features.",
        tone: "teal",
    },
] as const;

export default function CookiesPage() {
    return <div className={`${brand.landingPage} ${styles.cookiesPage}`}>
        <MarketingHeader />
        <main>
            <section className={styles.hero} aria-labelledby="cookies-title">
                <div className={styles.heroInner}>
                    <div>
                        <span className={styles.label}>Cookie policy</span>
                        <h1 id="cookies-title">Small files.<br /><span>Clearly explained.</span></h1>
                        <p>This draft Cookie Policy explains how ArchiCareer may use cookies and similar technologies as the service grows.</p>
                    </div>
                    <div className={styles.heroAccent} aria-hidden="true"><span>ARCHICAREER</span><strong>COOKIES</strong></div>
                </div>
            </section>

            <section className={styles.policy} aria-label="Cookie policy details">
                <div className={styles.policyHeading}>
                    <h2>What to know</h2>
                    <p>How they work, how we may use them, and the controls available to you.</p>
                </div>
                <div className={styles.sections}>
                    {sections.map((section) => <article className={styles.section} key={section.number}>
                        <span className={`${styles.number} ${styles[section.tone]}`} aria-hidden="true">{section.number}</span>
                        <div><h3>{section.title}</h3><p>{section.body}</p></div>
                    </article>)}
                </div>
            </section>

            <nav className={styles.legalLinks} aria-label="Related legal information">
                <p>Related information</p>
                <div>
                    <Link href="/privacy" className={`${brand.pillButton} ${styles.privacyLink}`}>Privacy policy</Link>
                    <Link href="/terms" className={`${brand.pillButton} ${styles.termsLink}`}>Terms of use</Link>
                </div>
            </nav>
        </main>
        <MarketingFooter />
    </div>;
}
