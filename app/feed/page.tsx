import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFeed } from "@/lib/queries/posts";
import FeedList from "@/app/components/FeedList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "The Architecture Community Feed",
    description: "A live feed for ideas, questions, work, and conversations from Nigeria's architecture community.",
    alternates: { canonical: "/feed" },
};

export default async function FeedPage() {
    const [{ data: posts }, { data: profile }] = await Promise.all([getFeed(10, 0), getCurrentProfile()]);
    return <div className="min-h-screen bg-paper py-5 text-ink sm:px-8 sm:py-10"><main className="mx-auto w-full max-w-[var(--page-max)]"><div className="mb-5 px-5 sm:px-0"><div className="ui-panel grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-7"><div><p className="ui-kicker">Community / field notes</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Think out loud.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-graphite">Ideas, work-in-progress, and useful notes from the architecture community.</p></div><p className="ui-meta font-mono uppercase tracking-widest">{posts?.length ?? 0} recent notes</p></div></div><FeedList initialPosts={posts ?? []} currentUserId={profile?.user_id ?? null} /></main></div>;
}
