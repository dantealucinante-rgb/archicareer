import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile, getProfileBySlug } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import { getPostsForProfile } from "@/lib/queries/posts";
import FirmPublicProfile from "@/app/components/FirmPublicProfile";
import PublicProfileHeader from "@/app/components/PublicProfileHeader";
import ProfileTabs from "@/app/components/ProfileTabs";
import { getFollowCounts, getFollowState, getProfileOwnerUserId } from "@/lib/queries/follows";
import { getEngagementSummary } from "@/lib/queries/engagement";
import type { EngagementSummary } from "@/types";
import { absoluteUrl, locationLabel, safeJsonLd } from "@/lib/seo";

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const { data: profile } = await getProfileBySlug(slug);
    if (!profile) return { title: "Profile not found", robots: { index: false, follow: false } };
    const roleLabel = profile.role === "firm" ? "Architecture Firm" : profile.role === "architect" ? "Architect" : "Architecture Student";
    return { title: `${profile.name} — ${roleLabel} in ${locationLabel(profile.location)}`, description: profile.bio?.trim() || `${profile.name}'s public ${roleLabel.toLowerCase()} profile and portfolio on ArchiCareer.`, alternates: { canonical: `/p/${profile.slug}` }, openGraph: { type: "profile", title: `${profile.name} — ${roleLabel} in ${locationLabel(profile.location)}`, description: profile.bio?.trim() || `${profile.name}'s public profile and portfolio on ArchiCareer.`, url: absoluteUrl(`/p/${profile.slug}`), images: profile.avatar_url ? [{ url: profile.avatar_url, alt: `${profile.name}'s profile image` }] : undefined } };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
    const { slug } = await params;
    if (!slug) notFound();
    const { data: profile, error } = await getProfileBySlug(slug);
    if (error || !profile) notFound();
    const [{ data: portfolioItems, error: portfolioError }, { data: posts }, { data: currentProfile }] = await Promise.all([getPortfolioItemsForProfile(profile.id), getPostsForProfile(profile.id), getCurrentProfile()]);
    const isOwner = currentProfile?.id === profile.id;
    const profileOwnerId = await getProfileOwnerUserId(profile.id);
    const [followCounts, followState] = profileOwnerId ? await Promise.all([getFollowCounts(profileOwnerId), getFollowState(currentProfile?.user_id ?? null, profileOwnerId)]) : [{ followers: 0, following: 0 }, { isFollowing: false, isMutual: false }];
    const [projectEngagement, postEngagement] = await Promise.all([
        Promise.all((portfolioItems ?? []).map(async (item) => [item.id, await getEngagementSummary({ portfolio_item_id: item.id }, currentProfile?.user_id)] as const)),
        Promise.all((posts ?? []).map(async (post) => [post.id, await getEngagementSummary({ post_id: post.id }, currentProfile?.user_id)] as const)),
    ]);
    const engagement = Object.fromEntries(projectEngagement) as Record<string, EngagementSummary>;
    const postsEngagement = Object.fromEntries(postEngagement) as Record<string, EngagementSummary>;
    const roleLabel = profile.role === "firm" ? "Architecture Firm" : profile.role === "architect" ? "Architect" : "Architecture Student";
    const profileSchema = { "@context": "https://schema.org", "@type": profile.role === "firm" ? "Organization" : "Person", name: profile.name, description: profile.bio ?? undefined, url: absoluteUrl(`/p/${profile.slug}`), image: profile.avatar_url ?? undefined, jobTitle: profile.role === "firm" ? undefined : roleLabel, address: { "@type": "PostalAddress", addressLocality: profile.location ?? undefined, addressCountry: "NG" }, sameAs: [profile.instagram_url, profile.personal_site_url, profile.linkedin_url].filter(Boolean) };

    if (profile.role === "firm") return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(profileSchema) }} /><FirmPublicProfile profile={profile} portfolioItems={portfolioItems ?? []} engagement={{ ...engagement, ...postsEngagement }} portfolioError={portfolioError} isOwner={isOwner} profileOwnerId={profileOwnerId} followerCount={followCounts.followers} followingCount={followCounts.following} isFollowing={followState.isFollowing} isMutual={followState.isMutual} currentUserId={currentProfile?.user_id ?? null} posts={posts ?? []} /></>;

    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(profileSchema) }} /><div className="min-h-screen bg-paper text-ink"><main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8"><PublicProfileHeader profile={profile} roleLabel={roleLabel} fallbackBio="A public profile on ArchiCareer." isOwner={isOwner} profileOwnerId={profileOwnerId} followerCount={followCounts.followers} followingCount={followCounts.following} isFollowing={followState.isFollowing} isMutual={followState.isMutual} projectCount={portfolioItems?.length ?? 0} /><ProfileTabs profile={profile} slug={profile.slug} projects={portfolioItems ?? []} posts={posts ?? []} engagement={{ ...engagement, ...postsEngagement }} currentUserId={currentProfile?.user_id ?? null} isOwner={isOwner} /></main></div></>;
}
