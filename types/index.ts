/**
 * Hand-written types matching the migration schema at supabase/migrations/.
 * TODO: Replace with generated types once the Supabase project is live:
 *   npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
 * The generated file takes precedence over these interfaces.
 */

export type UserRole = "student" | "architect" | "firm";

export type PortfolioCategory =
    | "residential"
    | "commercial"
    | "institutional"
    | "landscape"
    | "interior"
    | "urban"
    | "academic"
    | "other";

export type PortfolioProjectType =
    | "residential"
    | "commercial"
    | "institutional"
    | "urban_design"
    | "interior"
    | "landscape"
    | "competition"
    | "academic_studio";

export type PortfolioItemRole = "individual" | "team";
export type PortfolioItemStatus = "academic" | "professional";

export type JobType = "internship" | "job" | "competition";

export type JobStatus = "open" | "closed";
export type ApplicationStatus = "new" | "reviewing" | "shortlisted" | "interview" | "declined" | "hired";

export interface Profile {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    role: UserRole;
    school_or_firm: string | null;
    bio: string | null;
    location: string | null;
    social_links: Record<string, string>;
    software_proficiency: string[];
    cv_url: string | null;
    instagram_url: string | null;
    personal_site_url: string | null;
    linkedin_url: string | null;
    avatar_url: string | null;
    marketing_emails: boolean;
    created_at: string;
    updated_at: string;
}

export interface PortfolioItem {
    id: string;
    profile_id: string;
    title: string;
    description: string | null;
    category: PortfolioCategory;
    project_type: PortfolioProjectType;
    role: PortfolioItemRole;
    team_contribution: string | null;
    software_used: string[];
    year: number | null;
    status: PortfolioItemStatus;
    location: string | null;
    process_note: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
    images: PortfolioItemImage[];
}

export interface PortfolioItemImage {
    id: string;
    portfolio_item_id: string;
    image_url: string;
    display_order: number;
    created_at: string;
}

export interface JobListing {
    id: string;
    /**
     * Nullable after migration 20260726214700:
     * When a firm deletes their account, user_id is SET NULL and the listing
     * is auto-closed (status = 'closed') rather than hard-deleted.
     * Listings are preserved for historical record-keeping.
     */
    user_id: string | null;
    firm_name: string;
    title: string;
    type: JobType;
    description: string;
    apply_link_or_email: string | null;
    status: JobStatus;
    created_at: string;
    updated_at: string;
}

export interface Application {
    id: string;
    job_listing_id: string;
    applicant_id: string;
    cover_note: string | null;
    cv_url: string | null;
    status: ApplicationStatus;
    created_at: string;
    updated_at: string;
    job_listing?: Pick<JobListing, "id" | "firm_name" | "title" | "type" | "status">;
    applicant?: Pick<Profile, "id" | "user_id" | "name" | "slug" | "role" | "bio" | "cv_url" | "avatar_url">;
}

export interface ApplicationMessage {
    id: string;
    application_id: string;
    sender_id: string;
    body: string;
    created_at: string;
}

export interface Bookmark {
    id: string;
    user_id: string;
    job_listing_id: string;
    created_at: string;
}

export interface Firm {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    verified: boolean;
    created_at: string;
    updated_at: string;
}
