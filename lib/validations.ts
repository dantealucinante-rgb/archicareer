import { z } from "zod";

const httpUrl = (message: string) => z.string().url(message).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
}, "URL must use http:// or https://");

export const profileUpdateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens")
        .optional(),
    school_or_firm: z.string().max(200).nullable().optional(),
    bio: z.string().max(1000, "Bio must be 1000 characters or less").nullable().optional(),
    location: z.string().max(100).nullable().optional(),
    social_links: z.record(z.string(), httpUrl("Must be a valid HTTP(S) URL")).optional(),
    software_proficiency: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
    cv_url: httpUrl("CV must be a valid URL").nullable().optional(),
    instagram_url: httpUrl("Instagram must be a valid URL").nullable().optional(),
    personal_site_url: httpUrl("Personal site must be a valid URL").nullable().optional(),
    linkedin_url: httpUrl("LinkedIn must be a valid URL").nullable().optional(),
    avatar_url: httpUrl("Avatar must be a valid URL").nullable().optional(),
    marketing_emails: z.boolean().optional(),
    search_indexable: z.boolean().optional(),
});

export const portfolioItemCreateSchema = z.object({
    profile_id: z.string().uuid("Invalid profile ID"),
    title: z.string().min(2, "Title must be at least 2 characters").max(150),
    description: z.string().max(500).nullable().optional(),
    category: z.enum([
        "residential",
        "commercial",
        "institutional",
        "landscape",
        "interior",
        "urban",
        "academic",
        "other",
    ]),
    project_type: z.enum(["residential", "commercial", "institutional", "urban_design", "interior", "landscape", "competition", "academic_studio"]),
    role: z.enum(["individual", "team"]),
    team_contribution: z.string().max(280).nullable().optional(),
    software_used: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
    year: z.number().int().min(1900).max(2100).nullable().optional(),
    status: z.enum(["academic", "professional"]),
    location: z.string().max(160).nullable().optional(),
    process_note: z.string().max(280).nullable().optional(),
    display_order: z.number().int().nonnegative().optional().default(0),
});

export const portfolioItemUpdateSchema = portfolioItemCreateSchema
    .omit({ profile_id: true })
    .partial();

export const jobListingCreateSchema = z.object({
    user_id: z.string().uuid("Invalid user ID"),
    firm_name: z.string().min(2, "Firm name must be at least 2 characters"),
    title: z.string().min(2, "Title must be at least 2 characters"),
    type: z.enum(["internship", "job", "competition"]),
    description: z.string().min(10, "Description must be at least 10 characters"),
    apply_link_or_email: z.string().nullable().optional().refine((val) => {
        if (!val) return true;
        // Check if it is a valid email or valid URL
        const isEmail = z.string().email().safeParse(val).success;
        const isUrl = httpUrl("Apply contact must be a valid URL").safeParse(val).success;
        return isEmail || isUrl;
    }, "Apply contact must be a valid email address or URL link"),
    status: z.enum(["open", "closed"]).optional().default("open"),
});

export const jobListingUpdateSchema = jobListingCreateSchema
    .omit({ user_id: true })
    .partial();

export const applicationCreateSchema = z.object({
    job_listing_id: z.string().uuid("Invalid job listing"),
    cover_note: z.string().max(2000, "Cover note must be 2000 characters or less").nullable().optional(),
});

export const applicationStatusSchema = z.object({
    status: z.enum(["new", "reviewing", "shortlisted", "interview", "declined", "hired"]),
});

export const applicationMessageSchema = z.object({
    body: z.string().trim().min(1, "Message cannot be empty").max(4000, "Message is too long"),
});

export const commentCreateSchema = z.object({
    content: z.string().trim().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
    portfolio_item_id: z.string().uuid().nullable().optional(),
    post_id: z.string().uuid().nullable().optional(),
}).superRefine((value, context) => {
    if (Boolean(value.portfolio_item_id) === Boolean(value.post_id)) {
        context.addIssue({ code: "custom", message: "A comment must target one piece of content" });
    }
});

export const commentUpdateSchema = z.object({
    content: z.string().trim().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

export const postCreateSchema = z.object({
    content: z.string().trim().max(1000, "Post text must be 1000 characters or less").nullable().optional(),
    image_url: z.string().url().nullable().optional(),
}).superRefine((value, context) => {
    if (!value.content?.trim() && !value.image_url) {
        context.addIssue({ code: "custom", message: "Add some text or an image to publish a post" });
    }
});
