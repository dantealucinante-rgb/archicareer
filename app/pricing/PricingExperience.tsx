import Link from "next/link";
import type { ReactNode } from "react";
import type { PortfolioEntitlements } from "@/lib/billing";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import brand from "@/app/(marketing)/landing.module.css";
import styles from "./pricing.module.css";
import {
    ADDITIONAL_SPACE_BUNDLES,
    CHECKOUT_AVAILABLE,
    FREE_PORTFOLIO_SPACES,
    MAX_PURCHASED_PORTFOLIO_SPACES,
    PRO_MONTHLY_PRICE,
    PRO_PLUS_PRICE,
    PRO_PLUS_PORTFOLIO_SPACES,
    PRO_PORTFOLIO_SPACES,
    PRO_YEARLY_PRICE,
    formatNaira,
} from "@/lib/pricing-config";

type Account =
    | { kind: "signed-out" }
    | { kind: "error" }
    | { kind: "ready"; summary: PortfolioEntitlements };

const yearlySavings = PRO_MONTHLY_PRICE * 12 - PRO_YEARLY_PRICE;
const yearlySavingsPercent = ((yearlySavings / (PRO_MONTHLY_PRICE * 12)) * 100).toFixed(1);

const plannedProFeatures = [
    "3D model uploads",
    "Pro membership badge",
    "Push notifications",
    "Advanced portfolio analytics",
    "Enhanced profile customisation",
    "Improved project visibility",
];

const plannedProPlusFeatures = [
    "Pro Plus membership badge",
    "Higher storage allowance",
    "Enhanced analytics",
    "Additional professional customisation",
];

function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "orange" | "pink" | "teal" }) {
    return <span className={`${styles.statusPill} ${styles[`status${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>{children}</span>;
}

function PlannedFeatures({ features, dark = false }: { features: string[]; dark?: boolean }) {
    return <ul className={`${styles.featureList} ${styles.plannedList} ${dark ? styles.featureListDark : ""}`}>
        {features.map((feature) => <li key={feature}>
            <span>{feature}</span><span className={styles.plannedPill}>Planned</span>
        </li>)}
    </ul>;
}

function PricingCard({ children, className }: { children: ReactNode; className: string }) {
    return <article className={`${styles.planCard} ${className}`}>{children}</article>;
}

function AccountSection({ account }: { account: Account }) {
    if (account.kind === "signed-out") {
        return <section className={`${styles.accountPanel} ${styles.signedOut}`} aria-labelledby="account-title">
            <div><h2 id="account-title">ALREADY PART OF ARCHICAREER?</h2><p>Sign in to view your current plan and portfolio usage.</p></div>
            <Link href="/login?next=%2Fpricing" className={`${styles.pillAction} ${styles.accountAction}`}>Sign in</Link>
        </section>;
    }

    if (account.kind === "error") {
        return <section className={`${styles.accountPanel} ${styles.accountError}`} aria-labelledby="account-title">
            <h2 id="account-title">YOUR PLAN DETAILS</h2>
            <p role="status">We couldn’t load your plan details. Refresh the page to try again.</p>
        </section>;
    }

    const { summary } = account;
    const planName = summary.plan === "pro_plus" ? "PRO PLUS" : summary.plan.toUpperCase();
    const usagePercent = summary.totalSpaceLimit > 0 ? Math.min(100, (summary.usedSpaces / summary.totalSpaceLimit) * 100) : 0;

    return <section className={`${styles.accountPanel} ${styles.signedIn}`} aria-labelledby="account-title">
        <div className={styles.accountHeading}>
            <div><h2 id="account-title">YOUR CURRENT PLAN</h2></div>
            {summary.billingInterval && <StatusPill tone="pink">{summary.billingInterval} billing</StatusPill>}
        </div>
        <div className={styles.usageContent}>
            <p className={styles.currentPlan}>{planName}</p>
            <div className={styles.usageLabels}><strong>{summary.usedSpaces} / {summary.totalSpaceLimit} PORTFOLIO SPACES USED</strong><span>{summary.remainingPortfolioSpaces} SPACE{summary.remainingPortfolioSpaces === 1 ? "" : "S"} REMAINING</span></div>
            <div className={styles.usageTrack} role="progressbar" aria-label="Portfolio space usage" aria-valuemin={0} aria-valuemax={summary.totalSpaceLimit} aria-valuenow={Math.min(summary.usedSpaces, summary.totalSpaceLimit)}>
                <span style={{ width: `${usagePercent}%` }} />
            </div>
            <p className={styles.usageMeta}>{summary.purchasedSpaces} extra spaces owned · {summary.remainingPurchaseAllowance} of {summary.maximumPurchasedSpaces} available to purchase</p>
        </div>
    </section>;
}

export default function PricingExperience({ account }: { account: Account }) {
    const freeAction = account.kind === "ready" ? "/profile/edit" : "/signup";
    const freeActionLabel = account.kind === "ready" ? "Manage your portfolio" : "Create a free account";

    return <div className={`${brand.landingPage} ${styles.pricingPage}`}>
        <MarketingHeader />
        <main>
            <section className={styles.hero} aria-labelledby="pricing-title">
                <div className={styles.heroInner}>
                    <div className={styles.heroCopy}>
                        <span className={styles.pricingLabel}>ArchiCareer pricing</span>
                        <h1 id="pricing-title">YOUR WORK DESERVES <span>MORE SPACE.</span></h1>
                        <p>Start showcasing your work for free. As your portfolio grows, find the space and tools to take your professional journey further.</p>
                        <div className={styles.heroActions}>
                            <Link href="#plans" className={`${brand.pillButton} ${styles.heroPrimary}`}>Compare plans</Link>
                        </div>
                    </div>
                    <div className={styles.heroVisual} aria-hidden="true">
                        <div className={styles.heroVisualTop}><span>ROOM TO GROW</span><strong>20</strong><small>PORTFOLIO SPACES</small></div>
                        <div className={styles.heroVisualBottom}><div><strong>3</strong><span>FREE</span></div><div><strong>50</strong><span>PRO PLUS</span></div></div>
                        <span className={styles.heroSticker}>CREATES. CONNECTS. BUILDS.</span>
                    </div>
                </div>
            </section>

            <section id="plans" className={styles.plansSection} aria-labelledby="plans-title">
                <div className={styles.sectionHeading}>
                    <div><h2 id="plans-title">SPACE FOR EVERY STAGE.</h2></div>
                    <p>Start with a professional home for your work. Add capacity as your portfolio grows.</p>
                </div>
                <div className={styles.carousel} aria-label="Membership plans">
                    <div className={styles.planTrack}>
                        <div className={styles.planSlide}>
                            <PricingCard className={styles.freeCard}>
                                <div className={styles.planTopline}><div><StatusPill tone="teal">Available</StatusPill>{account.kind === "ready" && account.summary.plan === "free" && <StatusPill>Current plan</StatusPill>}</div></div>
                                <h3>Free</h3>
                                <p className={styles.planDescription}>Build your professional presence and share your work.</p>
                                <div className={`${styles.priceBlock} ${styles.freePrice}`}><strong>₦0</strong><span>always</span></div>
                                <ul className={styles.featureList}><li>Professional profile</li><li>Professional networking</li><li>Feed access</li><li>Job browsing and applications</li><li>{FREE_PORTFOLIO_SPACES} portfolio spaces</li></ul>
                                <Link href={freeAction} className={`${styles.pillAction} ${styles.freeAction}`}>{freeActionLabel}</Link>
                            </PricingCard>
                        </div>

                        <div className={styles.planSlide}>
                            <PricingCard className={styles.proCard}>
                                <div className={styles.planTopline}><div><StatusPill tone="teal">Recommended</StatusPill>{account.kind === "ready" && account.summary.plan === "pro" && <StatusPill tone="pink">Current plan</StatusPill>}<StatusPill tone="orange">Coming soon</StatusPill></div></div>
                                <h3>Pro</h3>
                                <p className={styles.planDescription}>Show more of your work with additional portfolio capacity.</p>
                                <div className={`${styles.priceBlock} ${styles.proPrice}`}>
                                    <p><strong>{formatNaira(PRO_MONTHLY_PRICE)}</strong><span>/ month</span></p>
                                    <p><strong>{formatNaira(PRO_YEARLY_PRICE)}</strong><span>/ year</span></p>
                                    <p className={styles.savingsCopy}>Save {formatNaira(yearlySavings)} yearly · {yearlySavingsPercent}% off</p>
                                </div>
                                <ul className={styles.featureList}><li>Everything in Free</li><li>{PRO_PORTFOLIO_SPACES} portfolio spaces</li></ul>
                                <PlannedFeatures features={plannedProFeatures} dark />
                                <button type="button" disabled={!CHECKOUT_AVAILABLE} className={`${styles.pillAction} ${styles.disabledAction}`}>Coming soon</button>
                            </PricingCard>
                        </div>

                        <div className={styles.planSlide}>
                            <PricingCard className={styles.plusCard}>
                                <div className={styles.planTopline}><div>{account.kind === "ready" && account.summary.plan === "pro_plus" && <StatusPill tone="pink">Current plan</StatusPill>}<StatusPill tone="orange">Coming soon</StatusPill></div></div>
                                <h3>Pro Plus</h3>
                                <p className={styles.planDescription}>For professionals who need greater portfolio capacity.</p>
                                <div className={`${styles.priceBlock} ${styles.plusPrice}`}><strong>{PRO_PLUS_PRICE === null ? "Price to be announced" : formatNaira(PRO_PLUS_PRICE)}</strong></div>
                                <ul className={styles.featureList}><li>Everything in Pro, when available</li><li>{PRO_PLUS_PORTFOLIO_SPACES} portfolio spaces</li></ul>
                                <PlannedFeatures features={plannedProPlusFeatures} dark />
                                <button type="button" disabled={!CHECKOUT_AVAILABLE} className={`${styles.pillAction} ${styles.disabledAction}`}>Coming soon</button>
                            </PricingCard>
                        </div>
                    </div>
                </div>
                <div className={styles.swipeFooter} role="img" aria-label="Three plans. Swipe to compare."><i /><i /><i /></div>
            </section>

            <section className={styles.spacesSection} aria-labelledby="spaces-title">
                <div className={styles.spacesIntro}>
                    <h2 id="spaces-title">GOT MORE WORK<br />TO SHOW?</h2>
                    <p>Get additional portfolio spaces when your work needs room to grow.</p>
                    <span className={styles.maxSpaces}>MAXIMUM {MAX_PURCHASED_PORTFOLIO_SPACES} EXTRA SPACES</span>
                </div>
                <div className={styles.bundleGrid}>
                    {ADDITIONAL_SPACE_BUNDLES.map((bundle, index) => <article key={bundle.spaces} className={`${styles.bundle} ${styles[`bundle${index + 1}`]}`}>
                        <div><h3>{bundle.spaces} {bundle.spaces === 1 ? "space" : "spaces"}</h3></div>
                        <strong>{formatNaira(bundle.price)}</strong>
                        <small>ONE-TIME PRICE</small>
                        <button type="button" disabled={!CHECKOUT_AVAILABLE} className={styles.bundleAction}>Coming soon</button>
                    </article>)}
                </div>
            </section>

            <AccountSection account={account} />

            <section className={styles.upcoming} aria-labelledby="upcoming-title">
                <div><h2 id="upcoming-title">MORE ROOM.<br />MORE POSSIBILITIES.</h2></div>
                <p>We’re preparing additional membership options and portfolio capacity for the ArchiCareer community. Paid memberships and extra portfolio purchases aren’t available just yet.</p>
                <StatusPill tone="orange">Payments unavailable</StatusPill>
            </section>
        </main>
        <MarketingFooter />
    </div>;
}
