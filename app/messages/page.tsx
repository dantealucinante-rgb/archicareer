import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MessagesExperience from "./MessagesExperience";
import { getConversations, getPerson, getThread } from "@/lib/queries/messages";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { pageMetadata } from "@/lib/seo";
import styles from "./messages.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
    title: "Messages",
    description: "Private conversations between people on ArchiCareer.",
    path: "/messages",
    index: false,
});

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");

    const params = await searchParams;
    const requested = typeof params.with === "string" ? params.with : null;
    const requestedPerson = requested && requested !== profile.user_id ? await getPerson(requested) : null;
    const [conversations, messages] = await Promise.all([
        getConversations(profile.user_id),
        requestedPerson ? getThread(profile.user_id, requestedPerson.user_id) : Promise.resolve([]),
    ]);

    return <main className={styles.page}>
        <div className={styles.shell}>
            <header className={styles.pageHeader}>
                <p className={styles.kicker}>Direct</p>
                <h1>Messages</h1>
            </header>

            <MessagesExperience
                key={requestedPerson?.user_id ?? "none"}
                currentUserId={profile.user_id}
                conversations={conversations}
                activeUserId={requestedPerson?.user_id ?? null}
                activePerson={requestedPerson}
                initialMessages={messages}
            />
        </div>
    </main>;
}
