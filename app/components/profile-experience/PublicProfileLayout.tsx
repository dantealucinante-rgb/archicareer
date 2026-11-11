import Image from "next/image";
import Link from "next/link";
import FollowButton from "@/app/components/FollowButton";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import type { PortfolioItem, Profile } from "@/types";
import type { PublicProfilePageData } from "./ProfilePageData";
import ProfileSectionNavigation from "./ProfileSectionNavigation";
import { PostsSection } from "./ProfileSections";
import ProfileProjectGallery from "./ProfileProjectGallery";
import styles from "./profile-experience.module.css";

const accountLabels: Record<Profile["account_type"], string> = {
    student: "Student",
    professional: "Built environment professional",
    firm: "Professional practice",
    business: "Industry business",
};

export default function PublicProfileLayout({ data }: { data: PublicProfilePageData }) {
    const { profile, projects } = data;
    const leadProject = projects[0];
    const contacts = getPublicLinks(profile);

    return <main className={`${styles.profilePage} ${styles.publicProfile}`}>
        <div className={styles.publicContainer}>
            <header className={styles.publicIdentity}>
                <div className={styles.portraitColumn}>
                    <div className={styles.portraitFrame}>
                        <ProfileAvatar profile={profile} size={240} className={styles.publicAvatar} fallbackClassName={styles.avatarFallback} priority />
                    </div>
                    <p className={styles.portraitCaption}><span>ARCHICAREER / PROFILE</span><span>{profile.account_type.toUpperCase()}</span></p>
                </div>

                <div className={styles.introColumn}>
                    <div className={styles.introTop}>
                        <p className={styles.profileKicker}>{accountLabels[profile.account_type]}</p>
                        {data.isOwner && <div className={styles.ownerActions}>
                            <Link className={`${styles.profileButton} ${styles.ownerButton}`} href="/profile/edit">Edit profile</Link>
                            <Link className={styles.settingsButton} href="/settings">Settings</Link>
                        </div>}
                    </div>
                    <h1 className={styles.profileName}>{profile.name}</h1>
                    <div className={styles.profileSubline}>
                        {profile.school_or_firm && profile.school_or_firm !== profile.name && <span>{profile.school_or_firm}</span>}
                        {profile.location && <span>{profile.location}</span>}
                    </div>
                    {profile.bio ? <p className={styles.profileBio}>{profile.bio}</p> : data.isOwner ? <p className={styles.profilePrompt}>Add a short introduction to help people understand your practice and work.</p> : null}

                    <div className={styles.profileActions}>
                        {!data.isOwner && data.profileOwnerId && (data.currentUserId
                            ? <FollowButton followingId={data.profileOwnerId} initialFollowing={data.isFollowing} initialMutual={data.isMutual} initialFollowerCount={data.followers} />
                            : <Link className={`${styles.profileButton} ${styles.followButton}`} href={`/login?next=${encodeURIComponent(`/p/${profile.slug}`)}`}>Follow</Link>)}
                        <a className={`${styles.profileButton} ${styles.contactButton}`} href="#contact">Contact <span aria-hidden="true">↘</span></a>
                    </div>

                    <dl className={styles.profileStats}>
                        <div><dt>Projects</dt><dd>{data.projectCount.toLocaleString()}</dd></div>
                        <div><dt>Followers</dt><dd>{data.followers.toLocaleString()}</dd></div>
                        <div><dt>Following</dt><dd>{data.following.toLocaleString()}</dd></div>
                    </dl>
                </div>
            </header>

            <ProfileSectionNavigation />

            <section id="overview" className={styles.editorialSection}>
                <SectionHeading number="01" title="Overview" note="A closer look at the work" />
                {leadProject ? <>
                    <FeaturedProject project={leadProject} slug={profile.slug} />
                    {projects.length > 1 && <div className={styles.selectedProjects}>
                        <div className={styles.subsectionHeading}><h3>Selected work</h3><a href="#projects">View all projects <span aria-hidden="true">↗</span></a></div>
                        <div className={styles.selectedGrid}>
                            {projects.slice(1, 3).map((project, index) => <ProjectPreview key={project.id} project={project} slug={profile.slug} index={index} />)}
                        </div>
                    </div>}
                </> : <div className={styles.emptyProjects}>
                    <span className={styles.emptyIndex}>WORK / 00</span>
                    <div><h3>No projects published yet.</h3><p>{data.isOwner ? "Your first published project will introduce your work here." : "There is no published work to show here yet."}</p></div>
                    {data.isOwner && <Link href="/profile/edit#portfolio" className={styles.textAction}>Add a project <span aria-hidden="true">↗</span></Link>}
                </div>}
                <ProfessionalSnapshot profile={profile} isOwner={data.isOwner} />
            </section>

            <section id="projects" className={styles.editorialSection}>
                <SectionHeading number="02" title="Projects" note={`${data.projectCount.toLocaleString()} published ${data.projectCount === 1 ? "project" : "projects"}`} />
                <ProfileProjectGallery slug={profile.slug} initialProjects={projects} total={data.projectCount} isOwner={data.isOwner} />
            </section>

            <AboutSection profile={profile} isOwner={data.isOwner} />
            <ContactSection profile={profile} links={contacts} isOwner={data.isOwner} />
            <section id="posts" className={`${styles.editorialSection} ${styles.activitySection}`}>
                <SectionHeading number="05" title="Posts" note="Community activity" />
                <PostsSection data={data} id="activity-posts" showTitle={false} />
            </section>
        </div>
    </main>;
}

function SectionHeading({ number, title, note }: { number: string; title: string; note: string }) {
    return <div className={styles.editorialHeading}>
        <span className={styles.editorialNumber}>{number}</span>
        <h2>{title}</h2>
        <p>{note}</p>
    </div>;
}

function FeaturedProject({ project, slug }: { project: PortfolioItem; slug: string }) {
    const image = project.images[0];
    return <article className={styles.featuredProject}>
        <Link href={`/p/${slug}/projects/${project.id}`} className={styles.featuredImage} aria-label={`View ${project.title}`}>
            {image ? <Image src={image.image_url} alt={project.title} fill priority sizes="(max-width: 760px) 100vw, 68vw" /> : <ProjectPlaceholder project={project} />}
            <span className={styles.imageLabel}>SELECTED PROJECT / {project.year ?? "ARCHICAREER"}</span>
        </Link>
        <div className={styles.featuredCopy}>
            <p className={styles.projectCategory}>{formatCategory(project.category)}{project.location ? ` · ${project.location}` : ""}</p>
            <h3><Link href={`/p/${slug}/projects/${project.id}`}>{project.title}</Link></h3>
            {project.description && <p className={styles.featuredDescription}>{project.description}</p>}
            <dl className={styles.projectFacts}>
                {project.year && <div><dt>Year</dt><dd>{project.year}</dd></div>}
                <div><dt>Contribution</dt><dd>{project.role === "team" ? "Team project" : "Individual project"}</dd></div>
                {project.software_used.length > 0 && <div><dt>Tools</dt><dd>{project.software_used.slice(0, 3).join(", ")}</dd></div>}
            </dl>
            <Link className={styles.textAction} href={`/p/${slug}/projects/${project.id}`}>View project <span aria-hidden="true">↗</span></Link>
        </div>
    </article>;
}

function ProjectPreview({ project, slug, index }: { project: PortfolioItem; slug: string; index: number }) {
    const image = project.images[0];
    return <Link href={`/p/${slug}/projects/${project.id}`} className={`${styles.previewProject} ${index === 1 ? styles.previewOffset : ""}`}>
        <div className={styles.previewImage}>
            {image ? <Image src={image.image_url} alt={project.title} fill sizes="(max-width: 760px) 48vw, 27vw" /> : <ProjectPlaceholder project={project} />}
            <span>{String(index + 2).padStart(2, "0")}</span>
        </div>
        <div className={styles.previewMeta}><h4>{project.title}</h4><p>{formatCategory(project.category)}{project.year ? ` · ${project.year}` : ""}</p></div>
    </Link>;
}

function ProjectPlaceholder({ project }: { project: PortfolioItem }) {
    return <span className={styles.projectPlaceholder}><span>{formatCategory(project.category)}</span><strong>{project.title}</strong></span>;
}

function ProfessionalSnapshot({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
    const facts = [
        profile.school_or_firm && { label: profile.account_type === "student" ? "Education" : profile.account_type === "professional" ? "Practice" : "Organisation", value: profile.school_or_firm },
        profile.location && { label: "Based in", value: profile.location },
        profile.software_proficiency.length > 0 && { label: "Tools", value: profile.software_proficiency.slice(0, 5).join(" · ") },
    ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

    if (!facts.length && !isOwner) return null;
    return <aside className={styles.snapshot}>
        <div><span className={styles.snapshotIndex}>AT A GLANCE</span><h3>Practice snapshot</h3></div>
        {facts.length ? <dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
            : <p className={styles.snapshotEmpty}>Add your education, location or tools so visitors can understand your practice.</p>}
        {isOwner && <Link href="/profile/edit" className={styles.snapshotEdit}>Complete profile <span aria-hidden="true">↗</span></Link>}
    </aside>;
}

function AboutSection({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
    const availableDetails = [
        profile.school_or_firm && { label: profile.account_type === "student" ? "Education" : profile.account_type === "professional" ? "Practice" : "Organisation", value: profile.school_or_firm },
        profile.location && { label: "Location", value: profile.location },
        profile.software_proficiency.length > 0 && { label: "Skills and software", value: profile.software_proficiency.join(", ") },
    ].filter((fact): fact is { label: string; value: string } => Boolean(fact));
    const hasAbout = Boolean(profile.bio || availableDetails.length);

    return <section id="about" className={styles.editorialSection}>
        <SectionHeading number="03" title="About" note="Background and practice" />
        {hasAbout ? <div className={styles.aboutLayout}>
            <div className={styles.aboutNarrative}>
                <p className={styles.aboutLabel}>{profile.account_type === "student" ? "INTRODUCTION" : "BIOGRAPHY"}</p>
                {profile.bio ? <p className={styles.aboutBio}>{profile.bio}</p> : <p className={styles.aboutQuiet}>No biography has been shared.</p>}
            </div>
            {availableDetails.length > 0 && <dl className={styles.aboutFacts}>{availableDetails.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        </div> : <div className={styles.aboutEmpty}><p>{isOwner ? "Add a biography or professional details to complete your profile." : "More professional details have not been shared."}</p>{isOwner && <Link href="/profile/edit" className={styles.textAction}>Edit profile <span aria-hidden="true">↗</span></Link>}</div>}
    </section>;
}

function ContactSection({ profile, links, isOwner }: { profile: Profile; links: PublicLink[]; isOwner: boolean }) {
    return <section id="contact" className={`${styles.editorialSection} ${styles.contactSection}`}>
        <SectionHeading number="04" title="Contact" note="Connect professionally" />
        {links.length > 0 ? <div className={styles.contactLinks}>
            <p>Find {profile.account_type === "firm" || profile.account_type === "business" ? "the practice" : profile.name} around the web.</p>
            <div>{links.map((link) => <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><b aria-hidden="true">↗</b></a>)}</div>
        </div> : <div className={styles.contactEmpty}>
            <p>{isOwner ? "Add a website or professional social link to make it easier to connect." : "No public contact links have been added."}</p>
            {isOwner && <Link href="/profile/edit" className={styles.textAction}>Add contact links <span aria-hidden="true">↗</span></Link>}
        </div>}
    </section>;
}

type PublicLink = { label: string; href: string };

function getPublicLinks(profile: Profile): PublicLink[] {
    const candidates: Array<[string, string | null | undefined]> = [
        ["Website", profile.personal_site_url],
        ["LinkedIn", profile.linkedin_url],
        ["Instagram", profile.instagram_url],
        ...Object.entries(profile.social_links ?? {}).map(([label, href]) => [formatLabel(label), href] as [string, string]),
    ];
    const seen = new Set<string>();
    return candidates.flatMap(([label, candidate]) => {
        const href = safeWebUrl(candidate);
        if (!href || seen.has(href)) return [];
        seen.add(href);
        return [{ label, href }];
    });
}

function safeWebUrl(value: string | null | undefined) {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch { return null; }
}

function formatLabel(value: string) {
    return value.replaceAll(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCategory(value: string) {
    return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
