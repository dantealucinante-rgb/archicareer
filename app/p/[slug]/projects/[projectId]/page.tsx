import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPortfolioItemById } from "@/lib/queries/portfolio";
import { getPublicProfileById } from "@/lib/queries/profiles";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFollowCounts, getFollowState, getProfileOwnerUserId } from "@/lib/queries/follows";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import FollowButton from "@/app/components/FollowButton";
import BrandMark from "@/app/components/BrandMark";
import { cache } from "react";

type Props = { params: Promise<{ slug: string; projectId: string }> };
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const projectPageData = cache(async (projectId: string) => {
    const { data: project } = await getPortfolioItemById(projectId);
    if (!project) return null;
    const [{ data: owner }, { data: viewer }] = await Promise.all([
        getPublicProfileById(project.profile_id), getCurrentProfile(),
    ]);
    if (!owner) return { project, owner: null, viewerId: viewer?.user_id ?? null, ownerUserId: null, following: false, mutual: false, followers: 0 };
    const ownerUserId = await getProfileOwnerUserId(owner.id);
    const [follow, counts] = ownerUserId ? await Promise.all([getFollowState(viewer?.user_id ?? null, ownerUserId), getFollowCounts(ownerUserId)]) : [{ isFollowing: false, isMutual: false }, { followers: 0, following: 0 }];
    return { project, owner, viewerId: viewer?.user_id ?? null, ownerUserId, following: follow.isFollowing, mutual: follow.isMutual, followers: counts.followers };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { projectId } = await params;
    const data = await projectPageData(projectId);
    if (!data) return { title: "Project not found", robots: { index: false } };
    const ownerName = data.owner?.name;
    return { title: ownerName ? `${data.project.title} — ${ownerName}` : data.project.title, description: data.project.description || `${label(data.project.project_type)} project${ownerName ? ` by ${ownerName}` : ""}.`, ...(data.owner ? { alternates: { canonical: `/p/${data.owner.slug}/projects/${projectId}` } } : {}) };
}

export default async function ProjectPage({ params }: Props) {
    const { projectId } = await params;
    const data = await projectPageData(projectId);
    if (!data) notFound();
    const { project, owner, viewerId, ownerUserId, following, mutual, followers } = data;
    const images = project.images;
    return <div className="portfolio-site min-h-screen bg-white text-ink">
        <header className="portfolio-nav"><Link href="/" className="portfolio-brand"><BrandMark className="portfolio-brand-mark" /><span>ARCHICAREER</span></Link>{owner && <Link href={`/p/${owner.slug}`} className="portfolio-nav-name">{owner.name}</Link>}<nav aria-label="Project navigation">{owner && <><Link href={`/p/${owner.slug}#projects`}>All projects</Link><Link href={`/p/${owner.slug}#about`}>About</Link></>}<Link href={`mailto:?subject=${encodeURIComponent(`Project enquiry: ${project.title}`)}`}>Contact ↗</Link></nav></header>
        <main className="portfolio-main portfolio-detail">
            <div className="portfolio-detail-heading"><Link href={owner ? `/p/${owner.slug}#projects` : "/discover"} className="portfolio-back">← {owner ? "BACK TO PROJECTS" : "BACK TO DISCOVER"}</Link><p className="portfolio-section-label">{label(project.project_type)} / {label(project.status)}</p><h1>{project.title}</h1>{project.description && <p className="portfolio-detail-lede">{project.description}</p>}</div>
            <section className="portfolio-detail-meta" aria-label="Project information">{[["CATEGORY", label(project.category)], ["LOCATION", project.location], ["YEAR", project.year?.toString()], ["ROLE", project.role === "team" ? `Team · ${project.team_contribution || ""}` : "Individual"], ["TOOLS", project.software_used.join(" · ")]].filter((row) => row[1]).map(([key, value]) => <div key={key}><span>{key}</span><p>{value}</p></div>)}</section>
            {project.process_note && <section className="portfolio-concept"><p className="portfolio-section-label">DESIGN APPROACH</p><p>{project.process_note}</p></section>}
            <div className="portfolio-detail-gallery">{images.map((image, index) => <figure key={image.id} className={index === 0 ? "portfolio-detail-image portfolio-detail-image-wide" : "portfolio-detail-image"}><Image src={image.image_url} alt={`${project.title}, project image ${index + 1}`} fill priority={index === 0} sizes="(max-width: 700px) 100vw, 90vw" className="portfolio-cover" /><figcaption>{project.title} <span>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span></figcaption></figure>)}</div>
            {images.length === 0 && <p className="portfolio-empty">No project images have been published.</p>}
            <footer className="portfolio-detail-footer">{owner ? <div className="flex flex-wrap items-center gap-4"><ProfileAvatar profile={owner} size={56} className="h-14 w-14 rounded-2xl border-2 border-ink object-cover" /><div><p className="portfolio-section-label">PROJECT BY</p><h2>{owner.name}</h2><p>{owner.account_type === "firm" || owner.account_type === "business" ? owner.account_type : owner.school_or_firm || label(owner.role)}</p></div>{ownerUserId && ownerUserId !== viewerId && (viewerId ? <FollowButton followingId={ownerUserId} initialFollowing={following} initialMutual={mutual} initialFollowerCount={followers} /> : <Link href={`/login?next=${encodeURIComponent(`/p/${owner.slug}/projects/${project.id}`)}`}>Sign in to follow</Link>)}<Link href={`/p/${owner.slug}`}>View profile ↗</Link></div> : <div><p className="portfolio-section-label">PROJECT BY</p><h2>Owner profile unavailable</h2><p>This project is still available to view.</p></div>}</footer>
        </main>
        <div className="portfolio-footer">{owner ? <Link href={`/p/${owner.slug}`}>{owner.name}</Link> : <span>ARCHICAREER</span>}<span>PROJECT CASE STUDY</span>{owner ? <Link href={`/p/${owner.slug}#projects`}>ALL PROJECTS ↑</Link> : <Link href="/discover">DISCOVER ↑</Link>}</div>
    </div>;
}
