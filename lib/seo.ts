export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://archicareer.ng";

export function absoluteUrl(path: string): string {
    return new URL(path, SITE_URL).toString();
}

export function safeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function locationLabel(location: string | null | undefined): string {
    return location ? `${location}, Nigeria` : "Nigeria";
}
