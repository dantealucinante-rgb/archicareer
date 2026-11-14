"use client";

import Pill from "./Pill";
import styles from "./editorial.module.css";

export type SaveState = "idle" | "saving" | "saved" | "error";

type SaveBarProps = {
    state: SaveState;
    dirty: boolean;
    error?: string | null;
    saveLabel?: string;
    onSave: () => void;
    onDiscard: () => void;
};

export default function SaveBar({ state, dirty, error, saveLabel = "Save changes", onSave, onDiscard }: SaveBarProps) {
    const status = state === "saving"
        ? "Saving…"
        : state === "error"
            ? error ?? "That didn't save. Try again."
            : state === "saved" && !dirty
                ? "All changes saved."
                : dirty
                    ? "You have unsaved changes."
                    : "";

    const statusClass = state === "error" ? styles.saveBarError : state === "saved" && !dirty ? styles.saveBarSaved : "";

    return <div className={styles.saveBar} role="status" aria-live="polite">
        <p className={[styles.saveBarStatus, statusClass].filter(Boolean).join(" ")}>{status}</p>
        <div className={styles.pillRow}>
            <Pill variant="quiet" size="small" onClick={onDiscard} disabled={!dirty || state === "saving"}>Discard</Pill>
            <Pill variant="blue" size="small" onClick={onSave} disabled={!dirty || state === "saving"}>
                {state === "saving" ? "Saving…" : saveLabel}
            </Pill>
        </div>
    </div>;
}
