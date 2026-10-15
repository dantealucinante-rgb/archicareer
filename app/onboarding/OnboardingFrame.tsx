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
        <div className="min-h-screen bg-paper px-4 pb-8 pt-5 text-ink selection:bg-redline selection:text-paper sm:px-8 sm:pt-8">
            <main className="mx-auto w-full max-w-4xl">
                <div className="mb-7 flex items-center justify-between border-b border-line pb-4 sm:mb-10 sm:pb-5">
                    <Link href="/" className="font-display text-lg font-bold tracking-[-0.055em] transition-colors hover:text-redline sm:text-xl">ArchiCareer<span className="text-redline">.</span></Link>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-graphite">Profile setup</span>
                </div>
                <div aria-label={`Profile setup, step ${step} of ${steps.length}`} className="mb-7 flex items-center gap-2 sm:mb-9">
                    {steps.map((item, index) => {
                        const number = index + 1;
                        const active = number === step;
                        const complete = number < step;
                        return (
                            <div key={item.href} className="flex flex-1 items-center gap-2">
                                {complete || active ? <Link href={item.href} aria-current={active ? "step" : undefined} className={`flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-widest ${active ? "text-ink" : "text-redline"}`}>
                                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[9px] ${active ? "border-ink bg-ink text-paper" : complete ? "border-redline text-redline" : "border-line text-graphite/50"}`}>{complete ? <Check /> : number}</span>
                                    <span className="hidden truncate sm:inline">{item.label}</span>
                                </Link> : <span aria-disabled="true" className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-graphite/50">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-[9px] text-graphite/50">{number}</span>
                                    <span className="hidden truncate sm:inline">{item.label}</span>
                                </span>}
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
