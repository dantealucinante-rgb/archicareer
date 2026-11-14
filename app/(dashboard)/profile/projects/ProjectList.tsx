"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/app/components/editorial/ConfirmDialog";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import PublishToggle from "@/app/components/profile-experience/PublishToggle";
import type { PortfolioItem } from "@/types";
import styles from "./projects.module.css";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

type ProjectListProps = {
    slug: string;
    items: PortfolioItem[];
};

export default function ProjectList({ slug, items: initialItems }: ProjectListProps) {
    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
    const [error, setError] = useState("");

    async function persistOrder(next: PortfolioItem[]) {
        setItems(next);
        setError("");
        const response = await fetch("/api/portfolio", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: next.map((item) => item.id) }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({})) as { error?: string };
            setError(payload.error ?? "Couldn't save the new order.");
            setItems(initialItems);
        }
    }

    function move(index: number, delta: number) {
        const target = index + delta;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        void persistOrder(next);
    }

    async function confirmDelete() {
        const target = deleteTarget;
        if (!target) return;
        setPendingId(target.id);
        setError("");
        try {
            const response = await fetch("/api/portfolio", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: target.id }),
            });
            const payload = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Couldn't delete this project.");
            setItems((current) => current.filter((item) => item.id !== target.id));
            setDeleteTarget(null);
            router.refresh();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Couldn't delete this project.");
        } finally {
            setPendingId(null);
        }
    }

    if (items.length === 0) {
        return <div className={styles.empty}>
            <p className={editorial.lede}>
                You haven&apos;t added a project yet. Your first project is what visitors see first on your profile.
            </p>
            <Pill href="/profile/projects/new" variant="blue">Add your first project</Pill>
        </div>;
    }

    return <>
        {error && <p className={editorial.fieldError} role="alert" style={{ marginTop: 16 }}>{error}</p>}
        <ol className={styles.list}>
            {items.map((item, index) => <li key={item.id} className={styles.row}>
                <div className={styles.rowImage}>
                    {item.images[0]
                        ? <Image src={item.images[0].image_url} alt="" fill sizes="150px" />
                        : <span className={styles.rowImageEmpty}>No image</span>}
                </div>

                <div className={styles.rowCopy}>
                    <h2 className={styles.rowTitle}>{item.title}</h2>
                    <p className={styles.rowMeta}>
                        {label(item.category)}
                        {item.year ? ` · ${item.year}` : ""}
                        {item.images.length ? ` · ${item.images.length} ${item.images.length === 1 ? "image" : "images"}` : ""}
                    </p>
                    <p>
                        <span className={[styles.badge, item.is_published ? styles.badgeLive : ""].filter(Boolean).join(" ")}>
                            {item.is_published ? "Published" : "Draft"}
                        </span>
                    </p>
                </div>

                <div className={styles.rowActions}>
                    <Pill size="small" variant="quiet" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.title} up`}>↑</Pill>
                    <Pill size="small" variant="quiet" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${item.title} down`}>↓</Pill>
                    <PublishToggle projectId={item.id} published={item.is_published} />
                    <Pill
                        size="small"
                        variant="quiet"
                        href={`/p/${slug}/projects/${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                    >Preview ↗</Pill>
                    <Pill size="small" href={`/profile/projects/${item.id}`}>Edit</Pill>
                    <Pill
                        size="small"
                        variant="quiet"
                        onClick={() => setDeleteTarget(item)}
                        disabled={pendingId === item.id}
                        style={{ color: "var(--coral)" }}
                    >Delete</Pill>
                </div>
            </li>)}
        </ol>

        <ConfirmDialog
            open={Boolean(deleteTarget)}
            title="Delete this project?"
            description={deleteTarget
                ? `“${deleteTarget.title}” and its images will be permanently removed. This can't be undone.`
                : ""}
            confirmLabel="Delete project"
            destructive
            busy={pendingId !== null}
            onConfirm={() => void confirmDelete()}
            onCancel={() => setDeleteTarget(null)}
        />
    </>;
}
