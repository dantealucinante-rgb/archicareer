import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getDiscoverPageData } from "@/lib/queries/discover";
import DiscoverExperience from "./DiscoverExperience";
import styles from "./discover.module.css";
import landingStyles from "@/app/(marketing)/landing.module.css";

export const metadata: Metadata = {
  title: "Discover people and portfolios",
  description: "Explore architecture projects, portfolios, and the people who create and build across ArchiCareer.",
  alternates: { canonical: "/discover" },
};

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const [{ data: currentProfile }, initialData] = await Promise.all([getCurrentProfile(), getDiscoverPageData()]);
  return <div className={`${landingStyles.landingPage} ${styles.page}`}>
    <MarketingHeader />
    <main id="main-content" className={styles.content}>
      <div className={styles.eyebrow}>Explore ArchiCareer</div>
      <DiscoverExperience initialData={initialData} viewerId={currentProfile?.user_id ?? null} />
    </main>
    <MarketingFooter />
  </div>;
}
