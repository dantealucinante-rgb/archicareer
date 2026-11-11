import type { Metadata } from "next";

export const SITE_URL = "https://archicareer.com.ng";
export const SITE_NAME = "Archicareer";
export const DEFAULT_TITLE = "Archicareer — Good Work Deserves to Be Seen.";
export const DEFAULT_DESCRIPTION = "Discover exceptional architecture, explore creative portfolios, connect with built-environment professionals and find opportunities across the architecture and construction industries.";
export const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

export function absoluteUrl(path: string): string {
    const safePath = path.startsWith("/") && !path.startsWith("//") ? path : `/${path}`;
    return new URL(safePath, SITE_URL).toString();
}

export function cleanDescription(value: string | null | undefined, fallback: string, maxLength = 160): string {
    const normalized = value?.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim() || fallback;
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function pageMetadata({
    title,
    description,
    path,
    image,
    imageAlt,
    type = "website",
    index = true,
}: {
    title: string;
    description: string;
    path: string;
    image?: string | null;
    imageAlt?: string;
    type?: "website" | "article" | "profile";
    index?: boolean;
}): Metadata {
    const absoluteTitle = title === DEFAULT_TITLE || title.endsWith(`| ${SITE_NAME}`) ? title : `${title} | ${SITE_NAME}`;
    const pageDescription = cleanDescription(description, DEFAULT_DESCRIPTION);
    const socialImage = image || DEFAULT_SOCIAL_IMAGE;
    const socialImageUrl = socialImage.startsWith("http") ? socialImage : absoluteUrl(socialImage);
    const alt = imageAlt || `${SITE_NAME} — Good Work Deserves to Be Seen`;

    return {
        title: { absolute: absoluteTitle },
        description: pageDescription,
        alternates: { canonical: absoluteUrl(path) },
        robots: { index, follow: index, googleBot: { index, follow: index, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
        openGraph: {
            type,
            siteName: SITE_NAME,
            title: absoluteTitle,
            description: pageDescription,
            url: absoluteUrl(path),
            images: [{ url: socialImageUrl, alt }],
        },
        twitter: {
            card: "summary_large_image",
            title: absoluteTitle,
            description: pageDescription,
            images: [{ url: socialImageUrl, alt }],
        },
    };
}

export function safeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function locationLabel(location: string | null | undefined): string {
    return location ? `${location}, Nigeria` : "Nigeria";
}
