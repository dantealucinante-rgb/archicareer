import { createClient } from "@/lib/supabase/server";

type AssetKind = "image" | "pdf";

function parseOwnedPath(publicUrl: string, bucket: string, userId: string): string | null {
    try {
        const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const url = new URL(publicUrl);
        if (!configuredUrl || url.origin !== new URL(configuredUrl).origin) return null;
        const marker = `/storage/v1/object/public/${bucket}/`;
        if (!url.pathname.startsWith(marker)) return null;
        const path = url.pathname.slice(marker.length).split("/").map(decodeURIComponent).join("/");
        return path.startsWith(`${userId}/`) && path.length > userId.length + 1 ? path : null;
    } catch {
        return null;
    }
}

export function isOwnedPublicAssetUrl(publicUrl: string, bucket: string, userId: string): boolean {
    return parseOwnedPath(publicUrl, bucket, userId) !== null;
}

export function ownedStoragePath(publicUrl: string, bucket: string, userId: string): string | null {
    return parseOwnedPath(publicUrl, bucket, userId);
}

export function validateAssetBytes(bytes: Uint8Array, kind: AssetKind): boolean {
    if (kind === "pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const gif = new TextDecoder().decode(bytes.slice(0, 4)) === "GIF8";
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    return png || jpeg || gif || webp;
}

export async function verifyStoredAsset(publicUrl: string, bucket: string, userId: string, kind: AssetKind): Promise<boolean> {
    const path = parseOwnedPath(publicUrl, bucket, userId);
    if (!path) return false;
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error || !data) return false;
        const bytes = new Uint8Array(await data.arrayBuffer());
        const maxBytes = kind === "pdf" ? 5 * 1024 * 1024 : bucket === "avatars" ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
        return bytes.byteLength > 0 && bytes.byteLength <= maxBytes && validateAssetBytes(bytes, kind);
    } catch {
        return false;
    }
}
