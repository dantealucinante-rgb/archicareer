"use client";

import { useEffect, useRef } from "react";
import Pill from "./Pill";
import styles from "./editorial.module.css";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    destructive = false,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handleCancel = (event: Event) => {
            event.preventDefault();
            if (!busy) onCancel();
        };
        dialog.addEventListener("cancel", handleCancel);
        return () => dialog.removeEventListener("cancel", handleCancel);
    }, [busy, onCancel]);

    return <dialog
        ref={dialogRef}
        className={styles.confirmDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
    >
        <h2 id="confirm-dialog-title" className={styles.subTitle}>{title}</h2>
        <p className={styles.body}>{description}</p>
        <div className={styles.pillRow}>
            <Pill variant={destructive ? "orange" : "ink"} onClick={onConfirm} disabled={busy}>
                {busy ? "Working…" : confirmLabel}
            </Pill>
            <Pill variant="quiet" onClick={onCancel} disabled={busy}>{cancelLabel}</Pill>
        </div>
    </dialog>;
}
