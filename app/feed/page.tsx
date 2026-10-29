import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFeed } from "@/lib/queries/posts";
import FeedList from "@/app/components/FeedList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "The Architecture Community Feed",
    description: "A live feed for ideas, questions, work, and conversations from Nigeria's architecture community.",
    alternates: { canonical: "/feed" },
};

export default async function FeedPage() {
    const [{ data: posts }, { data: profile }] = await Promise.all([getFeed(10, 0), getCurrentProfile()]);
    const postCount = posts?.length ?? 0;

    return <div className="min-h-screen bg-paper py-5 text-ink sm:px-8 sm:py-10">
        <main className="mx-auto w-full max-w-[var(--page-max)]">
            <div className="px-5 sm:px-0">
                <section className="feed-intro border-b border-line pb-6 sm:pb-8">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end lg:gap-12">
                        <div>
                            <p className="ui-kicker">Community / field notes</p>
                            <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">The work, as it happens.</h1>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite sm:text-base">Projects in progress, practical questions, and perspectives from the architecture community.</p>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-line pt-4 lg:block lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                            <p className="ui-meta font-mono uppercase tracking-widest">Current edition</p>
                            <p className="mt-1 font-display text-2xl font-semibold text-ink">{postCount}</p>
                            <p className="text-xs text-graphite">recent field notes</p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="feed-layout mt-6 lg:grid lg:grid-cols-[minmax(0,44rem)_16rem] lg:items-start lg:justify-center lg:gap-12">
                <section aria-label="Community posts" className="min-w-0">
                    <div className="mb-3 flex items-center justify-between px-5 sm:px-0">
                        <p className="ui-meta font-mono uppercase tracking-widest">Latest from the field</p>
                        <span className="h-px w-16 bg-line" aria-hidden="true" />
                    </div>
                    <FeedList initialPosts={posts ?? []} currentUserId={profile?.user_id ?? null} />
                </section>

                <aside className="feed-aside mx-5 mt-10 hidden border-t border-line pt-5 lg:sticky lg:top-28 lg:mx-0 lg:mt-0 lg:block" aria-label="Explore ArchiCareer">
                    <p className="ui-kicker">Keep exploring</p>
                    <p className="mt-3 font-display text-xl font-semibold tracking-tight">Find people and opportunities through the work.</p>
                    <div className="mt-5 space-y-1 border-y border-line py-3 text-sm">
                        <Link href="/discover" className="feed-aside-link">Discover professionals <span aria-hidden="true">↗</span></Link>
                        <Link href="/jobs" className="feed-aside-link">Browse opportunities <span aria-hidden="true">↗</span></Link>
                    </div>
                    {!profile && <p className="mt-5 text-sm leading-relaxed text-graphite"><Link href="/signup" className="font-medium text-ink underline decoration-redline underline-offset-4 hover:text-redline">Create a profile</Link> to add your voice to the field.</p>}
                </aside>
            </div>
        </main>
    </div>;
}
