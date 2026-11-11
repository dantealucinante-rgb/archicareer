import type { Profile } from "@/types";

export type CommunityVisibility = "public" | "private";
export type CommunityRole = "owner" | "moderator" | "member";
export type CommunityMemberStatus = "active" | "pending" | "banned";
export type CommunityPostType = "discussion" | "question" | "single_image" | "image_gallery" | "project_showcase";

export interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    avatar_url: string | null;
    visibility: CommunityVisibility;
    owner_id: string;
    created_at: string;
    updated_at: string;
    member_count: number;
    viewer_role: CommunityRole | null;
    viewer_status: CommunityMemberStatus | null;
}

export interface CommunityMember {
    id: string;
    community_id: string;
    user_id: string;
    role: CommunityRole;
    status: CommunityMemberStatus;
    joined_at: string | null;
    created_at: string;
    updated_at: string;
    profile?: Pick<Profile, "id" | "user_id" | "name" | "slug" | "role" | "location" | "avatar_url">;
}

export interface CommunityAttachment {
    id: string;
    post_id: string;
    bucket_id: string;
    storage_path: string;
    media_type: string;
    alt_text: string | null;
    position: number;
    created_at: string;
    url: string | null;
}

export interface PublicProfileCommunity {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
    role: "owner" | "moderator" | "member";
}
