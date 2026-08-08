import Link from "next/link";
import { Check } from "@/app/components/UiIcon";
import type { ReactNode } from "react";

const steps = [
    { href: "/onboarding/about", label: "About you" },
    { href: "/onboarding/links", label: "Links & files" },
    { href: "/onboarding/portfolio", label: "Portfolio" },
];

export default function OnboardingFrame({ step, children }: { step: 1 | 2 | 3; children: ReactNode }) {
    return (
        <div className="relative flex-1 overflow-hidden bg-paper px-5 py-10 text-ink selection:bg-redline selection:text-paper sm:px-8 sm:py-16">
            <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-sand/60 blur-3xl" />
            <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-redline/10 blur-3xl" />
            <main className="relative mx-auto w-full max-w-4xl">
                <div className="mb-8 flex items-center justify-between sm:mb-12">
                    <Link href="/" className="font-display text-2xl font-bold tracking-[-0.055em] transition-colors hover:text-redline sm:text-3xl">ArchiCareer</Link>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">Set up your profile</span>
                </div>
                <div className="mb-8 flex items-center gap-2 sm:mb-10">
                    {steps.map((item, index) => {
                        const number = index + 1;
                        const active = number === step;
                        const complete = number < step;
                        return (
                            <div key={item.href} className="flex flex-1 items-center gap-2">
                                <Link href={complete ? item.href : active ? item.href : "#"} aria-current={active ? "step" : undefined} className={`flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-widest ${active ? "text-ink" : complete ? "text-redline" : "text-graphite/50"}`}>
                                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active ? "border-ink bg-ink text-paper" : complete ? "border-redline text-redline" : "border-line text-graphite/50"}`}>{complete ? <Check /> : String(number).padStart(2, "0")}</span>
                                    <span className="hidden truncate sm:inline">{item.label}</span>
                                </Link>
                                {number < steps.length && <span className={`h-px flex-1 ${complete ? "bg-redline/50" : "bg-line"}`} />}
                            </div>
                        );
                    })}
                </div>
                {children}
            </main>
        </div>
    );
}
