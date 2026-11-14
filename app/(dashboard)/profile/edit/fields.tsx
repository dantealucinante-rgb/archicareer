"use client";

import { useState } from "react";
import Pill from "@/app/components/editorial/Pill";
import Field from "@/app/components/editorial/Field";
import editorial from "@/app/components/editorial/editorial.module.css";
import styles from "./edit.module.css";

type ChipAdderProps = {
    id: string;
    label: string;
    hint?: string;
    values: string[];
    onChange: (values: string[]) => void;
    suggestions?: readonly string[];
    placeholder?: string;
    addLabel?: string;
};

export function ChipAdder({ id, label, hint, values, onChange, suggestions, placeholder, addLabel = "Add" }: ChipAdderProps) {
    const [draft, setDraft] = useState("");

    function add() {
        const value = draft.trim();
        if (value && !values.includes(value)) onChange([...values, value]);
        setDraft("");
    }

    return <Field id={id} label={label} hint={hint}>
        {({ describedBy, invalid }) => <div className={styles.chipEditor}>
            {values.length > 0 && <ul className={editorial.chipRow}>
                {values.map((value) => <li key={value} className={`${editorial.chip} ${editorial.chipActive}`}>
                    {value}
                    <button
                        type="button"
                        onClick={() => onChange(values.filter((item) => item !== value))}
                        aria-label={`Remove ${value}`}
                        style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", marginLeft: 8, font: "inherit" }}
                    >×</button>
                </li>)}
            </ul>}
            <div className={styles.chipInputRow}>
                <input
                    id={id}
                    className={`${editorial.input} ${styles.chipInput}`}
                    value={draft}
                    list={suggestions ? `${id}-suggestions` : undefined}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    placeholder={placeholder}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            add();
                        }
                    }}
                />
                {suggestions && <datalist id={`${id}-suggestions`}>
                    {suggestions.filter((option) => !values.includes(option)).map((option) => <option key={option} value={option} />)}
                </datalist>}
                <Pill size="small" variant="quiet" onClick={add} disabled={!draft.trim()}>{addLabel}</Pill>
            </div>
        </div>}
    </Field>;
}

type EntryCardProps = {
    index: number;
    label: string;
    onRemove: () => void;
    children: React.ReactNode;
};

export function EntryCard({ index, label, onRemove, children }: EntryCardProps) {
    return <div className={styles.entry}>
        <div className={styles.entryHead}>
            <span className={styles.entryIndex}>{label} {index + 1}</span>
            <Pill size="small" variant="quiet" onClick={onRemove}>Remove</Pill>
        </div>
        {children}
    </div>;
}

export function newId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
