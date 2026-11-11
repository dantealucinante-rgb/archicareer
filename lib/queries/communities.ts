import type { Community, CommunityAttachment, CommunityMember, CommunityPostType, CommunityRole, PublicProfileCommunity } from "@/types/community";
import { getEngagementSummaries } from "@/lib/queries/engagement";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { isAccountType } from "@/lib/onboarding";

const COMMUNITY_COLUMNS = "id,name,slug,description,avatar_url,visibility,owner_id,created_at,updated_at";
const POST_COLUMNS = "id,user_id,content,image_url,created_at,updated_at,community_id,title,post_type,moderation_status";

type QueryResult<T> = { data: T | null; error: Error | null };
type RawCommunity = Omit<Community, "member_count" | "viewer_role" | "viewer_status">;
type RawMember = Omit<CommunityMember, "profile">;
export type CommunityPost = {
    id: string;
    user_id: string;
    content: string | null;
    image_url: string | null;
    title: string | null;
    post_type: CommunityPostType;
    community_id: string;
    created_at: string;
    updated_at: string;
    author: { id: string; user_id: string; name: string; slug: string; role: "student" | "architect" | "firm"; location: string | null; avatar_url: string | null };
    attachments: CommunityAttachment[];
    reaction_count: number;
    comment_count: number;
    user_reacted: boolean;
    user_bookmarked: boolean;
};

async function currentUserId(client: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await client.auth.getUser();
    return user?.id ?? null;
}

async function getMemberRows(client: Awaited<ReturnType<typeof createClient>>, communityIds: string[], userId: string): Promise<RawMember[]> {
    if (communityIds.length === 0) return [];
    const { data } = await client.from("community_members")
        .select("id,community_id,user_id,role,status,joined_at,created_at,updated_at")
        .eq("user_id", userId)
        .in("community_id", communityIds);
    return (data ?? []) as RawMember[];
}

async function addDirectoryDetails(communities: RawCommunity[], client: Awaited<ReturnType<typeof createClient>>, userId: string | null): Promise<Community[]> {
    if (communities.length === 0) return [];
    const ids = communities.map((community) => community.id);
    const [countResult, memberRows] = await Promise.all([
        createPublicClient().rpc("community_member_counts", { p_community_ids: ids }),
        userId ? getMemberRows(client, ids, userId) : Promise.resolve([]),
    ]);
    const counts = new Map<string, number>(((countResult.data ?? []) as { community_id: string; member_count: number | string }[]).map((row) => [row.community_id, Number(row.member_count) || 0]));
    const membership = new Map(memberRows.map((row) => [row.community_id, row]));
    return communities.map((community) => {
        const ownMembership = membership.get(community.id);
        const visibleDescription = community.visibility === "public" || ownMembership?.status === "active" || community.owner_id === userId;
        return {
            ...community,
            owner_id: "",
            description: visibleDescription ? community.description : "",
            member_count: counts.get(community.id) ?? 0,
            viewer_role: (ownMembership?.status === "active" ? ownMembership.role : null) as CommunityRole | null,
            viewer_status: (ownMembership?.status ?? null) as Community["viewer_status"],
        };
    });
}

export async function getCommunityDirectory(options: { query?: string; sort?: "trending" | "recent" | "joined" | "suggested"; limit?: number; offset?: number } = {}): Promise<QueryResult<Community[]>> {
    try {
        const client = await createClient();
        const userId = await currentUserId(client);
        const limit = Math.min(Math.max(Math.floor(options.limit ?? 24), 1), 50);
        const offset = Math.max(Math.floor(options.offset ?? 0), 0);
        const search = options.query?.trim().slice(0, 80) ?? "";
        const sort = options.sort ?? "recent";
        let joinedIds: string[] | null = null;

        if (sort === "joined") {
            if (!userId) return { data: [], error: null };
            const { data, error } = await client.from("community_members")
                .select("community_id")
                .eq("user_id", userId)
                .eq("status", "active")
                .order("joined_at", { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) throw new Error(error.message);
            joinedIds = [...new Set((data ?? []).map((row) => row.community_id as string))];
            if (joinedIds.length === 0) return { data: [], error: null };
        }

        const fetchBy = async (column: "name" | "description") => {
            let query = client.from("communities").select(COMMUNITY_COLUMNS).order("created_at", { ascending: false }).limit(search ? 50 : limit + offset);
            if (search) query = query.ilike(column, `%${search.replace(/[\\%_]/g, "\\$&")}%`);
            if (joinedIds) query = query.in("id", joinedIds);
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return (data ?? []) as RawCommunity[];
        };

        const communityRows = search
            ? await Promise.all([fetchBy("name"), fetchBy("description")]).then((results) => [...new Map(results.flat().map((row) => [row.id, row])).values()])
            : await fetchBy("name");
        const detailed = await addDirectoryDetails(communityRows, client, userId);
        const filtered = detailed.filter((community) => !search || community.name.toLowerCase().includes(search.toLowerCase()) || community.description.toLowerCase().includes(search.toLowerCase()));
        if (sort === "trending") filtered.sort((a, b) => b.member_count - a.member_count || Date.parse(b.created_at) - Date.parse(a.created_at));
        if (sort === "joined") filtered.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
        if (sort === "suggested") {
            const joined = new Set(detailed.filter((item) => item.viewer_status === "active").map((item) => item.id));
            filtered.splice(0, filtered.length, ...filtered.filter((item) => item.visibility === "public" && !joined.has(item.id)));
        }
        return { data: filtered.slice(offset, offset + limit), error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error("Unable to load communities") };
    }
}

export async function getCommunityBySlug(slug: string): Promise<QueryResult<{ community: Community; canView: boolean; canModerate: boolean; isOwner: boolean; viewerId: string | null }>> {
    try {
        const client = await createClient();
        const userId = await currentUserId(client);
        const { data, error } = await client.from("communities").select(COMMUNITY_COLUMNS).eq("slug", slug).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return { data: null, error: null };
        const community = data as RawCommunity;
        const [{ data: membership }, { data: canView }, { data: canModerate }, { data: isOwner }, counts] = await Promise.all([
            userId ? client.from("community_members").select("id,community_id,user_id,role,status,joined_at,created_at,updated_at").eq("community_id", community.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
            client.rpc("community_can_view", { p_community_id: community.id }),
            client.rpc("community_can_moderate", { p_community_id: community.id }),
            client.rpc("community_is_owner", { p_community_id: community.id }),
            createPublicClient().rpc("community_member_counts", { p_community_ids: [community.id] }),
        ]);
        const canRead = Boolean(canView) || community.visibility === "public";
        const memberCount = Number((counts.data as { member_count: number | string }[] | null)?.[0]?.member_count) || 0;
        const detail: Community = {
            ...community,
            description: canRead ? community.description : "",
            member_count: memberCount,
            viewer_role: membership?.status === "active" ? membership.role as CommunityRole : null,
            viewer_status: membership?.status ?? null,
        };
        return { data: { community: detail, canView: canRead, canModerate: Boolean(canModerate), isOwner: Boolean(isOwner), viewerId: userId }, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error("Unable to load community") };
    }
}

async function attachPostDetails(rows: Record<string, unknown>[], client: Awaited<ReturnType<typeof createClient>>, userId: string | null, privateMedia: boolean): Promise<CommunityPost[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((post) => post.id as string);
    const authors = [...new Set(rows.map((post) => post.user_id as string))];
    const [{ data: profiles }, { data: attachmentRows }, engagement, bookmarks] = await Promise.all([
        createPublicClient().from("profiles").select("id,user_id,name,slug,role,location,avatar_url").in("user_id", authors),
        client.from("post_attachments").select("id,post_id,bucket_id,storage_path,media_type,alt_text,position,created_at").in("post_id", ids).order("position", { ascending: true }),
        getEngagementSummaries({ postIds: ids }, userId),
        userId ? client.from("post_bookmarks").select("post_id").eq("user_id", userId).in("post_id", ids) : Promise.resolve({ data: [] }),
    ]);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const rawAttachments = (attachmentRows ?? []) as Omit<CommunityAttachment, "url">[];
    const signed = new Map<string, string>();
    const privateRows = rawAttachments.filter((item) => item.bucket_id === "community-private-media");
    if (privateRows.length > 0) {
        const { data } = await client.storage.from("community-private-media").createSignedUrls(privateRows.map((item) => item.storage_path), 900);
        for (let index = 0; index < privateRows.length; index += 1) {
            const url = data?.[index]?.signedUrl;
            if (url) signed.set(privateRows[index].id, url);
        }
    }
    const attachmentsByPost = new Map<string, CommunityAttachment[]>();
    for (const item of rawAttachments) {
        const url = item.bucket_id === "community-private-media"
            ? signed.get(item.id) ?? null
            : !privateMedia && item.bucket_id === "post-images"
                ? createPublicClient().storage.from("post-images").getPublicUrl(item.storage_path).data.publicUrl
                : null;
        const list = attachmentsByPost.get(item.post_id) ?? [];
        list.push({ ...item, url });
        attachmentsByPost.set(item.post_id, list);
    }
    const saved = new Set((bookmarks.data ?? []).map((item) => item.post_id));
    const summaryMap = engagement;
    return rows.map((post) => {
        const profile = profileMap.get(post.user_id as string);
        return {
            id: post.id as string,
            user_id: post.user_id as string,
            content: post.content as string | null,
            // Community images are stored in post_attachments. Do not render a
            // legacy public image_url on a private community post.
            image_url: privateMedia ? null : post.image_url as string | null,
            title: post.title as string | null,
            post_type: post.post_type as CommunityPostType,
            community_id: post.community_id as string,
            created_at: post.created_at as string,
            updated_at: post.updated_at as string,
            author: profile ?? { id: "", user_id: post.user_id as string, name: "Community member", slug: "", role: "student", location: null, avatar_url: null },
            attachments: attachmentsByPost.get(post.id as string) ?? [],
            reaction_count: summaryMap[post.id as string]?.reactionCount ?? 0,
            comment_count: summaryMap[post.id as string]?.commentCount ?? 0,
            user_reacted: summaryMap[post.id as string]?.userReacted ?? false,
            user_bookmarked: saved.has(post.id as string),
        };
    });
}

export async function getCommunityPost(communityId: string, postId: string, privateMedia: boolean): Promise<QueryResult<CommunityPost | null>> {
    try {
        const client = await createClient();
        const userId = await currentUserId(client);
        const { data, error } = await client.from("posts").select(POST_COLUMNS).eq("id", postId).eq("community_id", communityId).eq("moderation_status", "active").maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return { data: null, error: null };
        const [post] = await attachPostDetails([data as unknown as Record<string, unknown>], client, userId, privateMedia);
        return { data: post ?? null, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error("Unable to load post") };
    }
}

export async function getCommunityPosts(options: { communityId: string; privateMedia: boolean; filter?: string; limit?: number; offset?: number }): Promise<QueryResult<CommunityPost[]>> {
    try {
        const client = await createClient();
        const userId = await currentUserId(client);
        const limit = Math.min(Math.max(Math.floor(options.limit ?? 20), 1), 50);
        const offset = Math.max(Math.floor(options.offset ?? 0), 0);
        let query = client.from("posts").select(POST_COLUMNS).eq("community_id", options.communityId).eq("moderation_status", "active");
        if (options.filter === "questions") query = query.eq("post_type", "question");
        if (options.filter === "projects") query = query.eq("post_type", "project_showcase");
        query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const posts = await attachPostDetails((data ?? []) as unknown as Record<string, unknown>[], client, userId, options.privateMedia);
        if (options.filter === "popular") posts.sort((a, b) => b.reaction_count + b.comment_count - a.reaction_count - a.comment_count);
        return { data: posts, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error("Unable to load community posts") };
    }
}

export async function getCommunityMembers(communityId: string, includePending = false, limit = 50, offset = 0): Promise<QueryResult<CommunityMember[]>> {
    try {
        const client = await createClient();
        const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
        let query = client.from("community_members")
            .select("id,community_id,user_id,role,status,joined_at,created_at,updated_at")
            .eq("community_id", communityId)
            .order("joined_at", { ascending: true, nullsFirst: false })
            .range(Math.max(offset, 0), Math.max(offset, 0) + safeLimit - 1);
        if (!includePending) query = query.eq("status", "active");
        else query = query.in("status", ["active", "pending"]);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const members = (data ?? []) as RawMember[];
        const { data: profiles } = members.length ? await createPublicClient().from("profiles").select("id,user_id,name,slug,role,location,avatar_url").in("user_id", members.map((member) => member.user_id)) : { data: [] };
        const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
        return { data: members.map((member) => ({ ...member, profile: profileMap.get(member.user_id) })), error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error("Unable to load community members") };
    }
}

export async function getCommunityBannedMembers(communityId: string, limit = 100): Promise<QueryResult<CommunityMember[]>> {
    try {
        const client = await createClient();
        const { data, error } = await client.from("community_members").select("id,community_id,user_id,role,status,joined_at,created_at,updated_at").eq("community_id", communityId).eq("status", "banned").order("updated_at", { ascending: false }).limit(Math.min(Math.max(limit, 1), 100));
        if (error) throw new Error(error.message);
        const members = (data ?? []) as RawMember[];
        const { data: profiles } = members.length ? await createPublicClient().from("profiles").select("id,user_id,name,slug,role,location,avatar_url").in("user_id", members.map((member) => member.user_id)) : { data: [] };
        const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
        return { data: members.map((member) => ({ ...member, profile: profileMap.get(member.user_id) })), error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error("Unable to load banned members") };
    }
}

export async function getCurrentCommunityIdentity() {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { user: null, profile: null };
    const { data: profile } = await client.rpc("get_my_profile").maybeSingle();
    return { user, profile: profile as { id: string; user_id: string; name: string; slug: string; role: "student" | "architect" | "firm"; location: string | null; avatar_url: string | null; account_type: string } | null };
}

export async function getPublicProfileCommunities(userId: string): Promise<PublicProfileCommunity[]> {
    try {
        const { data, error } = await createPublicClient().rpc("public_profile_communities", { p_user_id: userId });
        return error ? [] : (data ?? []) as PublicProfileCommunity[];
    } catch {
        return [];
    }
}

export function isCommunityAccountType(value: string | undefined): value is "student" | "professional" | "firm" | "business" {
    return isAccountType(value);
}
