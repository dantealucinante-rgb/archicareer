"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioItem } from "@/types";
import styles from "./profile-experience.module.css";

export default function ProfileProjectGallery({ slug, initialProjects, total, isOwner }: { slug: string; initialProjects: PortfolioItem[]; total: number; isOwner: boolean }) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasMore = projects.length < total;

  const loadNext = useCallback(async () => {
    if (inFlight.current || loading || !hasMore) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(slug)}/projects?offset=${projects.length}`, { signal: controller.signal, headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({})) as { projects?: PortfolioItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Couldn’t load more projects.");
      const seen = new Set(projects.map((project) => project.id));
      const next = (payload.projects ?? []).filter((project) => !seen.has(project.id));
      setProjects((current) => [...current, ...next]);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name !== "AbortError") setError("Couldn’t load more projects. Try again.");
    } finally {
      inFlight.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [hasMore, loading, projects, slug]);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void loadNext(); }, { rootMargin: "420px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadNext]);

  if (total === 0) return <div className={styles.emptyState}><p>{isOwner ? "No projects published yet." : "No projects published yet."}</p>{isOwner && <Link href="/profile/edit#portfolio" className={`${styles.pill} ${styles.actionButton}`}>Add your first project</Link>}</div>;

  return <>
    <div className={styles.projectGrid}>
      {projects.map((project, index) => <Link key={project.id} href={`/p/${slug}/projects/${project.id}`} className={styles.projectCard} aria-label={`Open ${project.title}`}>
        <div className={styles.projectImage}>{project.images[0] ? <Image src={project.images[0].image_url} alt={project.title} fill priority={index < 2} sizes="(max-width: 640px) 48vw, (max-width: 1000px) 31vw, 24vw" className={styles.projectCover} /> : <span>{project.category.replaceAll("_", " ")}</span>}</div>
        <div className={styles.projectMeta}><h3>{project.title}</h3><p>{project.category.replaceAll("_", " ")}{project.year ? ` · ${project.year}` : ""}</p></div>
      </Link>)}
      {loading && Array.from({ length: 2 }, (_, index) => <div key={`loading-${index}`} className={styles.projectSkeleton} aria-hidden="true" />)}
    </div>
    {error && <div role="alert" className={styles.projectError}>{error}<button type="button" className={`${styles.pill} ${styles.actionButton}`} onClick={() => void loadNext()}>Retry</button></div>}
    {hasMore && <div ref={sentinel} className={styles.projectSentinel} aria-label="Loading more projects" />}
  </>;
}
