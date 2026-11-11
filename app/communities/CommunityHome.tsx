"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Community, CommunityMember } from "@/types/community";
import type { CommunityPost } from "@/lib/queries/communities";
import CommunityMembershipButton from "./CommunityMembershipButton";
import styles from "./community.module.css";

type Filter = "latest" | "popular" | "questions" | "projects";

export default function CommunityHome({ community, posts: initialPosts, members, signedIn, canView, canModerate, isOwner, slug }: {
    community: Community; posts: CommunityPost[]; members: CommunityMember[]; signedIn: boolean; canView: boolean; canModerate: boolean; isOwner: boolean; slug: string;
}) {
    const [filter, setFilter] = useState<Filter>("latest");
    const [posts, setPosts] = useState(initialPosts);
    const [postOffset, setPostOffset] = useState(initialPosts.length);
    const [hasMorePosts, setHasMorePosts] = useState(initialPosts.length >= 20);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postType, setPostType] = useState<"discussion" | "question" | "project_showcase">("discussion");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [reportTarget, setReportTarget] = useState<{ target_type: "community" | "post"; target_id: string } | null>(null);
    const [reportCategory, setReportCategory] = useState("spam");
    const [reportDetails, setReportDetails] = useState("");
    const tabs: { key: Filter; label: string }[] = [{ key: "latest", label: "Latest" }, { key: "popular", label: "Popular" }, { key: "questions", label: "Questions" }, { key: "projects", label: "Projects" }];
    const visiblePosts = posts.filter((post) => filter === "questions" ? post.post_type === "question" : filter === "projects" ? post.post_type === "project_showcase" : true).sort((a, b) => filter === "popular" ? b.reaction_count + b.comment_count - a.reaction_count - a.comment_count : Date.parse(b.created_at) - Date.parse(a.created_at));

    async function changeFilter(next: Filter) {
        setFilter(next); setLoadingPosts(true); setMessage("");
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/posts?filter=${next}&limit=20&offset=0`);
            const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error ?? "Unable to load posts");
            setPosts(payload.posts ?? []); setPostOffset(payload.posts?.length ?? 0); setHasMorePosts(Boolean(payload.hasMore));
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load posts"); }
        finally { setLoadingPosts(false); }
    }

    async function loadMorePosts() {
        if (loadingPosts || !hasMorePosts) return;
        setLoadingPosts(true); setMessage("");
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/posts?filter=${filter}&limit=20&offset=${postOffset}`);
            const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error ?? "Unable to load posts");
            setPosts((current) => [...current, ...(payload.posts ?? [])]); setPostOffset((current) => current + (payload.posts?.length ?? 0)); setHasMorePosts(Boolean(payload.hasMore));
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load posts"); }
        finally { setLoadingPosts(false); }
    }

    async function publish(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true); setMessage("");
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_type: postType, title, content }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to publish post");
            setMessage("Your post is live."); setTitle(""); setContent("");
            window.location.reload();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to publish post"); }
        finally { setSubmitting(false); }
    }

    async function submitReport(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); if (!reportTarget) return;
        const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/reports`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...reportTarget, category: reportCategory, details: reportDetails }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to submit report"); return; }
        setReportTarget(null); setReportDetails(""); setMessage("Report sent to the ArchiCareer moderation team.");
    }

    return <>
        <header className={styles.hero}>
            <div className={`${styles.avatar} ${styles.heroAvatar}`}>{community.avatar_url ? <Image src={community.avatar_url} alt="" width={124} height={124} /> : community.name.slice(0, 1)}</div>
            <div>
                <p className={styles.eyebrow}>{community.visibility === "private" ? "Private community" : "Public community"}</p>
                <h1 className={styles.heroTitle}>{community.name}</h1>
                {community.description && <p className={styles.heroDescription}>{community.description}</p>}
                {!community.description && community.visibility === "private" && <p className={styles.heroDescription}>A private community. Request to join to see its description and conversations.</p>}
                <div className={styles.heroMeta}><span>{community.member_count.toLocaleString()} members</span><span>{community.visibility}</span></div>
            </div>
            <div className={`${styles.membershipControl} ${styles.heroActions}`}>
                <CommunityMembershipButton community={community} returnTo={`/a/${slug}`} />
                {isOwner && <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/a/${slug}/settings`}>Settings</Link>}
                {signedIn && <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setReportTarget({ target_type: "community", target_id: community.id })}>Report</button>}
            </div>
        </header>
        <nav className={styles.communityNav} aria-label="Community sections">
            <a className={styles.navActive} href={`/a/${slug}`}>Overview</a>
            <a href={`/a/${slug}#community-posts`}>Posts</a>
            {canView && <Link href={`/a/${slug}/members`}>Members</Link>}
            {(canModerate || isOwner) && <Link href={`/a/${slug}/moderation`}>Moderation</Link>}
        </nav>
        {!canView ? <div className={styles.communityStatus} role="status">{community.viewer_status === "pending" ? "Your membership request is awaiting review." : community.viewer_status === "banned" ? "You can no longer access this community." : "Join or request access to view posts and members."}</div> : <div className={styles.feedLayout}>
            <section className={styles.feedMain} id="community-posts" aria-label={`${community.name} posts`}>
                <div className={styles.feedHeading}><h2>Community posts</h2></div>
                {community.viewer_status === "active" && <form className={styles.composer} onSubmit={publish}>
                    <h3 className={styles.composerTitle}>Add to the conversation</h3>
                    <div className={styles.composerGrid}>
                        <label className={styles.fieldGroup}>Post type<select className={styles.select} value={postType} onChange={(event) => setPostType(event.target.value as typeof postType)}><option value="discussion">Discussion</option><option value="question">Question</option><option value="project_showcase">Project showcase</option></select></label>
                        <label className={styles.fieldGroup}>Title <span className={styles.fieldHint}>Optional</span><input className={styles.field} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
                    </div>
                    <label className={styles.fieldGroup}><span className="sr-only">Your post</span><textarea className={`${styles.field} ${styles.textarea}`} maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Share a question, idea or work in progress" /></label>
                    <div className={styles.formFooter}><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={submitting || (!content.trim() && !title.trim())}>{submitting ? "Publishing…" : "Publish post"}</button>{message && <span role="status" className={styles.fieldHint}>{message}</span>}</div>
                </form>}
                <div className={styles.tabs} role="tablist" aria-label="Filter posts">{tabs.map((tab) => <button key={tab.key} className={`${styles.tab} ${filter === tab.key ? styles.tabActive : ""}`} type="button" role="tab" aria-selected={filter === tab.key} disabled={loadingPosts} onClick={() => void changeFilter(tab.key)}>{tab.label}</button>)}</div>
                {message && <p role="alert" className={styles.notice}>{message}</p>}{visiblePosts.length === 0 && loadingPosts ? <div className={styles.empty} role="status"><p>Loading posts…</p></div> : visiblePosts.length === 0 ? <div className={styles.empty}><h2>This space is ready for its first conversation.</h2><p>Questions, ideas and published work from members will appear here.</p></div> : <div className={styles.postList}>{visiblePosts.map((post) => <article key={post.id} className={`${styles.postCard} ${post.post_type === "question" ? styles.postQuestion : post.post_type === "project_showcase" ? styles.postProject : ""}`}>
                    <div className={styles.postHeader}>{post.author.avatar_url ? <Image src={post.author.avatar_url} alt="" width={42} height={42} className={styles.avatar} /> : <span className={`${styles.avatar} ${styles.heroAvatar}`}>{post.author.name.slice(0, 1)}</span>}<div className={styles.postAuthor}><strong>{post.author.name}</strong><span>{new Date(post.created_at).toLocaleDateString()}</span></div><span className={styles.postTag}>{post.post_type.replaceAll("_", " ")}</span></div>
                    {post.title && <h3 className={styles.postTitle}>{post.title}</h3>}{post.content && <p className={styles.postBody}>{post.content}</p>}
                    {post.attachments.length > 0 && <div className={styles.postImages}>{post.attachments.filter((attachment) => attachment.url).map((attachment) => <a className={styles.postImage} key={attachment.id} href={attachment.url!} target="_blank" rel="noreferrer"><Image src={attachment.url!} alt={attachment.alt_text || `Image attached to ${post.title || "community post"}`} fill sizes="(max-width: 640px) 100vw, 720px" /></a>)}</div>}
                    <div className={styles.postActions}><Link className={`${styles.button} ${styles.buttonSecondary} ${styles.smallButton}`} href={`/a/${slug}/posts/${post.id}`}>Open conversation · {post.comment_count} comments</Link>{signedIn && <>
                        <button className={`${styles.button} ${styles.buttonSecondary} ${styles.smallButton}`} type="button" onClick={async () => { const desired = !post.user_reacted; const response = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: post.id, reacted: desired }) }); if (response.ok) setPosts((items) => items.map((item) => item.id === post.id ? { ...item, user_reacted: desired, reaction_count: Math.max(0, item.reaction_count + (desired ? 1 : -1)) } : item)); }}>Like · {post.reaction_count}</button>
                        <button className={`${styles.button} ${styles.buttonSecondary} ${styles.smallButton}`} type="button" onClick={async () => { const desired = !post.user_bookmarked; const response = await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: post.id, bookmarked: desired }) }); if (response.ok) setPosts((items) => items.map((item) => item.id === post.id ? { ...item, user_bookmarked: desired } : item)); }}>{post.user_bookmarked ? "Saved" : "Save"}</button>
                    </>}<button className={`${styles.button} ${styles.buttonSecondary} ${styles.smallButton}`} type="button" onClick={async () => { const url = `${window.location.origin}/a/${slug}/posts/${post.id}`; if (navigator.share) await navigator.share({ title: post.title || community.name, url }).catch(() => undefined); else { await navigator.clipboard.writeText(url); setMessage("Post link copied."); } }}>Share</button>{signedIn && <button className={`${styles.button} ${styles.buttonSecondary} ${styles.smallButton}`} type="button" onClick={() => setReportTarget({ target_type: "post", target_id: post.id })}>Report</button>}</div>
                </article>)}</div>}{hasMorePosts && <div className={styles.pagination}><button type="button" disabled={loadingPosts} onClick={() => void loadMorePosts()} className={`${styles.button} ${styles.buttonSecondary}`}>{loadingPosts ? "Loading…" : "Load more posts"}</button></div>}
            </section>
            <aside className={styles.sidebar}><h2>About this community</h2><p>{community.description || "Community details are visible to approved members."}</p><div className={styles.memberList}>{members.slice(0, 6).map((member) => <div className={styles.memberRow} key={member.id}>{member.profile?.avatar_url ? <Image src={member.profile.avatar_url} alt="" width={36} height={36} className={styles.avatar} /> : <span className={styles.avatar}>{member.profile?.name.slice(0, 1) ?? "A"}</span>}<div className={styles.memberInfo}><strong>{member.profile?.name ?? "Member"}</strong><span>{member.role}</span></div></div>)}</div><Link className={styles.memberLink} href={`/a/${slug}/members`}>View all members</Link></aside>
        </div>}
        {reportTarget && <div className={styles.modalBackdrop}><form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="report-title" onSubmit={(event) => void submitReport(event)}><h2 id="report-title">Report {reportTarget.target_type}</h2><p>Reports are reviewed by ArchiCareer moderators.</p><label className={styles.fieldGroup}>Reason<select className={styles.select} value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="inappropriate">Inappropriate content</option><option value="misinformation">Misleading information</option><option value="other">Other</option></select></label><label className={styles.fieldGroup}>Details<textarea className={`${styles.field} ${styles.textarea}`} value={reportDetails} maxLength={1000} onChange={(event) => setReportDetails(event.target.value)} /></label><div className={styles.formFooter}><button className={`${styles.button} ${styles.buttonPrimary}`}>Send report</button><button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setReportTarget(null)}>Cancel</button></div></form></div>}
    </>;
}
