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
    return <div className="min-h-screen bg-paper px-5 py-10 text-ink sm:px-8 sm:py-16"><main className="mx-auto w-full max-w-5xl"><div className="mb-10 border-b border-line pb-8"><p className="eyebrow font-mono text-redline">A-06 / THE FIELD</p><h1 className="display-balance mt-3 max-w-3xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">A place to think out loud.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">Ideas, questions, work-in-progress, and useful notes from the people shaping architecture in Nigeria.</p></div><FeedList initialPosts={posts ?? []} currentUserId={profile?.user_id ?? null} /></main></div>;
}
