import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import type { Profile } from "@/types";
import { affiliationLabels, formatYearRange, safeWebUrl } from "./format";
import SectionHeading from "./SectionHeading";
import styles from "./profile-experience.module.css";

type ProfileAboutProps = {
    profile: Profile;
    isOwner: boolean;
};

/** True when there is anything at all worth rendering in About. */
export function hasAboutContent(profile: Profile): boolean {
    const details = profile.details ?? {};
    return Boolean(
        profile.bio ||
        profile.school_or_firm ||
        profile.location ||
        profile.software_proficiency.length ||
        (details.expertise?.length ?? 0) ||
        (details.education?.length ?? 0) ||
        (details.experience?.length ?? 0) ||
        (details.affiliations?.length ?? 0),
    );
}

export default function ProfileAbout({ profile, isOwner }: ProfileAboutProps) {
    const details = profile.details ?? {};
    const education = details.education ?? [];
    const experience = details.experience ?? [];
    const affiliations = details.affiliations ?? [];
    const expertise = details.expertise ?? [];
    const software = profile.software_proficiency ?? [];

    const hasNarrative = Boolean(profile.bio || experience.length);
    const hasSidebar = Boolean(education.length || affiliations.length || expertise.length || software.length || profile.location || profile.school_or_firm);

    if (!hasNarrative && !hasSidebar) {
        return <section id="about" className={styles.section}>
            <SectionHeading title="About" />
            <div className={styles.emptyState}>
                <p>{isOwner ? "Tell people about your background, practice and the work you care about." : "This profile hasn't added a biography yet."}</p>
                {isOwner && <Pill href="/profile/edit" variant="blue">Complete your profile</Pill>}
            </div>
        </section>;
    }

    return <section id="about" className={styles.section}>
        <SectionHeading title="About" note={isOwner && !profile.bio ? "Add a biography from your profile editor" : undefined} />

        <div className={styles.aboutGrid}>
            {hasNarrative && <div className={styles.aboutColumn}>
                {profile.bio && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Background</h3>
                    <p className={editorial.body}>{profile.bio}</p>
                </div>}

                {experience.length > 0 && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Experience</h3>
                    <ol className={styles.timeline}>
                        {experience.map((entry) => <li key={entry.id} className={styles.timelineItem}>
                            <p className={styles.timelineRole}>{entry.role}</p>
                            <p className={styles.timelineOrg}>{entry.organisation}</p>
                            <p className={styles.timelineMeta}>
                                {[formatYearRange(entry.start_year, entry.end_year), entry.location].filter(Boolean).join(" · ")}
                            </p>
                            {entry.description && <p className={styles.timelineNote}>{entry.description}</p>}
                        </li>)}
                    </ol>
                </div>}
            </div>}

            {hasSidebar && <div className={styles.aboutColumn}>
                {(profile.school_or_firm || profile.location) && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Details</h3>
                    <dl className={styles.projectFacts} style={{ paddingTop: 16 }}>
                        {profile.school_or_firm && profile.school_or_firm !== profile.name && <div>
                            <dt>{affiliationLabels[profile.account_type]}</dt>
                            <dd>{profile.school_or_firm}</dd>
                        </div>}
                        {profile.location && <div><dt>Based in</dt><dd>{profile.location}</dd></div>}
                    </dl>
                </div>}

                {education.length > 0 && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Education</h3>
                    <ol className={styles.timeline}>
                        {education.map((entry) => <li key={entry.id} className={styles.timelineItem}>
                            <p className={styles.timelineRole}>{entry.institution}</p>
                            <p className={styles.timelineOrg}>{[entry.qualification, entry.discipline].filter(Boolean).join(", ")}</p>
                            {formatYearRange(entry.start_year, entry.end_year) && <p className={styles.timelineMeta}>
                                {formatYearRange(entry.start_year, entry.end_year)}
                            </p>}
                        </li>)}
                    </ol>
                </div>}

                {expertise.length > 0 && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Areas of expertise</h3>
                    <ul className={editorial.chipRow}>
                        {expertise.map((item) => <li key={item} className={editorial.chip}>{item}</li>)}
                    </ul>
                </div>}

                {software.length > 0 && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Skills and software</h3>
                    <ul className={editorial.chipRow}>
                        {software.map((item) => <li key={item} className={editorial.chip}>{item}</li>)}
                    </ul>
                </div>}

                {affiliations.length > 0 && <div className={styles.aboutBlock}>
                    <h3 className={styles.aboutBlockTitle}>Affiliations</h3>
                    <ul className={styles.affiliationList}>
                        {affiliations.map((entry) => {
                            const href = safeWebUrl(entry.url);
                            return <li key={entry.id}>
                                <strong>{entry.organisation}</strong>
                                {entry.role && <span>{entry.role}</span>}
                                {href && <a href={href} target="_blank" rel="noreferrer">Visit ↗</a>}
                            </li>;
                        })}
                    </ul>
                </div>}
            </div>}
        </div>
    </section>;
}
