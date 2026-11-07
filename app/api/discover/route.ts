import { NextResponse } from "next/server";
import { getDiscoverPageData } from "@/lib/queries/discover";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawType = params.get("type");
  const type = rawType === "people" || rawType === "portfolios" ? rawType : "all";
  const rawCategory = params.get("category") ?? "all";
  const allowedCategories = new Set(["all", "residential", "commercial", "institutional", "interior", "landscape", "urban", "academic", "other"]);
  try {
    const data = await getDiscoverPageData({
      search: params.get("q") ?? "",
      category: allowedCategories.has(rawCategory) ? rawCategory : "all",
      type,
      profileOffset: Number(params.get("profiles")) || 0,
      projectOffset: Number(params.get("projects")) || 0,
      seed: params.has("seed") ? Number(params.get("seed")) || 0 : undefined,
    });
    if (data.error) return NextResponse.json({ error: "Couldn’t load discoveries." }, { status: 503 });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[discover] Unable to load results:", error);
    return NextResponse.json({ error: "Couldn’t load discoveries." }, { status: 503 });
  }
}
