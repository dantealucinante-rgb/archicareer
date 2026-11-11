import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile, getProfileBySlug } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import { getPostsForProfile } from "@/lib/queries/posts";
import { getFollowCounts, getFollowState, getProfileOwnerUserId } from "@/lib/queries/follows";
import { getEngagementSummaries } from "@/lib/queries/engagement";
import { absoluteUrl, cleanDescription, locationLabel, pageMetadata, safeJsonLd } from "@/lib/seo";
import type { AccountType } from "@/types";
import type { PublicProfilePageData } from "@/app/components/profile-experience/ProfilePageData";
import StudentProfileLayout from "@/app/components/profile-experience/StudentProfileLayout";
import ProfessionalProfileLayout from "@/app/components/profile-experience/ProfessionalProfileLayout";
import FirmProfileLayout from "@/app/components/profile-experience/FirmProfileLayout";
import BusinessProfileLayout from "@/app/components/profile-experience/BusinessProfileLayout";

interface PageProps { params: Promise<{ slug: string }> }
const labels: Record<AccountType, string> = {
  student: "Student",
  professional: "Individual professional",
  firm: "Firm",
  business: "Business",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: profile } = await getProfileBySlug(slug);
  if (!profile) return { title: { absolute: "Portfolio not found | Archicareer" }, robots: { index: false, follow: false } };
  const type = profile.account_type in labels ? profile.account_type : "professional";
  const label = labels[type];
  const title = `${profile.name} | Architecture Portfolio`;
  const description = cleanDescription(profile.bio, `${profile.name}'s ${label.toLowerCase()} portfolio and selected work${profile.location ? ` in ${locationLabel(profile.location)}` : ""}.`);
  const { data: projects } = await getPortfolioItemsForProfile(profile.id, 1, 0);
  const image = projects?.[0]?.images[0]?.image_url;
  return pageMetadata({ title, description, path: `/p/${profile.slug}`, image, imageAlt: image ? `${profile.name}'s public portfolio work` : undefined, type: "profile" });
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();
  const { data: profile } = await getProfileBySlug(slug);
  if (!profile) notFound();

  const [projectResult, postResult, currentResult, profileOwnerId] = await Promise.all([
    getPortfolioItemsForProfile(profile.id, 12, 0),
    getPostsForProfile(profile.id, 12),
    getCurrentProfile(),
    getProfileOwnerUserId(profile.id),
  ]);
  const projects = projectResult.data ?? [];
  const posts = postResult.data ?? [];
  const currentProfile = currentResult.data;
  const isOwner = currentProfile?.id === profile.id;
  const [followCounts, followState] = profileOwnerId ? await Promise.all([
    getFollowCounts(profileOwnerId),
    getFollowState(currentProfile?.user_id ?? null, profileOwnerId),
  ]) : [{ followers: 0, following: 0 }, { isFollowing: false, isMutual: false }];
  const engagement = await getEngagementSummaries({ portfolioItemIds: projects.map((item) => item.id), postIds: posts.map((post) => post.id) }, currentProfile?.user_id);
  const profileEntity = {
    "@type": profile.account_type === "firm" || profile.account_type === "business" ? "Organization" : "Person",
    name: profile.name,
    description: profile.bio ?? undefined,
    url: absoluteUrl(`/p/${profile.slug}`),
    image: profile.avatar_url ?? undefined,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
    sameAs: [profile.instagram_url, profile.personal_site_url, profile.linkedin_url].filter(Boolean),
  };
  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${profile.name} | Architecture Portfolio`,
    url: absoluteUrl(`/p/${profile.slug}`),
    mainEntity: profileEntity,
  };
  const data: PublicProfilePageData = {
    profile,
    projects,
    projectCount: projectResult.count ?? projects.length,
    posts,
    engagement,
    currentUserId: currentProfile?.user_id ?? null,
    isOwner,
    profileOwnerId,
    followers: followCounts.followers,
    following: followCounts.following,
    isFollowing: followState.isFollowing,
    isMutual: followState.isMutual,
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(profileSchema) }} />
    {profile.account_type === "student" ? <StudentProfileLayout data={data} />
      : profile.account_type === "firm" ? <FirmProfileLayout data={data} />
        : profile.account_type === "business" ? <BusinessProfileLayout data={data} />
          : <ProfessionalProfileLayout data={data} />}
  </>;
}
