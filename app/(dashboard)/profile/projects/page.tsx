import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getPortfolioItemsForOwner } from "@/lib/queries/portfolio";
import { getPortfolioEntitlements } from "@/lib/billing";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import ProjectList from "./ProjectList";
import styles from "./projects.module.css";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");

    const [itemsResult, entitlementsResult] = await Promise.all([
        getPortfolioItemsForOwner(profile.id),
        getPortfolioEntitlements(profile.user_id, profile.id),
    ]);

    const items = itemsResult.data ?? [];
    const entitlements = entitlementsResult.data;
    const drafts = items.filter((item) => !item.is_published).length;

    return <main className={editorial.page}>
        <div className={editorial.container}>
            <header className={styles.head}>
                <div className={styles.headCopy}>
                    <h1 className={editorial.pageTitle}>Your projects</h1>
                    {entitlements && <p className={styles.quota}>
                        {entitlements.usedSpaces} of {entitlements.totalSpaceLimit} portfolio {entitlements.totalSpaceLimit === 1 ? "space" : "spaces"} used
                        {drafts > 0 ? ` · ${drafts} ${drafts === 1 ? "draft" : "drafts"}` : ""}
                    </p>}
                </div>
                <div className={editorial.pillRow}>
                    <Pill href={`/p/${profile.slug}`} variant="quiet">View public profile ↗</Pill>
                    <Pill href="/profile/edit" variant="quiet">Edit profile</Pill>
                    <Pill href="/profile/projects/new" variant="blue">Add a project</Pill>
                </div>
            </header>

            {itemsResult.error && <p className={editorial.fieldError} role="alert" style={{ marginTop: 24 }}>
                Your projects couldn&apos;t be loaded. Refresh the page to try again.
            </p>}

            <ProjectList slug={profile.slug} items={items} />
        </div>
    </main>;
}
