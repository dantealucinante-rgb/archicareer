import Image from "next/image";
import Link from "next/link";
import type { FeedPost, EngagementSummary, Profile } from "@/types";
import ContentEngagement from "@/app/components/ContentEngagement";
import ProfileProjectGallery from "./ProfileProjectGallery";
import type { PublicProfilePageData } from "./ProfilePageData";
import styles from "./profile-experience.module.css";

export function SectionNavigation({ items }: { items: Array<[string, string]> }) {
  return <nav className={styles.sectionNav} aria-label="Profile sections">{items.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>;
}

export function SectionTitle({ eyebrow, title, count }: { eyebrow?: string; title: string; count?: string }) {
  return <div className={styles.sectionTitle}>{eyebrow && <p>{eyebrow}</p>}<div><h2>{title}</h2>{count && <span>{count}</span>}</div></div>;
}

export function ProjectsSection({ data, id = "projects", title = "Projects", eyebrow = "SELECTED WORK" }: { data: PublicProfilePageData; id?: string; title?: string; eyebrow?: string }) {
  return <section id={id} className={styles.contentSection}>
    <SectionTitle eyebrow={eyebrow} title={title} count={data.projectCount ? String(data.projectCount) : undefined} />
    <ProfileProjectGallery slug={data.profile.slug} initialProjects={data.projects} total={data.projectCount} isOwner={data.isOwner} />
  </section>;
}

export function ToolsSection({ profile, heading = "Skills and software", id = "skills" }: { profile: Profile; heading?: string; id?: string }) {
  return <section id={id} className={styles.contentSection}>
    <SectionTitle eyebrow="TOOLS IN USE" title={heading} />
    {profile.software_proficiency.length ? <ul className={styles.skillList}>{profile.software_proficiency.map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p className={styles.emptyInline}>No skills or software listed yet.</p>}
  </section>;
}

export function InstitutionSection({ profile }: { profile: Profile }) {
  return <section id="education" className={styles.infoPanel}>
    <p className={styles.infoLabel}>EDUCATION</p>
    {profile.school_or_firm ? <h3>{profile.school_or_firm}</h3> : <p className={styles.emptyInline}>No institution listed yet.</p>}
  </section>;
}

export function OrganizationFacts({ profile, heading, includeOrganisation = true }: { profile: Profile; heading: string; includeOrganisation?: boolean }) {
  return <section id="about" className={styles.contentSection}>
    <SectionTitle eyebrow="PROFILE DETAILS" title={heading} />
    <dl className={styles.facts}>
      {includeOrganisation && profile.school_or_firm && profile.school_or_firm !== profile.name && <div><dt>Organisation</dt><dd>{profile.school_or_firm}</dd></div>}
      {profile.location && <div><dt>Location</dt><dd>{profile.location}</dd></div>}
      {profile.personal_site_url && <div><dt>Website</dt><dd><ExternalLink href={profile.personal_site_url}>{profile.personal_site_url}</ExternalLink></dd></div>}
      {profile.linkedin_url && <div><dt>LinkedIn</dt><dd><ExternalLink href={profile.linkedin_url}>Open LinkedIn profile</ExternalLink></dd></div>}
      {profile.instagram_url && <div><dt>Instagram</dt><dd><ExternalLink href={profile.instagram_url}>Open Instagram profile</ExternalLink></dd></div>}
      {(!includeOrganisation || !profile.school_or_firm || profile.school_or_firm === profile.name) && !profile.location && !profile.personal_site_url && !profile.linkedin_url && !profile.instagram_url && <div><dt>Details</dt><dd>No additional details have been added yet.</dd></div>}
    </dl>
  </section>;
}

export function PostsSection({ data, id = "posts", showTitle = true }: { data: PublicProfilePageData; id?: string; showTitle?: boolean }) {
  return <section id={id} className={styles.contentSection}>
    {showTitle && <SectionTitle eyebrow="COMMUNITY ACTIVITY" title="Posts" count={data.posts.length ? String(data.posts.length) : undefined} />}
    {data.posts.length ? <div className={styles.postList}>{data.posts.map((post) => <PostItem key={post.id} post={post} engagement={data.engagement} currentUserId={data.currentUserId} isOwner={data.isOwner} />)}</div> : <p className={styles.emptyInline}>{data.isOwner ? "Your posts will appear here when you share them." : "No posts yet."}</p>}
  </section>;
}

function PostItem({ post, engagement, currentUserId, isOwner }: { post: FeedPost; engagement: Record<string, EngagementSummary>; currentUserId: string | null; isOwner: boolean }) {
  return <article className={styles.post}>
    <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</time>
    {post.community && <p className={styles.postOrigin}>Posted in <Link href={`/a/${post.community.slug}`}>{post.community.name}</Link></p>}
    {post.title && <h3 className={styles.postTitle}>{post.title}</h3>}
    {post.content && <p className={styles.postContent}>{post.content}</p>}
    {post.image_url && <div className={styles.postImage}><Image src={post.image_url} alt={`Image shared by ${post.author.name}`} fill sizes="(max-width: 700px) 100vw, 720px" /></div>}
    <ContentEngagement target={{ post_id: post.id }} initial={engagement[post.id] ?? { reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} canModerate={isOwner} shareUrl={post.community ? `/a/${post.community.slug}/posts/${post.id}` : undefined} />
  </article>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const safeHref = safeWebUrl(href);
  return safeHref ? <a href={safeHref} target="_blank" rel="noreferrer">{children} ↗</a> : <span>{children}</span>;
}

function safeWebUrl(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}
