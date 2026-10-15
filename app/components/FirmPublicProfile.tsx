import type { EngagementSummary, PortfolioItem, Profile } from "@/types";
import PublicProfileHeader from "./PublicProfileHeader";
import ProfileTabs from "./ProfileTabs";
import type { FeedPost } from "@/types";

export default function FirmPublicProfile({ profile, portfolioItems, engagement, isOwner, profileOwnerId, followerCount, followingCount, isFollowing, isMutual, currentUserId, posts }: { profile: Profile; portfolioItems: PortfolioItem[]; engagement: Record<string, EngagementSummary>; portfolioError: Error | null; isOwner: boolean; profileOwnerId: string | null; followerCount: number; followingCount: number; isFollowing: boolean; isMutual: boolean; currentUserId: string | null; posts: FeedPost[] }) {
    return (
        <div className="min-h-screen bg-paper text-ink">
            <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
                <PublicProfileHeader profile={profile} roleLabel="Architecture firm" fallbackBio="A practice building meaningful work and looking for the people who can help bring it to life." isOwner={isOwner} profileOwnerId={profileOwnerId} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isMutual={isMutual} projectCount={portfolioItems.length} />
                <ProfileTabs profile={profile} slug={profile.slug} projects={portfolioItems} posts={posts} engagement={engagement} currentUserId={currentUserId} isOwner={isOwner} />
            </main>
        </div>
    );
}
