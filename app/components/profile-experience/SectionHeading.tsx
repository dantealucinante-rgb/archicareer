import type { ReactNode } from "react";
import editorial from "@/app/components/editorial/editorial.module.css";
import styles from "./profile-experience.module.css";

type SectionHeadingProps = {
    title: string;
    note?: string;
    action?: ReactNode;
};

export default function SectionHeading({ title, note, action }: SectionHeadingProps) {
    return <div className={styles.sectionHead}>
        <div className={styles.sectionHeadCopy}>
            <h2 className={editorial.sectionTitle}>{title}</h2>
            {note && <p className={styles.sectionNote}>{note}</p>}
        </div>
        {action}
    </div>;
}
