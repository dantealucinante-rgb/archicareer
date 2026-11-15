import Pill from "@/app/components/editorial/Pill";
import type { Profile } from "@/types";
import { linkValue, type PublicLink } from "./format";
import SectionHeading from "./SectionHeading";
import styles from "./profile-experience.module.css";

type ProfileContactProps = {
    profile: Profile;
    links: PublicLink[];
    isOwner: boolean;
    messageHref: string | null;
};

export default function ProfileContact({ profile, links, isOwner, messageHref }: ProfileContactProps) {
    const isOrganisation = profile.account_type === "firm" || profile.account_type === "business";

    return <section id="contact" className={styles.section}>
        <SectionHeading
            eyebrow="Reach out"
            title="Contact"
            note={isOrganisation
                ? `Ways to reach ${profile.name}`
                : `Ways to reach ${profile.name}`}
        />

        {links.length > 0
            ? <ul className={styles.contactList}>
                {links.map((link) => <li key={`${link.label}-${link.href}`}>
                    <a className={styles.contactRow} href={link.href} target="_blank" rel="noreferrer">
                        <span className={styles.contactLabel}>{link.label}</span>
                        <span className={styles.contactValue}>{linkValue(link.href)}</span>
                        <span className={styles.contactArrow} aria-hidden="true">↗</span>
                    </a>
                </li>)}
            </ul>
            : <div className={styles.emptyState}>
                <p>{isOwner
                    ? "Add a website or professional social link so people can reach you."
                    : "No public contact links have been added."}</p>
                {isOwner && <Pill href="/profile/edit" variant="blue">Add contact links</Pill>}
            </div>}

        {messageHref && <div className={styles.contactCta}>
            <p>Prefer a direct conversation? Send a message from your ArchiCareer account.</p>
            <Pill href={messageHref} variant="ink">Send a message</Pill>
        </div>}
    </section>;
}
