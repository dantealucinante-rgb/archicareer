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
    return <div className="min-h-screen bg-paper px-5 py-7 text-ink sm:px-8 sm:py-12"><main className="mx-auto w-full max-w-5xl"><div className="mb-6 border-b border-line pb-5"><p className="font-mono text-[10px] uppercase tracking-widest text-redline">The field</p><div className="mt-2 flex flex-wrap items-baseline justify-between gap-3"><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Think out loud.</h1><p className="max-w-lg text-sm leading-relaxed text-graphite">Ideas, questions, work-in-progress, and useful notes from the architecture community.</p></div></div><FeedList initialPosts={posts ?? []} currentUserId={profile?.user_id ?? null} /></main></div>;
}
