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
    return <div className="min-h-screen bg-paper py-8 text-ink sm:px-8 sm:py-12"><main className="mx-auto w-full max-w-[var(--page-max)]"><div className="mb-8 border-b border-line px-5 pb-7 sm:px-0"><div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="ui-kicker">Community</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">The architecture community feed.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-graphite">Ideas, work-in-progress, and useful notes from the field.</p></div><p className="ui-meta font-mono uppercase tracking-widest">{posts?.length ?? 0} recent notes</p></div></div><FeedList initialPosts={posts ?? []} currentUserId={profile?.user_id ?? null} /></main></div>;
}
