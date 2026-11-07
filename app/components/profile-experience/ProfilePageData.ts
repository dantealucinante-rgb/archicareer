import type { EngagementSummary, FeedPost, PortfolioItem, Profile } from "@/types";

export type PublicProfilePageData = {
  profile: Profile;
  projects: PortfolioItem[];
  projectCount: number;
  posts: FeedPost[];
  engagement: Record<string, EngagementSummary>;
  currentUserId: string | null;
  isOwner: boolean;
  profileOwnerId: string | null;
  followers: number;
  following: number;
  isFollowing: boolean;
  isMutual: boolean;
};
