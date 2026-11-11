import { notFound } from "next/navigation";
import Link from "next/link";
import MemberManagement from "./MemberManagement";
import styles from "@/app/communities/community.module.css";
import { getCommunityBySlug, getCommunityMembers } from "@/lib/queries/communities";

export const dynamic = "force-dynamic";

export default async function CommunityMembersPage({ params }: PageProps<"/a/[slug]/members">) {
    const { slug } = await params;
    const result = await getCommunityBySlug(slug);
    if (!result.data || result.error) notFound();
    const { community, canView, canModerate, isOwner } = result.data;
    if (!canView) notFound();
    const { data: members } = await getCommunityMembers(community.id, canModerate, 100, 0);
    return <main className={styles.page}>
        <Link href={`/a/${slug}`} className={styles.memberLink}>← {community.name}</Link>
        <header className={styles.intro}><div><p className={styles.eyebrow}>Community</p><h1 className={styles.title}>Members</h1><p className={styles.description}>{community.member_count.toLocaleString()} people in this community.</p></div></header>
        <MemberManagement members={members ?? []} hasMore={(members?.length ?? 0) === 100} slug={slug} canManage={canModerate} isOwner={isOwner} />
    </main>;
}
