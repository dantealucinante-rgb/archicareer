"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Pill from "@/app/components/editorial/Pill";
import type { PortfolioItemImage } from "@/types";
import styles from "@/app/p/[slug]/projects/[projectId]/project.module.css";

type ProjectImageGalleryProps = {
    images: PortfolioItemImage[];
    title: string;
    projectType: string;
};

export default function ProjectImageGallery({ images, title, projectType }: ProjectImageGalleryProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const isOpen = openIndex !== null;

    const close = useCallback(() => setOpenIndex(null), []);
    const step = useCallback((delta: number) => {
        setOpenIndex((current) => {
            if (current === null) return current;
            return (current + delta + images.length) % images.length;
        });
    }, [images.length]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isOpen && !dialog.open) dialog.showModal();
        if (!isOpen && dialog.open) dialog.close();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
            if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, step]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handleCancel = (event: Event) => { event.preventDefault(); close(); };
        dialog.addEventListener("cancel", handleCancel);
        return () => dialog.removeEventListener("cancel", handleCancel);
    }, [close]);

    if (images.length === 0) return null;

    const active = openIndex === null ? null : images[openIndex];

    return <>
        <div className={styles.gallery}>
            {images.map((image, index) => <figure key={image.id} className={styles.galleryItem}>
                <button
                    type="button"
                    className={styles.galleryButton}
                    onClick={() => setOpenIndex(index)}
                    aria-label={`Open image ${index + 1} of ${images.length} at full size`}
                >
                    <Image
                        src={image.image_url}
                        alt={`${title}, ${projectType} view ${index + 1}`}
                        fill
                        priority={index === 0}
                        sizes={index === 0 ? "(max-width: 700px) 100vw, 90vw" : "(max-width: 700px) 100vw, 45vw"}
                    />
                </button>
                <figcaption>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</figcaption>
            </figure>)}
        </div>

        <dialog ref={dialogRef} className={styles.lightbox} aria-label={`${title} image viewer`}>
            {active && <div className={styles.lightboxInner}>
                <div className={styles.lightboxImage}>
                    <Image
                        src={active.image_url}
                        alt={`${title}, ${projectType} view ${(openIndex ?? 0) + 1}`}
                        fill
                        sizes="100vw"
                    />
                </div>
                <div className={styles.lightboxBar}>
                    <p className={styles.lightboxCount}>
                        {(openIndex ?? 0) + 1} / {images.length}
                    </p>
                    <div className={styles.lightboxActions}>
                        {images.length > 1 && <>
                            <Pill size="small" variant="quiet" onClick={() => step(-1)}>← Previous</Pill>
                            <Pill size="small" variant="quiet" onClick={() => step(1)}>Next →</Pill>
                        </>}
                        <Pill size="small" variant="ink" onClick={close}>Close</Pill>
                    </div>
                </div>
            </div>}
        </dialog>
    </>;
}
