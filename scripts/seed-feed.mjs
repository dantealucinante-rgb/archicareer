import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the feed seed.");
}

const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const seedPosts = [
    {
        author: "Amina Bello",
        content: "What is one small decision that made a big difference in your studio project? Mine was moving the shared courtyard closer to the shaded circulation path. The plan immediately felt less like a diagram and more like somewhere people might actually pause.",
    },
    {
        author: "Tunde Akinyemi",
        content: "Site lesson from Lagos: if the drawing depends on a perfect delivery sequence, it probably needs another detail. The best details leave room for real weather, real trades, and the occasional surprise from the supplier.",
    },
    {
        author: "Zainab Aliyu",
        content: "I am collecting examples of landscape strategies that manage heavy rain without turning every public space into a fenced-off drain. What projects in Nigeria should I study?",
    },
    {
        author: "Sani Musa",
        content: "Question for students and recent graduates: how do you decide which work belongs in a portfolio when almost every studio project still feels unfinished? I am trying to show the thinking, not just the polished final image.",
    },
    {
        author: "Ifeoma Okafor",
        content: "A good public interior does not need to announce itself loudly. Clear thresholds, a place to orient yourself, comfortable light, and one detail that rewards attention can carry a lot of the experience.",
    },
    {
        author: "Kora Urban Practice",
        content: "We are thinking about the phrase ‘affordable housing’ again. Affordability is not only a smaller plan or cheaper finish; it is also shade, maintenance, access to transport, and whether the building can adapt as a household changes.",
    },
    {
        author: "Northstar Atelier",
        content: "Abuja practitioners: what tools or habits help you keep early design conversations connected to technical reality? We are comparing simple workflows that make coordination feel less like a late-stage emergency.",
    },
    {
        author: "Bala & Co. Studio",
        content: "A reminder for anyone documenting work: one clear section can explain more than ten atmospheric renders. Show the relationship between people, shade, structure, and material. That is usually where the project starts to speak.",
    },
];

async function main() {
    const names = seedPosts.map((post) => post.author);
    const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("name", names);
    if (profileError) throw new Error(`Unable to load seed authors: ${profileError.message}`);

    const userIdByName = new Map((profiles ?? []).map((profile) => [profile.name, profile.user_id]));
    const missing = names.filter((name) => !userIdByName.has(name));
    if (missing.length > 0) throw new Error(`Missing seed authors: ${missing.join(", ")}`);

    const rows = seedPosts.map((post) => ({ user_id: userIdByName.get(post.author), content: post.content, image_url: null }));
    const existing = await supabase.from("posts").select("content").in("content", rows.map((row) => row.content));
    if (existing.error) throw new Error(`Unable to check existing feed posts: ${existing.error.message}`);
    const existingContent = new Set((existing.data ?? []).map((post) => post.content));
    const freshRows = rows.filter((row) => !existingContent.has(row.content));

    if (freshRows.length === 0) {
        console.log("Feed seed skipped: all demo posts already exist.");
        return;
    }

    const { error } = await supabase.from("posts").insert(freshRows);
    if (error) throw new Error(`Unable to insert feed posts: ${error.message}`);
    console.log(`Feed seed complete: inserted ${freshRows.length} demo posts.`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
