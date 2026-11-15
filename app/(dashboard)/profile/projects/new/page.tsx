import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import editorial from "@/app/components/editorial/editorial.module.css";
import ProjectEditor from "../ProjectEditor";
import styles from "../projects.module.css";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");

    return <main className={editorial.page}>
        <div className={editorial.container}>
            <header className={styles.head}>
                <div className={styles.headCopy}>
                    <Link href="/profile/projects" className={styles.rowMeta}>← All projects</Link>
                    <h1 className={editorial.pageTitle}>New project</h1>
                    <p className={editorial.lede}>
                        Add the details and images now, or save it as a draft and come back later.
                    </p>
                </div>
            </header>

            <ProjectEditor profileId={profile.id} submitLabel="Create project" />
        </div>
    </main>;
}
