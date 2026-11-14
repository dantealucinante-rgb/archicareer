"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Pill from "@/app/components/editorial/Pill";
import styles from "@/app/components/editorial/editorial.module.css";

type PublishToggleProps = {
    projectId: string;
    published: boolean;
    size?: "default" | "small";
};

export default function PublishToggle({ projectId, published, size = "small" }: PublishToggleProps) {
    const router = useRouter();
    const [isPublished, setIsPublished] = useState(published);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    async function toggle() {
        if (pending) return;
        const next = !isPublished;
        setPending(true);
        setError("");
        try {
            const response = await fetch("/api/portfolio", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: projectId, is_published: next }),
            });
            const payload = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Couldn’t update this project.");
            setIsPublished(next);
            router.refresh();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Couldn’t update this project.");
        } finally {
            setPending(false);
        }
    }

    return <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
        <Pill
            size={size}
            variant={isPublished ? "quiet" : "orange"}
            onClick={toggle}
            disabled={pending}
            aria-pressed={isPublished}
        >
            {pending ? "Updating…" : isPublished ? "Unpublish" : "Publish"}
        </Pill>
        {error && <p className={styles.fieldError} role="alert">{error}</p>}
    </div>;
}
