import type { ReactNode } from "react";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import styles from "./profile-experience.module.css";

export type IdentityStat = { label: string; value: string };

type AvatarSubject = {
    id?: string | null;
    slug?: string | null;
    name: string;
    avatar_url?: string | null;
};

type ProfileIdentityProps = {
    name: string;
    avatar: AvatarSubject;
    /** Small label above the name, e.g. "Student" or "Professional practice". */
    eyebrow: string;
    /** Professional title or category shown directly under the name. */
    title?: string | null;
    /** Practice, school or location line. */
    affiliation?: string | null;
    intro?: string | null;
    badges?: ReactNode;
    actions?: ReactNode;
    ownerActions?: ReactNode;
    stats?: IdentityStat[];
    /** Extra content under the actions, such as public contact links. */
    children?: ReactNode;
};

/**
 * The single profile header used by every account type and by the firm
 * directory, so identity always reads the same way across the platform.
 */
export default function ProfileIdentity({
    name,
    avatar,
    eyebrow,
    title,
    affiliation,
    intro,
    badges,
    actions,
    ownerActions,
    stats,
    children,
}: ProfileIdentityProps) {
    return <header className={styles.hero}>
        <div className={styles.heroInner}>
            <div className={styles.avatarColumn}>
                <div className={styles.avatarCircle}>
                    <ProfileAvatar
                        profile={avatar}
                        size={320}
                        className={styles.avatarImage}
                        fallbackClassName={styles.avatarFallback}
                        preload
                    />
                </div>
            </div>

            <div className={styles.heroCopy}>
                <div className={styles.heroTop}>
                    <div className={styles.eyebrowRow}>
                        <p className={styles.eyebrow}>{eyebrow}</p>
                        {badges}
                    </div>
                    {ownerActions}
                </div>

                <h1 className={styles.name}>{name}</h1>

                {title && <p className={styles.titleLine}>{title}</p>}
                {affiliation && <p className={styles.affiliationLine}>{affiliation}</p>}
                {intro && <p className={styles.intro}>{intro}</p>}

                {actions && <div className={styles.actionRow}>{actions}</div>}
                {children}

                {stats && stats.length > 0 && <dl className={styles.metaStrip}>
                    {stats.map((stat) => <div key={stat.label} className={styles.metaItem}>
                        <dt className={styles.metaLabel}>{stat.label}</dt>
                        <dd className={styles.metaValue}>{stat.value}</dd>
                    </div>)}
                </dl>}
            </div>
        </div>
    </header>;
}
