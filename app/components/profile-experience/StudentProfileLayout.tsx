import ProfileIdentity from "./ProfileIdentity";
import ProfileProjectGallery from "./ProfileProjectGallery";
import { InstitutionSection, PostsSection, SectionNavigation, SectionTitle, ToolsSection } from "./ProfileSections";
import type { PublicProfilePageData } from "./ProfilePageData";
import styles from "./profile-experience.module.css";

export default function StudentProfileLayout({ data }: { data: PublicProfilePageData }) {
  const { profile } = data;
  return <main className={`${styles.profilePage} ${styles.student}`}>
    <div className={styles.container}>
      <ProfileIdentity {...data} label="Student profile" descriptor="Student" tone="student" />
      <SectionNavigation items={[["education", "Education"], ["projects", "Projects"], ["skills", "Skills"], ["posts", "Posts"]]} />
      <section className={styles.studentIntro}><SectionTitle eyebrow="ACADEMIC FOUNDATION" title="Education" /><InstitutionSection profile={profile} /></section>
      <section id="projects" className={styles.contentSection}><SectionTitle eyebrow="ACADEMIC & PERSONAL WORK" title="Projects" count={data.projectCount ? String(data.projectCount) : undefined} /><ProfileProjectGallery slug={profile.slug} initialProjects={data.projects} total={data.projectCount} isOwner={data.isOwner} /></section>
      <div className={styles.studentDetails}><ToolsSection profile={profile} heading="Skills and software" /></div>
      <PostsSection data={data} />
    </div>
  </main>;
}
