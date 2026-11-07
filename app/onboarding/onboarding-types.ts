import type { AccountType, PortfolioItem } from "@/types";

export type OnboardingDraft = {
    first_name: string;
    last_name: string;
    institution: string;
    discipline: string;
    academic_level: string;
    graduation_year: string;
    professional_title: string;
    experience: string;
    bio: string;
    organization_type: string;
    organization_type_other: string;
    company_size: string;
    location: string;
    website: string;
    year_established: string;
    description: string;
    business_category: string;
    organization_name: string;
    products_services: string[];
};

export type Recommendation = {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    role: string;
    account_type: AccountType;
    school_or_firm: string | null;
    location: string | null;
    bio: string | null;
    avatar_url: string | null;
    following: boolean;
    sharedInterests: string[];
};

export type OnboardingStage = { id: number; label: string; optional?: boolean };

export const INTERESTS = [
    "Architecture", "Interior Design", "Landscape Architecture", "Structural Engineering", "Civil Engineering",
    "Construction", "Building", "Contracting", "Urban Planning", "3D Visualisation", "3D Modelling",
    "Product Design", "Furniture Design", "Material Design", "Project Management", "Real Estate",
    "Building Materials", "Manufacturing", "Photography", "Graphic Design", "Other",
] as const;

export const EMPTY_DRAFT: OnboardingDraft = {
    first_name: "", last_name: "", institution: "", discipline: "", academic_level: "", graduation_year: "",
    professional_title: "", experience: "", bio: "", organization_type: "", organization_type_other: "",
    company_size: "", location: "", website: "", year_established: "", description: "", business_category: "", organization_name: "", products_services: [],
};

export function getStages(accountType: AccountType): OnboardingStage[] {
    const stages: OnboardingStage[] = [
        { id: 0, label: "Welcome" },
        { id: 1, label: "Identity" },
        { id: 2, label: "Interests" },
    ];
    if (accountType !== "business") stages.push({ id: 3, label: "Portfolio", optional: true });
    stages.push({ id: 4, label: "Connections", optional: true }, { id: 5, label: "Ready" });
    return stages;
}

export function readOnboardingDraft(value: unknown): Partial<OnboardingDraft> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const raw = value as Record<string, unknown>;
    const result: Partial<OnboardingDraft> = {};
    for (const key of Object.keys(EMPTY_DRAFT) as (keyof OnboardingDraft)[]) {
        const candidate = raw[key];
        if (key === "products_services") {
            if (Array.isArray(candidate)) result.products_services = candidate.filter((item): item is string => typeof item === "string").slice(0, 24);
        } else if (typeof candidate === "string") {
            result[key] = candidate.slice(0, key === "bio" || key === "description" ? 700 : 180) as never;
        }
    }
    return result;
}

export function initialDraft(accountType: AccountType, profile: { name: string; school_or_firm: string | null; location: string | null; bio: string | null; personal_site_url: string | null }, stateData: unknown, registrationDetails: unknown): OnboardingDraft {
    const saved = readOnboardingDraft(stateData);
    const registration = registrationDetails && typeof registrationDetails === "object" ? registrationDetails as Record<string, unknown> : {};
    const parts = profile.name.trim().split(/\s+/);
    const first = typeof registration.first_name === "string" && registration.first_name.trim() ? registration.first_name : parts[0] ?? "";
    const last = typeof registration.last_name === "string" && registration.last_name.trim() ? registration.last_name : parts.slice(1).join(" ");
    const registered = (key: string) => typeof registration[key] === "string" ? registration[key] as string : "";
    const products = Array.isArray(registration.products_services) ? registration.products_services.filter((item): item is string => typeof item === "string") : [];
    return {
        ...EMPTY_DRAFT,
        first_name: saved.first_name ?? first,
        last_name: saved.last_name ?? last,
        institution: saved.institution ?? (accountType === "student" ? profile.school_or_firm ?? registered("institution") : ""),
        discipline: saved.discipline ?? (accountType === "student" ? registered("discipline") : registered("primary_industry")),
        academic_level: saved.academic_level ?? registered("academic_level"),
        graduation_year: saved.graduation_year ?? registered("graduation_year"),
        professional_title: saved.professional_title ?? registered("professional_title"),
        experience: saved.experience ?? registered("years_experience"),
        bio: saved.bio ?? (accountType === "professional" ? profile.bio ?? "" : ""),
        organization_type: saved.organization_type ?? registered("organization_type"),
        organization_type_other: saved.organization_type_other ?? "",
        company_size: saved.company_size ?? registered("company_size"),
        location: saved.location ?? profile.location ?? "",
        website: saved.website ?? profile.personal_site_url ?? registered("website"),
        year_established: saved.year_established ?? registered("year_established"),
        description: saved.description ?? profile.bio ?? registered("description"),
        business_category: saved.business_category ?? registered("business_category"),
        organization_name: saved.organization_name ?? (accountType === "firm" || accountType === "business" ? profile.name : ""),
        products_services: saved.products_services ?? products,
    };
}

export function portfolioSummary(items: PortfolioItem[]) {
    return items.map((item) => ({ id: item.id, title: item.title, image: item.images[0]?.image_url ?? null }));
}
