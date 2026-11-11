import type { Metadata } from "next";
import CommunitiesExperience from "./CommunitiesExperience";
import styles from "./community.module.css";
import { getCommunityDirectory, getCurrentCommunityIdentity } from "@/lib/queries/communities";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({
    title: "Architecture and Design Communities",
    description: "Find communities for architecture, design, construction and the built environment on ArchiCareer.",
    path: "/communities",
});

export default async function CommunitiesPage() {
    const [{ data: communities }, { user }] = await Promise.all([
        getCommunityDirectory({ sort: "trending", limit: 24 }),
        getCurrentCommunityIdentity(),
    ]);
    return <main className={styles.page}>
        <CommunitiesExperience initialCommunities={communities ?? []} signedIn={Boolean(user)} />
    </main>;
}
