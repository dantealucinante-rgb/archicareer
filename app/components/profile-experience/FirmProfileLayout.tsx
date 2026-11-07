import ProfileIdentity from "./ProfileIdentity";
import { OrganizationFacts, PostsSection, ProjectsSection, SectionNavigation, ToolsSection } from "./ProfileSections";
import type { PublicProfilePageData } from "./ProfilePageData";
import styles from "./profile-experience.module.css";

export default function FirmProfileLayout({ data }: { data: PublicProfilePageData }) {
  return <main className={`${styles.profilePage} ${styles.firm}`}>
    <div className={styles.container}>
      <ProfileIdentity {...data} label="Firm" descriptor="Professional practice" tone="firm" />
      <SectionNavigation items={[["projects", "Work"], ["practice", "Practice"], ["posts", "Posts"]]} />
      <ProjectsSection data={data} title="Selected projects" eyebrow="PRACTICE WORK" />
      <section id="practice" className={styles.firmPractice}>
        <OrganizationFacts profile={data.profile} heading="About the practice" includeOrganisation={false} />
        <ToolsSection profile={data.profile} heading="Tools and capabilities" />
      </section>
      <PostsSection data={data} />
    </div>
  </main>;
}
