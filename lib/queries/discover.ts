import { createPublicClient } from "@/lib/supabase/server";
import { getProfileOwnerUserIds, getFollowStatesForTargets } from "@/lib/queries/follows";
import { getCurrentProfile } from "@/lib/queries/profiles";
import type { PortfolioItem, Profile } from "@/types";

export type DiscoverCategory = "all" | "residential" | "commercial" | "institutional" | "interior" | "landscape" | "urban" | "academic" | "other";
export type DiscoverItem =
  | { type: "person"; id: string; profile: Pick<Profile, "id" | "name" | "slug" | "role" | "account_type" | "school_or_firm" | "bio" | "location" | "avatar_url">; followId: string | null; following: boolean; mutual: boolean }
  | { type: "portfolio"; id: string; project: Pick<PortfolioItem, "id" | "profile_id" | "title" | "description" | "category" | "project_type" | "year" | "images">; ownerSlug: string };

export type DiscoverPageData = { items: DiscoverItem[]; nextProfileOffset: number; nextProjectOffset: number; hasMore: boolean; seed: number; error?: boolean };

const PAGE_SIZE = 8;
const profileFields = "id, name, slug, role, account_type, school_or_firm, bio, location, avatar_url, created_at";
const projectFields = "id, profile_id, title, description, category, project_type, year, created_at";
const words: Record<Exclude<DiscoverCategory, "all">, string[]> = {
  residential: ["residential", "housing", "home"], commercial: ["commercial", "office", "retail"],
  institutional: ["institutional", "school", "hospital"], interior: ["interior", "interior design"],
  landscape: ["landscape", "garden"], urban: ["urban", "city", "planning"],
  academic: ["academic", "student", "studio"], other: ["other", "product", "furniture", "material"],
};

function safeSearch(value: string) { return value.replace(/[(),%_\\]/g, " ").trim().slice(0, 80); }
function seedHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

export async function getDiscoverPageData(options: {
  search?: string; category?: string; type?: "all" | "people" | "portfolios";
  profileOffset?: number; projectOffset?: number; seed?: number;
} = {}): Promise<DiscoverPageData> {
  const supabase = createPublicClient();
  const search = safeSearch(options.search ?? "");
  const category = (options.category ?? "all") as DiscoverCategory;
  const type = options.type ?? "all";
  const profileOffset = Math.max(0, options.profileOffset ?? 0);
  const projectOffset = Math.max(0, options.projectOffset ?? 0);
  const seed = Math.max(0, Math.floor(options.seed ?? Math.random() * 1_000_000_000));
  const categoryTerms = category === "all" ? [] : words[category as Exclude<DiscoverCategory, "all">] ?? [];
  const profileQuery = supabase.from("profiles").select(profileFields)
    .eq("search_indexable", true).eq("account_status", "active")
    .order("created_at", { ascending: false }).range(profileOffset, profileOffset + PAGE_SIZE - 1);
  const projectQuery = supabase.from("portfolio_items").select(projectFields)
    .eq("moderation_status", "active").order("created_at", { ascending: false })
    .range(projectOffset, projectOffset + PAGE_SIZE - 1);

  if (type === "portfolios") {
    // profiles are deliberately not queried for a portfolio-only result set.
  } else if (search || categoryTerms.length) {
    const profileTerms = search ? [`name.ilike.%${search}%`, `role.ilike.%${search}%`, `school_or_firm.ilike.%${search}%`, `bio.ilike.%${search}%`, `location.ilike.%${search}%`] : [];
    profileTerms.push(...categoryTerms.flatMap((term) => [`bio.ilike.%${term}%`, `school_or_firm.ilike.%${term}%`, `role.ilike.%${term}%`]));
    profileQuery.or(profileTerms.join(","));
  }
  if (type === "people") {
    // projects are deliberately omitted from a people-only search.
  } else {
    if (category !== "all") projectQuery.eq("category", category);
    if (search) projectQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%,project_type.ilike.%${search}%`);
  }

  const [profilesResult, projectsResult, currentResult] = await Promise.all([
    type === "portfolios" ? Promise.resolve({ data: [], error: null }) : profileQuery,
    type === "people" ? Promise.resolve({ data: [], error: null }) : projectQuery,
    getCurrentProfile(),
  ]);
  if (profilesResult.error || projectsResult.error) return { items: [], nextProfileOffset: profileOffset, nextProjectOffset: projectOffset, hasMore: false, seed, error: true };
  const profiles = (profilesResult.data ?? []) as unknown as Profile[];
  const projects = (projectsResult.data ?? []) as unknown as Pick<PortfolioItem, "id" | "profile_id" | "title" | "description" | "category" | "project_type" | "year">[];
  const ownerProfiles = projects.length ? await supabase.from("profiles").select("id, slug").in("id", [...new Set(projects.map((item) => item.profile_id))]).eq("search_indexable", true).eq("account_status", "active") : { data: [], error: null };
  const slugByProfileId = new Map((ownerProfiles.data ?? []).map((profile) => [profile.id, profile.slug]));
  const visibleProjects = projects.filter((project) => slugByProfileId.has(project.profile_id));
  const imageResult = visibleProjects.length ? await supabase.from("portfolio_item_images").select("id, portfolio_item_id, image_url, display_order, created_at").in("portfolio_item_id", visibleProjects.map((project) => project.id)).order("display_order", { ascending: true }) : { data: [], error: null };
  const imagesByProject = new Map<string, PortfolioItem["images"]>();
  for (const image of (imageResult.data ?? []) as PortfolioItem["images"]) imagesByProject.set(image.portfolio_item_id, [...(imagesByProject.get(image.portfolio_item_id) ?? []), image]);
  const spreadCreators = (source: typeof visibleProjects) => {
    const remaining = [...source];
    const ordered: typeof source = [];
    let previousOwner = "";
    while (remaining.length) {
      let index = remaining.findIndex((item) => item.profile_id !== previousOwner);
      if (index < 0) index = 0;
      const [item] = remaining.splice(index, 1);
      ordered.push(item);
      previousOwner = item.profile_id;
    }
    return ordered;
  };
  const userIds = await getProfileOwnerUserIds(profiles.map((profile) => profile.id));
  const followIds = Object.values(userIds);
  const followStates = await getFollowStatesForTargets(currentResult.data?.user_id ?? null, followIds);
  const people: DiscoverItem[] = profiles.filter((profile) => profile.id !== currentResult.data?.id)
    .sort((a, b) => seedHash(`${seed}:${a.id}`) - seedHash(`${seed}:${b.id}`)).map((profile) => ({
    type: "person", id: profile.id,
    profile: { id: profile.id, name: profile.name, slug: profile.slug, role: profile.role, account_type: profile.account_type, school_or_firm: profile.school_or_firm, bio: profile.bio, location: profile.location, avatar_url: profile.avatar_url },
    followId: userIds[profile.id] ?? null,
    following: followStates[userIds[profile.id]]?.isFollowing ?? false,
    mutual: followStates[userIds[profile.id]]?.isMutual ?? false,
  }));
  const portfolios: DiscoverItem[] = spreadCreators([...visibleProjects].sort((a, b) => seedHash(`${seed}:${a.id}`) - seedHash(`${seed}:${b.id}`))).map((project) => ({
    type: "portfolio", id: project.id,
    project: { ...project, images: imagesByProject.get(project.id) ?? [] },
    ownerSlug: slugByProfileId.get(project.profile_id)!,
  }));

  // Alternate source types; vary the starting source by page while preserving source order.
  const items: DiscoverItem[] = [];
  let personIndex = 0;
  let projectIndex = 0;
  const startWithProject = (Math.floor(profileOffset / PAGE_SIZE) + seed % 2) % 2 === 1;
  while (personIndex < people.length || projectIndex < portfolios.length) {
    const preferProject = (items.length % 2 === 0) === startWithProject;
    const fallback = preferProject ? people : portfolios;
    if (preferProject && projectIndex < portfolios.length) items.push(portfolios[projectIndex++]);
    else if (!preferProject && personIndex < people.length) items.push(people[personIndex++]);
    else if (fallback === portfolios && projectIndex < portfolios.length) items.push(portfolios[projectIndex++]);
    else if (fallback === people && personIndex < people.length) items.push(people[personIndex++]);
  }
  return {
    items,
    nextProfileOffset: profileOffset + profiles.length,
    nextProjectOffset: projectOffset + projects.length,
    hasMore: profiles.length === PAGE_SIZE || projects.length === PAGE_SIZE,
    seed,
  };
}
