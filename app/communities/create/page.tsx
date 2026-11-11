import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CommunityCreateForm from "./CommunityCreateForm";
import styles from "../community.module.css";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Create a Community", description: "Start a focused space for people in architecture, design and construction.", path: "/communities/create", index: false });

export default async function CreateCommunityPage() {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent("/communities/create")}`);
    return <main className={styles.page}>
        <div className={styles.intro}>
            <div><p className={styles.eyebrow}>Build a space for your field</p><h1 className={styles.title}>Start a community.</h1><p className={styles.description}>Create a place for people across the built environment to share work, exchange knowledge and take part.</p></div>
            <Link href="/communities" className={`${styles.button} ${styles.buttonSecondary}`}>← All communities</Link>
        </div>
        <CommunityCreateForm />
    </main>;
}
