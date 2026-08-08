import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "@/app/components/UiIcon";

const principles = [
    { number: "01", title: "Show the work", copy: "Build a living portfolio that feels like you—not another blank upload form." },
    { number: "02", title: "Meet the right people", copy: "Find the talent, collaborators, studios, and companies aligned with your direction." },
    { number: "03", title: "Find what’s next", copy: "Discover meaningful roles and opportunities that bring good work closer." },
];

export default function HomePage() {
    return (
        <div className="flex flex-col bg-paper text-ink">
            <main className="mx-auto w-full max-w-7xl px-5 sm:px-8">
                <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
                    <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sand/60 blur-3xl" />
                    <div className="absolute -left-28 bottom-4 h-64 w-64 rounded-full bg-redline/10 blur-3xl" />
                    <div className="relative grid items-end gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
                        <div className="t-stagger is-shown max-w-4xl">
                            <p className="t-stagger-line t-stagger-line--1 eyebrow mb-7 font-mono text-redline">A-01 / PEOPLE, PRACTICE, OPPORTUNITY</p>
                            <h1 className="t-stagger-line t-stagger-line--2 display-balance font-display text-[clamp(3rem,15vw,5.5rem)] font-semibold leading-[0.87] tracking-[-0.075em] text-ink sm:text-[clamp(3.6rem,10vw,8.8rem)]">
                                Bring your next<br />
                                <span className="text-redline">idea to life.</span>
                            </h1>
                            <p className="t-stagger-line t-stagger-line--3 mt-8 max-w-xl text-lg leading-relaxed text-graphite sm:text-xl">
                                ArchiCareer connects emerging talent, experienced professionals, studios, and companies through meaningful work and opportunities.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Link href="/discover" className="group inline-flex items-center justify-center gap-4 rounded-full bg-ink px-6 py-3.5 font-mono text-[11px] uppercase tracking-widest text-paper transition-all duration-300 hover:-translate-y-1 hover:bg-redline">
                                    Explore the network <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </Link>
                                <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-line bg-paper px-6 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink transition-all duration-300 hover:-translate-y-1 hover:border-ink">
                                    Create your profile
                                </Link>
                            </div>
                        </div>

                        <div className="surface-dark ink-grid relative min-h-[300px] overflow-hidden p-5 text-paper sm:min-h-[430px] sm:p-8">
                            <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60"><span>Field notes / 2026</span><span>09°N 8°E</span></div>
                            <div className="absolute inset-x-8 top-1/2 h-px bg-paper/20" />
                            <div className="absolute left-1/2 top-1/2 h-[78%] w-px -translate-x-1/2 -translate-y-1/2 bg-paper/20" />
                            <div className="absolute left-[18%] top-[25%] h-28 w-28 rounded-full border border-paper/30" />
                            <div className="absolute right-[16%] top-[34%] h-36 w-36 rotate-45 border border-redline/80" />
                            <div className="absolute bottom-10 left-8 right-8 flex items-end justify-between">
                                <div><p className="font-display text-5xl leading-none text-sand sm:text-6xl">Connect</p><p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-paper/60">around meaningful work</p></div>
                                <span className="grid h-14 w-14 place-items-center rounded-full border border-paper/30 text-paper/70"><ArrowDown /></span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-line py-10 sm:py-14">
                    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <div>
                            <p className="eyebrow font-mono text-redline">START HERE</p>
                            <h2 className="display-balance mt-4 max-w-sm font-display text-3xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl">Choose your way in.</h2>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-graphite">Whether you are building your practice or building a team, start with the path that fits you.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Link href="/signup?role=student" className="interactive group rounded-2xl border border-line bg-warm-white p-5 hover:-translate-y-1 hover:border-redline hover:shadow-lg">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-redline">01 / Talent</span>
                                <h3 className="mt-10 font-display text-xl font-semibold tracking-tight">I’m a student</h3>
                                <span className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors group-hover:text-ink">Create a profile ↗</span>
                            </Link>
                            <Link href="/signup?role=architect" className="interactive group rounded-2xl border border-line bg-warm-white p-5 hover:-translate-y-1 hover:border-redline hover:shadow-lg">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-redline">02 / Practice</span>
                                <h3 className="mt-10 font-display text-xl font-semibold tracking-tight">I’m an architect</h3>
                                <span className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors group-hover:text-ink">Create a profile ↗</span>
                            </Link>
                            <Link href="/firms/signup" className="interactive group rounded-2xl border border-ink bg-ink p-5 text-paper hover:-translate-y-1 hover:border-redline hover:bg-redline hover:shadow-lg">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-sand">03 / Organisation</span>
                                <h3 className="mt-10 font-display text-xl font-semibold tracking-tight">I’m a firm or company</h3>
                                <span className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-paper/60 transition-colors group-hover:text-paper">Find your people ↗</span>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 border-y border-line py-5 sm:grid-cols-3">
                    {principles.map((item) => <div key={item.number} className="card-lift rounded-2xl border border-transparent p-5 hover:bg-white/45"><div className="mb-10 flex items-center justify-between"><span className="font-mono text-xs text-redline">{item.number}</span><span className="h-px w-12 bg-line" /></div><h2 className="font-display text-xl font-semibold tracking-tight">{item.title}</h2><p className="mt-3 max-w-xs text-sm leading-relaxed text-graphite">{item.copy}</p></div>)}
                </section>

                <section className="grid gap-8 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
                    <div><p className="eyebrow font-mono text-redline">A-02 / WHY ARCHICAREER</p><h2 className="display-balance mt-5 max-w-md font-display text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">Bring the right people into the room.</h2></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="surface card-lift p-6 sm:translate-y-8"><span className="block h-7 w-7 rounded-full border-2 border-redline" aria-hidden="true" /><h3 className="mt-12 font-display text-2xl font-semibold">Work first</h3><p className="mt-3 text-sm leading-relaxed text-graphite">Build a profile that gives your projects, skills, and point of view the attention they deserve.</p></div>
                        <div className="surface-dark card-lift p-6 text-paper"><span className="block h-7 w-7 rounded-full border border-sand/70" aria-hidden="true" /><h3 className="mt-12 font-display text-2xl font-semibold">People at the centre</h3><p className="mt-3 text-sm leading-relaxed text-paper/70">A focused space for talent and organisations to find each other through the work.</p></div>
                    </div>
                </section>

                <section className="surface-dark ink-grid overflow-hidden p-7 text-paper sm:p-12 lg:p-16">
                    <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
                        <div><p className="eyebrow font-mono text-sand">A-03 / START HERE</p><h2 className="display-balance mt-5 max-w-3xl font-display text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">Your next opportunity can start with the work you already have.</h2><p className="mt-6 max-w-xl text-base leading-relaxed text-paper/70">Give it a home that helps the right people find it.</p></div>
                        <Link href="/signup" className="interactive inline-flex items-center justify-center rounded-full bg-sand px-6 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink hover:bg-paper">Create your profile ↗</Link>
                    </div>
                </section>

                <section className="flex flex-col gap-4 py-20 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow font-mono text-graphite">A-04 / KEEP EXPLORING</p><h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Find the work. Find the people.</h2></div><div className="flex gap-3"><Link href="/discover" className="rounded-full border border-ink px-5 py-3 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper">Discover</Link><Link href="/jobs" className="rounded-full border border-line px-5 py-3 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-ink">Jobs</Link></div></section>
            </main>
        </div>
    );
}
