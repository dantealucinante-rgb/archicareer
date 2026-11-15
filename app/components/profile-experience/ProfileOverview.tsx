import Image from "next/image";
import Link from "next/link";
import Pill from "@/app/components/editorial/Pill";
import type { PortfolioItem, Profile } from "@/types";
import { affiliationLabels, formatCategory } from "./format";
import SectionHeading from "./SectionHeading";
import styles from "./profile-experience.module.css";

type ProfileOverviewProps = {
    profile: Profile;
    projects: PortfolioItem[];
    projectCount: number;
    isOwner: boolean;
};

export default function ProfileOverview({ profile, projects, projectCount, isOwner }: ProfileOverviewProps) {
    const [lead, ...rest] = projects;
    const affiliation = profile.school_or_firm && profile.school_or_firm !== profile.name ? profile.school_or_firm : null;
    const expertise = profile.details?.expertise ?? [];
    const facts = [
        affiliation && { label: affiliationLabels[profile.account_type], value: affiliation },
        profile.location && { label: "Based in", value: profile.location },
        expertise.length > 0 && { label: "Focus", value: expertise.slice(0, 4).join(" · ") },
    ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

    return <section id="overview" className={styles.section}>
        <SectionHeading
            eyebrow="Selected work"
            title="Overview"
            note={projectCount > 0 ? `${projectCount.toLocaleString()} ${projectCount === 1 ? "project" : "projects"} published` : undefined}
            action={projectCount > 0 ? <a className={styles.textLink} href="#projects">All projects <span aria-hidden="true">↓</span></a> : undefined}
        />

        {lead ? <>
            <article className={styles.featured}>
                <Link href={`/p/${profile.slug}/projects/${lead.id}`} className={styles.featuredImage} aria-label={`View ${lead.title}`}>
                    {lead.images[0]
                        ? <Image src={lead.images[0].image_url} alt={lead.title} fill preload sizes="(max-width: 920px) 100vw, 60vw" />
                        : <ProjectPlaceholder project={lead} />}
                </Link>
                <div className={styles.featuredCopy}>
                    <p className={styles.projectCategory}>
                        {formatCategory(lead.category)}{lead.location ? ` · ${lead.location}` : ""}
                    </p>
                    <h3 className={styles.featuredTitle}>
                        <Link href={`/p/${profile.slug}/projects/${lead.id}`}>{lead.title}</Link>
                    </h3>
                    {lead.description && <p className={styles.featuredDescription}>{lead.description}</p>}
                    <dl className={styles.projectFacts}>
                        {lead.year && <div><dt>Year</dt><dd>{lead.year}</dd></div>}
                        <div><dt>Contribution</dt><dd>{lead.role === "team" ? "Team project" : "Individual"}</dd></div>
                        {lead.software_used.length > 0 && <div><dt>Tools</dt><dd>{lead.software_used.slice(0, 3).join(", ")}</dd></div>}
                    </dl>
                    <Link className={styles.textLink} href={`/p/${profile.slug}/projects/${lead.id}`}>
                        View project <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </article>

            {rest.length > 0 && <div className={styles.selected}>
                <div className={styles.selectedHead}>
                    <h3>More selected work</h3>
                    <a className={styles.textLink} href="#projects">See everything</a>
                </div>
                <div className={styles.selectedGrid}>
                    {rest.slice(0, 2).map((project) => <Link
                        key={project.id}
                        href={`/p/${profile.slug}/projects/${project.id}`}
                        className={styles.previewCard}
                    >
                        <div className={styles.previewImage}>
                            {project.images[0]
                                ? <Image src={project.images[0].image_url} alt={project.title} fill sizes="(max-width: 700px) 100vw, 30vw" />
                                : <ProjectPlaceholder project={project} />}
                        </div>
                        <h4 className={styles.previewTitle}>{project.title}</h4>
                        <p className={styles.previewMeta}>{formatCategory(project.category)}{project.year ? ` · ${project.year}` : ""}</p>
                    </Link>)}
                </div>
            </div>}
        </> : <div className={styles.emptyState}>
            <p>
                {isOwner
                    ? "Your first published project introduces your work here. Add one to bring this page to life."
                    : "There is no published work on this profile yet."}
            </p>
            {isOwner && <Pill href="/profile/projects/new" variant="blue">Add a project</Pill>}
        </div>}

        {facts.length > 0 && <dl className={styles.factsRow}>
            {facts.map((fact) => <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
            </div>)}
        </dl>}
    </section>;
}

function ProjectPlaceholder({ project }: { project: PortfolioItem }) {
    return <span className={styles.projectPlaceholder}>
        <span>{formatCategory(project.category)}</span>
        <strong>{project.title}</strong>
    </span>;
}
