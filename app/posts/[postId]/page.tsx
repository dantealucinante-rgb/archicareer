import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentEngagement from "@/app/components/ContentEngagement";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import { MarketingFooter } from "@/app/components/MarketingChrome";
import { getPostById } from "@/lib/queries/posts";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { formatCommunityDate } from "@/lib/date-format";
import { pageMetadata } from "@/lib/seo";
import styles from "./post.module.css";

export const dynamic = "force-dynamic";

function roleLabel(role: string) {
    if (role === "student") return "Architecture student";
    if (role === "architect") return "Architect";
    if (role === "firm") return "Architecture practice";
    return "Built environment professional";
}

function typeLabel(post: { post_type?: string | null; image_url: string | null }) {
    if (post.post_type === "question") return "Question";
    if (post.post_type === "project_showcase" || post.image_url) return "Project";
    if (post.post_type === "single_image" || post.post_type === "image_gallery") return "Images";
    if (post.post_type === "discussion") return "Discussion";
    return null;
}

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }): Promise<Metadata> {
    const { postId } = await params;
    const { data: post } = await getPostById(postId);
    if (!post) return { title: "Post unavailable", robots: { index: false, follow: false } };
    const title = post.title || `Post by ${post.author.name}`;
    const description = post.content?.slice(0, 155) || `A post from ${post.author.name} on ArchiCareer.`;
    return pageMetadata({ title, description, path: `/posts/${post.id}`, image: post.image_url ?? undefined, type: "article" });
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const [{ data: post }, profileResult] = await Promise.all([getPostById(postId), getCurrentProfile()]);
    if (!post) notFound();
    const currentUserId = profileResult.data?.user_id ?? null;
    const label = typeLabel(post);
    const authorHref = post.author.slug ? `/p/${post.author.slug}` : null;

    return <main className={styles.page}>
        <div className={styles.shell}>
            <header className={styles.topBar}>
                <Link href="/feed" className={styles.backLink}><span aria-hidden="true">←</span> Feed</Link>
                <span className={styles.kicker}>Post</span>
            </header>

            <article className={styles.post}>
                <header className={styles.authorRow}>
                    {authorHref ? <Link href={authorHref} aria-label={`View ${post.author.name}'s profile`} className={styles.avatarLink}><ProfileAvatar profile={post.author} size={52} className={styles.avatar} /></Link>
                        : <ProfileAvatar profile={post.author} size={52} className={styles.avatar} />}
                    <div className={styles.authorInfo}>
                        <span className={styles.nameRow}>
                            {authorHref ? <Link href={authorHref} className={styles.name}>{post.author.name}</Link> : <span className={styles.name}>{post.author.name}</span>}
                            {post.author.slug && <span className={styles.username}>@{post.author.slug}</span>}
                        </span>
                        <span className={styles.authorRole}>{roleLabel(post.author.role)}{post.author.location ? ` · ${post.author.location}` : ""}</span>
                    </div>
                    <time className={styles.timestamp} dateTime={post.created_at}>{formatCommunityDate(post.created_at)}</time>
                </header>

                {label && <div className={styles.chipRow}>
                    <span className={styles.typeChip}>{label}</span>
                </div>}

                {post.title && <h1 className={styles.title}>{post.title}</h1>}
                {post.content && <p className={styles.content}>{post.content}</p>}

                {post.image_url && <div className={styles.media}>
                    <div className={styles.mediaWrap}><Image src={post.image_url} alt={`Image shared by ${post.author.name}`} fill priority sizes="(max-width: 760px) 100vw, 720px" /></div>
                </div>}

                <div className={styles.engagement}>
                    <ContentEngagement
                        target={{ post_id: post.id }}
                        initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }}
                        currentUserId={currentUserId}
                        defaultOpen
                        shareUrl={`/posts/${post.id}`}
                    />
                </div>
            </article>
        </div>

        <div className={styles.footerWrap}>
            <MarketingFooter />
        </div>
    </main>;
}
