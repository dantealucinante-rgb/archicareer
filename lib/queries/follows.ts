import { createAdminClient, createClient, createPublicClient } from "@/lib/supabase/server";

export interface FollowState {
    isFollowing: boolean;
    isMutual: boolean;
}

export interface FollowCounts {
    followers: number;
    following: number;
}

export async function getProfileOwnerUserId(profileId: string): Promise<string | null> {
    try {
        const { data, error } = await createAdminClient()
            .from("profiles")
            .select("user_id")
            .eq("id", profileId)
            .maybeSingle();
        if (error || !data) return null;
        return data.user_id;
    } catch {
        return null;
    }
}

export async function getProfileOwnerUserIds(profileIds: string[]): Promise<Record<string, string>> {
    if (profileIds.length === 0) return {};
    try {
        const { data, error } = await createAdminClient()
            .from("profiles")
            .select("id, user_id")
            .in("id", profileIds);
        if (error) return {};
        return Object.fromEntries((data ?? []).map((profile) => [profile.id, profile.user_id]));
    } catch {
        return {};
    }
}

export async function followUser(followingId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    if (user.id === followingId) return { data: null, error: new Error("You cannot follow yourself") };

    const { data, error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: followingId })
        .select("id, follower_id, following_id, created_at")
        .single();
    return { data, error: error ? new Error(error.message) : null };
}

export async function unfollowUser(followingId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };

    const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingId);
    return { data: { followingId }, error: error ? new Error(error.message) : null };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await createPublicClient()
        .from("follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();
    return !error && Boolean(data);
}

export async function isMutual(userIdA: string, userIdB: string): Promise<boolean> {
    if (userIdA === userIdB) return false;
    const { data, error } = await createPublicClient()
        .from("follows")
        .select("follower_id, following_id")
        .or(`and(follower_id.eq.${userIdA},following_id.eq.${userIdB}),and(follower_id.eq.${userIdB},following_id.eq.${userIdA})`);
    return !error && (data?.length ?? 0) === 2;
}

export async function getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await createPublicClient()
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId);
    return error ? 0 : count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await createPublicClient()
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId);
    return error ? 0 : count ?? 0;
}

export async function getFollowers(userId: string) {
    const { data, error } = await createPublicClient()
        .from("follows")
        .select("id, follower_id, following_id, created_at")
        .eq("following_id", userId)
        .order("created_at", { ascending: false });
    return { data: data ?? [], error: error ? new Error(error.message) : null };
}

export async function getFollowing(userId: string) {
    const { data, error } = await createPublicClient()
        .from("follows")
        .select("id, follower_id, following_id, created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false });
    return { data: data ?? [], error: error ? new Error(error.message) : null };
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
    const [followers, following] = await Promise.all([getFollowerCount(userId), getFollowingCount(userId)]);
    return { followers, following };
}

export async function getFollowState(viewerId: string | null, profileOwnerId: string): Promise<FollowState> {
    if (!viewerId || viewerId === profileOwnerId) return { isFollowing: false, isMutual: false };
    const { data, error } = await createPublicClient()
        .from("follows")
        .select("follower_id, following_id")
        .or(`and(follower_id.eq.${viewerId},following_id.eq.${profileOwnerId}),and(follower_id.eq.${profileOwnerId},following_id.eq.${viewerId})`);
    if (error) return { isFollowing: false, isMutual: false };
    const isFollowingValue = data?.some((follow) => follow.follower_id === viewerId && follow.following_id === profileOwnerId) ?? false;
    return { isFollowing: isFollowingValue, isMutual: isFollowingValue && (data?.length ?? 0) === 2 };
}

export async function getFollowStatesForTargets(viewerId: string | null, targetUserIds: string[]): Promise<Record<string, FollowState>> {
    if (!viewerId || targetUserIds.length === 0) return {};
    const { data, error } = await createPublicClient()
        .from("follows")
        .select("follower_id, following_id")
        .or(`follower_id.eq.${viewerId},following_id.eq.${viewerId}`);
    if (error) return {};

    return Object.fromEntries(targetUserIds.map((targetId) => {
        const outgoing = data?.some((follow) => follow.follower_id === viewerId && follow.following_id === targetId) ?? false;
        const incoming = data?.some((follow) => follow.follower_id === targetId && follow.following_id === viewerId) ?? false;
        return [targetId, { isFollowing: outgoing, isMutual: outgoing && incoming }];
    }));
}
