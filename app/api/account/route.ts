import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const buckets = ["avatars", "cv-documents", "portfolio-images"] as const;

async function removeUserFiles(userId: string) {
    const admin = createAdminClient();
    for (const bucket of buckets) {
        while (true) {
            // Delete from the beginning each time; removing a page shifts the
            // remaining objects, so advancing an offset would skip files.
            const { data: files, error: listError } = await admin.storage.from(bucket).list(userId, { limit: 1000, offset: 0 });
            if (listError) throw new Error(`Unable to prepare ${bucket} files for deletion`);
            const paths = (files ?? []).filter((file) => file.name).map((file) => `${userId}/${file.name}`);
            if (paths.length > 0) {
                const { error: removeError } = await admin.storage.from(bucket).remove(paths);
                if (removeError) throw new Error(`Unable to remove ${bucket} files`);
            }
            if (!files || files.length < 1000) break;
        }
    }
}

export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

        await removeUserFiles(user.id);
        const admin = createAdminClient();
        const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
        if (deleteError) return NextResponse.json({ error: "Unable to delete your account" }, { status: 500 });

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete your account" }, { status: 500 });
    }
}
