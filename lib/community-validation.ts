import { z } from "zod";

export const communityCreateSchema = z.object({
    name: z.string().trim().min(3, "Use at least 3 characters").max(50, "Community names can be up to 50 characters"),
    description: z.string().trim().min(1, "Add a short description").max(500, "Descriptions can be up to 500 characters"),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letters, numbers and hyphens in the URL"),
    visibility: z.enum(["public", "private"]),
    avatar_url: z.string().url().nullable().optional(),
});

export const communitySettingsSchema = communityCreateSchema.partial().refine((value) => Object.keys(value).length > 0, "Update at least one community field");

export const communityPostSchema = z.object({
    content: z.string().trim().max(1000).nullable().optional(),
    title: z.string().trim().max(120).nullable().optional(),
    post_type: z.enum(["discussion", "question", "single_image", "image_gallery", "project_showcase"]),
}).superRefine((post, context) => {
    if (!post.content?.trim() && !post.title?.trim()) {
        context.addIssue({ code: "custom", message: "Add a title or some text before publishing" });
    }
});

export const communityMembershipActionSchema = z.object({
    action: z.enum(["join", "request", "cancel_request", "leave", "approve", "reject", "remove", "ban", "unban", "promote", "demote"]),
    user_id: z.string().uuid().optional(),
});

export const communityReportSchema = z.object({
    target_type: z.enum(["community", "post", "comment"]),
    target_id: z.string().uuid(),
    category: z.enum(["spam", "harassment", "inappropriate", "misinformation", "other"]),
    details: z.string().trim().max(1000).optional().default(""),
});

export const communityModerationActionSchema = z.discriminatedUnion("action", [
    z.object({ action: z.literal("remove_content"), target_type: z.enum(["post", "comment"]), target_id: z.string().uuid() }),
    z.object({ action: z.literal("resolve_report"), report_id: z.string().uuid(), status: z.enum(["in_review", "resolved", "dismissed"]), reason: z.string().trim().max(1000).optional().default("") }),
]);
