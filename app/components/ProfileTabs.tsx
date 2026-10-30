"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { FeedPost, PortfolioItem, Profile, EngagementSummary } from "@/types";
import ContentEngagement from "./ContentEngagement";

type Props = { profile: Profile; slug: string; projects: PortfolioItem[]; posts: FeedPost[]; engagement: Record<string, EngagementSummary>; currentUserId: string | null; isOwner: boolean };

const tabs = ["Posts", "Projects", "About"] as const;

export default function ProfileTabs({ profile, slug, projects, posts, engagement, currentUserId, isOwner }: Props) {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Projects");
    return <section className="mt-5" aria-label="Profile content">
        <nav className="sticky top-[3.5rem] z-20 flex rounded-xl border border-line bg-warm-white/95 p-1 shadow-sm backdrop-blur-sm" aria-label="Profile sections" role="tablist">{tabs.map((tab) => <button key={tab} type="button" role="tab" onClick={() => setActiveTab(tab)} aria-selected={activeTab === tab} className={`relative min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-sand text-ink" : "text-graphite hover:text-ink"}`}>{tab}</button>)}</nav>
        <div className="ui-panel mt-4 p-4 sm:p-6">
            {activeTab === "Projects" && <ProjectsTab slug={slug} projects={projects} engagement={engagement} currentUserId={currentUserId} isOwner={isOwner} />}
            {activeTab === "Posts" && <PostsTab posts={posts} engagement={engagement} currentUserId={currentUserId} />}
            {activeTab === "About" && <AboutTab profile={profile} />}
        </div>
    </section>;
}

function ProjectsTab({ slug, projects, engagement, currentUserId, isOwner }: { slug: string; projects: PortfolioItem[]; engagement: Record<string, EngagementSummary>; currentUserId: string | null; isOwner: boolean }) {
    if (projects.length === 0) return <div className="py-12 text-center"><p className="text-sm font-medium text-ink">{isOwner ? "Your projects will appear here." : "No projects published yet."}</p><p className="mt-1 text-sm text-graphite">{isOwner ? "Add your first project from Edit profile." : "Check back when this profile has added work."}</p>{isOwner && <Link href="/profile/edit#portfolio" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-ink px-4 text-xs font-medium text-paper hover:bg-redline">Add a project</Link>}</div>;
    return <div id="projects"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{projects.map((project) => <Link key={project.id} id={`project-${project.id}`} href={`/p/${slug}#project-${project.id}`} aria-label={`View ${project.title}`} className="group relative aspect-square overflow-hidden rounded-lg bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline">{project.images[0] ? <Image src={project.images[0].image_url} alt={project.title} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover transition-transform duration-200 group-hover:scale-[1.03]" /> : <span className="grid h-full place-items-center px-2 text-center text-xs text-graphite">{project.title}</span>}<span className="sr-only">{project.title}, {project.category}</span></Link>)}</div><div className="mt-6 divide-y divide-line border-y border-line">{projects.map((project) => <article key={project.id} className="py-4"><div className="flex items-baseline justify-between gap-3"><h2 className="text-sm font-medium text-ink">{project.title}</h2><span className="text-xs text-graphite">{project.year ?? project.category}</span></div>{project.description && <p className="mt-1 text-xs leading-relaxed text-graphite">{project.description}</p>}<div className="mt-2"><ContentEngagement target={{ portfolio_item_id: project.id }} initial={engagement[project.id]} currentUserId={currentUserId} canModerate={isOwner} /></div></article>)}</div></div>;
}

function PostsTab({ posts, engagement, currentUserId }: { posts: FeedPost[]; engagement: Record<string, EngagementSummary>; currentUserId: string | null }) {
    if (posts.length === 0) return <div className="py-12 text-center text-sm text-graphite">No posts published yet.</div>;
    return <div className="border-y border-line">{posts.map((post) => <article key={post.id} className="border-b border-line bg-warm-white py-5 last:border-b-0"><div className="flex items-center justify-between gap-3"><time dateTime={post.created_at} className="text-xs text-graphite">{new Date(post.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</time></div>{post.content && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{post.content}</p>}{post.image_url && <div className="relative mt-3 aspect-[4/3] overflow-hidden bg-sand"><Image src={post.image_url} alt="Post image" fill sizes="(max-width: 640px) 100vw, 672px" className="object-cover" /></div>}<div className="mt-3"><ContentEngagement target={{ post_id: post.id }} initial={engagement[post.id] ?? { reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} /></div></article>)}</div>;
}

function AboutTab({ profile }: { profile: Profile }) {
    const links = [["Portfolio website", profile.personal_site_url], ["Instagram", profile.instagram_url], ["LinkedIn", profile.linkedin_url]].filter((entry): entry is [string, string] => Boolean(entry[1]));
    const sections = [{ title: "About", content: profile.bio }, { title: "Education", content: profile.school_or_firm }, { title: "Experience", content: profile.role === "firm" ? "Architecture firm" : profile.role === "architect" ? "Architect" : "Architecture student" }].filter((section) => section.content);
    return <div className="divide-y divide-line border-y border-line">{sections.map((section) => <section key={section.title} className="py-5"><h2 className="text-sm font-semibold text-ink">{section.title}</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-graphite">{section.content}</p></section>)}{profile.software_proficiency.length > 0 && <section className="py-5"><h2 className="text-sm font-semibold text-ink">Software & skills</h2><div className="mt-3 flex flex-wrap gap-2">{profile.software_proficiency.map((tool) => <span key={tool} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-graphite">{tool}</span>)}</div></section>}{profile.cv_url && <section className="py-5"><h2 className="text-sm font-semibold text-ink">CV / résumé</h2><a href={profile.cv_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-redline hover:underline">Open CV</a></section>}{links.length > 0 && <section className="py-5"><h2 className="text-sm font-semibold text-ink">External links</h2><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="text-sm text-redline hover:underline">{label}</a>)}</div></section>}</div>;
}
