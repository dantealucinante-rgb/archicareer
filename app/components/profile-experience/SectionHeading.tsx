import type { ReactNode } from "react";
import styles from "./profile-experience.module.css";

type SectionHeadingProps = {
    /** Small uppercase label above the title. */
    eyebrow?: string;
    title: string;
    note?: string;
    action?: ReactNode;
};

export default function SectionHeading({ eyebrow, title, note, action }: SectionHeadingProps) {
    return <div className={styles.sectionHead}>
        <div className={styles.sectionHeadCopy}>
            {eyebrow && <p className={styles.sectionEyebrow}>{eyebrow}</p>}
            <h2 className={styles.sectionTitle}>{title}</h2>
            {note && <p className={styles.sectionNote}>{note}</p>}
        </div>
        {action && <div className={styles.sectionAction}>{action}</div>}
    </div>;
}
