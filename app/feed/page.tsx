import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFeed } from "@/lib/queries/posts";
import FeedList from "@/app/components/FeedList";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import PrimaryNav from "@/app/components/PrimaryNav";
import styles from "./feed.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "The Architecture Community Feed",
    description: "A live feed for ideas, questions, work, and conversations from Nigeria's architecture community.",
    alternates: { canonical: "/feed" },
};

function roleLabel(role: string) {
    if (role === "student") return "Student";
    if (role === "firm") return "Firm";
    return "Built environment professional";
}

export default async function FeedPage() {
    const [feedResult, profileResult] = await Promise.all([getFeed(10, 0), getCurrentProfile()]);
    const posts = feedResult.data ?? [];
    const profile = profileResult.data;
    const activeAuthors = [...new Map(posts
        .filter((post) => post.author.slug && post.author.slug !== profile?.slug)
        .map((post) => [post.author.slug, post.author])).values()].slice(0, 5);

    return <main className={styles.feedPage}>
        <div className={`${styles.feedShell} ${styles.feedShellWithRail} ${activeAuthors.length ? styles.feedShellWithAside : ""}`}>
            <aside className={styles.leftRail} aria-label="Feed navigation">
                <PrimaryNav orientation="vertical" profileHref={profile?.slug ? `/p/${profile.slug}` : undefined} />
            </aside>

            <section className={styles.timeline} aria-label="Community feed">
                <header className={styles.timelineHeader}>
                    <h1>Home</h1>
                    <span className={styles.latestLabel}>Latest</span>
                </header>
                <FeedList initialPosts={posts} initialError={feedResult.error ? "Couldn’t load posts. Try again." : ""} currentUserId={profile?.user_id ?? null} />
            </section>

            {activeAuthors.length > 0 && <aside className={styles.activePeople} aria-label="People recently active in the feed">
                <div className={styles.activePeopleInner}>
                    <h2 className={styles.sidebarHeading}>Recent voices</h2>
                    <p className={styles.sidebarDescription}>People sharing updates with the community.</p>
                    {activeAuthors.map((author) => <Link key={author.slug} href={`/p/${author.slug}`} className={styles.activePerson}>
                        <ProfileAvatar profile={author} size={36} className={styles.activeAvatar} />
                        <span className={styles.activePersonInfo}><strong className={styles.activeName}>{author.name}</strong><span className={styles.activeRole}>{roleLabel(author.role)}</span></span>
                    </Link>)}
                    <Link href="/discover" className={styles.activePerson}><span className={styles.activePersonInfo}><strong className={styles.activeName}>Explore more people</strong><span className={styles.activeRole}>Open Discover</span></span></Link>
                </div>
            </aside>}
        </div>
    </main>;
}
