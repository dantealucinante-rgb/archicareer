import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityHome from "@/app/communities/CommunityHome";
import styles from "@/app/communities/community.module.css";
import { getCommunityBySlug, getCommunityMembers, getCommunityPosts } from "@/lib/queries/communities";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/a/[slug]">): Promise<Metadata> {
    const { slug } = await params;
    const result = await getCommunityBySlug(slug);
    if (!result.data) return { title: "Community not found | ArchiCareer", robots: { index: false, follow: false } };
    const { community } = result.data;
    if (community.visibility === "private") return { ...pageMetadata({ title: `${community.name} | ArchiCareer`, description: "Private ArchiCareer community.", path: `/a/${slug}` }), robots: { index: false, follow: false } };
    const description = community.description || `Join ${community.name} on ArchiCareer.`;
    return pageMetadata({ title: community.name, description, path: `/a/${slug}` });
}

export default async function CommunityPage({ params }: PageProps<"/a/[slug]">) {
    const { slug } = await params;
    const result = await getCommunityBySlug(slug);
    if (!result.data || result.error) notFound();
    const { community, canView, canModerate, isOwner, viewerId } = result.data;
    const [posts, members] = await Promise.all([
        canView ? getCommunityPosts({ communityId: community.id, privateMedia: community.visibility === "private" }) : Promise.resolve({ data: [], error: null }),
        canView ? getCommunityMembers(community.id, false, 8, 0) : Promise.resolve({ data: [], error: null }),
    ]);
    return <main className={styles.page}><CommunityHome community={{ ...community, owner_id: "" }} posts={posts.data ?? []} members={members.data ?? []} signedIn={Boolean(viewerId)} canView={canView} canModerate={canModerate} isOwner={isOwner} slug={slug} /></main>;
}
