import type { Comment, ReactionType } from "@/types";
import { commentCreateSchema, commentUpdateSchema } from "@/lib/validations";
import { createAdminClient, createClient, createPublicClient } from "@/lib/supabase/server";

type Target = { portfolio_item_id?: string; post_id?: string };
type QueryResult<T> = { data: T | null; error: Error | null };

async function attachAuthors(comments: Comment[]): Promise<Comment[]> {
    if (comments.length === 0) return comments;
    const { data: profiles } = await createAdminClient()
        .from("profiles")
        .select("id, user_id, name, slug, role, avatar_url")
        .in("user_id", comments.map((comment) => comment.user_id));
    const byUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    return comments.map((comment) => ({ ...comment, author: byUserId.get(comment.user_id) })) as Comment[];
}

export async function getComments(target: Target): Promise<QueryResult<Comment[]>> {
    try {
        const base = createPublicClient().from("comments").select("id, portfolio_item_id, post_id, user_id, content, created_at, updated_at");
        const { data, error } = target.portfolio_item_id
            ? await base.eq("portfolio_item_id", target.portfolio_item_id).order("created_at", { ascending: true })
            : await base.eq("post_id", target.post_id as string).order("created_at", { ascending: true });
        if (error) return { data: null, error: new Error(error.message) };
        return { data: await attachAuthors((data ?? []) as Comment[]), error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

export async function addComment(raw: unknown): Promise<QueryResult<Comment>> {
    const parsed = commentCreateSchema.safeParse(raw);
    if (!parsed.success) return { data: null, error: new Error(parsed.error.issues.map((issue) => issue.message).join(", ")) };
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data, error } = await supabase.from("comments").insert({
        portfolio_item_id: parsed.data.portfolio_item_id ?? null,
        post_id: parsed.data.post_id ?? null,
        user_id: user.id,
        content: parsed.data.content,
    }).select("id, portfolio_item_id, post_id, user_id, content, created_at, updated_at").single();
    if (error) return { data: null, error: new Error(error.message) };
    const [comment] = await attachAuthors([data as Comment]);
    return { data: comment, error: null };
}

export async function deleteComment(commentId: string): Promise<QueryResult<{ id: string }>> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) return { data: null, error: new Error(error.message) };
    return { data: { id: commentId }, error: null };
}

export async function updateComment(commentId: string, raw: unknown): Promise<QueryResult<Comment>> {
    const parsed = commentUpdateSchema.safeParse(raw);
    if (!parsed.success) return { data: null, error: new Error(parsed.error.issues.map((issue) => issue.message).join(", ")) };
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data, error } = await supabase.from("comments").update({ content: parsed.data.content }).eq("id", commentId).select("id, portfolio_item_id, post_id, user_id, content, created_at, updated_at").single();
    if (error) return { data: null, error: new Error(error.message) };
    const [comment] = await attachAuthors([data as Comment]);
    return { data: comment, error: null };
}

export async function getReactionCount(target: Target): Promise<number> {
    try {
        const base = createPublicClient().from("reactions").select("id", { count: "exact", head: true });
        const { count, error } = target.portfolio_item_id
            ? await base.eq("portfolio_item_id", target.portfolio_item_id)
            : await base.eq("post_id", target.post_id as string);
        return error ? 0 : count ?? 0;
    } catch {
        return 0;
    }
}

export async function hasUserReacted(target: Target, userId?: string | null): Promise<boolean> {
    if (!userId) return false;
    try {
        const base = createPublicClient().from("reactions").select("id").eq("user_id", userId);
        const { data, error } = target.portfolio_item_id
            ? await base.eq("portfolio_item_id", target.portfolio_item_id).maybeSingle()
            : await base.eq("post_id", target.post_id as string).maybeSingle();
        return !error && Boolean(data);
    } catch {
        return false;
    }
}

export async function toggleReaction(target: Target, type: ReactionType = "like"): Promise<QueryResult<{ reacted: boolean; count: number }>> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const existingBase = supabase.from("reactions").select("id").eq("user_id", user.id);
    const { data: existing, error: existingError } = target.portfolio_item_id
        ? await existingBase.eq("portfolio_item_id", target.portfolio_item_id).maybeSingle()
        : await existingBase.eq("post_id", target.post_id as string).maybeSingle();
    if (existingError) return { data: null, error: new Error(existingError.message) };

    if (existing) {
        const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
        if (error) return { data: null, error: new Error(error.message) };
        return { data: { reacted: false, count: await getReactionCount(target) }, error: null };
    }

    const { error } = await supabase.from("reactions").insert({
        portfolio_item_id: target.portfolio_item_id ?? null,
        post_id: target.post_id ?? null,
        user_id: user.id,
        type,
    });
    if (error) return { data: null, error: new Error(error.message) };
    return { data: { reacted: true, count: await getReactionCount(target) }, error: null };
}

export async function getEngagementSummary(target: Target, userId?: string | null) {
    const publicClient = createPublicClient();
    const commentsQuery = target.portfolio_item_id
        ? publicClient.from("comments").select("id", { count: "exact", head: true }).eq("portfolio_item_id", target.portfolio_item_id)
        : publicClient.from("comments").select("id", { count: "exact", head: true }).eq("post_id", target.post_id as string);
    const [comments, reactions, reacted] = await Promise.all([
        commentsQuery,
        getReactionCount(target),
        hasUserReacted(target, userId),
    ]);
    return {
        commentCount: comments.error ? 0 : comments.count ?? 0,
        reactionCount: reactions,
        userReacted: reacted,
    };
}
