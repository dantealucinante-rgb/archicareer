import ProfileIdentity from "./ProfileIdentity";
import { OrganizationFacts, PostsSection, ProjectsSection, SectionNavigation, SectionTitle } from "./ProfileSections";
import type { PublicProfilePageData } from "./ProfilePageData";
import styles from "./profile-experience.module.css";

export default function BusinessProfileLayout({ data }: { data: PublicProfilePageData }) {
  return <main className={`${styles.profilePage} ${styles.business}`}>
    <div className={styles.container}>
      <ProfileIdentity {...data} label="Business" descriptor="Industry business" tone="business" />
      <SectionNavigation items={[["overview", "Overview"], ["work", "Projects & work"], ["posts", "Posts"]]} />
      <section id="overview" className={styles.businessOverview}>
        <div><SectionTitle eyebrow="BUSINESS PROFILE" title="A business in the industry" /><p>Discover the business through its public profile, shared work, and community posts.</p></div>
        <OrganizationFacts profile={data.profile} heading="Business details" includeOrganisation={false} />
      </section>
      <ProjectsSection data={data} id="work" title="Projects & collaborations" eyebrow="PUBLISHED WORK" />
      <section className={styles.offerNote}><SectionTitle eyebrow="PRODUCTS & SERVICES" title="Share what your business offers" /><p>Structured product and service listings aren’t available on public profiles yet. Posts can introduce updates and offerings to the ArchiCareer community.</p></section>
      <PostsSection data={data} />
    </div>
  </main>;
}
