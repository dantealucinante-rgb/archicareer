import type { FeedPost } from "@/types";
import { postCreateSchema } from "@/lib/validations";
import { createAdminClient, createClient, createPublicClient } from "@/lib/supabase/server";
import { ownedStoragePath, verifyStoredAsset } from "@/lib/storage-validation";
import { getEngagementSummaries } from "@/lib/queries/engagement";

type QueryResult<T> = { data: T | null; error: Error | null };

async function currentUserId() {
    const { data: { user } } = await (await createClient()).auth.getUser();
    return user?.id ?? null;
}

async function addPostDetails(posts: FeedPost[], userId: string | null): Promise<FeedPost[]> {
    if (posts.length === 0) return posts;
    const ids = posts.map((post) => post.id);
    const [{ data: profiles }, engagement] = await Promise.all([
        createAdminClient().from("profiles").select("id, user_id, name, slug, role, location, avatar_url").in("user_id", posts.map((post) => post.user_id)),
        getEngagementSummaries({ postIds: ids }, userId),
    ]);
    const byUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    return posts.map((post) => ({
        ...post,
        author: byUserId.get(post.user_id) ?? { id: "", name: "Community member", slug: "", role: "student", location: null, avatar_url: null },
        reaction_count: engagement[post.id]?.reactionCount ?? 0,
        comment_count: engagement[post.id]?.commentCount ?? 0,
        user_reacted: engagement[post.id]?.userReacted ?? false,
    })) as FeedPost[];
}

export async function getFeed(limit = 10, offset = 0): Promise<QueryResult<FeedPost[]>> {
    try {
        const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 50);
        const safeOffset = Math.max(Math.floor(offset) || 0, 0);
        const userId = await currentUserId();
        const { data, error } = await createPublicClient()
            .from("posts")
            .select("id, user_id, content, image_url, created_at, updated_at")
            .order("created_at", { ascending: false })
            .range(safeOffset, safeOffset + safeLimit - 1);
        if (error) return { data: null, error: new Error(error.message) };
        return { data: await addPostDetails((data ?? []) as FeedPost[], userId), error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

export async function getPostsForProfile(profileId: string, limit = 12): Promise<QueryResult<FeedPost[]>> {
    try {
        const admin = createAdminClient();
        const { data: profile, error: profileError } = await admin.from("profiles").select("user_id").eq("id", profileId).maybeSingle();
        if (profileError) return { data: null, error: new Error(profileError.message) };
        if (!profile?.user_id) return { data: [], error: null };
        const { data, error } = await createPublicClient().from("posts").select("id, user_id, content, image_url, created_at, updated_at").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(Math.min(Math.max(limit, 1), 30));
        if (error) return { data: null, error: new Error(error.message) };
        return { data: await addPostDetails((data ?? []) as FeedPost[], null), error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

export async function createPost(raw: unknown): Promise<QueryResult<FeedPost>> {
    const parsed = postCreateSchema.safeParse(raw);
    if (!parsed.success) return { data: null, error: new Error(parsed.error.issues.map((issue) => issue.message).join(", ")) };
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    if (parsed.data.image_url && !(await verifyStoredAsset(parsed.data.image_url, "post-images", user.id, "image"))) {
        return { data: null, error: new Error("Post image could not be verified") };
    }
    const { data, error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: parsed.data.content?.trim() || null,
        image_url: parsed.data.image_url ?? null,
    }).select("id, user_id, content, image_url, created_at, updated_at").single();
    if (error) {
        if (parsed.data.image_url) {
            const path = ownedStoragePath(parsed.data.image_url, "post-images", user.id);
            if (path) await createAdminClient().storage.from("post-images").remove([path]);
        }
        return { data: null, error: new Error(error.message) };
    }
    const [post] = await addPostDetails([data as FeedPost], user.id);
    return { data: post, error: null };
}

export async function deletePost(postId: string): Promise<QueryResult<{ id: string }>> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data: post, error: readError } = await supabase.from("posts").select("id, image_url").eq("id", postId).eq("user_id", user.id).maybeSingle();
    if (readError) return { data: null, error: new Error(readError.message) };
    if (!post) return { data: null, error: new Error("Post not found") };
    const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
    if (error) return { data: null, error: new Error(error.message) };
    if (post.image_url) {
        const path = ownedStoragePath(post.image_url, "post-images", user.id);
        if (path) await createAdminClient().storage.from("post-images").remove([path]);
    }
    return { data: { id: postId }, error: null };
}
