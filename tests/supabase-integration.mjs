import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    console.log("Supabase integration checks skipped: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to run them.");
    process.exit(0);
}

const supabase = createClient(url, anonKey);
const fakeId = "00000000-0000-0000-0000-000000000000";

const { error: profileReadError } = await supabase.from("profiles").select("id").limit(1);
if (profileReadError) throw new Error(`Anonymous profile read failed: ${profileReadError.message}`);

const { data: profileWriteData, error: profileWriteError } = await supabase
    .from("profiles")
    .update({ name: "Unauthorized" })
    .eq("id", fakeId)
    .select("id");
if (profileWriteError) throw new Error(`Anonymous profile update request failed unexpectedly: ${profileWriteError.message}`);
if ((profileWriteData ?? []).length !== 0) throw new Error("Anonymous profile update unexpectedly changed a row");

const { error: storageWriteError } = await supabase.storage.from("portfolio-images").upload(`integration-test/${crypto.randomUUID()}.png`, new Uint8Array([1, 2, 3]), { contentType: "image/png" });
if (!storageWriteError) throw new Error("Anonymous storage upload unexpectedly succeeded");

console.log("Supabase integration checks passed.");
