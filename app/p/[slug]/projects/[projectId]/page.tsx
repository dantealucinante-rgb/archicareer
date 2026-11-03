import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProfileBySlug } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import BrandMark from "@/app/components/BrandMark";

type Props = { params: Promise<{ slug: string; projectId: string }> };
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, projectId } = await params;
    const { data: profile } = await getProfileBySlug(slug);
    if (!profile) return { title: "Project not found", robots: { index: false } };
    const { data } = await getPortfolioItemsForProfile(profile.id);
    const project = data?.find((item) => item.id === projectId);
    return project ? { title: `${project.title} — ${profile.name}`, description: project.description || `${label(project.project_type)} project by ${profile.name}.` } : { title: "Project not found", robots: { index: false } };
}

export default async function ProjectPage({ params }: Props) {
    const { slug, projectId } = await params;
    const { data: profile } = await getProfileBySlug(slug);
    if (!profile) notFound();
    const { data: items } = await getPortfolioItemsForProfile(profile.id);
    const project = items?.find((item) => item.id === projectId);
    if (!project) notFound();
    const images = project.images;
    return <div className="portfolio-site min-h-screen bg-white text-ink"><header className="portfolio-nav"><Link href="/" className="portfolio-brand"><BrandMark className="portfolio-brand-mark" /><span>ARCHICAREER</span></Link><Link href={`/p/${slug}`} className="portfolio-nav-name">{profile.name}</Link><nav aria-label="Project navigation"><Link href={`/p/${slug}#projects`}>All projects</Link><Link href={`/p/${slug}#about`}>About</Link><Link href={`mailto:?subject=${encodeURIComponent(`Project enquiry: ${project.title}`)}`}>Contact ↗</Link></nav></header><main className="portfolio-main portfolio-detail"><div className="portfolio-detail-heading"><Link href={`/p/${slug}#projects`} className="portfolio-back">← BACK TO PROJECTS</Link><p className="portfolio-section-label">{label(project.project_type)} / {label(project.status)}</p><h1>{project.title}</h1>{project.description && <p className="portfolio-detail-lede">{project.description}</p>}</div><section className="portfolio-detail-meta" aria-label="Project information">{[["LOCATION", project.location], ["YEAR", project.year?.toString()], ["ROLE", project.role === "team" ? `Team · ${project.team_contribution || ""}` : "Individual"], ["TOOLS", project.software_used.join(" · ")]].filter((row) => row[1]).map(([key, value]) => <div key={key}><span>{key}</span><p>{value}</p></div>)}</section>{project.process_note && <section className="portfolio-concept"><p className="portfolio-section-label">DESIGN APPROACH</p><p>{project.process_note}</p></section>}<div className="portfolio-detail-gallery">{images.map((image, index) => <figure key={image.id} className={index === 0 ? "portfolio-detail-image portfolio-detail-image-wide" : "portfolio-detail-image"}><Image src={image.image_url} alt={`${project.title}, project image ${index + 1}`} fill priority={index === 0} sizes="(max-width: 700px) 100vw, 90vw" className="portfolio-cover" /><figcaption>{project.title} <span>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span></figcaption></figure>)}</div>{images.length === 0 && <p className="portfolio-empty">No project images have been published.</p>}<footer className="portfolio-detail-footer"><div><p className="portfolio-section-label">PROJECT BY</p><h2>{profile.name}</h2><p>{profile.school_or_firm || profile.location}</p></div><Link href={`/p/${slug}`}>View complete portfolio ↗</Link></footer></main><div className="portfolio-footer"><Link href={`/p/${slug}`}>{profile.name}</Link><span>PROJECT CASE STUDY</span><Link href={`/p/${slug}#projects`}>ALL PROJECTS ↑</Link></div></div>;
}
