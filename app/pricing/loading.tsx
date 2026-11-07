import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import brand from "@/app/(marketing)/landing.module.css";
import styles from "./pricing.module.css";

export default function PricingLoading() {
    return <div className={`${brand.landingPage} ${styles.pricingPage}`}>
        <MarketingHeader />
        <main aria-label="Loading membership pricing">
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div><div className={`h-10 w-48 animate-pulse rounded-full ${styles.loadingLabel}`} /><div className={`mt-6 h-24 max-w-2xl animate-pulse sm:h-36 ${styles.loadingHeadline}`} /><div className={`mt-5 h-12 max-w-xl animate-pulse ${styles.loadingCopy}`} /></div>
                    <div className={`hidden min-h-[22rem] animate-pulse border-2 border-ink md:block ${styles.loadingVisual}`} />
                </div>
            </section>
            <section className={styles.plansSection}>
                <div className={styles.sectionHeading}><div className={`h-12 w-64 animate-pulse ${styles.loadingHeadline}`} /></div>
                <div className={styles.carousel}><div className={styles.planTrack}>
                    {[0, 1, 2].map((plan) => <div key={plan} className={styles.planSlide}><div className={`${styles.planCard} ${styles.loadingCard} h-[34rem] animate-pulse`} /></div>)}
                </div></div>
            </section>
        </main>
        <MarketingFooter />
    </div>;
}
