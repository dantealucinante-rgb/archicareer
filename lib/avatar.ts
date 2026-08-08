const DICEBEAR_AVATAAARS_BASE_URL = "https://api.dicebear.com/9.x/avataaars/svg";

const COLOUR_AVATAR_PARAMS = {
    backgroundColor: "f4d35e,ee964b,f95738,8bd3dd,b8e986,cdb4db",
    skinColor: "614335,ae5d29,d08b5b,edb98a,ffdbb4",
    hairColor: "2c1b18,4a312c,724133,a55728,b58143,d6b370",
    facialHairColor: "2c1b18,4a312c,724133,a55728,b58143",
    clothesColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
    hatColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
    accessoriesColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
    borderRadius: "50",
} as const;

export function getProfileAvatarSeed(profile: { slug?: string | null; id?: string | null; name?: string | null }) {
    return profile.slug || profile.id || profile.name || "archicareer";
}

export function getFallbackAvatarUrl(profile: { slug?: string | null; id?: string | null; name?: string | null }) {
    const params = new URLSearchParams({
        seed: getProfileAvatarSeed(profile),
        ...COLOUR_AVATAR_PARAMS,
    });

    return `${DICEBEAR_AVATAAARS_BASE_URL}?${params.toString()}`;
}

export function isFallbackAvatarUrl(url: string) {
    return url.startsWith(DICEBEAR_AVATAAARS_BASE_URL);
}
