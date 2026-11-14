import type { ReactNode } from "react";
import styles from "./editorial.module.css";

type FieldControlProps = {
    /** Pass to the control's aria-describedby. */
    describedBy: string | undefined;
    invalid: boolean;
};

type FieldProps = {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    className?: string;
    children: (props: FieldControlProps) => ReactNode;
};

/**
 * Label + control + hint/error, wired for screen readers.
 * The control is a render prop so aria-describedby and aria-invalid can never
 * drift out of sync with the message that is actually rendered.
 */
export default function Field({ id, label, hint, error, className, children }: FieldProps) {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
        <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
            <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
            {children({ describedBy, invalid: Boolean(error) })}
            {error
                ? <p className={styles.fieldError} id={errorId} role="alert">{error}</p>
                : hint ? <p className={styles.fieldHint} id={hintId}>{hint}</p> : null}
        </div>
    );
}
