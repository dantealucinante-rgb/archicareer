import type { FeedPost } from "@/types";
import { postCreateSchema } from "@/lib/validations";
import { createAdminClient, createClient, createPublicClient } from "@/lib/supabase/server";
import { ownedStoragePath, verifyStoredAsset } from "@/lib/storage-validation";

type QueryResult<T> = { data: T | null; error: Error | null };

async function currentUserId() {
    const { data: { user } } = await (await createClient()).auth.getUser();
    return user?.id ?? null;
}

async function addPostDetails(posts: FeedPost[], userId: string | null): Promise<FeedPost[]> {
    if (posts.length === 0) return posts;
    const ids = posts.map((post) => post.id);
    const publicClient = createPublicClient();
    const [{ data: reactions }, { data: comments }, { data: profiles }] = await Promise.all([
        publicClient.from("reactions").select("post_id, user_id").in("post_id", ids),
        publicClient.from("comments").select("post_id").in("post_id", ids),
        createAdminClient().from("profiles").select("id, user_id, name, slug, role, avatar_url").in("user_id", posts.map((post) => post.user_id)),
    ]);
    const reactionCounts = new Map<string, number>();
    const userReacted = new Set<string>();
    for (const reaction of reactions ?? []) {
        if (reaction.post_id) reactionCounts.set(reaction.post_id, (reactionCounts.get(reaction.post_id) ?? 0) + 1);
        if (userId && reaction.user_id === userId && reaction.post_id) userReacted.add(reaction.post_id);
    }
    const commentCounts = new Map<string, number>();
    for (const comment of comments ?? []) if (comment.post_id) commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
    const byUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    return posts.map((post) => ({
        ...post,
        author: byUserId.get(post.user_id) ?? { id: "", name: "Community member", slug: "", role: "student", avatar_url: null },
        reaction_count: reactionCounts.get(post.id) ?? 0,
        comment_count: commentCounts.get(post.id) ?? 0,
        user_reacted: userReacted.has(post.id),
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
