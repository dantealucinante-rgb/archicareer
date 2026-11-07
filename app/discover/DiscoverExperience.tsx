"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { DiscoverItem, DiscoverPageData } from "@/lib/queries/discover";
import FollowButton from "@/app/components/FollowButton";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import { Close } from "@/app/components/UiIcon";
import styles from "./discover.module.css";

const categories = [
  ["all", "All"], ["residential", "Residential"], ["commercial", "Commercial"],
  ["institutional", "Institutional"], ["interior", "Interior design"], ["landscape", "Landscape"],
  ["urban", "Urban design"], ["academic", "Academic"], ["other", "Other"],
] as const;
type ResultType = "all" | "people" | "portfolios";

export default function DiscoverExperience({ initialData, viewerId }: { initialData: DiscoverPageData; viewerId: string | null }) {
  const [items, setItems] = useState(initialData.items);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [resultType, setResultType] = useState<ResultType>("all");
  const [profileOffset, setProfileOffset] = useState(initialData.nextProfileOffset);
  const [projectOffset, setProjectOffset] = useState(initialData.nextProjectOffset);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(initialData.error ? "Couldn’t load discoveries. Try again." : "");
  const sentinel = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);
  const requestPage = useCallback(async (nextCategory: string, nextSearch: string, nextType: ResultType, append: boolean, cursor = { profileOffset: 0, projectOffset: 0 }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (append) setLoadingMore(true);
    else setLoadingResults(true);
    setError("");
    const params = new URLSearchParams({ category: nextCategory, q: nextSearch, type: nextType, profiles: append ? String(cursor.profileOffset) : "0", projects: append ? String(cursor.projectOffset) : "0", seed: String(initialData.seed) });
    try {
      const response = await fetch(`/api/discover?${params}`, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Couldn’t load discovery results.");
      const data = await response.json() as DiscoverPageData;
      setItems((previous) => {
        const existing = append ? new Set(previous.map((item) => `${item.type}:${item.id}`)) : new Set<string>();
        return [...(append ? previous : []), ...data.items.filter((item) => !existing.has(`${item.type}:${item.id}`))];
      });
      setProfileOffset(data.nextProfileOffset);
      setProjectOffset(data.nextProjectOffset);
      setHasMore(data.hasMore);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name !== "AbortError") setError("Couldn’t load more discoveries. Try again.");
    } finally {
      if (!controller.signal.aborted) {
        setLoadingMore(false);
        setLoadingResults(false);
      }
    }
  }, [initialData.seed]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim()) {
        setItems([]);
        setProfileOffset(0);
        setProjectOffset(0);
        setHasMore(true);
        void requestPage(category, search.trim(), resultType, false);
      } else if (category !== "all" || resultType !== "all") {
        setItems([]);
        setProfileOffset(0);
        setProjectOffset(0);
        setHasMore(true);
        void requestPage(category, "", resultType, false);
      } else {
        abortRef.current?.abort();
        setItems(initialData.items);
        setProfileOffset(initialData.nextProfileOffset);
        setProjectOffset(initialData.nextProjectOffset);
        setHasMore(initialData.hasMore);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [search, category, resultType, initialData, requestPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loadingMore || loadingResults || !hasMore) return;
    loadingMoreRef.current = true;
    void requestPage(category, search.trim(), resultType, true, { profileOffset, projectOffset }).finally(() => { loadingMoreRef.current = false; });
  }, [category, hasMore, loadingMore, loadingResults, profileOffset, projectOffset, requestPage, resultType, search]);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore(); }, { rootMargin: "320px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loadMore]);

  const showNoResults = items.length === 0 && !loadingResults && !error && !hasMore;
  return <section className={styles.explore} aria-label="Explore people and portfolios">
    <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.searchIcon} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.3 4.3" strokeLinecap="round"/></svg>
      <label htmlFor="discover-search" className={styles.visuallyHidden}>Search people, projects and portfolios</label>
      <input id="discover-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, projects and portfolios…" autoComplete="off" />
      {search && <button className={styles.clearSearch} type="button" onClick={() => setSearch("")} aria-label="Clear search"><Close /></button>}
    </form>

    <nav aria-label="Filter by category" className={styles.categoryScroller}>
      {categories.map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`${styles.pill} ${category === value ? styles.activePill : ""}`}>{label}</button>)}
    </nav>

    <div className={styles.resultsToolbar}>
      <p>People and work worth discovering</p>
      <div className={styles.typeFilters} aria-label="Discovery result type">
        {([["all", "All"], ["people", "People"], ["portfolios", "Portfolios"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={resultType === value} className={`${styles.pill} ${resultType === value ? styles.typeActive : ""}`} onClick={() => setResultType(value)}>{label}</button>)}
      </div>
    </div>

    {loadingResults && items.length === 0 ? <div className={styles.masonry} aria-label="Loading discoveries" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className={`${styles.skeleton} ${index % 3 === 0 ? styles.skeletonTall : ""}`} />)}</div> : null}
    <div className={styles.masonry} aria-live="polite">
      {items.map((item, index) => item.type === "portfolio"
        ? <PortfolioCard key={`portfolio:${item.id}`} item={item} priority={index < 2} />
        : <PersonCard key={`person:${item.id}`} item={item} viewerId={viewerId} />)}
      {loadingMore && Array.from({ length: 2 }, (_, index) => <div key={`loading:${index}`} className={`${styles.skeleton} ${index === 0 ? styles.skeletonTall : ""}`} aria-hidden="true" />)}
    </div>
    {showNoResults && <div className={styles.empty}><h2>Nothing here yet.</h2><p>Try another search or explore a different category.</p></div>}
    {error && <div role="alert" className={styles.error}>{error}<button type="button" className={`${styles.pill} ${styles.retry}`} onClick={() => { setItems([]); setProfileOffset(0); setProjectOffset(0); setHasMore(true); void requestPage(category, search.trim(), resultType, false); }}>Try again</button></div>}
    {hasMore && <div ref={sentinel} className={styles.loadMarker} aria-label="More discoveries" />}
  </section>;
}

const PortfolioCard = memo(function PortfolioCard({ item, priority }: { item: Extract<DiscoverItem, { type: "portfolio" }>; priority: boolean }) {
  const cover = item.project.images[0];
  const label = item.project.category.replaceAll("_", " ");
  return <article className={`${styles.portfolio} ${styles.masonryItem}`}>
    <Link href={`/p/${item.ownerSlug}/projects/${item.project.id}`} className={styles.projectLink} aria-label={`Open ${item.project.title}`}>
      <div className={`${styles.projectImage} ${cover ? "" : styles.noImage}`}>
        {cover ? <Image src={cover.image_url} alt={`${item.project.title} project`} fill priority={priority} sizes="(max-width: 600px) 46vw, (max-width: 1000px) 31vw, 24vw" className={styles.cover} /> : <span className={styles.noImageText}>Project preview</span>}
      </div>
      <div className={styles.projectCopy}><div><h2>{item.project.title}</h2><p>{label}</p></div>{item.project.year && <span className={styles.projectYear}>{item.project.year}</span>}</div>
    </Link>
  </article>;
});

const PersonCard = memo(function PersonCard({ item, viewerId }: { item: Extract<DiscoverItem, { type: "person" }>; viewerId: string | null }) {
  const profile = item.profile;
  const subtitle = profile.school_or_firm || (profile.role === "student" ? "Architecture student" : profile.role === "firm" ? "Architecture firm" : "Architecture professional");
  return <article className={`${styles.person} ${styles.masonryItem}`}>
    <div className={styles.personHead}><Link href={`/p/${profile.slug}`} className={styles.personIdentity}><ProfileAvatar profile={profile} size={52} className={styles.avatar} /><span><strong>{profile.name}</strong><small>{subtitle}</small></span></Link>
      {item.followId && item.followId !== viewerId && (viewerId
        ? <FollowButton followingId={item.followId} initialFollowing={item.following} initialMutual={item.mutual} initialFollowerCount={0} compact />
        : <Link href="/login?next=%2Fdiscover" className={`${styles.pill} ${styles.followLink}`}>Follow</Link>)}
    </div>
    {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
    {profile.location && <p className={styles.location}>{profile.location}</p>}
  </article>;
});
