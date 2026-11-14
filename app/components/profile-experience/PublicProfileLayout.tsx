import FollowButton from "@/app/components/FollowButton";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import type { PublicProfilePageData } from "./ProfilePageData";
import ProfileAbout, { hasAboutContent } from "./ProfileAbout";
import ProfileContact from "./ProfileContact";
import ProfileHero from "./ProfileHero";
import ProfileOverview from "./ProfileOverview";
import ProfileProjectGallery from "./ProfileProjectGallery";
import ProfileSectionNavigation, { type ProfileSection } from "./ProfileSectionNavigation";
import { PostsSection } from "./ProfileSections";
import SectionHeading from "./SectionHeading";
import { getPublicLinks } from "./format";
import styles from "./profile-experience.module.css";

export default function PublicProfileLayout({ data }: { data: PublicProfilePageData }) {
    const { profile, projects } = data;
    const links = getPublicLinks(profile);
    const loginHref = `/login?next=${encodeURIComponent(`/p/${profile.slug}`)}`;

    const messageHref = !data.isOwner && data.profileOwnerId
        ? data.currentUserId ? `/messages?with=${data.profileOwnerId}` : loginHref
        : null;

    const showAbout = hasAboutContent(profile) || data.isOwner;
    const showContact = links.length > 0 || data.isOwner;

    const sections: ProfileSection[] = [
        { id: "overview", label: "Overview" },
        { id: "projects", label: "Projects" },
        ...(showAbout ? [{ id: "about", label: "About" }] : []),
        ...(showContact ? [{ id: "contact", label: "Contact" }] : []),
    ];

    const actions = <>
        {!data.isOwner && data.profileOwnerId && (data.currentUserId
            ? <FollowButton
                followingId={data.profileOwnerId}
                initialFollowing={data.isFollowing}
                initialMutual={data.isMutual}
                initialFollowerCount={data.followers}
            />
            : <Pill href={loginHref} variant="orange">Follow</Pill>)}
        {messageHref && <Pill href={messageHref} variant="ink">Message</Pill>}
        {links.length > 0 && <Pill href="#contact" variant="quiet">Contact ↓</Pill>}
    </>;

    const ownerActions = data.isOwner
        ? <div className={editorial.pillRow}>
            <Pill href="/profile/edit" size="small">Edit profile</Pill>
            <Pill href="/settings" size="small" variant="quiet">Settings</Pill>
        </div>
        : undefined;

    return <main className={editorial.page}>
        <div className={editorial.container}>
            <ProfileHero
                profile={profile}
                projectCount={data.projectCount}
                followers={data.followers}
                following={data.following}
                actions={actions}
                ownerActions={ownerActions}
            />
        </div>

        <ProfileSectionNavigation sections={sections} />

        <div className={editorial.container}>
            <ProfileOverview
                profile={profile}
                projects={projects}
                projectCount={data.projectCount}
                isOwner={data.isOwner}
            />

            <section id="projects" className={styles.section}>
                <SectionHeading
                    title="Projects"
                    note={data.projectCount > 0
                        ? `${data.projectCount.toLocaleString()} published ${data.projectCount === 1 ? "project" : "projects"}`
                        : undefined}
                    action={data.isOwner ? <Pill href="/profile/projects" size="small" variant="quiet">Manage projects</Pill> : undefined}
                />
                <ProfileProjectGallery
                    slug={profile.slug}
                    initialProjects={projects}
                    total={data.projectCount}
                    isOwner={data.isOwner}
                />
            </section>

            {showAbout && <ProfileAbout profile={profile} isOwner={data.isOwner} />}
            {showContact && <ProfileContact profile={profile} links={links} isOwner={data.isOwner} messageHref={messageHref} />}

            <PostsSection data={data} />
        </div>
    </main>;
}
