import { notFound } from "next/navigation";
import Link from "next/link";
import ModerationPanel from "./ModerationPanel";
import styles from "@/app/communities/community.module.css";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CommunityModerationPage({ params }: PageProps<"/a/[slug]/moderation">) {
    const { slug } = await params;
    const result = await getCommunityBySlug(slug);
    if (!result.data || result.error || !result.data.canModerate) notFound();
    const { community } = result.data;
    const client = await createClient();
    const { data, error } = await client.rpc("community_moderation_queue", { p_community_id: community.id });
    return <main className={styles.page}>
        <Link href={`/a/${slug}`} className={styles.memberLink}>← {community.name}</Link>
        <header className={styles.intro}><div><p className={styles.eyebrow}>Moderation</p><h1 className={styles.title}>Keep this space constructive.</h1><p className={styles.description}>Review reports submitted for this community and take action where needed.</p></div><Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/a/${slug}/members`}>Manage members</Link></header>
        <ModerationPanel initialReports={(data ?? []) as Parameters<typeof ModerationPanel>[0]["initialReports"]} slug={slug} initialError={error ? "Apply the community security migration to enable report review." : ""} />
    </main>;
}
