import Link from "next/link";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import FollowButton from "@/app/components/FollowButton";
import type { PublicProfilePageData } from "./ProfilePageData";
import styles from "./profile-experience.module.css";

type Props = Pick<PublicProfilePageData, "profile" | "projectCount" | "currentUserId" | "isOwner" | "profileOwnerId" | "followers" | "following" | "isFollowing" | "isMutual"> & {
  label: string;
  descriptor: string;
  tone: "student" | "professional" | "firm" | "business";
  stats?: Array<[string, number]>;
};

export default function ProfileIdentity({ profile, projectCount, currentUserId, isOwner, profileOwnerId, followers, following, isFollowing, isMutual, label, descriptor, tone, stats }: Props) {
  const values = stats ?? [["Projects", projectCount], ["Followers", followers], ["Following", following]];
  return <header className={`${styles.identity} ${styles[tone]}`}>
    <div className={styles.identityTop}><span className={styles.accountLabel}>{label}</span><div className={styles.actions}>
      {isOwner ? <><Link className={`${styles.pill} ${styles.editButton}`} href="/profile/edit">Edit profile</Link><Link className={styles.settings} href="/settings" aria-label="Settings" title="Settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z"/><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.1a1.8 1.8 0 1 1-3.6 0v-.1a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1H3.2a1.8 1.8 0 1 1 0-3.6h.1a1.8 1.8 0 0 0 1.3-3.1l-.1-.1A1.8 1.8 0 1 1 7 4.9l.1.1a1.8 1.8 0 0 0 3.1-1.3v-.1a1.8 1.8 0 1 1 3.6 0v.1a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.1a1.8 1.8 0 1 1 0 3.6h-.1a1.8 1.8 0 0 0-1.3 3.1Z"/></svg></Link></>
        : profileOwnerId ? currentUserId ? <FollowButton followingId={profileOwnerId} initialFollowing={isFollowing} initialMutual={isMutual} initialFollowerCount={followers} compact /> : <Link className={`${styles.pill} ${styles.editButton}`} href={`/login?next=${encodeURIComponent(`/p/${profile.slug}`)}`}>Follow</Link> : null}
    </div></div>
    <div className={styles.identityBody}>
      <ProfileAvatar profile={profile} size={96} className={styles.avatar} priority />
      <div className={styles.identityCopy}><p className={styles.descriptor}>{descriptor}</p><h1>{profile.name}</h1>
        {profile.location && <p className={styles.location}>{profile.location}</p>}
        <p className={styles.bio}>{profile.bio || (isOwner ? "Add a short introduction to help people understand your profile." : "No introduction added yet.")}</p>
        <div className={styles.links}>{profile.personal_site_url && <SafeLink href={profile.personal_site_url}>Website</SafeLink>}{profile.linkedin_url && <SafeLink href={profile.linkedin_url}>LinkedIn</SafeLink>}{profile.instagram_url && <SafeLink href={profile.instagram_url}>Instagram</SafeLink>}</div>
      </div>
    </div>
    <dl className={styles.stats}>{values.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl>
  </header>;
}

function SafeLink({ href, children }: { href: string; children: string }) {
  const safeHref = safeWebUrl(href);
  if (!safeHref) return null;
  return <a href={safeHref} target="_blank" rel="noreferrer">{children}<span aria-hidden="true"> ↗</span></a>;
}

function safeWebUrl(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}
