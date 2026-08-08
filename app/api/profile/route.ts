import { NextResponse } from "next/server";
import { getCurrentProfile, isOwnedAvatarUrl, removeAvatarFile, removeCvFile, updateProfile } from "@/lib/queries/profiles";
import { verifyStoredAsset } from "@/lib/storage-validation";
import { createClient } from "@/lib/supabase/server";
import { isFallbackAvatarUrl } from "@/lib/avatar";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        if (!body || Array.isArray(body) || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
        }
        const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
        const rawName = typeof body.name === "string" ? body.name.trim() : "";
        const rawBio = typeof body.bio === "string" ? body.bio.trim() : "";
        const rawSchool = typeof body.school_or_firm === "string" ? body.school_or_firm.trim() : "";
        const rawLocation = typeof body.location === "string" ? body.location.trim() : "";
        const rawSlug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
        const nullableUrl = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;

        const updates: { name?: string; bio?: string | null; school_or_firm?: string | null; location?: string | null; slug?: string } = {};
        if (has("name") && rawName) {
            updates.name = rawName;
        }
        if (has("bio")) {
            updates.bio = rawBio ? rawBio : null;
        }
        if (has("school_or_firm")) updates.school_or_firm = rawSchool ? rawSchool : null;
        if (has("location")) updates.location = rawLocation ? rawLocation : null;
        if (has("slug") && rawSlug) updates.slug = rawSlug;

        const profileUpdates = {
            ...updates,
            ...(has("software_proficiency") && Array.isArray(body.software_proficiency)
                ? { software_proficiency: body.software_proficiency.filter((value: unknown): value is string => typeof value === "string") }
                : {}),
            ...(has("cv_url") ? { cv_url: nullableUrl(body.cv_url) } : {}),
            ...(has("instagram_url") ? { instagram_url: nullableUrl(body.instagram_url) } : {}),
            ...(has("personal_site_url") ? { personal_site_url: nullableUrl(body.personal_site_url) } : {}),
            ...(has("linkedin_url") ? { linkedin_url: nullableUrl(body.linkedin_url) } : {}),
            ...(has("avatar_url") ? { avatar_url: nullableUrl(body.avatar_url) } : {}),
            ...(has("search_indexable") && typeof body.search_indexable === "boolean" ? { search_indexable: body.search_indexable } : {}),
            ...(has("social_links") && body.social_links && typeof body.social_links === "object" && !Array.isArray(body.social_links)
                ? { social_links: body.social_links }
                : {}),
        };

        const { data: profile, error: currentError } = await getCurrentProfile();
        if (currentError || !profile) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", {
            p_action: "profile_update",
            p_limit: 30,
        });
        if (limitError) return NextResponse.json({ error: "Unable to verify request limit" }, { status: 500 });
        if (!allowed) return NextResponse.json({ error: "Too many profile updates. Try again later." }, { status: 429 });

        const avatarIsFallback = typeof profileUpdates.avatar_url === "string" && isFallbackAvatarUrl(profileUpdates.avatar_url);
        if (typeof profileUpdates.avatar_url === "string" && !avatarIsFallback && !isOwnedAvatarUrl(profileUpdates.avatar_url, profile.user_id)) {
            return NextResponse.json({ error: "Avatar must be uploaded to your avatar storage folder" }, { status: 400 });
        }
        if (typeof profileUpdates.avatar_url === "string" && !avatarIsFallback && !(await verifyStoredAsset(profileUpdates.avatar_url, "avatars", profile.user_id, "image"))) {
            return NextResponse.json({ error: "Avatar file could not be verified" }, { status: 400 });
        }
        if (typeof profileUpdates.cv_url === "string" && !(await verifyStoredAsset(profileUpdates.cv_url, "cv-documents", profile.user_id, "pdf"))) {
            return NextResponse.json({ error: "CV file could not be verified" }, { status: 400 });
        }

        const { data, error } = await updateProfile(profile.id, profileUpdates);
        if (error || !data) {
            return NextResponse.json(
                { error: "Unable to save profile" },
                { status: 400 }
            );
        }

        if (profile.cv_url && profile.cv_url !== data.cv_url) {
            await removeCvFile(profile.cv_url);
        }
        if (profile.avatar_url && profile.avatar_url !== data.avatar_url) {
            await removeAvatarFile(profile.avatar_url);
        }

        return NextResponse.json({ ok: true, profile: data });
    } catch {
        return NextResponse.json(
            { error: "Unexpected server error" },
            { status: 500 }
        );
    }
}
