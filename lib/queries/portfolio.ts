import { createClient, createPublicClient } from "@/lib/supabase/server";
import { PortfolioItem, PortfolioItemImage } from "@/types";
import { portfolioItemCreateSchema, portfolioItemUpdateSchema } from "@/lib/validations";
import { QueryResult } from "@/lib/queries/profiles";

const PORTFOLIO_COLS =
    "id, profile_id, title, description, category, project_type, role, team_contribution, software_used, year, status, location, process_note, display_order, created_at, updated_at";
const IMAGE_COLS = "id, portfolio_item_id, image_url, display_order, created_at";
type ServerClient = Awaited<ReturnType<typeof createClient>>;

function storageObjectFromPublicUrl(imageUrl: string): { bucket: string; path: string } | null {
    try {
        const url = new URL(imageUrl);
        const marker = "/storage/v1/object/public/";
        const index = url.pathname.indexOf(marker);
        if (index === -1) return null;
        const [bucket, ...parts] = url.pathname.slice(index + marker.length).split("/");
        if (!bucket || parts.length === 0) return null;
        return { bucket, path: parts.map((part) => decodeURIComponent(part)).join("/") };
    } catch {
        return null;
    }
}

export function isPortfolioImageUrl(imageUrl: string): boolean {
    try {
        const url = new URL(imageUrl);
        const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!configuredUrl || url.origin !== new URL(configuredUrl).origin) return false;
        const object = storageObjectFromPublicUrl(imageUrl);
        return object?.bucket === "portfolio-images" && object.path.length > 0;
    } catch {
        return false;
    }
}

export function isOwnedPortfolioImageUrl(imageUrl: string, userId: string): boolean {
    if (!isPortfolioImageUrl(imageUrl)) return false;
    const object = storageObjectFromPublicUrl(imageUrl);
    return object?.path.split("/")[0] === userId;
}

export async function removePortfolioImageFiles(imageUrls: string[]): Promise<boolean> {
    if (imageUrls.length === 0) return true;
    const supabase = await createClient();
    const byBucket = new Map<string, string[]>();
    for (const imageUrl of imageUrls) {
        const object = storageObjectFromPublicUrl(imageUrl);
        if (!object) continue;
        byBucket.set(object.bucket, [...(byBucket.get(object.bucket) ?? []), object.path]);
    }
    const results = await Promise.all([...byBucket.entries()].map(([bucket, paths]) => supabase.storage.from(bucket).remove(paths)));
    const errors = results.filter((result) => result.error).map((result) => result.error?.message);
    if (errors.length > 0) {
        console.error("[portfolio] Unable to remove one or more image files:", errors);
        return false;
    }
    return true;
}

async function attachImages(
    supabase: ServerClient,
    items: Omit<PortfolioItem, "images">[]
): Promise<PortfolioItem[]> {
    if (items.length === 0) return [];

    const { data: images, error } = await supabase
        .from("portfolio_item_images")
        .select(IMAGE_COLS)
        .in("portfolio_item_id", items.map((item) => item.id))
        .order("display_order", { ascending: true });

    if (error) throw new Error(error.message);

    const grouped = new Map<string, PortfolioItemImage[]>();
    for (const image of (images ?? []) as PortfolioItemImage[]) {
        const current = grouped.get(image.portfolio_item_id) ?? [];
        current.push(image);
        grouped.set(image.portfolio_item_id, current);
    }

    return items.map((item) => ({ ...item, images: grouped.get(item.id) ?? [] }));
}

export async function getPortfolioItemsForProfile(
    profileId: string
): Promise<QueryResult<PortfolioItem[]>> {
    try {
        const supabase = createPublicClient();
        const { data, error } = await supabase
            .from("portfolio_items")
            .select(PORTFOLIO_COLS)
            .eq("profile_id", profileId)
            .order("display_order", { ascending: true });

        if (error) return { data: null, error: new Error(error.message) };
        return { data: await attachImages(supabase, (data ?? []) as Omit<PortfolioItem, "images">[]), error: null };
    } catch (err) {
        console.error("[portfolio] getPortfolioItemsForProfile:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function addPortfolioItem(
    rawItem: unknown
): Promise<QueryResult<PortfolioItem>> {
    try {
        const validation = portfolioItemCreateSchema.safeParse(rawItem);
        if (!validation.success) {
            return { data: null, error: new Error(validation.error.issues.map((e: import("zod").ZodIssue) => e.message).join(", ")) };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("portfolio_items")
            .insert(validation.data)
            .select(PORTFOLIO_COLS)
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: { ...(data as Omit<PortfolioItem, "images">), images: [] }, error: null };
    } catch (err) {
        console.error("[portfolio] addPortfolioItem:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function updatePortfolioItem(
    id: string,
    rawUpdates: Partial<Omit<PortfolioItem, "id" | "profile_id" | "created_at" | "updated_at" | "images">>
): Promise<QueryResult<PortfolioItem>> {
    try {
        const validation = portfolioItemUpdateSchema.safeParse(rawUpdates);
        if (!validation.success) {
            return { data: null, error: new Error(validation.error.issues.map((e: import("zod").ZodIssue) => e.message).join(", ")) };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("portfolio_items")
            .update(validation.data)
            .eq("id", id)
            .select(PORTFOLIO_COLS)
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: { ...(data as Omit<PortfolioItem, "images">), images: [] }, error: null };
    } catch (err) {
        console.error("[portfolio] updatePortfolioItem:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function addPortfolioItemImages(
    portfolioItemId: string,
    imageUrls: string[]
): Promise<QueryResult<PortfolioItemImage[]>> {
    try {
        if (imageUrls.some((imageUrl) => !isPortfolioImageUrl(imageUrl))) {
            return { data: null, error: new Error("Portfolio images must be uploaded to the portfolio storage bucket") };
        }
        const supabase = await createClient();
        const rows = imageUrls.map((image_url, display_order) => ({ portfolio_item_id: portfolioItemId, image_url, display_order }));
        if (rows.length === 0) return { data: [], error: null };

        const { data, error } = await supabase
            .from("portfolio_item_images")
            .insert(rows)
            .select(IMAGE_COLS)
            .order("display_order", { ascending: true });

        if (error) return { data: null, error: new Error(error.message) };
        return { data: data as PortfolioItemImage[], error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function deletePortfolioItem(id: string): Promise<QueryResult<null>> {
    try {
        const supabase = await createClient();
        const { data: images, error: imageQueryError } = await supabase
            .from("portfolio_item_images")
            .select("image_url")
            .eq("portfolio_item_id", id);
        if (imageQueryError) return { data: null, error: new Error(imageQueryError.message) };
        const { data: deleted, error } = await supabase
            .from("portfolio_items")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();
        if (error) return { data: null, error: new Error(error.message) };
        if (!deleted) return { data: null, error: new Error("Portfolio item not found or not owned by the current user") };
        await removePortfolioImageFiles((images ?? []).map((image) => image.image_url));
        return { data: null, error: null };
    } catch (err) {
        console.error("[portfolio] deletePortfolioItem:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function deletePortfolioItemImage(id: string): Promise<QueryResult<null>> {
    try {
        const supabase = await createClient();
        const { data: image, error: imageQueryError } = await supabase
            .from("portfolio_item_images")
            .select("image_url")
            .eq("id", id)
            .maybeSingle();
        if (imageQueryError) return { data: null, error: new Error(imageQueryError.message) };
        const { error } = await supabase.from("portfolio_item_images").delete().eq("id", id);
        if (error) return { data: null, error: new Error(error.message) };
        if (image?.image_url) await removePortfolioImageFiles([image.image_url]);
        return { data: null, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function reorderPortfolioItemImages(
    portfolioItemId: string,
    orderedIds: string[]
): Promise<QueryResult<null>> {
    try {
        const supabase = await createClient();
        const { data: existingImages, error: imageQueryError } = await supabase
            .from("portfolio_item_images")
            .select("id")
            .eq("portfolio_item_id", portfolioItemId);
        if (imageQueryError) return { data: null, error: new Error(imageQueryError.message) };

        const existingIds = new Set((existingImages ?? []).map((image) => image.id));
        const requestedIds = new Set(orderedIds);
        if (requestedIds.size !== orderedIds.length || requestedIds.size !== existingIds.size || [...requestedIds].some((id) => !existingIds.has(id))) {
            return { data: null, error: new Error("Image order must contain every image exactly once") };
        }

        const results = await Promise.all(orderedIds.map((id, index) => supabase
            .from("portfolio_item_images")
            .update({ display_order: index })
            .eq("id", id)
            .eq("portfolio_item_id", portfolioItemId)
        ));
        const firstError = results.find((result) => result.error);
        return firstError?.error
            ? { data: null, error: new Error(firstError.error.message) }
            : { data: null, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function reorderPortfolioItems(
    profileId: string,
    orderedIds: string[]
): Promise<QueryResult<null>> {
    try {
        const supabase = await createClient();
        const updates = orderedIds.map((id, index) => supabase
            .from("portfolio_items")
            .update({ display_order: index })
            .eq("id", id)
            .eq("profile_id", profileId)
        );
        const results = await Promise.all(updates);
        const firstError = results.find((r) => r.error);
        if (firstError?.error) return { data: null, error: new Error(firstError.error.message) };
        return { data: null, error: null };
    } catch (err) {
        console.error("[portfolio] reorderPortfolioItems:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}
