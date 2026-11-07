import ProfileIdentity from "./ProfileIdentity";
import { OrganizationFacts, PostsSection, ProjectsSection, SectionNavigation, ToolsSection } from "./ProfileSections";
import type { PublicProfilePageData } from "./ProfilePageData";
import styles from "./profile-experience.module.css";

export default function ProfessionalProfileLayout({ data }: { data: PublicProfilePageData }) {
  return <main className={`${styles.profilePage} ${styles.professional}`}>
    <div className={styles.container}>
      <ProfileIdentity {...data} label="Individual professional" descriptor={data.profile.school_or_firm && data.profile.school_or_firm !== data.profile.name ? `Professional · ${data.profile.school_or_firm}` : "Individual professional"} tone="professional" />
      <SectionNavigation items={[["projects", "Projects"], ["about", "About"], ["posts", "Posts"]]} />
      <ProjectsSection data={data} />
      <div className={styles.professionalDetails}><OrganizationFacts profile={data.profile} heading="Professional profile" /><ToolsSection profile={data.profile} /></div>
      <PostsSection data={data} />
    </div>
  </main>;
}
