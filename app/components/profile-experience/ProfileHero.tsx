import type { ReactNode } from "react";
import type { Profile } from "@/types";
import ProfileIdentity from "./ProfileIdentity";
import { accountLabels, getAffiliationLine, getProfileTitle } from "./format";

type ProfileHeroProps = {
    profile: Profile;
    projectCount: number;
    followers: number;
    following: number;
    actions?: ReactNode;
    ownerActions?: ReactNode;
    badges?: ReactNode;
    children?: ReactNode;
};

export default function ProfileHero({ profile, projectCount, followers, following, actions, ownerActions, badges, children }: ProfileHeroProps) {
    return <ProfileIdentity
        name={profile.name}
        avatar={profile}
        eyebrow={accountLabels[profile.account_type]}
        title={getProfileTitle(profile)}
        affiliation={getAffiliationLine(profile)}
        intro={profile.bio}
        badges={badges}
        actions={actions}
        ownerActions={ownerActions}
        stats={[
            { label: "Projects", value: projectCount.toLocaleString() },
            { label: "Followers", value: followers.toLocaleString() },
            { label: "Following", value: following.toLocaleString() },
        ]}
    >
        {children}
    </ProfileIdentity>;
}
