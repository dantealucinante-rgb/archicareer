import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFirmBySlug } from "@/lib/queries/firms";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import { MarketingFooter } from "@/app/components/MarketingChrome";
import ProfileIdentity from "@/app/components/profile-experience/ProfileIdentity";
import SectionHeading from "@/app/components/profile-experience/SectionHeading";
import styles from "@/app/components/profile-experience/profile-experience.module.css";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const { data: firm } = await getFirmBySlug(slug);
    if (!firm) return { title: { absolute: "Firm profile not found | Archicareer" }, robots: { index: false, follow: false } };
    return pageMetadata({
        title: `${firm.name} | Architecture Firm Profile`,
        description: `${firm.name} on Archicareer. Explore the firm profile and its architecture work.`,
        path: `/firms/${firm.slug}`,
        image: firm.logo_url,
        imageAlt: `${firm.name} logo`,
        type: "profile",
    });
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
    };

    return (
        <div className={editorial.page}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(firmSchema) }} />
            <main className={styles.profileShell}>
                <div className={editorial.container}>
                    <ProfileIdentity
                        name={firm.name}
                        avatar={{ id: firm.id, slug: firm.slug, name: firm.name, avatar_url: firm.logo_url }}
                        eyebrow="Firm directory"
                        title="Architecture practice"
                        intro="A firm listed in the ArchiCareer directory."
                        badges={firm.verified
                            ? <span className={`${styles.badge} ${styles.badgeVerified}`}>Verified firm</span>
                            : undefined}
                        actions={<Pill href="/discover" variant="ink" flat>Explore the directory</Pill>}
                    />
                </div>

                <div className={editorial.container}>
                    <section className={styles.section}>
                        <SectionHeading eyebrow="Listing" title="Firm information" />
                        <div className={styles.emptyState}>
                            <p>This firm has not published a full profile yet. Its projects, people and contact details will appear here once the practice completes its listing.</p>
                            <Pill href="/discover" variant="quiet" size="small">Browse other profiles</Pill>
                        </div>
                    </section>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
