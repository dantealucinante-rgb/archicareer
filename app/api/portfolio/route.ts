import { NextResponse } from "next/server";
import { addPortfolioItem, addPortfolioItemImages, deletePortfolioItem, deletePortfolioItemImage, isOwnedPortfolioImageUrl, removePortfolioImageFiles, reorderPortfolioItemImages, updatePortfolioItem } from "@/lib/queries/portfolio";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { verifyStoredAsset } from "@/lib/storage-validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        }
        if (!body || Array.isArray(body) || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
        }
        const { data: profile, error: profileError } = await getCurrentProfile();
        if (profileError || !profile) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }
        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", { p_action: "portfolio_write", p_limit: 60 });
        if (limitError) return NextResponse.json({ error: "Unable to verify request limit" }, { status: 500 });
        if (!allowed) return NextResponse.json({ error: "Too many portfolio changes. Try again later." }, { status: 429 });

        const { imageUrls = [], ...rawItem } = body;
        const result = await addPortfolioItem({ ...rawItem, profile_id: profile.id });
        if (result.error || !result.data) {
            return NextResponse.json({ error: "Unable to create portfolio item" }, { status: 400 });
        }

        const images = Array.isArray(imageUrls) ? imageUrls.filter((url: unknown): url is string => typeof url === "string") : [];
        if (images.length > 12) {
            await deletePortfolioItem(result.data.id);
            return NextResponse.json({ error: "A project can contain at most 12 images" }, { status: 400 });
        }
        if (images.some((imageUrl) => !isOwnedPortfolioImageUrl(imageUrl, profile.user_id))) {
            await deletePortfolioItem(result.data.id);
            return NextResponse.json({ error: "Portfolio images must be uploaded to the portfolio storage bucket" }, { status: 400 });
        }
        for (const imageUrl of images) {
            if (!(await verifyStoredAsset(imageUrl, "portfolio-images", profile.user_id, "image"))) {
                await deletePortfolioItem(result.data.id);
                await removePortfolioImageFiles(images);
                return NextResponse.json({ error: "One or more portfolio images could not be verified" }, { status: 400 });
            }
        }
        const imageResult = await addPortfolioItemImages(result.data.id, images);
        if (imageResult.error) {
            await deletePortfolioItem(result.data.id);
            await removePortfolioImageFiles(images);
            return NextResponse.json({ error: "Unable to save portfolio images" }, { status: 400 });
        }

        return NextResponse.json({ item: { ...result.data, images: imageResult.data ?? [] } });
    } catch {
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { data: profile } = await getCurrentProfile();
        if (!profile) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", { p_action: "portfolio_write", p_limit: 60 });
        if (limitError) return NextResponse.json({ error: "Unable to verify request limit" }, { status: 500 });
        if (!allowed) return NextResponse.json({ error: "Too many portfolio changes. Try again later." }, { status: 429 });
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        }
        if (!body || Array.isArray(body) || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
        }
        const { id, imageId } = body as { id?: unknown; imageId?: unknown };
        if (typeof imageId === "string") {
            const result = await deletePortfolioItemImage(imageId);
            if (result.error) return NextResponse.json({ error: "Unable to remove portfolio image" }, { status: 400 });
            return NextResponse.json({ ok: true });
        }
        if (typeof id !== "string") return NextResponse.json({ error: "Portfolio item ID is required" }, { status: 400 });
        const result = await deletePortfolioItem(id);
        if (result.error) return NextResponse.json({ error: "Unable to remove portfolio item" }, { status: 400 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { data: profile } = await getCurrentProfile();
        if (!profile) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", { p_action: "portfolio_write", p_limit: 60 });
        if (limitError) return NextResponse.json({ error: "Unable to verify request limit" }, { status: 500 });
        if (!allowed) return NextResponse.json({ error: "Too many portfolio changes. Try again later." }, { status: 429 });
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        }
        if (!body || Array.isArray(body) || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
        }
        if (typeof body.id !== "string") return NextResponse.json({ error: "Portfolio item ID is required" }, { status: 400 });
        const { id, imageOrder, ...updates } = body;
        if (Array.isArray(imageOrder)) {
            const orderResult = await reorderPortfolioItemImages(id, imageOrder.filter((value: unknown): value is string => typeof value === "string"));
            if (orderResult.error) return NextResponse.json({ error: "Unable to reorder portfolio images" }, { status: 400 });
        }
        if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });
        const result = await updatePortfolioItem(id, updates);
        if (result.error || !result.data) return NextResponse.json({ error: "Unable to update portfolio item" }, { status: 400 });
        return NextResponse.json({ item: result.data });
    } catch {
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
