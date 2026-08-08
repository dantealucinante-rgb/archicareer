import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateAssetBytes } from "@/lib/storage-validation";

const config = {
    "portfolio-images": { kind: "image" as const, maxBytes: 10 * 1024 * 1024, types: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]) },
    avatars: { kind: "image" as const, maxBytes: 2 * 1024 * 1024, types: new Set(["image/jpeg", "image/png", "image/webp"]) },
    "cv-documents": { kind: "pdf" as const, maxBytes: 5 * 1024 * 1024, types: new Set(["application/pdf"]) },
} as const;

export async function POST(request: Request) {
    try {
        const { data: profile } = await getCurrentProfile();
        if (!profile) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

        const formData = await request.formData();
        const bucketValue = formData.get("bucket");
        const file = formData.get("file");
        if (typeof bucketValue !== "string" || !(bucketValue in config) || !(file instanceof File)) {
            return NextResponse.json({ error: "A valid bucket and file are required" }, { status: 400 });
        }

        const bucket = bucketValue as keyof typeof config;
        const rules = config[bucket];
        if (!rules.types.has(file.type) || file.size === 0 || file.size > rules.maxBytes) {
            return NextResponse.json({ error: "File type or size is not allowed" }, { status: 400 });
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!validateAssetBytes(bytes, rules.kind)) {
            return NextResponse.json({ error: "File content could not be verified" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", {
            p_action: "storage_upload",
            p_limit: 100,
        });
        if (limitError) return NextResponse.json({ error: "Unable to verify upload limit" }, { status: 500 });
        if (!allowed) return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });

        const extension = bucket === "cv-documents" ? "pdf" : file.type.split("/")[1].replace("jpeg", "jpg");
        const path = `${profile.user_id}/${crypto.randomUUID()}.${extension}`;
        const admin = createAdminClient();
        const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, { contentType: file.type, upsert: false });
        if (uploadError) {
            await supabase.rpc("release_user_rate_limit", { p_action: "storage_upload" });
            return NextResponse.json({ error: "Unable to upload file" }, { status: 400 });
        }

        const { data } = admin.storage.from(bucket).getPublicUrl(path);
        return NextResponse.json({ path, url: data.publicUrl }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
