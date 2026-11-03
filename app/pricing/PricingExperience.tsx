"use client";

import Link from "next/link";
import { useState } from "react";
import type { PortfolioEntitlements } from "@/lib/billing";
import {
    ADDITIONAL_SPACE_BUNDLES,
    CHECKOUT_AVAILABLE,
    FREE_PORTFOLIO_SPACES,
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

type BillingInterval = "monthly" | "yearly";
type Feature = { name: string; free: string; pro: string; proPlus: string };

const upcomingProFeatures = [
    "3D model uploads",
    "Pro membership badge",
    "Push notifications",
    "Advanced portfolio analytics",
    "Enhanced profile customisation",
    "Improved project visibility",
];

const comparisonFeatures: Feature[] = [
    { name: "Portfolio spaces", free: String(FREE_PORTFOLIO_SPACES), pro: String(PRO_PORTFOLIO_SPACES), proPlus: String(PRO_PLUS_PORTFOLIO_SPACES) },
    { name: "3D model uploads", free: "not-included", pro: "planned", proPlus: "planned" },
    { name: "Professional profile", free: "included", pro: "included", proPlus: "included" },
    { name: "Membership badge", free: "not-included", pro: "planned", proPlus: "planned" },
    { name: "Push notifications", free: "not-included", pro: "planned", proPlus: "planned" },
    { name: "Advanced analytics", free: "not-included", pro: "planned", proPlus: "planned" },
    { name: "Profile customisation", free: "Standard", pro: "Planned", proPlus: "Planned" },
    { name: "Project visibility", free: "Standard", pro: "Planned", proPlus: "Planned" },
    { name: "Professional networking", free: "included", pro: "included", proPlus: "included" },
    { name: "Job applications", free: "included", pro: "included", proPlus: "included" },
    { name: "Storage allowance", free: "Standard", pro: "Expanded · planned", proPlus: "Higher · planned" },
];

const faqs = [
    {
        question: "Can I use ArchiCareer for free?",
        answer: "Yes. A free account includes a professional profile, up to three portfolio projects, professional networking, the feed, and the ability to browse and apply for jobs.",
    },
    {
        question: "What is a portfolio space?",
        answer: "A portfolio space is one project entry on your profile. It can hold a project description and its project images. Your included spaces depend on your membership plan.",
    },
    {
        question: "Can I purchase additional portfolio spaces?",
        answer: "The one-time bundles are listed here, but checkout is not connected yet. You cannot currently buy or receive additional spaces through the site.",
    },
    {
        question: "Are additional spaces one-time purchases?",
        answer: "Yes. The planned space bundles are single payments and are separate from recurring membership. Purchased spaces are designed to remain on your account if a membership expires.",
    },
    {
        question: "What happens when my subscription expires?",
        answer: "Your included allowance returns to the Free level. Your existing projects and paid additional spaces are retained; adding projects will be limited by the Free allowance plus your purchased spaces.",
    },
    {
        question: "Can I upgrade or downgrade my subscription?",
        answer: "Paid membership checkout and plan management are not available yet. No subscription changes can currently be made from ArchiCareer.",
    },
    {
        question: "What happens to my purchased spaces if I cancel my subscription?",
        answer: "Purchased spaces are separate from a subscription and are not meant to be removed when a subscription ends. Existing projects are retained; the number of new projects you can add follows your current plan plus purchased spaces.",
    },
    {
        question: "Can I upload 3D models?",
        answer: "Not yet. 3D model uploads are a planned membership feature. Current project uploads support images.",
    },
    {
        question: "What is the difference between Pro and Pro Plus?",
        answer: "Pro is planned to include 20 portfolio spaces, while Pro Plus is planned to include 50 and a higher storage allowance. Pro Plus pricing and checkout are not available yet; several advanced features are still planned.",
    },
];

function Availability({ value }: { value: string }) {
    if (value === "included") return <span className="font-medium text-ink">Included</span>;
    if (value === "not-included") return <span className="text-graphite/60">Not included</span>;
    if (value === "planned") return <span className="font-medium text-redline">Planned</span>;
    return <span className="text-graphite">{value}</span>;
}

export default function PricingExperience({ account }: { account: Account }) {
    const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
    const [message, setMessage] = useState("");
    const yearlySavings = PRO_MONTHLY_PRICE * 12 - PRO_YEARLY_PRICE;
    const yearlySavingsPercent = ((yearlySavings / (PRO_MONTHLY_PRICE * 12)) * 100).toFixed(1);
    const entitlements = account.kind === "ready" ? account.summary : null;

    function explainUnavailableAction() {
        setMessage("Checkout is not connected yet. No payment has been taken and no plan or spaces have been changed.");
    }

    return (
        <main className="w-full overflow-x-clip">
            <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:px-12">
                <section aria-labelledby="pricing-title" className="relative border-b border-line pb-12 sm:pb-16">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
                        <div className="max-w-4xl">
                            <p className="flex items-center gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-redline sm:text-xs">
                                <span className="h-px w-8 bg-redline" aria-hidden="true" />
                                ArchiCareer membership
                            </p>
                            <h1 id="pricing-title" className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-ink sm:text-7xl lg:text-8xl">
                                Your work deserves room to grow.
                            </h1>
                            <p className="mt-6 max-w-2xl text-base leading-7 text-graphite sm:text-lg sm:leading-8">
                                Build your professional presence, showcase your projects and access the tools you need to grow within the architecture industry.
                            </p>
                        </div>
                        <div className="border-l border-line pl-5 lg:mb-1">
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">A clearer way to grow</p>
                            <p className="mt-3 text-sm leading-6 text-ink">Start with a strong portfolio. Add space when your body of work grows.</p>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-4 border-t border-line pt-5 sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">Choose a billing interval</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex border border-line bg-white p-1" role="group" aria-label="Pro billing interval">
                                {(["monthly", "yearly"] as const).map((interval) => (
                                    <button
                                        key={interval}
                                        type="button"
                                        aria-pressed={billingInterval === interval}
                                        onClick={() => setBillingInterval(interval)}
                                        className={`min-h-10 px-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline ${billingInterval === interval ? "bg-ink text-white" : "text-graphite hover:bg-paper hover:text-ink"}`}
                                    >
                                        {interval}
                                    </button>
                                ))}
                            </div>
                            {billingInterval === "yearly" && (
                                <span className="text-sm font-medium text-redline">
                                    Save {formatNaira(yearlySavings)} a year ({yearlySavingsPercent}%)
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <section id="plans" aria-labelledby="plans-title" className="scroll-mt-28 pt-12 sm:pt-16">
                    <div className="mb-8 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">01 / Membership</p>
                            <h2 id="plans-title" className="mt-3 font-display text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Choose your working scale.</h2>
                        </div>
                        <p className="max-w-lg text-sm leading-6 text-graphite">All memberships start with a professional profile. Choose the amount of project space that fits the work you want to show.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 md:gap-0">
                        <article className="flex flex-col border border-line bg-white p-6 sm:p-7 md:mr-2 lg:p-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">01 / Open plan</p>
                                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">Free</h3>
                                </div>
                                {entitlements?.plan === "free" && <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">Current plan</span>}
                            </div>
                            <p className="mt-4 min-h-12 text-sm leading-6 text-graphite">Everything you need to establish your professional presence.</p>
                            <p className="mt-7 flex items-baseline gap-2"><span className="font-display text-4xl font-semibold tracking-[-0.05em]">₦0</span><span className="text-sm text-graphite">/ always</span></p>
                            <p className="mt-2 text-xs text-graphite">{FREE_PORTFOLIO_SPACES} portfolio spaces included</p>
                            <Link href={account.kind === "ready" ? "/profile/edit" : "/signup"} className="ui-button-secondary mt-7 w-full">Get Started</Link>
                            <ul className="mt-7 space-y-3 border-t border-line pt-6 text-sm leading-5">
                                <li>Professional profile</li>
                                <li>Standard project uploads</li>
                                <li>Professional networking</li>
                                <li>Access to the professional feed</li>
                                <li>Browse and apply for jobs</li>
                                <li className="text-graphite">Basic notifications <span className="font-mono text-[9px] uppercase tracking-wider text-redline">Planned</span></li>
                            </ul>
                        </article>

                        <article className="relative z-[1] flex flex-col border-2 border-redline bg-sand/45 p-6 sm:p-7 md:mx-1 md:-my-2 lg:p-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-redline">02 / For growing practices</p>
                                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">Pro</h3>
                                </div>
                                <span className="border border-redline/35 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-widest text-redline">Recommended</span>
                            </div>
                            <p className="mt-4 min-h-12 text-sm leading-6 text-graphite">More room to showcase your work and grow your professional visibility.</p>
                            <p className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className="font-display text-4xl font-semibold tracking-[-0.05em]">{formatNaira(billingInterval === "monthly" ? PRO_MONTHLY_PRICE : PRO_YEARLY_PRICE)}</span>
                                <span className="text-sm text-graphite">/ {billingInterval === "monthly" ? "month" : "year"}</span>
                            </p>
                            <p className="mt-2 min-h-5 text-xs text-graphite">
                                {billingInterval === "yearly" ? `${formatNaira(PRO_YEARLY_PRICE / 12)} effective monthly · save ${formatNaira(yearlySavings)} per year` : "Billed monthly · change your interval any time"}
                            </p>
                            <button type="button" onClick={explainUnavailableAction} className="ui-button-primary mt-7 w-full">Get Pro</button>
                            <ul className="mt-7 space-y-3 border-t border-redline/25 pt-6 text-sm leading-5">
                                <li>Everything included in Free</li>
                                <li><strong className="font-semibold">{PRO_PORTFOLIO_SPACES} portfolio spaces</strong></li>
                                {upcomingProFeatures.map((feature) => <li key={feature} className="flex items-start justify-between gap-3 text-graphite"><span>{feature}</span><span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-redline">Planned</span></li>)}
                            </ul>
                        </article>

                        <article className="flex flex-col border border-line bg-white p-6 sm:p-7 md:ml-2 lg:p-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">03 / Higher capacity</p>
                                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">Pro Plus</h3>
                                </div>
                                {entitlements?.plan === "pro_plus" && <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">Current plan</span>}
                            </div>
                            <p className="mt-4 min-h-12 text-sm leading-6 text-graphite">For professionals who need greater portfolio capacity.</p>
                            <p className="mt-7 font-display text-3xl font-semibold tracking-[-0.04em]">{PRO_PLUS_PRICE === null ? "Coming soon" : formatNaira(PRO_PLUS_PRICE)}</p>
                            <p className="mt-2 text-xs text-graphite">No price has been announced.</p>
                            <button type="button" onClick={explainUnavailableAction} className="ui-button-secondary mt-7 w-full">Explore Pro Plus</button>
                            <ul className="mt-7 space-y-3 border-t border-line pt-6 text-sm leading-5">
                                <li>Everything included in Pro</li>
                                <li><strong className="font-semibold">{PRO_PLUS_PORTFOLIO_SPACES} portfolio spaces</strong></li>
                                <li className="flex items-start justify-between gap-3 text-graphite"><span>Pro Plus membership badge</span><span className="font-mono text-[9px] uppercase tracking-wider text-redline">Planned</span></li>
                                <li className="flex items-start justify-between gap-3 text-graphite"><span>Higher storage allowance</span><span className="font-mono text-[9px] uppercase tracking-wider text-redline">Planned</span></li>
                                <li className="flex items-start justify-between gap-3 text-graphite"><span>Enhanced analytics</span><span className="font-mono text-[9px] uppercase tracking-wider text-redline">Planned</span></li>
                                <li className="flex items-start justify-between gap-3 text-graphite"><span>Additional professional customisation</span><span className="font-mono text-[9px] uppercase tracking-wider text-redline">Planned</span></li>
                            </ul>
                        </article>
                    </div>

                    <p className="mt-5 text-xs leading-5 text-graphite"><span className="font-medium text-redline">Planned</span> marks features that are not available yet. Membership checkout is not configured, so paid features cannot currently be purchased or activated.</p>
                    <p id="payment-notice" aria-live="polite" role="status" className="mt-3 min-h-6 text-sm font-medium text-ink">{message}</p>
                </section>

                <section aria-labelledby="spaces-title" className="scroll-mt-28 border-y border-line py-12 sm:py-16">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">02 / One-time additions</p>
                            <h2 id="spaces-title" className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Need more room for your work?</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-graphite sm:text-base sm:leading-7">Expand your portfolio whenever you need more space. Purchase additional portfolio spaces with a single payment, without changing your current membership.</p>
                        </div>
                        <div className="border-l border-line pl-5 text-sm leading-6 text-graphite">
                            <p>Spaces stack on your membership allowance and are separate from a recurring plan.</p>
                            <p className="mt-2">Maximum: {entitlements?.maximumPurchasedSpaces ?? 10} purchased spaces per account.</p>
                        </div>
                    </div>

                    <div className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {ADDITIONAL_SPACE_BUNDLES.map((bundle) => {
                            const allowance = entitlements?.remainingPurchaseAllowance ?? 10;
                            const overAllowance = bundle.spaces > allowance;
                            const unavailable = account.kind === "error" || !CHECKOUT_AVAILABLE || overAllowance;
                            const bestValue = bundle.spaces === 10;
                            const accessibleBundle = bundle.spaces === 3;
                            return (
                                <article key={bundle.spaces} className={`flex min-h-56 flex-col border p-5 ${bestValue ? "border-redline bg-sand/40" : accessibleBundle ? "border-redline/50 bg-white" : "border-line bg-white"}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-display text-xl font-semibold tracking-tight">{bundle.spaces} {bundle.spaces === 1 ? "space" : "spaces"}</h3>
                                        {bestValue ? <span className="font-mono text-[9px] uppercase tracking-widest text-redline">Best value</span> : accessibleBundle ? <span className="font-mono text-[9px] uppercase tracking-widest text-redline">Bundle</span> : null}
                                    </div>
                                    <p className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">{formatNaira(bundle.price)}</p>
                                    <p className="mt-1 text-xs text-graphite">{formatNaira(bundle.price / bundle.spaces)} per space · one-time payment</p>
                                    <button type="button" disabled={unavailable} aria-describedby="space-checkout-status" onClick={explainUnavailableAction} className="ui-button-secondary mt-auto w-full disabled:cursor-not-allowed disabled:opacity-50">
                                        Purchase spaces
                                    </button>
                                </article>
                            );
                        })}
                    </div>

                    <div className="mt-7 border-t border-line pt-5" aria-live="polite">
                        {account.kind === "ready" ? (
                            <div className="grid gap-3 text-sm sm:grid-cols-3">
                                <p><span className="text-graphite">Current plan: </span><strong className="font-semibold text-ink">{account.summary.plan === "pro_plus" ? "Pro Plus" : account.summary.plan === "pro" ? "Pro" : "Free"}</strong></p>
                                <p><span className="text-graphite">Spaces purchased: </span><strong className="font-semibold text-ink">{account.summary.purchasedSpaces} of {account.summary.maximumPurchasedSpaces}</strong></p>
                                <p><span className="text-graphite">Purchase allowance left: </span><strong className="font-semibold text-ink">{account.summary.remainingPurchaseAllowance}</strong></p>
                                <p><span className="text-graphite">Projects used: </span><strong className="font-semibold text-ink">{account.summary.usedSpaces} of {account.summary.totalSpaceLimit}</strong></p>
                                <p><span className="text-graphite">Project spaces available: </span><strong className="font-semibold text-ink">{account.summary.remainingPortfolioSpaces}</strong></p>
                            </div>
                        ) : account.kind === "signed-out" ? (
                            <p className="text-sm leading-6 text-graphite">Sign in to see your purchased spaces and current portfolio allowance. Free accounts include {FREE_PORTFOLIO_SPACES} project spaces.</p>
                        ) : (
                            <p className="text-sm leading-6 text-graphite">We could not load your account space totals. The billing tables may need to be installed or your connection may have failed. Refresh this page to try again.</p>
                        )}
                        <p id="space-checkout-status" className="mt-3 text-xs leading-5 text-graphite">{CHECKOUT_AVAILABLE ? "Checkout is available." : "Purchases are not available yet because a payment provider has not been connected."}{account.kind === "ready" && account.summary.remainingPurchaseAllowance === 0 ? " This account has reached the 10-space purchase limit." : ""}</p>
                    </div>
                </section>

                <section aria-labelledby="comparison-title" className="scroll-mt-28 py-12 sm:py-16">
                    <div className="mb-8 max-w-3xl">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">03 / At a glance</p>
                        <h2 id="comparison-title" className="mt-3 font-display text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Find the right space for your ambitions.</h2>
                    </div>
                    <div className="hidden overflow-x-auto border-y border-line md:block">
                        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                            <thead><tr className="border-b border-line">
                                <th scope="col" className="w-[38%] py-4 pr-4 font-mono text-[10px] font-medium uppercase tracking-widest text-graphite">Included feature</th>
                                <th scope="col" className="px-4 py-4 font-display text-lg font-semibold">Free</th>
                                <th scope="col" className="bg-sand/50 px-4 py-4 font-display text-lg font-semibold text-redline">Pro</th>
                                <th scope="col" className="px-4 py-4 font-display text-lg font-semibold">Pro Plus</th>
                            </tr></thead>
                            <tbody>{comparisonFeatures.map((feature) => <tr key={feature.name} className="border-b border-line/70 last:border-0">
                                <th scope="row" className="py-4 pr-4 font-medium text-ink">{feature.name}</th>
                                <td className="px-4 py-4"><Availability value={feature.free} /></td>
                                <td className="bg-sand/30 px-4 py-4"><Availability value={feature.pro} /></td>
                                <td className="px-4 py-4"><Availability value={feature.proPlus} /></td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                    <div className="divide-y divide-line border-y border-line md:hidden">
                        {([
                            { name: "Free", key: "free" },
                            { name: "Pro", key: "pro" },
                            { name: "Pro Plus", key: "proPlus" },
                        ] as const).map((plan) => (
                            <section key={plan.key} aria-label={`${plan.name} features`} className={plan.key === "pro" ? "bg-sand/30 px-4 py-5" : "px-4 py-5"}>
                                <h3 className={`font-display text-xl font-semibold ${plan.key === "pro" ? "text-redline" : "text-ink"}`}>{plan.name}</h3>
                                <dl className="mt-4 space-y-3">
                                    {comparisonFeatures.map((feature) => <div key={feature.name} className="flex items-baseline justify-between gap-4 border-b border-line/60 pb-2 last:border-0 last:pb-0">
                                        <dt className="text-sm text-graphite">{feature.name}</dt>
                                        <dd className="shrink-0 text-right text-sm"><Availability value={feature[plan.key]} /></dd>
                                    </div>)}
                                </dl>
                            </section>
                        ))}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-graphite">“Planned” means that capability is not active on ArchiCareer today.</p>
                </section>

                <section aria-labelledby="faq-title" className="border-t border-line py-12 sm:py-16">
                    <div className="grid gap-8 lg:grid-cols-[minmax(15rem,.75fr)_minmax(0,1.25fr)]">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-graphite">04 / Questions</p>
                            <h2 id="faq-title" className="mt-3 max-w-md font-display text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Good to know before you choose.</h2>
                        </div>
                        <div className="divide-y divide-line border-y border-line">
                            {faqs.map((faq, index) => <details key={faq.question} className="group py-4">
                                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-medium text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-redline sm:text-base">
                                    <span className="flex items-start gap-3"><span className="pt-0.5 font-mono text-[9px] text-graphite">{String(index + 1).padStart(2, "0")}</span>{faq.question}</span>
                                    <span aria-hidden="true" className="shrink-0 font-mono text-lg text-redline transition-transform group-open:rotate-45">+</span>
                                </summary>
                                <p className="ml-8 mt-3 max-w-2xl pr-7 text-sm leading-6 text-graphite">{faq.answer}</p>
                            </details>)}
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 border-t border-line py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-redline">Make the next move</p>
                        <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Your next project deserves to be seen.</h2>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-graphite sm:text-base sm:leading-7">Start building your professional identity and connect with the people shaping the architecture industry.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                        <Link href={account.kind === "ready" ? "/profile/edit" : "/signup"} className="ui-button-primary min-h-12 px-6">Create Your Free Account</Link>
                        <Link href="#plans" className="ui-button-secondary min-h-12 px-6">Explore Membership</Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
