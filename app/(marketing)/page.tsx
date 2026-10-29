import Link from "next/link";
import { ArrowUpRight } from "@/app/components/UiIcon";

const paths = [
    { eyebrow: "For emerging talent", title: "Build a profile around your work.", copy: "Present your projects, skills, and perspective where the right studios and collaborators can find them.", href: "/signup?role=student", action: "Create a student profile" },
    { eyebrow: "For professionals", title: "Keep your practice in view.", copy: "Share work, connect with peers, and find the opportunities that fit the direction of your career.", href: "/signup?role=architect", action: "Create a professional profile" },
    { eyebrow: "For firms", title: "Meet people who care about the work.", copy: "Introduce your practice, show your projects, and reach architecture talent with context.", href: "/firms/signup", action: "Create a firm profile" },
];

export default function HomePage() {
    return <main className="mx-auto w-full max-w-[var(--page-max)] px-5 sm:px-8">
        <section className="grid gap-10 border-b border-line py-16 sm:py-24 lg:grid-cols-[1.35fr_.65fr] lg:gap-16 lg:py-28">
            <div className="max-w-4xl">
                <p className="ui-kicker">ArchiCareer / Professional network</p>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-7xl">The professional network for architecture in Nigeria.</h1>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-graphite sm:text-lg">A considered place to show work, meet people, and find opportunities across the built environment.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/signup" className="ui-button-primary interactive gap-2">Create your profile <ArrowUpRight className="h-4 w-4" /></Link>
                    <Link href="/discover" className="ui-button-secondary interactive">Explore the network</Link>
                </div>
            </div>
            <aside className="self-end border-l border-line pl-6 text-sm leading-relaxed text-graphite lg:pb-1">
                <p className="font-display text-xl font-semibold text-ink">Made for the people shaping space.</p>
                <p className="mt-3">Students, architects, studios, recruiters, and built-environment professionals meet here through the work itself.</p>
                <dl className="mt-8 space-y-3 border-t border-line pt-4 text-xs"><div className="flex justify-between gap-4"><dt>People</dt><dd className="font-medium text-ink">Discover</dd></div><div className="flex justify-between gap-4"><dt>Work</dt><dd className="font-medium text-ink">Portfolio</dd></div><div className="flex justify-between gap-4"><dt>Opportunities</dt><dd className="font-medium text-ink">Jobs</dd></div></dl>
            </aside>
        </section>

        <section className="py-14 sm:py-20">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="ui-kicker">Ways in</p><h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">A focused place for every side of practice.</h2></div><Link href="/discover" className="text-sm font-medium text-redline hover:text-ink">Browse the community →</Link></div>
            <div className="divide-y divide-line border-y border-line">
                {paths.map((path, index) => <article key={path.href} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr_auto] sm:items-center sm:gap-6"><span className="ui-meta">0{index + 1}</span><div><p className="ui-kicker">{path.eyebrow}</p><h3 className="mt-2 font-display text-xl font-semibold">{path.title}</h3><p className="mt-2 max-w-xl text-sm leading-relaxed text-graphite">{path.copy}</p></div><Link href={path.href} className="ui-button-secondary interactive w-fit">{path.action}</Link></article>)}
            </div>
        </section>

        <section className="border-t border-line py-14 sm:py-20"><div className="max-w-2xl"><p className="ui-kicker">The network</p><h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Work deserves context.</h2><p className="mt-5 text-base leading-relaxed text-graphite">ArchiCareer makes room for the portfolio, experience, conversations, and opportunities behind a meaningful career—not just a title.</p></div><div className="mt-8 flex flex-wrap gap-3"><Link href="/jobs" className="ui-button-secondary interactive">View opportunities</Link><Link href="/feed" className="ui-button-secondary interactive">Read the community feed</Link></div></section>
    </main>;
}
