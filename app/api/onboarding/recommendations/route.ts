import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getProfileOnboardingState } from "@/lib/onboarding";
import { createAdminClient, createClient, createPublicClient } from "@/lib/supabase/server";
import { isAccountActive } from "@/lib/admin";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return NextResponse.json({ error: "Sign in to see recommendations." }, { status: 401 });
        if (!(await isAccountActive(user.id))) return NextResponse.json({ error: "Account access is restricted." }, { status: 403 });
        const [{ data: profile }, onboarding] = await Promise.all([getCurrentProfile(), getProfileOnboardingState(user.id)]);
        if (!profile || onboarding.error || !onboarding.data) return NextResponse.json({ error: "Recommendations are not available right now." }, { status: 503 });

        const admin = createAdminClient();
        const { data: candidates, error: candidatesError } = await admin
            .from("profiles")
            .select("id, user_id, name, slug, role, account_type, school_or_firm, location, bio, avatar_url, created_at")
            .eq("search_indexable", true)
            .neq("user_id", user.id)
            .in("account_type", ["student", "professional", "firm", "business"])
            .order("created_at", { ascending: false })
            .limit(36);
        if (candidatesError) return NextResponse.json({ error: "We could not load people to follow." }, { status: 503 });
        const users = candidates ?? [];
        if (users.length === 0) return NextResponse.json({ recommendations: [] });

        const candidateIds = users.map((candidate) => candidate.user_id);
        const [{ data: candidateInterests }, { data: follows }] = await Promise.all([
            admin.from("profile_onboarding").select("user_id, professional_interests").in("user_id", candidateIds),
            createPublicClient().from("follows").select("following_id").eq("follower_id", user.id).in("following_id", candidateIds),
        ]);
        const interestsByUser = new Map<string, string[]>((candidateInterests ?? []).map((item: { user_id: string; professional_interests: string[] | null }) => [item.user_id, item.professional_interests ?? []]));
        const followingIds = new Set((follows ?? []).map((item) => item.following_id));
        const wanted = new Set(onboarding.data.professional_interests);
        const recommendations = users.map((candidate) => {
            const sharedInterests = (interestsByUser.get(candidate.user_id) ?? []).filter((interest) => wanted.has(interest));
            return { ...candidate, following: followingIds.has(candidate.user_id), sharedInterests };
        }).sort((a, b) => b.sharedInterests.length - a.sharedInterests.length || a.created_at.localeCompare(b.created_at) * -1).slice(0, 6);

        return NextResponse.json({ recommendations });
    } catch {
        return NextResponse.json({ error: "Recommendations are temporarily unavailable." }, { status: 500 });
    }
}
