import type { ReactNode } from "react";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import editorial from "@/app/components/editorial/editorial.module.css";
import type { Profile } from "@/types";
import { accountLabels } from "./format";
import styles from "./profile-experience.module.css";

type ProfileHeroProps = {
    profile: Profile;
    projectCount: number;
    followers: number;
    following: number;
    actions?: ReactNode;
    ownerActions?: ReactNode;
};

export default function ProfileHero({ profile, projectCount, followers, following, actions, ownerActions }: ProfileHeroProps) {
    const affiliation = profile.school_or_firm && profile.school_or_firm !== profile.name ? profile.school_or_firm : null;

    return <header className={styles.hero}>
        <div className={styles.heroGrid}>
            <div className={styles.portrait}>
                <div className={styles.portraitImage}>
                    <ProfileAvatar profile={profile} size={300} fallbackClassName={styles.avatarFallback} priority />
                </div>
            </div>

            <div className={styles.heroCopy}>
                <div className={styles.heroTop}>
                    <p className={styles.accountLabel}>{accountLabels[profile.account_type]}</p>
                    {ownerActions}
                </div>

                <h1 className={editorial.display}>{profile.name}</h1>

                {(affiliation || profile.location) && <p className={styles.subline}>
                    {affiliation && <span>{affiliation}</span>}
                    {profile.location && <span>{profile.location}</span>}
                </p>}

                {profile.bio && <p className={styles.heroBio}>{profile.bio}</p>}

                {actions && <div className={editorial.pillRow}>{actions}</div>}

                <dl className={styles.stats}>
                    <div><dt>Projects</dt><dd>{projectCount.toLocaleString()}</dd></div>
                    <div><dt>Followers</dt><dd>{followers.toLocaleString()}</dd></div>
                    <div><dt>Following</dt><dd>{following.toLocaleString()}</dd></div>
                </dl>
            </div>
        </div>
    </header>;
}
