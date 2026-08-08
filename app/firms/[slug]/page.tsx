import { notFound } from "next/navigation";
import { getFirmBySlug } from "@/lib/queries/firms";
import type { Metadata } from "next";
import { absoluteUrl, safeJsonLd } from "@/lib/seo";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const { data: firm } = await getFirmBySlug(slug);
    if (!firm) return { title: "Firm not found", robots: { index: false, follow: false } };
    return {
        title: `${firm.name} — Architecture Firm in Nigeria`,
        description: `${firm.name} on ArchiCareer — discover the practice and its opportunities in Nigeria.`,
        alternates: { canonical: `/firms/${firm.slug}` },
        robots: { index: true, follow: true },
        openGraph: {
            type: "profile",
            title: `${firm.name} — Architecture Firm in Nigeria`,
            description: `${firm.name} on ArchiCareer — discover the practice and its opportunities in Nigeria.`,
            url: absoluteUrl(`/firms/${firm.slug}`),
            images: firm.logo_url ? [{ url: firm.logo_url, alt: `${firm.name} logo` }] : undefined,
        },
    };
}

export default async function FirmDetailPage({ params }: PageProps) {
    const { slug } = await params;
    if (!slug) {
        notFound();
    }

    const { data: firm } = await getFirmBySlug(slug);
    if (!firm) notFound();

    const firmSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: firm.name,
        url: absoluteUrl(`/firms/${firm.slug}`),
        logo: firm.logo_url ?? undefined,
        address: { "@type": "PostalAddress", addressCountry: "NG" },
    };

    return (
        <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(firmSchema) }} /><div className="bg-paper text-ink flex flex-col font-sans selection:bg-redline selection:text-paper">
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="border border-line rounded-[2px] p-8 text-center">
                    <h1 className="font-display text-3xl uppercase tracking-tight text-ink mb-4 font-normal">{firm.name}</h1>
                    <p className="text-graphite mb-6">{firm.verified ? "Verified firm" : "Architecture firm"}</p>
                    <div className="border border-dashed border-line rounded-[2px] p-6 text-graphite">
                        Firm details and active opportunities will appear here as this profile is expanded.
                    </div>
                </div>
            </main>
        </div></>
    );
}
