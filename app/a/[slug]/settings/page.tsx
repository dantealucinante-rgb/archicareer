import { notFound } from "next/navigation";
import Link from "next/link";
import CommunitySettingsForm from "./CommunitySettingsForm";
import styles from "@/app/communities/community.module.css";
import { getCommunityBySlug } from "@/lib/queries/communities";

export const dynamic = "force-dynamic";

export default async function CommunitySettingsPage({ params }: PageProps<"/a/[slug]/settings">) {
    const { slug } = await params;
    const result = await getCommunityBySlug(slug);
    if (!result.data || result.error || !result.data.isOwner) notFound();
    return <main className={styles.page}>
        <Link href={`/a/${slug}`} className={styles.memberLink}>← {result.data.community.name}</Link>
        <header className={styles.intro}><div><p className={styles.eyebrow}>Owner settings</p><h1 className={styles.title}>Community settings</h1><p className={styles.description}>Update the information members see about this space.</p></div></header>
        <CommunitySettingsForm community={{ ...result.data.community, owner_id: "" }} />
    </main>;
}
