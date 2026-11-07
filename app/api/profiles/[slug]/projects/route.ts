import { NextResponse } from "next/server";
import { getProfileBySlug } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offsetValue = Number(new URL(request.url).searchParams.get("offset"));
  const offset = Number.isFinite(offsetValue) ? Math.max(0, Math.floor(offsetValue)) : 0;
  const { data: profile } = await getProfileBySlug(slug);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const result = await getPortfolioItemsForProfile(profile.id, 12, offset);
  if (result.error) return NextResponse.json({ error: "Couldn’t load more projects." }, { status: 503 });
  return NextResponse.json({ projects: result.data ?? [], count: result.count ?? 0, nextOffset: offset + (result.data?.length ?? 0) }, { headers: { "Cache-Control": "private, no-store" } });
}
