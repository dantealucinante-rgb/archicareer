import { notFound } from "next/navigation";
import { getFirmBySlug } from "@/lib/queries/firms";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function FirmDetailPage({ params }: PageProps) {
    const { slug } = await params;
    if (!slug) {
        notFound();
    }

    const { data: firm } = await getFirmBySlug(slug);
    if (!firm) notFound();

    return (
        <div className="bg-paper text-ink flex flex-col font-sans selection:bg-redline selection:text-paper">
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="border border-line rounded-[2px] p-8 text-center">
                    <h1 className="font-display text-3xl uppercase tracking-tight text-ink mb-4 font-normal">{firm.name}</h1>
                    <p className="text-graphite mb-6">{firm.verified ? "Verified firm" : "Architecture firm"}</p>
                    <div className="border border-dashed border-line rounded-[2px] p-6 text-graphite">
                        Firm details and active opportunities will appear here as this profile is expanded.
                    </div>
                </div>
            </main>
        </div>
    );
}
