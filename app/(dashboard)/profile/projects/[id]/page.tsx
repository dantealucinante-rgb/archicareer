import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getPortfolioItemForViewer } from "@/lib/queries/portfolio";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import ProjectEditor from "../ProjectEditor";
import styles from "../projects.module.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: PageProps) {
    const { id } = await params;
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");

    const { data: project } = await getPortfolioItemForViewer(profile.id, id);
    if (!project) notFound();

    return <main className={editorial.page}>
        <div className={editorial.container}>
            <header className={styles.head}>
                <div className={styles.headCopy}>
                    <Link href="/profile/projects" className={styles.rowMeta}>← All projects</Link>
                    <h1 className={editorial.pageTitle}>Edit project</h1>
                    <p className={editorial.lede}>
                        {project.is_published
                            ? "This project is live on your public profile."
                            : "This project is a draft and only you can see it."}
                    </p>
                </div>
                <div className={editorial.pillRow}>
                    <Pill href={`/p/${profile.slug}/projects/${project.id}`} variant="quiet">Preview ↗</Pill>
                    <Pill href={`/p/${profile.slug}`} variant="quiet">Public profile ↗</Pill>
                </div>
            </header>

            <ProjectEditor profileId={profile.id} project={project} submitLabel="Save project" />
        </div>
    </main>;
}
