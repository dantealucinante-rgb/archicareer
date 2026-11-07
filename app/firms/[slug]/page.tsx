import { notFound } from "next/navigation";
import { getFirmBySlug } from "@/lib/queries/firms";
import type { Metadata } from "next";
import { absoluteUrl, safeJsonLd } from "@/lib/seo";
import Image from "next/image";
import styles from "@/app/components/profile-experience/profile-experience.module.css";

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
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(firmSchema) }} />
            <main className={`${styles.profilePage} ${styles.firm}`}>
                <div className={styles.container}>
                    <header className={styles.identity}>
                        <div className={styles.identityTop}><span className={styles.accountLabel}>Firm directory</span>{firm.verified && <span className={`${styles.pill} ${styles.verified}`}>Verified firm</span>}</div>
                        <div className={styles.identityBody}>
                            <div className={`${styles.avatar} ${styles.firmLogo}`}>
                                {firm.logo_url ? <Image src={firm.logo_url} alt={`${firm.name} logo`} fill sizes="(max-width: 700px) 66px, 84px" priority /> : <span aria-hidden="true">{firm.name.trim().charAt(0).toUpperCase()}</span>}
                            </div>
                            <div className={styles.identityCopy}><p className={styles.descriptor}>Architecture firm</p><h1>{firm.name}</h1><p className={styles.bio}>Firm listing on ArchiCareer.</p></div>
                        </div>
                    </header>
                    <section className={styles.firmDirectoryNote} aria-label="Firm information">
                        <p className={styles.infoLabel}>PUBLIC LISTING</p>
                        <p>Additional firm information is not available on this listing.</p>
                    </section>
                </div>
            </main>
        </>
    );
}
