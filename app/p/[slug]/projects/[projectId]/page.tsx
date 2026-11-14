import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";
import { getPortfolioItemForProfile, getPortfolioItemForViewer, getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import { getCurrentProfile, getProfileBySlug } from "@/lib/queries/profiles";
import { getFollowCounts, getFollowState, getProfileOwnerUserId } from "@/lib/queries/follows";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import FollowButton from "@/app/components/FollowButton";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import ProjectImageGallery from "@/app/components/profile-experience/ProjectImageGallery";
import PublishToggle from "@/app/components/profile-experience/PublishToggle";
import { absoluteUrl, cleanDescription, pageMetadata, safeJsonLd } from "@/lib/seo";
import styles from "./project.module.css";

type Props = { params: Promise<{ slug: string; projectId: string }> };

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const publicProjectData = cache(async (slug: string, projectId: string) => {
    const { data: owner } = await getProfileBySlug(slug);
    if (!owner) return null;
    const { data: project } = await getPortfolioItemForProfile(owner.id, projectId);
    if (!project) return null;
    return { project, owner };
});

const projectPageData = cache(async (slug: string, projectId: string) => {
    const { data: owner } = await getProfileBySlug(slug);
    if (!owner) return null;
    // Viewer-aware so the owner can preview their own drafts; everyone else is
    // held to the public policy.
    const { data: project } = await getPortfolioItemForViewer(owner.id, projectId);
    if (!project) return null;

    const viewer = await getCurrentProfile();
    const isOwner = viewer.data?.id === owner.id;
    const ownerUserId = await getProfileOwnerUserId(owner.id);
    const [follow, counts, related] = await Promise.all([
        ownerUserId ? getFollowState(viewer.data?.user_id ?? null, ownerUserId) : Promise.resolve({ isFollowing: false, isMutual: false }),
        ownerUserId ? getFollowCounts(ownerUserId) : Promise.resolve({ followers: 0, following: 0 }),
        getPortfolioItemsForProfile(owner.id, 8, 0),
    ]);

    return {
        project,
        owner,
        isOwner,
        viewerId: viewer.data?.user_id ?? null,
        ownerUserId,
        following: follow.isFollowing,
        mutual: follow.isMutual,
        followers: counts.followers,
        related: (related.data ?? []).filter((item) => item.id !== project.id).slice(0, 3),
    };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, projectId } = await params;
    const data = await publicProjectData(slug, projectId);
    if (!data) return { title: { absolute: "Project not found | Archicareer" }, robots: { index: false, follow: false } };
    const ownerName = data.owner.name;
    const title = `${data.project.title} | ${ownerName}`;
    const description = cleanDescription(data.project.description, `${label(data.project.project_type)} project by ${ownerName}.`);
    const image = data.project.images[0]?.image_url;
    return pageMetadata({ title, description, path: `/p/${data.owner.slug}/projects/${data.project.id}`, image, imageAlt: `${data.project.title} by ${ownerName}` });
}

export default async function ProjectPage({ params }: Props) {
    const { slug, projectId } = await params;
    const data = await projectPageData(slug, projectId);
    if (!data) notFound();

    const { project, owner, isOwner, viewerId, ownerUserId, following, mutual, followers, related } = data;
    const images = project.images;
    const isOrganisation = owner.account_type === "firm" || owner.account_type === "business";

    const projectSchema = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        description: project.description || undefined,
        url: absoluteUrl(`/p/${owner.slug}/projects/${project.id}`),
        image: images.map((image) => image.image_url),
        creator: { "@type": isOrganisation ? "Organization" : "Person", name: owner.name, url: absoluteUrl(`/p/${owner.slug}`) },
        genre: label(project.project_type),
        ...(project.location ? { spatialCoverage: { "@type": "Place", name: project.location } } : {}),
    };

    const metaRows: Array<[string, string | null | undefined]> = [
        ["Category", label(project.category)],
        ["Location", project.location],
        ["Year", project.year?.toString()],
        ["Role", project.role === "team" ? "Team project" : "Individual project"],
        ["Tools", project.software_used.length > 0 ? project.software_used.join(" · ") : null],
    ];

    return <main className={editorial.page}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(projectSchema) }} />
        <div className={editorial.container}>
            <div className={styles.topBar}>
                <Link className={styles.back} href={`/p/${owner.slug}#projects`}>← All projects</Link>
                {isOwner && <div className={editorial.pillRow}>
                    <PublishToggle projectId={project.id} published={project.is_published} />
                    <Pill href={`/profile/projects/${project.id}`} size="small">Edit project</Pill>
                </div>}
            </div>

            <header className={styles.head}>
                <p className={styles.kicker}>
                    <span>{label(project.project_type)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{label(project.status)}</span>
                    {!project.is_published && <span className={styles.draftBadge}>Draft — only you can see this</span>}
                </p>
                <h1 className={editorial.display}>{project.title}</h1>
                {project.description && <p className={styles.lede}>{project.description}</p>}
            </header>

            <div className={styles.cover}>
                {images[0]
                    ? <Image src={images[0].image_url} alt={project.title} fill priority sizes="100vw" />
                    : <span className={styles.coverPlaceholder}>
                        <span>{label(project.category)}</span>
                        <strong>{project.title}</strong>
                    </span>}
            </div>

            <dl className={styles.meta}>
                {metaRows.filter((row): row is [string, string] => Boolean(row[1])).map(([key, value]) => <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                </div>)}
            </dl>

            {project.process_note && <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Design approach</h2>
                </div>
                <div className={styles.approach}>
                    <p>{project.process_note}</p>
                </div>
            </section>}

            {images.length > 0 && <section className={styles.section} aria-label="Project gallery">
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Gallery</h2>
                </div>
                <ProjectImageGallery images={images} title={project.title} projectType={label(project.project_type)} />
            </section>}

            <section className={styles.section} aria-label="Credits">
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Credits</h2>
                </div>
                <div className={styles.credits}>
                    <dl>
                        <div>
                            <dt>Contribution</dt>
                            <dd>{project.role === "team" ? "Team project" : "Individual project"}</dd>
                        </div>
                        {project.role === "team" && project.team_contribution && <div>
                            <dt>Team contribution</dt>
                            <dd>{project.team_contribution}</dd>
                        </div>}
                        {project.software_used.length > 0 && <div>
                            <dt>Tools</dt>
                            <dd>{project.software_used.join(", ")}</dd>
                        </div>}
                        {project.year && <div>
                            <dt>Year</dt>
                            <dd>{project.year}</dd>
                        </div>}
                    </dl>
                </div>
            </section>

            <section className={styles.section} aria-label="Project author">
                <div className={styles.creator}>
                    <Link className={styles.creatorIdentity} href={`/p/${owner.slug}`}>
                        <ProfileAvatar profile={owner} size={64} className={styles.creatorAvatar} />
                        <span className={styles.creatorCopy}>
                            <p>Project by</p>
                            <h2>{owner.name}</h2>
                            <span>{isOrganisation ? label(owner.account_type) : owner.school_or_firm || label(owner.role)}</span>
                        </span>
                    </Link>
                    <div className={editorial.pillRow}>
                        {ownerUserId && ownerUserId !== viewerId && (viewerId
                            ? <FollowButton followingId={ownerUserId} initialFollowing={following} initialMutual={mutual} initialFollowerCount={followers} />
                            : <Pill href={`/login?next=${encodeURIComponent(`/p/${owner.slug}/projects/${project.id}`)}`} variant="orange">Sign in to follow</Pill>)}
                        <Pill href={`/p/${owner.slug}`} variant="ink">View profile →</Pill>
                    </div>
                </div>
            </section>

            {related.length > 0 && <section className={styles.section} aria-label="More from this profile">
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>More from {owner.name}</h2>
                </div>
                <div className={styles.relatedGrid}>
                    {related.map((item) => <Link key={item.id} className={styles.relatedCard} href={`/p/${owner.slug}/projects/${item.id}`}>
                        <div className={styles.relatedImage}>
                            {item.images[0] && <Image src={item.images[0].image_url} alt={item.title} fill sizes="(max-width: 700px) 100vw, 30vw" />}
                        </div>
                        <h3>{item.title}</h3>
                        <p>{label(item.category)}{item.year ? ` · ${item.year}` : ""}</p>
                    </Link>)}
                </div>
            </section>}
        </div>
    </main>;
}
