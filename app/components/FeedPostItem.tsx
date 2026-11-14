"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { FeedPost } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import ContentEngagement from "./ContentEngagement";
import { formatCommunityDate } from "@/lib/date-format";
import styles from "@/app/feed/feed.module.css";

type Props = {
    post: FeedPost;
    currentUserId: string | null;
    deleting: boolean;
    onDelete: () => void;
    onOpenComposer: () => void;
};

function roleLabel(role: string) {
    if (role === "student") return "Architecture student";
    if (role === "architect") return "Architect";
    if (role === "firm") return "Architecture practice";
    return "Built environment professional";
}

function typeChip(post: FeedPost): { label: string; className: string } | null {
    if (post.post_type === "question") return { label: "Question", className: styles.chipQuestion };
    if (post.post_type === "project_showcase") return { label: "Project", className: styles.chipProject };
    if (post.post_type === "single_image" || post.post_type === "image_gallery") return { label: "Images", className: styles.chipImages };
    if (post.image_url) return { label: "Project", className: styles.chipProject };
    if (post.post_type === "discussion") return { label: "Discussion", className: styles.chipQuestion };
    return null;
}

function linkifyPost(content: string) {
    const matcher = /https?:\/\/[^\s<>]+/gi;
    const parts: ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(content))) {
        const raw = match[0];
        const url = raw.replace(/[),.!?;:]+$/, "");
        const trailing = raw.slice(url.length);
        if (!url) continue;
        if (match.index > cursor) parts.push(content.slice(cursor, match.index));
        parts.push(<a key={`${match.index}-${url}`} href={url} target="_blank" rel="noreferrer">{url}</a>);
        if (trailing) parts.push(trailing);
        cursor = match.index + raw.length;
    }
    if (cursor < content.length) parts.push(content.slice(cursor));
    return parts.length ? parts : content;
}

function AuthorDetails({ post }: { post: FeedPost }) {
    const authorHref = post.author.slug ? `/p/${post.author.slug}` : null;
    return <><span className={styles.authorMeta}>
        {authorHref ? <Link href={authorHref} className={styles.authorName}>{post.author.name}</Link> : <strong className={styles.authorName}>{post.author.name}</strong>}
        {post.author.slug && <span className={styles.username}>@{post.author.slug}</span>}
        <span className={styles.timestamp} aria-hidden="true">·</span>
        <Link href={`/posts/${post.id}`} className={styles.postPermalink} aria-label={`Open post by ${post.author.name}`}><time className={styles.timestamp} dateTime={post.created_at}>{formatCommunityDate(post.created_at)}</time></Link>
    </span><span className={styles.authorRole}>{roleLabel(post.author.role)}{post.author.location ? ` · ${post.author.location}` : ""}</span></>;
}

export default function FeedPostItem({ post, currentUserId, deleting, onDelete, onOpenComposer }: Props) {
    const authorHref = post.author.slug ? `/p/${post.author.slug}` : null;
    const chip = typeChip(post);
    const showcase = Boolean(post.image_url);
    return <article id={`post-${post.id}`} aria-label={`Post by ${post.author.name}`} className={showcase ? styles.postShowcase : styles.postDiscussion}>
        <div className={styles.postRow}>
            {authorHref ? <Link href={authorHref} aria-label={`View ${post.author.name}'s profile`} className={styles.authorAvatarLink}><ProfileAvatar profile={post.author} size={44} className={styles.authorAvatar} /></Link>
                : <ProfileAvatar profile={post.author} size={44} className={styles.authorAvatar} />}
            <div className={styles.postBody}>
                <header className={styles.authorRow}>
                    <div className={styles.authorInfo}><AuthorDetails post={post} /></div>
                    {post.user_id === currentUserId && <button type="button" disabled={deleting} onClick={onDelete} aria-label="Delete post" title="Delete post" className={styles.postOptions}>{deleting ? "…" : "⋯"}</button>}
                </header>
                {(chip || post.community) && <div className={styles.chipRow}>
                    {chip && <span className={`${styles.typeChip} ${chip.className}`}>{chip.label}</span>}
                    {post.community && <p className={styles.communityOrigin}>Posted in <Link href={`/a/${post.community.slug}`}>&nbsp;{post.community.name}</Link></p>}
                </div>}
                {post.title && <h2 className={styles.communityPostTitle}><Link href={`/posts/${post.id}`} className={styles.postTitleLink}>{post.title}</Link></h2>}
                {post.content && <p className={styles.postContent}>{linkifyPost(post.content)}</p>}
            </div>
        </div>
        {post.image_url && <Link href={`/posts/${post.id}`} className={styles.postMedia} aria-label={`Open post by ${post.author.name}`}><div className={styles.postMediaImageWrap}><Image src={post.image_url} alt={`Image shared by ${post.author.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 680px, 640px" className={styles.postMediaImage} /></div><span className={`${styles.mediaCaption} ${post.community ? styles.mediaCaptionCommunity : chip?.label === "Question" ? styles.mediaCaptionAlt : ""}`}>{post.community ? post.community.name : chip?.label ?? "From the field"}</span></Link>}
        {post.client_status ? <div className={styles.pendingStatus}>{post.client_status === "pending" ? "Publishing post…" : <>Post wasn’t published. <button type="button" onClick={onOpenComposer}>Retry in composer</button></>}</div>
            : <div className={styles.engagement}><ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} compactActions shareUrl={`/posts/${post.id}`} /></div>}
    </article>;
}
