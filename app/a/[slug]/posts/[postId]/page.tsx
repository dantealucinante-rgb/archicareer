import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentEngagement from "@/app/components/ContentEngagement";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import styles from "@/app/communities/community.module.css";
import { getCommunityBySlug, getCommunityPost, getCurrentCommunityIdentity } from "@/lib/queries/communities";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function getPostContext(slug: string, postId: string) {
    const lookup = await getCommunityBySlug(slug);
    if (!lookup.data || !lookup.data.canView) return null;
    const result = await getCommunityPost(lookup.data.community.id, postId, lookup.data.community.visibility === "private");
    if (!result.data) return null;
    return { ...lookup.data, post: result.data };
}

export async function generateMetadata({ params }: PageProps<"/a/[slug]/posts/[postId]">): Promise<Metadata> {
    const { slug, postId } = await params;
    const data = await getPostContext(slug, postId);
    if (!data) return { title: "Post unavailable | ArchiCareer", robots: { index: false, follow: false } };
    const title = data.post.title || `${data.post.author.name} in ${data.community.name}`;
    const description = data.post.content?.slice(0, 155) || `${data.post.post_type.replaceAll("_", " ")} in ${data.community.name}.`;
    const meta = pageMetadata({ title, description, path: `/a/${slug}/posts/${postId}`, image: data.post.attachments.find((item) => item.url)?.url ?? undefined, type: "article" });
    return data.community.visibility === "private" ? { ...meta, robots: { index: false, follow: false } } : meta;
}

export default async function CommunityPostPage({ params }: PageProps<"/a/[slug]/posts/[postId]">) {
    const { slug, postId } = await params;
    const [data, identity] = await Promise.all([getPostContext(slug, postId), getCurrentCommunityIdentity()]);
    if (!data) notFound();
    const post = data.post;
    return <main className={styles.page}>
        <Link href={`/a/${slug}`} className={styles.memberLink}>← {data.community.name}</Link>
        <article className={styles.postCard}>
            <div className={styles.postHeader}><Link href={post.author.slug ? `/p/${post.author.slug}` : "#"} aria-label={`View ${post.author.name}'s profile`}><ProfileAvatar profile={post.author} size={44} className={styles.authorAvatar} /></Link><div className={styles.postAuthor}><strong>{post.author.name}</strong><span>{new Date(post.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })} · {data.community.name}</span></div><span className={styles.postTag}>{post.post_type.replaceAll("_", " ")}</span></div>
            {post.title && <h1 className={styles.postTitle}>{post.title}</h1>}{post.content && <p className={styles.postBody}>{post.content}</p>}
            {post.attachments.length > 0 && <div className={styles.postImages}>{post.attachments.filter((attachment) => attachment.url).map((attachment) => <div key={attachment.id} className={styles.postImage}><Image src={attachment.url!} alt={attachment.alt_text || `Image attached to ${post.title || "community post"}`} fill sizes="(max-width: 640px) 100vw, 720px" /></div>)}</div>}
            <ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={identity.user?.id ?? null} shareUrl={`/a/${slug}/posts/${post.id}`} />
        </article>
    </main>;
}
