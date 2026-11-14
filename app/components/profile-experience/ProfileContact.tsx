import Pill from "@/app/components/editorial/Pill";
import type { Profile } from "@/types";
import type { PublicLink } from "./format";
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
            title="Contact"
            note={isOrganisation ? `Reach ${profile.name}` : `Reach ${profile.name}`}
        />

        {links.length > 0
            ? <div className={styles.contactGrid}>
                {links.map((link) => <a
                    key={`${link.label}-${link.href}`}
                    className={styles.contactLink}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                >
                    <span>{link.label}</span>
                    <span aria-hidden="true">↗</span>
                </a>)}
            </div>
            : <div className={styles.emptyState}>
                <p>{isOwner
                    ? "Add a website or professional social link so people can reach you."
                    : "No public contact links have been added."}</p>
                {isOwner && <Pill href="/profile/edit" variant="blue">Add contact links</Pill>}
            </div>}

        {messageHref && <div style={{ marginTop: 24 }}>
            <Pill href={messageHref} variant="ink">Send a message</Pill>
        </div>}
    </section>;
}
