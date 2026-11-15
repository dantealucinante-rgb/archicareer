import type { Profile } from "@/types";

export const accountLabels: Record<Profile["account_type"], string> = {
    student: "Student",
    professional: "Built environment professional",
    firm: "Professional practice",
    business: "Industry business",
};

/** The word used for `school_or_firm` on each profile type. */
export const affiliationLabels: Record<Profile["account_type"], string> = {
    student: "School",
    professional: "Practice",
    firm: "Practice",
    business: "Organisation",
};

/** The professional title shown under the name. */
export const roleLabels: Record<Profile["role"], string> = {
    student: "Architecture student",
    architect: "Architect",
    firm: "Practice",
};

export function formatCategory(value: string): string {
    return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatLabel(value: string): string {
    return value.replaceAll(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function safeWebUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
        return null;
    }
}

export function formatYearRange(start: number | null | undefined, end: number | null | undefined): string {
    if (start && end) return start === end ? String(start) : `${start} – ${end}`;
    if (start) return `${start} – Present`;
    if (end) return String(end);
    return "";
}

/** A readable value for a link: the host without `www.`, or the path for mail links. */
export function linkValue(href: string): string {
    try {
        const url = new URL(href);
        if (url.protocol === "mailto:") return url.pathname;
        return url.hostname.replace(/^www\./, "") + (url.pathname === "/" ? "" : url.pathname);
    } catch {
        return href;
    }
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

export type PublicLink = { label: string; href: string };

export function getPublicLinks(profile: Profile): PublicLink[] {
    const candidates: Array<[string, string | null | undefined]> = [
        ["Website", profile.personal_site_url],
        ["LinkedIn", profile.linkedin_url],
        ["Instagram", profile.instagram_url],
        ...Object.entries(profile.social_links ?? {}).map(([label, href]) => [formatLabel(label), href] as [string, string]),
    ];
    const seen = new Set<string>();
    return candidates.flatMap(([label, candidate]) => {
        const href = safeWebUrl(candidate);
        if (!href || seen.has(href)) return [];
        seen.add(href);
        return [{ label, href }];
    });
}

/** The line under the name: practice or school, then location. */
export function getAffiliationLine(profile: Profile): string | null {
    const affiliation = profile.school_or_firm && profile.school_or_firm !== profile.name ? profile.school_or_firm : null;
    return [affiliation, profile.location].filter(Boolean).join(" · ") || null;
}

/** The professional title: the role, plus the first stated area of expertise. */
export function getProfileTitle(profile: Profile): string {
    const role = roleLabels[profile.role] ?? accountLabels[profile.account_type];
    const focus = profile.details?.expertise?.[0];
    return focus ? `${role} · ${focus}` : role;
}

export function nonEmpty<T>(value: T | null | undefined | "" | false): value is T {
    return Boolean(value);
}
