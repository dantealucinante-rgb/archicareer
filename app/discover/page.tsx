import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getDiscoverPageData } from "@/lib/queries/discover";
import editorial from "@/app/components/editorial/editorial.module.css";
import DiscoverExperience from "./DiscoverExperience";
import styles from "./discover.module.css";
import landingStyles from "@/app/(marketing)/landing.module.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Explore Architecture and Creative Projects",
  description: "Explore architecture projects, creative portfolios, and the professionals shaping the built environment.",
  path: "/discover",
});

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const [{ data: currentProfile }, initialData] = await Promise.all([getCurrentProfile(), getDiscoverPageData()]);
  return <div className={landingStyles.landingPage}>
    <MarketingHeader />
    <main id="main-content" className={editorial.page}>
      <div className={editorial.container}>
        <header className={styles.masthead}>
          <h1 className={editorial.display}>Discover</h1>
          <div className={styles.mastheadBody}>
            <p className={editorial.lede}>
              Projects, portfolios and the people shaping the built environment — search by name, place or discipline.
            </p>
          </div>
        </header>
        <DiscoverExperience initialData={initialData} viewerId={currentProfile?.user_id ?? null} />
      </div>
    </main>
    <MarketingFooter />
  </div>;
}
