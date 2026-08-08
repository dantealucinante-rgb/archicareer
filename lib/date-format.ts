const communityDateFormatter = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

export function formatCommunityDate(value: string): string {
    return communityDateFormatter.format(new Date(value));
}
